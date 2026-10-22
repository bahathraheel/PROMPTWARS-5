// shared/types/index.ts
// ─── Core Domain Types ───────────────────────────────────────────────────────

export type EventType =
  | 'wedding'
  | 'engagement'
  | 'birthday'
  | 'anniversary'
  | 'college_festival'
  | 'corporate'
  | 'community'
  | 'baby_shower'
  | 'graduation'
  | 'private_party'
  | 'other';

export type PlanningStyle = 'budget_friendly' | 'balanced' | 'premium';
export type EventStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type VendorCategory =
  | 'venue'
  | 'catering'
  | 'decor'
  | 'photography'
  | 'makeup'
  | 'entertainment'
  | 'transportation'
  | 'other';
export type BookingStatus = 'not_contacted' | 'contacted' | 'negotiating' | 'booked' | 'cancelled';
export type RSVPStatus = 'pending' | 'confirmed' | 'declined' | 'maybe';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type GuestGroup = 'family' | 'friends' | 'colleagues' | 'other';

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Event ───────────────────────────────────────────────────────────────────
export interface Event {
  id: string;
  userId: string;
  name: string;
  type: EventType;
  date: string; // ISO date string
  endDate?: string;
  location: string;
  city: string;
  venuePreference?: string;
  isOutdoor?: boolean;
  guestCount: number;
  budget: number;
  currency: string;
  theme?: string;
  colors?: string[];
  atmosphere?: string;
  dietaryPreferences?: string[];
  accessibilityNeeds?: string;
  culturalRequirements?: string;
  priorities?: {
    food?: number;
    decor?: number;
    entertainment?: number;
    photography?: number;
    venue?: number;
  };
  planningStyle: PlanningStyle;
  status: EventStatus;
  aiPlanId?: string;
  collaborators?: string[]; // user UIDs
  createdAt: string;
  updatedAt: string;
}

// ─── Budget ──────────────────────────────────────────────────────────────────
export interface BudgetCategory {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  estimatedCost: number;
  actualCost: number;
  amountPaid: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  eventId: string;
  userId: string;
  categoryId: string;
  description: string;
  amount: number;
  isPaid: boolean;
  date: string;
  vendorId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Task / Checklist ────────────────────────────────────────────────────────
export interface Task {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
  category?: string;
  notes?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Vendor ──────────────────────────────────────────────────────────────────
export interface Vendor {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  category: VendorCategory;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  location?: string;
  estimatedQuote: number;
  finalQuote?: number;
  depositPaid?: number;
  bookingStatus: BookingStatus;
  notes?: string;
  isAiSuggested?: boolean;
  placeId?: string; // Google Places ID
  createdAt: string;
  updatedAt: string;
}

// ─── Guest ───────────────────────────────────────────────────────────────────
export interface Guest {
  id: string;
  eventId: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  rsvpStatus: RSVPStatus;
  plusOnes?: number;
  dietaryNotes?: string;
  accessibilityNotes?: string;
  group: GuestGroup;
  tableNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── AI Conversation ─────────────────────────────────────────────────────────
export interface AIMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  eventId: string;
  userId: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── AI Plan ─────────────────────────────────────────────────────────────────
export interface AIEventPlan {
  eventId: string;
  summary: string;
  budgetBreakdown: { category: string; estimatedCost: number; percentage: number; notes: string }[];
  timeline: { date: string; milestone: string; description: string; priority: TaskPriority }[];
  vendorChecklist: { category: VendorCategory; name: string; notes: string; isRequired: boolean }[];
  themeRecommendations: { title: string; description: string; colors: string[]; mood: string }[];
  menuIdeas: { course: string; options: string[]; notes: string }[];
  entertainmentSuggestions: { type: string; description: string; estimatedCost?: number }[];
  actionItems: { title: string; priority: TaskPriority; dueDate?: string; category: string }[];
  assumptions: string[];
  missingInfo: string[];
  generatedAt: string;
}

// ─── Calendar Integration ────────────────────────────────────────────────────
export interface CalendarIntegration {
  id: string;
  userId: string;
  eventId: string;
  googleCalendarEventId?: string;
  authorized: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Invitation ──────────────────────────────────────────────────────────────
export interface Invitation {
  id: string;
  eventId: string;
  invitedBy: string; // userId
  invitedEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  token: string;
  expiresAt: string;
  createdAt: string;
}

// ─── API Response Shapes ─────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
