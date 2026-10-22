<div align="center">

<img src="https://raw.githubusercontent.com/bahathraheel/PROMPTWARS-5/main/client/public/logo.png" alt="PLANEN AI Logo" width="80" height="80" onerror="this.style.display='none'"/>

# 👑 PLANEN AI — Celestial Event Planner

### *"Celestial Palaces of the Sun King"*

**Your AI-powered celebration & event planning platform — from intimate birthdays to grand weddings.**

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)

---

> ⚡ **Tell us your vision. Our AI builds your complete event plan in seconds.**

</div>

---

## ✨ Features

| Category | Features |
|---|---|
| 🤖 **AI Planning** | Gemini AI generates complete event plans — budget, timeline, vendors, checklist |
| 💰 **Budget Manager** | Real-time expense tracking, category charts, over-budget alerts |
| 📅 **Timeline & Tasks** | Visual milestones, checklist management, priority tracking |
| 🏪 **Vendor Management** | Organize vendors, compare quotes, AI-drafted inquiry emails |
| 👥 **Guest Management** | RSVPs, dietary needs, group assignments, invitation drafts |
| 🎨 **Theme Studio** | AI-generated themes, color palettes, mood boards, decor concepts |
| 📤 **Export** | PDF & CSV export of plans, vendor lists, guest summaries |
| 🔐 **Auth** | Firebase Authentication — Email/Password + Google OAuth |
| 💬 **AI Chat** | Persistent AI workspace per event — chat history saved to Firestore |

---

## 🏛️ Tech Stack

### Frontend (`/client`)
- **React 19** + **TypeScript** — Modern component architecture
- **Vite** — Lightning-fast dev server & build tool
- **Firebase SDK** — Auth, Firestore real-time database, Storage
- **Zustand** — Lightweight global state management
- **React Router v6** — Client-side routing
- **Lucide React** — Icon library
- **Recharts** — Budget & analytics charts
- **React Hot Toast** — Toast notifications

### Backend (`/server`)
- **Node.js + Express** — REST API server
- **Google Generative AI SDK** — Gemini AI integration (plan generation, chat, budget optimization, theme suggestions)
- **envsafe** — Type-safe environment variable validation
- **Morgan** — HTTP request logging
- **Helmet** — Security headers
- **express-rate-limit** — API rate limiting
- **cors** — Cross-origin resource sharing

### Infrastructure
- **Firebase Firestore** — NoSQL database with security rules
- **Firebase Authentication** — User management
- **Firebase Hosting** — (Optional) Frontend hosting
- **Render / Railway** — Backend hosting (recommended)
- **Vercel** — Frontend hosting (recommended)

---

## 🗂️ Project Structure

```
PROMPTWARS-5/
├── client/                     # React + TypeScript frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── layout/         # AppLayout, Sidebar, Header
│   │   │   ├── ui/             # Buttons, Cards, Modals
│   │   │   └── ErrorBoundary.tsx
│   │   ├── contexts/           # React contexts (AuthContext)
│   │   ├── pages/              # Route pages
│   │   │   ├── auth/           # SignIn, SignUp, ForgotPassword
│   │   │   ├── budget/         # Budget management
│   │   │   ├── checklist/      # Task checklists
│   │   │   ├── dashboard/      # Event dashboard
│   │   │   ├── events/         # Create & view events
│   │   │   ├── export/         # Export plans
│   │   │   ├── guests/         # Guest list
│   │   │   ├── theme/          # Theme studio
│   │   │   ├── timeline/       # Timeline & milestones
│   │   │   ├── vendors/        # Vendor management
│   │   │   ├── workspace/      # AI Chat workspace
│   │   │   └── LandingPage.tsx
│   │   ├── services/           # API & Firebase service modules
│   │   ├── store/              # Zustand stores (auth, theme, UI)
│   │   ├── styles/             # Global CSS design system
│   │   └── utils/              # Helpers & formatters
│   ├── .env.example            # ← Copy to .env.local
│   └── vite.config.ts
│
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   │   ├── ai.js           # /api/ai/* — Gemini endpoints
│   │   │   └── health.js       # /api/health
│   │   ├── services/
│   │   │   └── geminiService.js # Gemini AI integration
│   │   └── index.js            # Server entry point
│   ├── .env.example            # ← Copy to .env
│   └── package.json
│
├── shared/                     # Shared TypeScript types
│   └── types/
│       └── index.ts
│
├── firestore.rules             # Firebase security rules
├── firestore.indexes.json      # Firestore composite indexes
├── firebase.json               # Firebase project config
├── .env.example                # Root env template
├── .gitignore                  # Protects all secrets
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- Google AI Studio API key ([aistudio.google.com](https://aistudio.google.com))

### 1. Clone the repository

```bash
git clone https://github.com/bahathraheel/PROMPTWARS-5.git
cd PROMPTWARS-5
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
# Edit server/.env with your real values
```

**Required server variables:**
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
FIREBASE_PROJECT_ID=your_project_id
PORT=3001
NODE_ENV=development
```

