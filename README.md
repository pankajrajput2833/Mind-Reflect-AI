# Mind Reflect AI — Multi-Lingual AI Journaling & Real-Time Conversational Web App

**Mind Reflect AI** is an enterprise-grade, secure, full-stack Multi-Lingual AI Journaling and Reflection application engineered with **React 19 (TypeScript)**, **Tailwind CSS v4**, **Google Cloud Firestore**, **Firebase Authentication (Google Sign-In)**, and the **Google Gen AI SDK (`@google/genai`)**.

---

## 1. Agentic Threat Model (5 Threat Zones)

Mind Reflect AI enforces strict security controls across all 5 Agentic Threat Zones:

| Threat Zone | Identified Risk | Implemented Countermeasure | OWASP Mapping |
| :--- | :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious prompt injection, multimodal image tampering, payload tampering, XSS injection via journal text | Strict input sanitization, MIME-type verification for multimodal images, max length bounding, JSON payload caps (1MB), safe text and Markdown rendering | OWASP LLM01 / A03 |
| **2. Planning & Reasoning** | Model hallucination, system instruction escape, toxic guidance across personas | Socratic system prompts with persona-specific boundary enforcement, multi-turn role boundary demarcation, defensive JSON schema parsing | OWASP LLM02 / LLM05 |
| **3. Tool & API Execution** | Gemini API key leakage on client, SSRF, unauthenticated model exhaustion | Server-side API proxy (`/api/*`), zero API keys in client code, resilient fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) | OWASP A05 / LLM04 |
| **4. Memory & State** | Cross-user data leakage in Firestore, unauthorized reads/writes of private reflections & preferences | Strict owner-bound Firestore security rules (`request.auth.uid == userId`), Firebase Auth JWT verification on all backend endpoints | OWASP A01 (Broken Access Control) |
| **5. Inter-System Communication** | Token theft, unverified bearer tokens, CORS replay attacks | Firebase Admin SDK `verifyIdToken` on every backend request, HTTPS-only transport, strict UID matching between token claims and request payloads | OWASP A07 / A02 |

---

## 2. System Architecture & Flow Diagrams

### High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------------------+
|                                      CLIENT LAYER (Browser)                                   |
|                                                                                               |
|   +---------------------------------------------------------------------------------------+   |
|   |  React 19 SPA (Tailwind CSS v4 + Motion)                                              |   |
|   |  - Theme Provider (Zen, Obsidian, Light, Neo-Glass)                                    |   |
|   |  - Language Provider (EN, ES, HI, FR, JA, DE, ZH, AR, PT)                             |   |
|   |  - Web Speech API (Voice Dictation STT & Text-to-Speech Audio Readout)                |   |
|   |  - Multimodal Upload Preview (Inspiration Images/Sketches)                             |   |
|   |  - Live Emotion Radar & Trends Visualizer                                             |   |
|   +---------------------------------------------------------------------------------------+   |
|            |                                                               |                  |
|            | 1. Direct Auth & Realtime Sync                                | 2. Server API    |
|            v                                                               v    Proxy Calls   |
+-------------------------------------------------------------+---------------------------------+
|               FIREBASE & CLOUD BACKEND                       |     EXPRESS NODE.JS SERVER      |
|                                                             |     (Port 3000 / 0.0.0.0)       |
|  +-------------------------------------------------------+  |  +---------------------------+  |
|  | Firebase Authentication (Google Sign-In)              |  |  | Auth Verification         |  |
|  | - Client Popup / Redirect Flow                        |  |  | - Firebase Admin SDK      |  |
|  | - Issues Signed JWT ID Tokens                         |  |  | - Validates Bearer Token  |  |
|  +-------------------------------------------------------+  |  +-------------+-------------+  |
|                            ^                                |                |                |
|                            | Verified Token                 |                v                |
|  +-------------------------------------------------------+  |  +---------------------------+  |
|  | Cloud Firestore (Owner-Bound Subcollections)          |  |  | Express Proxy Endpoints   |  |
|  | - /users/{userId}/sessions/{sessionId}/messages      |  |  | - POST /api/chat/stream   |  |
|  | - /users/{userId}/preferences                         |  |  | - POST /api/chat          |  |
|  | - Protected by firestore.rules                        |  |  | - POST /api/summary       |  |
|  +-------------------------------------------------------+  |  | - POST /api/auto-tag      |  |
|                                                             |  | - POST /api/trends        |  |
|                                                             |  +-------------+-------------+  |
+-------------------------------------------------------------+----------------|----------------+
                                                                               | Resilient
                                                                               | Fallback Ladder
                                                                               v
                                                              +---------------------------------+
                                                              |      GOOGLE GEMINI API          |
                                                              |  1. gemini-3.6-flash (Primary)  |
                                                              |  2. gemini-3.1-flash-lite       |
                                                              |  3. gemini-flash-latest         |
                                                              |  4. gemini-3.7-flash            |
                                                              +---------------------------------+
