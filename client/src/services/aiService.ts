import axios, { type AxiosError } from 'axios';
import type { AIEventPlan } from '../../../shared/types/index';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIStatus {
  configured: boolean;
  model: string | null;
  message: string;
}

export interface ChatResponse {
  response: string;
  timestamp: string;
}

export interface ThemeSuggestions {
  themes: {
    title: string;
    description: string;
    colors: string[];
    mood: string;
    decorIdeas: string[];
    flowerSuggestions: string[];
    dressCode: string;
    venueStyleConcept: string;
    menuConcept: string;
    entertainmentIdea: string;
  }[];
}

export interface BudgetOptimization {
  suggestions: {
    category: string;
    currentAmount: number;
    suggestedAmount: number;
    rationale: string;
    savingTip: string;
  }[];
  overallAdvice: string;
  estimatedSavings: number;
  assumptions: string[];
}

export interface VendorEmailDraft {
  subject: string;
  body: string;
  keyPoints: string[];
}

export interface ChecklistResult {
  tasks: {
    title: string;
    description: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
    suggestedDueDate: string | null;
    isRequired: boolean;
  }[];
}

// ─── Error handling ───────────────────────────────────────────────────────────

function extractError(err: unknown): string {
  const axiosErr = err as AxiosError<{ error?: string }>;
  return (
    axiosErr.response?.data?.error ||
    axiosErr.message ||
    'An unknown error occurred'
  );
}

// ─── AI API Functions ─────────────────────────────────────────────────────────

/**
 * Check if the AI service is configured and available.
 */
export async function checkAIStatus(): Promise<AIStatus> {
  const { data } = await api.get<{ success: boolean; data: AIStatus }>('/api/ai/status');
  return data.data;
}

/**
 * Generate a full event plan via Gemini AI.
 */
export async function generateEventPlan(eventData: Record<string, unknown>): Promise<AIEventPlan> {
  try {
    const { data } = await api.post<{ success: boolean; data: AIEventPlan }>(
      '/api/ai/plan-event',
      eventData
    );
    return data.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/**
 * Send a chat message to the AI planner.
 */
export async function sendChatMessage(
  message: string,
  history: { role: 'user' | 'model'; content: string }[],
  eventContext?: Record<string, unknown>
): Promise<ChatResponse> {
  try {
    const { data } = await api.post<{ success: boolean; data: ChatResponse }>('/api/ai/chat', {
      message,
      history,
      eventContext,
    });
    return data.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/**
 * Get AI theme suggestions for an event.
 */
export async function suggestThemes(eventData: Record<string, unknown>): Promise<ThemeSuggestions> {
  try {
    const { data } = await api.post<{ success: boolean; data: ThemeSuggestions }>(
      '/api/ai/suggest-theme',
      eventData
    );
    return data.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/**
 * Get AI budget optimization suggestions.
 */
export async function optimizeBudget(
  eventData: Record<string, unknown>,
  currentBudget: unknown[]
): Promise<BudgetOptimization> {
  try {
    const { data } = await api.post<{ success: boolean; data: BudgetOptimization }>(
      '/api/ai/optimize-budget',
      { eventData, currentBudget }
    );
    return data.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/**
 * Generate an AI preparation checklist.
 */
export async function generateChecklist(eventData: Record<string, unknown>): Promise<ChecklistResult> {
  try {
    const { data } = await api.post<{ success: boolean; data: ChecklistResult }>(
      '/api/ai/generate-checklist',
      eventData
    );
    return data.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

/**
 * Draft a vendor inquiry email via AI.
 */
export async function draftVendorEmail(
  vendor: Record<string, unknown>,
  event: Record<string, unknown>,
  customRequest?: string
): Promise<VendorEmailDraft> {
  try {
    const { data } = await api.post<{ success: boolean; data: VendorEmailDraft }>(
      '/api/ai/draft-vendor-email',
      { vendor, event, customRequest }
    );
    return data.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}
