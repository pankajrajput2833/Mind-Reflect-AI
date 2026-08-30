# MindReflect — Multi-Lingual AI Journaling & Real-Time Conversational Web App

MindReflect is a secure, responsive, full-stack Multi-Lingual AI Journaling and Reflection application engineered with **React (TypeScript)**, **Tailwind CSS**, **Google Cloud Firestore**, **Firebase Authentication (Google Sign-In)**, and the **Google Gen AI SDK (`@google/genai`)**.

---

## 1. Agentic Threat Model (5 Threat Zones)

| Threat Zone | Identified Risk | Implemented Countermeasure | OWASP Mapping |
| :--- | :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious prompt injection, multimodal image tampering, payload tampering, XSS injection via journal text | Strict input sanitization, MIME-type verification for multimodal images, max length bounding, JSON payload caps (1MB), safe text and Markdown rendering | OWASP LLM01 / A03 |
| **2. Planning & Reasoning** | Model hallucination, system instruction escape, toxic guidance across personas | Socratic system prompts with persona-specific boundary enforcement, multi-turn role boundary demarcation, defensive JSON schema parsing | OWASP LLM02 / LLM05 |
| **3. Tool & API Execution** | Gemini API key leakage on client, SSRF, unauthenticated model exhaustion | Server-side API proxy (`/api/*`), zero API keys in client code, resilient fallback ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) | OWASP A05 / LLM04 |
| **4. Memory & State** | Cross-user data leakage in Firestore, unauthorized reads/writes of private reflections & preferences | Strict owner-bound Firestore security rules (`request.auth.uid == userId`), Firebase Auth JWT verification on all endpoints | OWASP A01 (Broken Access Control) |
| **5. Inter-System Communication** | Token theft, unverified bearer tokens, CORS replay attacks | Firebase Admin SDK `verifyIdToken` on every backend request, HTTPS-only transport, UID matching | OWASP A07 / A02 |

---

## 2. Core Architecture & Feature Matrix

- **Client**: React 19, Tailwind CSS v4, Lucide Icons, React-Markdown, Web Speech API (Dictation & TTS), Theme Provider, Multi-Lingual I18n Provider (9 languages: EN, ES, HI, FR, JA, DE, ZH, AR, PT).
- **Backend / Proxy**: Express.js server binding to port `3000` (`0.0.0.0`) with Vite SPA middleware in development and static asset serving in production. Includes Server-Sent Events (SSE) streaming endpoint `/api/chat/stream`.
- **Authentication**: Firebase Authentication with Google Sign-In (`signInWithPopup` with `signInWithRedirect` fallback).
- **Database**: Cloud Firestore with user-isolated subcollections (`/users/{userId}/sessions/{sessionId}/messages/{messageId}`).
- **Theme Engine**: 4 distinctive themes: *Zen Minimalist (Warm Cream/Earth)*, *Obsidian Midnight (Deep Slate/Violet)*, *Pure Light*, and *Neo-Glass (Cyan/Emerald Translucent)* with persistent storage.
- **AI Personas**:
  1. 🌸 **Empathetic Companion**: Gentle, emotionally validating, nurturing listener.
  2. 🧠 **Socratic Inquirer**: Probing, introspective, analytical thought-provoker.
  3. 🧭 **Wisdom Mentor**: Action-oriented, resilient growth catalyst.
- **Multimodal Reflection**: Upload inspiration photos or sketches to accompany reflections for AI vision analysis.
- **Live Emotion Radar**: Interactive multi-axial radar chart visualizing emotional nuance (Peace, Gratitude, Clarity, Vulnerability, Growth, Energy).
- **Longitudinal Trends Analytics**: Cross-session emotional trajectory synthesis, recurring themes analysis, growth milestones, and tailored self-inquiry prompts.

---

## 3. Firestore Security Rules

Deployed to Firebase Firestore:

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

## 4. Google Cloud Secret Manager Setup

To run securely in Google Cloud Run without exposing secrets:

```bash
# 1. Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# 2. Create the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant Cloud Run Service Account permission to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Google Cloud Run Deployment & Campaign Verification

### Deploy to Cloud Run:
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

## 6. Functional Stability & Comprehensive Walkthrough Test Suite

| Test ID | User Interaction / Process | Expected Functional Result | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **TC-01** | Load landing page as unauthenticated user | Renders hero section, language picker, theme switcher, sample reflection inquiries, and prominent "Sign in with Google" button. Dashboard routes remain inaccessible. | Landing page renders in chosen theme/language; no authenticated state leakage. |
| **TC-02** | Toggle Language Selector (e.g. Spanish, French, Japanese) | UI text immediately updates across navigation, buttons, titles, and sample reflection prompts. Language preference persisted. | Instant re-render with localized strings. |
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
