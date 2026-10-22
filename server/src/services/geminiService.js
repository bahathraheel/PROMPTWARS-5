import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

function getApiKey()   { return process.env.GEMINI_API_KEY  || ''; }
function getModelName(){ return process.env.GEMINI_MODEL    || 'gemini-3.8-flash'; }
function getMaxTokens(){ return Number(process.env.GEMINI_MAX_TOKENS) || 8192; }

let genAI = null;
let lastKey = null;

/**
 * Support both classic AIza... API keys and new AQ. Bearer token keys
 * (issued by the new Google AI Studio).
 */
function getGenAI() {
  const key = getApiKey();
  if (!key) return null;
  // Re-init if key changed
  if (!genAI || key !== lastKey) {
    lastKey = key;
    if (key.startsWith('AQ.')) {
      // New OAuth2-style key — pass as Bearer token via custom fetch
      genAI = new GoogleGenerativeAI(key, {
        fetchImplementation: (url, opts = {}) => {
          const headers = new Headers(opts.headers || {});
          headers.set('Authorization', `Bearer ${key}`);
          // Remove x-goog-api-key if set, use Bearer only
          headers.delete('x-goog-api-key');
          return fetch(url, { ...opts, headers });
        },
      });
    } else {
      genAI = new GoogleGenerativeAI(key);
    }
  }
  return genAI;
}

/**
 * Strip markdown code fences that Gemini sometimes wraps JSON in.
 * Handles ```json ... ``` and plain ``` ... ```
 */