```

---

### Real-Time Reflection & Token Streaming Flow

```
[ User Action ]
      |
      |-- Types reflection / Speaks via Speech-to-Text
      |-- (Optional) Attaches inspiration photo or selects Mood context
      v
[ Client Application ]
      |
      |-- 1. Optimistic save: Writes message immediately to Firestore (/users/{uid}/sessions/{id}/messages)
      |-- 2. Retrieves fresh Firebase Auth ID token (JWT)
      |-- 3. Opens SSE connection to POST /api/chat/stream with Bearer Token & payload
      v
[ Express Server Proxy ]
      |
      |-- 4. Verifies JWT token via Firebase Admin SDK (checks request.body.userId === decodedToken.uid)
      |-- 5. Sanitizes prompt, injects persona instruction & language directives
      |-- 6. Dispatches to @google/genai SDK (generateContentStream) with model fallback ladder
      v
[ Gemini 3.6 Flash ]
      |
      |-- 7. Generates empathetic, socratic reflection chunks
      v
[ Express Server Proxy ]
      |
      |-- 8. Pipes Server-Sent Event chunks ('data: {"text": "..."}\n\n') to client
      v
[ Client Application ]
      |
      |-- 9. Progressively renders live token stream in chat bubble
      |-- 10. On stream end: Writes completed model reflection to Firestore
      |-- 11. Triggers auto-tag & title generator on turn 1
      |-- 12. Audio Readout (TTS) available via speaker icon button
```

---

### Authentication & Owner-Bound Data Isolation Flow

```
[ Unauthenticated User ]
      |
      |-- Clicks "Sign in with Google"
      v
[ Firebase Client SDK ]
      |
      |-- signInWithPopup(auth, GoogleAuthProvider)
      v
[ Google Identity Provider ]
      |
      |-- User authenticates & approves consent
      v
[ Firebase Client SDK ]
      |
      |-- Receives UserCredential (uid, email, displayName, photoURL)
      |-- Sets Auth State Listener (onAuthStateChanged)
      v
[ Firestore Security Rules Validation ]
      |
      |-- Client subscribes to collection('users', user.uid, 'sessions')
      |-- Rules evaluate: `request.auth != null && request.auth.uid == userId`
      |-- PERMITTED: User reads and writes ONLY their private session data
