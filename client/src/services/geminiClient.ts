import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { AIEventPlan } from '../../../shared/types/index';
import type {
  ChatResponse,
  ThemeSuggestions,
  BudgetOptimization,
  ChecklistResult,
  VendorEmailDraft,
} from './aiService';

const getClientApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || '';
const getClientModelName = () => {
  const raw = (import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash').trim();
  // Sanitize Unicode dashes (en-dash, em-dash, etc.) into ASCII hyphens
  const sanitized = raw.replace(/[\u2010-\u2015\u2212]/g, '-');
  return sanitized || 'gemini-1.5-flash';
};

export function isClientAIConfigured(): boolean {
  const key = getClientApiKey();
  return !!key && !key.startsWith('your_');
}

let genAI: GoogleGenerativeAI | null = null;
let lastKey = '';

function getGenAI(): GoogleGenerativeAI | null {
  const key = getClientApiKey();
  if (!key) return null;
  if (!genAI || key !== lastKey) {
    lastKey = key;
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const SYSTEM_INSTRUCTION = `You are PLANEN AI, an expert event planning assistant specializing in creating personalized, detailed, and actionable event plans.

Your core principles:
- Provide REALISTIC, budget-aware recommendations appropriate to the user's stated budget and planning style.
- Be CULTURALLY SENSITIVE and respectful of all traditions, religions, and backgrounds.
- Clearly state your ASSUMPTIONS when information is missing or ambiguous.
- Flag any MISSING INFORMATION that would improve your recommendations.
- NEVER fabricate vendor names, prices, availability, or reviews.
- All cost estimates are ADVISORY only — actual costs must be verified independently.
- Personalize recommendations based on the specific event type, theme, culture, and priorities.
- Be warm, encouraging, and professional in conversational responses.
- Always clarify what you can and cannot do: you cannot book vendors, send emails, or modify calendars directly.

CRITICAL CHAT FORMATTING RULES:
- In chat conversations, ALWAYS respond in clear, friendly, readable plain text or markdown.
- NEVER output raw JSON, code blocks, or structured data objects in chat responses.
- Use bullet points (•), numbered lists, and **bold** for emphasis — not JSON.
- When a user asks about their plan, summarize key points in human-readable sentences.
- Keep chat responses conversational and concise (under 300 words unless asked for detail).
- JSON output is ONLY allowed when explicitly requested by a structured generation prompt.`;

function extractJSON(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

function parseJSON<T>(text: string): T {
  try {
    return JSON.parse(extractJSON(text)) as T;
  } catch (err) {
    console.error('[Gemini Client] JSON parse failed:', text?.slice(0, 500));
    throw new Error('AI returned malformed JSON. Please try again.');
  }
}

export async function clientGenerateEventPlan(event: Record<string, unknown>): Promise<AIEventPlan> {
  const client = getGenAI();
  if (!client) throw new Error('VITE_GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getClientModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  });

  const prompt = `Generate a comprehensive, personalized event plan for:
- Name: ${event.name}
- Type: ${event.type}
- Date: ${event.date}
- City: ${event.city || 'Not specified'}
- Venue Preference: ${event.venuePreference || 'Not specified'}
- Indoor/Outdoor: ${event.isOutdoor ? 'Outdoor' : 'Indoor'}
- Guest Count: ${event.guestCount}
- Budget: ${event.currency || 'USD'} ${event.budget}
- Planning Style: ${event.planningStyle}
- Theme: ${event.theme || 'Not specified'}
- Dietary: ${(event.dietaryPreferences as string[])?.join(', ') || 'None'}
- Cultural: ${event.culturalRequirements || 'None'}

Return pure JSON matching this exact structure:
{
  "eventId": "${event.id || ''}",
  "summary": "Executive summary of the event concept and vision",
  "budgetBreakdown": [
    { "category": "Category name", "estimatedCost": 0, "percentage": 0, "notes": "Notes" }
  ],
  "timeline": [
    { "date": "Date or relative time", "milestone": "Milestone name", "description": "Description", "priority": "high|medium|low" }
  ],
  "vendorChecklist": [
    { "category": "venue|catering|decor|photography|makeup|entertainment|transportation|other", "name": "Recommended type", "notes": "Guidance", "isRequired": true }
  ],
  "themeRecommendations": [
    { "title": "Theme name", "description": "Details", "colors": ["#hex1", "#hex2"], "mood": "atmosphere" }
  ],
  "menuIdeas": [
    { "course": "Course", "options": ["Option 1"], "notes": "Notes" }
  ],
  "entertainmentSuggestions": [
    { "type": "Activity/music", "description": "Details", "estimatedCost": 0 }
  ],
  "actionItems": [
    { "title": "Immediate next step", "priority": "urgent|high|medium|low", "category": "Category" }
  ],
  "assumptions": ["Key assumption made"],
  "missingInfo": ["Info that would refine plan"],
  "generatedAt": "${new Date().toISOString()}"
}`;

  const res = await model.generateContent(prompt);
  const plan = parseJSON<AIEventPlan>(res.response.text());
  
  // Recalculate percentages
  if (Array.isArray(plan.budgetBreakdown)) {
    const total = plan.budgetBreakdown.reduce((acc, c) => acc + (c.estimatedCost || 0), 0);
    if (total > 0) {
      plan.budgetBreakdown = plan.budgetBreakdown.map(c => ({
        ...c,
        percentage: Math.round(((c.estimatedCost || 0) / total) * 100 * 10) / 10,
      }));
    }
  }

  return plan;
}

export async function clientSendChatMessage(
  message: string,
  history: { role: 'user' | 'model'; content: string }[],
  eventContext?: Record<string, unknown>
): Promise<ChatResponse> {
  const client = getGenAI();
  if (!client) throw new Error('VITE_GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getClientModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.8 },
  });

  const formattedHistory = (history || [])
    .filter(m => m.content)
    .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));

  const chat = model.startChat({ history: formattedHistory });
  const contextPrefix = eventContext
    ? `[Event Context: ${eventContext.name || 'Event'}, Type: ${eventContext.type || 'general'}, Budget: ${eventContext.currency || ''}${eventContext.budget || 0}, Guests: ${eventContext.guestCount || 0}]\n\n`
    : '';

  const res = await chat.sendMessage(contextPrefix + message);
  return {
    response: res.response.text(),
    timestamp: new Date().toISOString(),
  };
}

export async function clientSuggestThemes(eventData: Record<string, unknown>): Promise<ThemeSuggestions> {
  const client = getGenAI();
  if (!client) throw new Error('VITE_GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getClientModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 4096, temperature: 0.9, responseMimeType: 'application/json' },
  });

  const prompt = `Generate 5 unique, personalized event theme ideas for:
Event: ${eventData.name || 'Event'} (${eventData.type || 'general'})
Budget: ${eventData.currency || ''}${eventData.budget || 'Not specified'}
Guest Count: ${eventData.guestCount || 'Not specified'}
Colors: ${(eventData.colors as string[])?.join(', ') || 'Any'}
Atmosphere: ${eventData.atmosphere || 'Any'}
Cultural: ${eventData.culturalRequirements || 'None'}

Return pure JSON:
{
  "themes": [
    {
      "title": "Theme name",
      "description": "2-3 sentence description",
      "colors": ["#hex1", "#hex2", "#hex3"],
      "mood": "mood description",
      "decorIdeas": ["idea1", "idea2", "idea3"],
      "flowerSuggestions": ["flower1", "flower2"],
      "dressCode": "Dress code description",
      "venueStyleConcept": "Venue concept",
      "menuConcept": "Menu concept",
      "entertainmentIdea": "Entertainment concept"
    }
  ]
}`;

  const res = await model.generateContent(prompt);
  return parseJSON<ThemeSuggestions>(res.response.text());
}

export async function clientOptimizeBudget(
  eventData: Record<string, unknown>,
  currentBudget: unknown[]
): Promise<BudgetOptimization> {
  const client = getGenAI();
  if (!client) throw new Error('VITE_GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getClientModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.5, responseMimeType: 'application/json' },
  });

  const prompt = `Analyze and optimize budget for:
Event: ${eventData.name || 'Event'} (${eventData.type || 'general'})
Total Budget: ${eventData.currency || ''}${eventData.budget || 0}
Style: ${eventData.planningStyle || 'balanced'}
Current Breakdown: ${JSON.stringify(currentBudget, null, 2)}

Return pure JSON:
{
  "suggestions": [
    {
      "category": "Category name",
      "currentAmount": 0,
      "suggestedAmount": 0,
      "rationale": "Reason for suggestion",
      "savingTip": "Practical tip"
    }
  ],
  "overallAdvice": "Overall advice",
  "estimatedSavings": 0,
  "assumptions": ["Assumption 1"]
}`;

  const res = await model.generateContent(prompt);
  return parseJSON<BudgetOptimization>(res.response.text());
}