function extractJSON(text) {
  const trimmed = text.trim();
  // Remove ```json ... ``` or ``` ... ``` wrapper
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

/**
 * Safe JSON parser — strips markdown fences before parsing.
 */
function parseJSON(text) {
  try {
    return JSON.parse(extractJSON(text));
  } catch (err) {
    console.error('[Gemini] JSON parse failed. Raw text (first 500):', text?.slice(0, 500));
    throw new Error('AI returned malformed JSON. Please try again.');
  }
}

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
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
- JSON output is ONLY allowed when explicitly requested by the server via a structured generation prompt.`;

// ─── Generate Event Plan ───────────────────────────────────────────────────────

export async function generateEventPlan(eventData) {
  const client = getGenAI();
  if (!client) throw new Error('GEMINI_API_KEY is not configured. Please add it to server/.env');

  const model = client.getGenerativeModel({
    model: getModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      maxOutputTokens: getMaxTokens(),
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  });

  try {
    const result = await model.generateContent(buildEventPlanPrompt(eventData));
    return parseJSON(result.response.text());
  } catch (err) {
    if (err.message?.includes('malformed JSON')) throw err;
    throw err;
  }
}

// ─── Chat With Planner ─────────────────────────────────────────────────────────

export async function chatWithPlanner(history, userMessage, eventContext) {
  const client = getGenAI();
  if (!client) throw new Error('GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.8 },
  });

  const formattedHistory = (history || [])
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));

  const chat = model.startChat({ history: formattedHistory });

  const contextPrefix = eventContext
    ? `[Event Context: ${eventContext.name}, Type: ${eventContext.type}, Budget: ${eventContext.currency || ''}${eventContext.budget}, Guests: ${eventContext.guestCount}]\n\n`
    : '';

  const result = await chat.sendMessage(contextPrefix + userMessage);
  return result.response.text();
}

// ─── Suggest Themes ───────────────────────────────────────────────────────────

export async function suggestThemes(eventData) {
  const client = getGenAI();
  if (!client) throw new Error('GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 4096, temperature: 0.9, responseMimeType: 'application/json' },
  });

  const prompt = `Generate 5 unique, personalized event theme ideas for:
Event: ${eventData.name || 'Event'} (${eventData.type || 'general'})
Budget: ${eventData.currency || ''}${eventData.budget || 'Not specified'}
Guest Count: ${eventData.guestCount || 'Not specified'}
Preferred Colors: ${eventData.colors?.join(', ') || 'Not specified'}
Atmosphere: ${eventData.atmosphere || 'Not specified'}
Cultural Requirements: ${eventData.culturalRequirements || 'None'}

Return pure JSON (no markdown) with this structure:
{
  "themes": [
    {
      "title": "Theme name",
      "description": "2-3 sentence description",
      "colors": ["#hex1", "#hex2", "#hex3"],
      "mood": "romantic|elegant|festive|rustic|modern|cultural",
      "decorIdeas": ["idea1", "idea2", "idea3"],
      "flowerSuggestions": ["flower1", "flower2"],
      "dressCode": "Description of dress code",
      "venueStyleConcept": "How the venue should be styled",
      "menuConcept": "Brief menu concept",
      "entertainmentIdea": "Entertainment concept"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
}

// ─── Optimize Budget ──────────────────────────────────────────────────────────

export async function optimizeBudget(eventData, currentBudget) {
  const client = getGenAI();
  if (!client) throw new Error('GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 2048, temperature: 0.5, responseMimeType: 'application/json' },
  });

  const prompt = `Analyze and suggest budget optimization for:
Event: ${eventData.name || 'Event'} (${eventData.type || 'general'})
Total Budget: ${eventData.currency || ''}${eventData.budget || 0}
Planning Style: ${eventData.planningStyle || 'balanced'}
Guest Count: ${eventData.guestCount || 0}

Current Budget Breakdown:
${JSON.stringify(currentBudget, null, 2)}

Return pure JSON (no markdown):
{
  "suggestions": [
    {
      "category": "Category name",
      "currentAmount": 0,
      "suggestedAmount": 0,
      "rationale": "Why this change is recommended",
      "savingTip": "Practical tip to save money"
    }
  ],
  "overallAdvice": "General budget optimization advice",
  "estimatedSavings": 0,
  "assumptions": ["assumption1"]
}`;

  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
}

// ─── Generate Vendor Email ────────────────────────────────────────────────────

export async function generateVendorEmail(vendor, event, customRequest) {
  const client = getGenAI();
  if (!client) throw new Error('GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 1024, temperature: 0.6, responseMimeType: 'application/json' },
  });

  const prompt = `Draft a professional vendor inquiry email for:
Vendor: ${vendor.name} (${vendor.category})
Event: ${event.name} (${event.type})
Event Date: ${event.date}
Location: ${event.city || 'Not specified'}
Guest Count: ${event.guestCount}
Budget Range: ${event.currency || ''}${vendor.estimatedQuote}
Custom Request: ${customRequest || 'General inquiry'}

Return pure JSON (no markdown):
{
  "subject": "Email subject line",
  "body": "Full email body text (plain text, no HTML)",
  "keyPoints": ["Point 1", "Point 2"]
}`;

  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
}

// ─── Generate Checklist ───────────────────────────────────────────────────────

export async function generateChecklist(eventData) {
  const client = getGenAI();
  if (!client) throw new Error('GEMINI_API_KEY is not configured.');

  const model = client.getGenerativeModel({
    model: getModelName(),
    systemInstruction: SYSTEM_INSTRUCTION,
    safetySettings: SAFETY_SETTINGS,
    generationConfig: { maxOutputTokens: 4096, temperature: 0.6, responseMimeType: 'application/json' },
  });

  const daysUntilEvent = eventData.date
    ? Math.ceil((new Date(eventData.date) - new Date()) / (1000 * 60 * 60 * 24))
    : 30;

  const prompt = `Generate a comprehensive preparation checklist for:
Event: ${eventData.name || 'Event'} (${eventData.type || 'general'})
Event Date: ${eventData.date || 'Not specified'} (${daysUntilEvent} days away)
Location: ${eventData.city || 'Not specified'}
Guest Count: ${eventData.guestCount || 0}
Budget: ${eventData.currency || ''}${eventData.budget || 0}
Planning Style: ${eventData.planningStyle || 'balanced'}

Return pure JSON (no markdown):
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Brief description",
      "category": "Category name",
      "priority": "high|medium|low",
      "suggestedDueDate": "ISO date string or null",
      "isRequired": true
    }
  ]
}

Generate 20-30 practical, actionable tasks appropriate to the timeline.`;

  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildEventPlanPrompt(event) {
  const daysUntilEvent = event.date
    ? Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return `Generate a comprehensive, personalized event plan for the following requirements:

EVENT DETAILS:
- Name: ${event.name}
- Type: ${event.type}
- Date: ${event.date}${daysUntilEvent ? ` (${daysUntilEvent} days from now)` : ''}
- Duration: ${event.endDate ? `${event.date} to ${event.endDate}` : 'Single day'}
- Location/City: ${event.city || 'Not specified'}
- Venue Preference: ${event.venuePreference || 'Not specified'}
- Indoor/Outdoor: ${event.isOutdoor === true ? 'Outdoor' : event.isOutdoor === false ? 'Indoor' : 'Not specified'}

GUESTS & BUDGET:
- Guest Count: ${event.guestCount}
- Total Budget: ${event.currency || 'USD'}${event.budget}
- Planning Style: ${event.planningStyle}

PREFERENCES:
- Theme: ${event.theme || 'Not specified'}
- Colors: ${event.colors?.join(', ') || 'Not specified'}
- Atmosphere: ${event.atmosphere || 'Not specified'}
- Dietary Preferences: ${event.dietaryPreferences?.join(', ') || 'None'}
- Accessibility Needs: ${event.accessibilityNeeds || 'None'}
- Cultural Requirements: ${event.culturalRequirements || 'None'}

Return pure JSON (no markdown fences) in this exact structure:
{
  "summary": "2-3 sentence personalized overview",
  "budgetBreakdown": [
    { "category": "Category name", "estimatedCost": 0, "percentage": 0, "notes": "Brief note" }
  ],
  "timeline": [
    { "date": "ISO date string", "milestone": "Milestone title", "description": "What to do", "priority": "high|medium|low" }
  ],
  "vendorChecklist": [
    { "category": "venue|catering|decor|photography|makeup|entertainment|transportation|other", "name": "Vendor type description", "notes": "What to look for", "isRequired": true }
  ],
  "themeRecommendations": [
    { "title": "Theme name", "description": "Description", "colors": ["#hex1"], "mood": "Description" }
  ],
  "menuIdeas": [
    { "course": "Course name", "options": ["Option 1", "Option 2"], "notes": "Dietary or cultural notes" }
  ],
  "entertainmentSuggestions": [
    { "type": "Entertainment type", "description": "Description", "estimatedCost": null }
  ],
  "actionItems": [
    { "title": "Action title", "priority": "high|medium|low|urgent", "dueDate": "ISO date string or null", "category": "Category" }
  ],
  "assumptions": ["Assumption 1"],
  "missingInfo": ["Missing info 1"]
}

Ensure budget breakdown percentages sum to 100. All costs are estimates only.`;
}

export { getGenAI, getModelName };