```

---

## 3. Project & Repository Structure Guide

```
├── .env.example                # Example environment variables documentation
├── .gitignore                  # Git ignore patterns (node_modules, dist, .env)
├── firebase.json               # Firebase deployment configuration
├── firestore.rules             # Cloud Firestore security rules with per-user isolation
├── index.html                  # HTML entry point (SEO, OG meta, title)
├── metadata.json               # Platform metadata, title, permissions & capabilities
├── package.json                # Dependencies, build scripts, dev commands
├── README.md                   # Complete architectural, local testing, & deployment guide
├── server.ts                   # Express server entry point, API routes, Vite middleware & Gemini proxy
├── tsconfig.json               # TypeScript configuration
├── tsconfig.node.json          # Node TypeScript configuration
├── vite.config.ts              # Vite bundler configuration & Tailwind plugin
│
└── src/
    ├── App.tsx                 # Core application controller & top-level view router
    ├── index.css               # Global CSS & Tailwind CSS v4 design tokens
    ├── main.tsx                # React DOM entry point
    ├── types.ts                # TypeScript domain models, interfaces, personas & types
    │
    ├── components/             # Modular UI components
    │   ├── ChatArea.tsx        # Conversation workspace, voice input, attachments & streaming
    │   ├── EmotionRadar.tsx    # Multi-axial SVG emotional valence radar chart
    │   ├── InsightsDrawer.tsx  # Slide-out session takeaways, quotes & intention drawer
    │   ├── LandingPage.tsx     # Public greeting, feature showcases & Google Sign-In CTA
    │   ├── LanguageSelector.tsx# 9-Language switcher dropdown with country badges
    │   ├── Navbar.tsx          # Top navigation bar, user avatar, trends & security buttons
    │   ├── PersonaSelector.tsx # 3-Persona picker (Empathetic, Socratic, Wisdom Mentor)
    │   ├── SecurityModal.tsx   # Interactive threat model viewer & Firestore rules display
    │   ├── Sidebar.tsx         # Session history, search filter, mood tags & date filters
    │   ├── SummaryModal.tsx    # Comprehensive session summary dialog
    │   ├── ThemeSelector.tsx   # 4-Theme switcher (Zen, Obsidian, Light, Neo-Glass)
    │   └── TrendsAnalyticsModal.tsx # Cross-session longitudinal growth & emotion trends
    │
    ├── context/                # Global React State Providers
    │   ├── LanguageContext.tsx # Multi-lingual i18n context & translation hook
    │   └── ThemeContext.tsx    # Dynamic CSS variable theme switcher with localStorage
    │
    └── lib/                    # Core business logic, services & API clients
        ├── firebase.ts         # Firebase App, Auth, and Firestore client initialization
        ├── geminiClient.ts     # Client proxy calling backend API routes with Bearer token
        ├── journalService.ts   # Firestore CRUD operations for sessions & messages
        └── translations.ts     # 9-Language translation dictionaries and resolver
```

---

## 4. Local Development & Testing Guide

Follow these step-by-step instructions to run and test **Mind Reflect AI** locally on your workstation.

### Prerequisites

1. **Node.js**: Version `18.0.0` or higher (`node -v`).
2. **npm**: Version `9.0.0` or higher (`npm -v`).
3. **Google Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).
4. **Firebase Project**: A Firebase project with **Authentication (Google Sign-In enabled)** and **Cloud Firestore Database** enabled.

---

### Step 1: Clone the Repository & Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd mind-reflect-ai

# Install dependencies
npm install
```

---

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Gemini API Key (Server-side secret, NEVER exposed to client)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# App URL (Localhost default)
APP_URL="http://localhost:3000"

# Firebase Project ID (for backend token validation)
FIREBASE_PROJECT_ID="your-firebase-project-id"
```

---

### Step 3: Start the Full-Stack Development Server

The application runs a unified server that hosts both the Express API routes and the Vite frontend middleware on port `3000`:

```bash
npm run dev
```

Open your browser and navigate to:
**`http://localhost:3000`**

---

### Step 4: Verify Backend Health & API Endpoints

You can verify the backend is running properly by testing the `/api/health` endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected JSON response:
```json
{
  "status": "healthy",
  "geminiConfigured": true,
  "firebaseConfigured": true
}
```

---

### Step 5: Execute Code Validation & Build Tests

```bash
# Run TypeScript type-checking and linter
npm run lint

# Run production build (compiles client bundle and backend bundle)
npm run build

# Test production server locally
npm run start
```

---

## 5. Google Cloud Secret Manager Setup

To deploy securely to Google Cloud Run without hardcoded credentials:

