import express from 'express';
import { z } from 'zod';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { createError } from '../middleware/errorHandler.js';
import {
  generateEventPlan,
  chatWithPlanner,
  suggestThemes,
  optimizeBudget,
  generateVendorEmail,
  generateChecklist,
  getGenAI,
  getModelName,
} from '../services/geminiService.js';

export const aiRouter = express.Router();

// ─── Request Schemas ──────────────────────────────────────────────────────────

const EventDataSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1),
  date: z.string(),
  endDate: z.string().optional(),
  city: z.string().optional(),
  venuePreference: z.string().optional(),
  isOutdoor: z.boolean().optional(),
  guestCount: z.number().int().min(1).max(100000),
  budget: z.number().min(0),
  currency: z.string().default('USD'),
  theme: z.string().optional(),
  colors: z.array(z.string()).optional(),
  atmosphere: z.string().optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  accessibilityNeeds: z.string().optional(),
  culturalRequirements: z.string().optional(),
  priorities: z.record(z.number()).optional(),
  planningStyle: z.enum(['budget_friendly', 'balanced', 'premium']).default('balanced'),
});

const ChatSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
    timestamp: z.string().optional(),
  })).max(50).optional().default([]),
  eventContext: EventDataSchema.partial().optional(),
});

// ─── Status endpoint ──────────────────────────────────────────────────────────

/**
 * GET /api/ai/status
 * Check if AI is configured and available.
 */
aiRouter.get('/status', (req, res) => {
  const isConfigured = !!process.env.GEMINI_API_KEY;
  const modelName = isConfigured ? getModelName() : null;
  res.json({
    success: true,
    data: {
      configured: isConfigured,
      model: modelName,
      message: isConfigured
        ? `Gemini AI ready (${modelName})`
        : 'GEMINI_API_KEY not configured. Add it to server .env to enable AI features.',
    },
  });
});

// ─── Plan Event ───────────────────────────────────────────────────────────────

/**
 * POST /api/ai/plan-event
 * Generate a complete structured event plan.
 */
aiRouter.post('/plan-event', aiRateLimiter, async (req, res, next) => {
  try {
    const parsed = EventDataSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(`Invalid event data: ${parsed.error.issues.map(i => i.message).join(', ')}`, 400);
    }

    const plan = await generateEventPlan(parsed.data);

    // Validate core plan structure
    if (!plan.summary || !Array.isArray(plan.budgetBreakdown)) {
      throw createError('AI returned an invalid plan structure. Please try again.', 502);
    }

    // Recalculate budget percentages from application code (don't trust AI arithmetic)
    const totalEstimated = plan.budgetBreakdown.reduce((sum, c) => sum + (c.estimatedCost || 0), 0);
    if (totalEstimated > 0) {
      plan.budgetBreakdown = plan.budgetBreakdown.map(c => ({
        ...c,
        percentage: Math.round((c.estimatedCost / totalEstimated) * 100 * 10) / 10,
      }));
    }

    plan.generatedAt = new Date().toISOString();
    plan.eventId = req.body.id || null;

    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

// ─── Chat ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * Conversational event planning assistant.
 */
aiRouter.post('/chat', aiRateLimiter, async (req, res, next) => {
  try {
    const parsed = ChatSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(`Invalid request: ${parsed.error.issues.map(i => i.message).join(', ')}`, 400);
    }

    const { message, history, eventContext } = parsed.data;
    const response = await chatWithPlanner(history, message, eventContext);

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Suggest Theme ────────────────────────────────────────────────────────────

/**
 * POST /api/ai/suggest-theme
 */
aiRouter.post('/suggest-theme', aiRateLimiter, async (req, res, next) => {
  try {
    const parsed = EventDataSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw createError('Invalid event data for theme generation.', 400);
    }

    const themes = await suggestThemes(parsed.data);
    res.json({ success: true, data: themes });
  } catch (err) {
    next(err);
  }
});

// ─── Optimize Budget ──────────────────────────────────────────────────────────

/**
 * POST /api/ai/optimize-budget
 */
aiRouter.post('/optimize-budget', aiRateLimiter, async (req, res, next) => {
  try {
    const { eventData, currentBudget } = req.body;
    if (!eventData || !currentBudget) {
      throw createError('eventData and currentBudget are required.', 400);
    }

    const parsed = EventDataSchema.partial().safeParse(eventData);
    if (!parsed.success) {
      throw createError('Invalid event data.', 400);
    }

    const result = await optimizeBudget(parsed.data, currentBudget);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ─── Generate Checklist ───────────────────────────────────────────────────────

/**
 * POST /api/ai/generate-checklist
 */
aiRouter.post('/generate-checklist', aiRateLimiter, async (req, res, next) => {
  try {
    const parsed = EventDataSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      throw createError('Invalid event data.', 400);
    }

    const result = await generateChecklist(parsed.data);

    if (!result.tasks || !Array.isArray(result.tasks)) {
      throw createError('AI returned invalid checklist format.', 502);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ─── Draft Vendor Email ───────────────────────────────────────────────────────

/**
 * POST /api/ai/draft-vendor-email
 */
aiRouter.post('/draft-vendor-email', aiRateLimiter, async (req, res, next) => {
  try {
    const { vendor, event, customRequest } = req.body;
    if (!vendor || !event) {
      throw createError('vendor and event are required.', 400);
    }

    // Sanitize email-related fields
    const safeVendor = {
      name: String(vendor.name || '').slice(0, 200),
      category: String(vendor.category || '').slice(0, 50),
      estimatedQuote: Number(vendor.estimatedQuote) || 0,
    };

    const result = await generateVendorEmail(safeVendor, event, customRequest);

    if (!result.subject || !result.body) {
      throw createError('AI returned invalid email format.', 502);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