### 3. Configure the frontend

```bash
cd ../client
cp .env.example .env.local
# Edit client/.env.local with your Firebase config
```

**Required client variables:**
```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Install dependencies

```bash
# From root
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 5. Set up Firebase

```bash
# Deploy Firestore security rules and indexes
npx firebase-tools deploy --only firestore --project your-project-id
```

### 6. Run locally

```bash
# Terminal 1 — Backend
cd server && node src/index.js

# Terminal 2 — Frontend
cd client && npm run dev
```

Open **http://localhost:5173** 🎉

---

## 🔐 Firebase Security Rules

Firestore is protected by row-level security — users can only read and write their own data. Rules are in [`firestore.rules`](./firestore.rules).

**Key rules:**
- ✅ Users can only access their own events
- ✅ Sub-collections (budget, vendors, guests) require ownership
- ✅ All write operations validate `userId` matches `request.auth.uid`
- ✅ Unauthenticated access is completely denied

---

## 🌐 Deployment

### Frontend → Vercel

1. Import the GitHub repository
2. Set root directory to `client`
3. Add all `VITE_*` environment variables in Vercel dashboard
4. Deploy

### Backend → Render

1. Create a new Web Service from the GitHub repo
2. Set root directory to `server`
3. Build command: `npm install`
4. Start command: `node src/index.js`
5. Add all server environment variables in Render dashboard
6. Update `VITE_API_BASE_URL` in Vercel to point to your Render URL

### Environment Variables Reference

| Variable | Where | Description |
|---|---|---|
| `GEMINI_API_KEY` | Render | Google AI Studio API key |
| `GEMINI_MODEL` | Render | Model name (e.g. `gemini-1.5-flash`) |
| `FIREBASE_PROJECT_ID` | Render | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Render | Firebase Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | Render | Firebase Admin SDK private key |
| `PORT` | Render | Server port (default: 3001) |
| `NODE_ENV` | Render | Set to `production` |
| `ALLOWED_ORIGINS` | Render | Your Vercel frontend URL |
| `VITE_FIREBASE_API_KEY` | Vercel | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Vercel | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Vercel | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Vercel | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Vercel | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Vercel | Firebase app ID |
| `VITE_API_BASE_URL` | Vercel | Your Render backend URL |

---

## 🎨 Design System

PLANEN AI uses a custom **"Celestial Palaces of the Sun King"** theme:

| Token | Value | Purpose |
|---|---|---|
| Gold | `#FFD700` | Highlights, active states, logo |
| Amber | `#FF8C00` | Primary CTA, buttons, links |
| Burgundy | `#800020` | Accent, error states, depth |
| Background | `#FFFDF5` | Warm cream base |
| Dark sidebar | `#1A0A0A → #2D0D12` | Deep royal dark |

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/ai/`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/ai/status` | Gemini AI connectivity check |
| `POST` | `/api/ai/chat` | AI chat message (with history) |
| `POST` | `/api/ai/plan-event` | Generate full event plan |
| `POST` | `/api/ai/optimize-budget` | Budget optimization suggestions |
| `POST` | `/api/ai/suggest-theme` | Theme & decor suggestions |
| `POST` | `/api/ai/generate-checklist` | Smart checklist generation |
| `POST` | `/api/ai/draft-vendor-email` | AI vendor inquiry email |

---

## 🛡️ Security

- 🔒 All secrets stored in `.env` files — **never committed to Git**
- 🔒 Firebase Firestore protected by row-level security rules
- 🔒 Express API uses Helmet, CORS, and rate limiting
- 🔒 `VITE_*` variables contain only public Firebase config (no backend secrets)
- 🔒 Gemini API key is **server-side only** — never exposed to the browser
- 🔒 `.gitignore` covers all credential patterns including service account JSON files

---

## 📜 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [Shaik Bahath Raheel](https://github.com/bahathraheel)**

*Powered by Google Gemini AI · Firebase · React · Node.js*

⭐ **Star this repo if you find it useful!**

</div>