export async function clientGenerateChecklist(eventData: Record<string, unknown>): Promise<ChecklistResult> {
  const client = getGenAI();
  if (!client) throw new Error('VITE_GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getClientModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 4096, temperature: 0.6, responseMimeType: 'application/json' },
  });

  const prompt = `Generate a preparation checklist for:
Event: ${eventData.name || 'Event'} (${eventData.type || 'general'})
Date: ${eventData.date || 'Upcoming'}
Guests: ${eventData.guestCount || 0}

Return pure JSON:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description",
      "category": "Category",
      "priority": "high",
      "suggestedDueDate": null,
      "isRequired": true
    }
  ]
}`;

  const res = await model.generateContent(prompt);
  return parseJSON<ChecklistResult>(res.response.text());
}

export async function clientDraftVendorEmail(
  vendor: Record<string, unknown>,
  event: Record<string, unknown>,
  customRequest?: string
): Promise<VendorEmailDraft> {
  const client = getGenAI();
  if (!client) throw new Error('VITE_GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getClientModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.6, responseMimeType: 'application/json' },
  });

  const prompt = `Draft a vendor inquiry email:
Vendor: ${vendor.name} (${vendor.category})
Event: ${event.name} (${event.type})
Date: ${event.date}
Budget: ${event.currency || ''}${vendor.estimatedQuote || 0}
Request: ${customRequest || 'General inquiry'}

Return pure JSON:
{
  "subject": "Email subject",
  "body": "Email body",
  "keyPoints": ["Point 1"]
}`;

  const res = await model.generateContent(prompt);
  return parseJSON<VendorEmailDraft>(res.response.text());
}