```bash
# 1. Enable Google Cloud APIs
gcloud services enable secretmanager.googleapis.com run.googleapis.com firestore.googleapis.com

# 2. Create the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run Service Account Secret Accessor permissions
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 6. Cloud Firestore Security Rules

Deploy these owner-bound rules to ensure complete user privacy:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /preferences/{prefId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

---

## 7. Google Cloud Run Deployment & Campaign Verification

### Deploy Container to Cloud Run:
```bash
gcloud run deploy mindreflect-journal \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars FIREBASE_PROJECT_ID="flowing-gasket-v6d0h",NODE_ENV="production"
```

### Apply Required Campaign Verification Label:
```bash
gcloud run services update mindreflect-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region us-central1
```

---

## 8. Functional Stability & Comprehensive Walkthrough Test Suite

| Test ID | User Interaction / Process | Expected Functional Result | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **TC-01** | Load landing page as unauthenticated user | Renders hero section, language picker, theme switcher, sample reflection inquiries, and prominent "Sign in with Google" button. Dashboard routes remain inaccessible. | Landing page renders in chosen theme/language; no authenticated state leakage. |
| **TC-02** | Toggle Language Selector (e.g. Spanish, French, Japanese, Hindi) | UI text immediately updates across navigation, buttons, titles, and sample reflection prompts. Language preference persisted. | Instant re-render with localized strings. |
| **TC-03** | Toggle Theme Selector (Zen, Obsidian, Light, Neo-Glass) | CSS variables dynamically switch color palettes, surface background, card border glows, and typography contrast. Theme persisted in `localStorage`. | Smooth background/glass transition. |
| **TC-04** | Click "Security Architecture" button | Opens interactive modal displaying the 5-Zone Threat Summary table and deployed Firestore Security Rules. | Modal opens with full OWASP mappings. |
| **TC-05** | Click "Sign in with Google" button | Triggers Firebase Google Auth popup. Upon authorization, user profile loads and redirects to authenticated workspace. | Auth state updates; user display name and photo appear in Navbar. |
| **TC-06** | Click "New Reflection" or select Persona (Empathetic / Socratic / Mentor) | Instantiates a fresh session document in `/users/{uid}/sessions` with selected persona configuration. | Blank conversation canvas with prompt starter chips and active persona badge appears. |
| **TC-07** | Send reflection message with voice dictation (Microphone button) | Web Speech API transcribes speech into text in real-time. Text appends to input buffer. | Accurate speech-to-text transcript rendered. |
| **TC-08** | Attach inspiration image (Multimodal Attachment) and submit | Image previews with removal button; base64 payload transmitted to backend `/api/chat/stream`. Gemini processes text + image jointly. | Model incorporates visual elements into reflection. |
| **TC-09** | Token-by-Token Streaming Display | As server streams SSE chunks from Gemini, words appear fluidly in real-time in the conversation bubble. | Live streaming text bubble updates smoothly. |
| **TC-10** | Audio Read Aloud (Text-to-Speech) | Clicking speaker icon on any AI response plays audio narration using browser speech synthesis in the matching language. | Clear, audible speech playback. |
| **TC-11** | Open Emotion Radar Drawer / View | Multi-axial radar chart dynamically calculates emotional valence scores based on conversation mood context. | Polygon chart animates smoothly. |
| **TC-12** | Automatic session auto-tagging on turn 1 | Gemini server endpoint `/api/auto-tag` generates a concise 3–5 word title and 1–3 mood tags. Updates Firestore session doc. | Session title changes from "New Reflection" to synthesized title in Sidebar & Header. |
| **TC-13** | Longitudinal Trends Analysis (Cross-Session) | Clicking "Emotional Trends & Growth" triggers `/api/trends` across all user sessions. Returns trajectory synthesis, theme clusters, growth milestones, and tailored inquiry starters. | Comprehensive modal with visual mood distribution and interactive prompt starters. |
| **TC-14** | Click "Session Insights" Drawer | Generates structured takeaways, key quotes, emotional arc, and actionable intentions with one-click clipboard copy. | Drawer slides out from right with formatted insights. |
| **TC-15** | Search & Date Filtering in Sidebar | Inputting keywords or selecting mood tags / date presets (Last 7 Days, Last 30 Days) dynamically filters session list. | Instant reactive filtering with highlighted match counts. |
| **TC-16** | Rename session title via inline edit | Updates session `title` and `updatedAt` in Firestore. | New title reflected immediately across sidebar and top header. |
| **TC-17** | Delete session with confirmation | Prompts confirmation dialog and deletes session document and nested messages from Firestore. | Session removed from sidebar; next session selected. |
| **TC-18** | Sign Out | Calls `signOut(auth)`. Clears state and redirects immediately to Landing Page. | Clean session teardown and return to landing state. |
