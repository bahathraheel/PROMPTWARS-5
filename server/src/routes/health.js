import express from 'express';
import { getGenAI, getModelName } from '../services/geminiService.js';

export const healthRouter = express.Router();

/**
 * GET /api/health
 * Returns service status for all integrations.
 */
healthRouter.get('/', (req, res) => {
  const isAiConfigured = !!process.env.GEMINI_API_KEY;
  const isFirebaseConfigured = !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL
  );

  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        api: { status: 'ok' },
        ai: {
          status: isAiConfigured ? 'configured' : 'not_configured',
          model: isAiConfigured ? getModelName() : null,
        },
        firebase: {
          status: isFirebaseConfigured ? 'configured' : 'not_configured',
        },
      },
    },
  });
});
