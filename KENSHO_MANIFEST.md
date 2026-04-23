# KENSHŌ — See Through the Noise
**The Definitive AI-Powered Flashcard Engine & Spaced Repetition Workspace**

Built for the **Cuemath AI Builder Challenge** by **Harshal Patel**.

---

## 🚀 Overview
Kenshō is a high-fidelity learning platform designed to turn dense, complex information into durable long-term knowledge. It leverages advanced AI to automate the tedious process of flashcard creation and uses the scientific SM-2 algorithm to optimize study schedules. It is characterized by an uncompromising "Apple-like" obsession with tactile feedback, minimalism, and performance.

---

## 🛠️ The Technical Core

### Frontend Architecture
- **Framework**: Next.js 16 (App Router) + React 19.
- **Runtime**: Turbopack for lightning-fast development builds.
- **State Management**: Zustand for global UI states and AI generation status.
- **Animations**: Framer Motion with custom spring physics and reduced-motion fallbacks.
- **Data Fetching**: Server Components for SEO and fast initial load; Client-side optimistic updates for study reviews.

### Backend & AI Orchestration
- **Performance Layer**: Go (Golang) backend for high-throughput PDF parsing and AI orchestration.
- **AI Stack**: Multi-model fallback chain ensures 100% uptime:
  1. `Groq Llama-3.1-8b-instant` (Primary - Ultra-low latency)
  2. `Mistral-7B-Instruct-v0.3` (Secondary - Robust reliability)
  3. `Gemini 2.5 Flash-Lite` (Tertiary - Deep context extraction)
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM for type-safe, low-latency queries.

### Infrastructure & Security
- **Authentication**: Clerk (Full JWT-based user lifecycle management).
- **Asset Management**: UploadThing & Vercel Blob for secure, fast PDF handling.
- **Protection**: Edge Middleware (`proxy.ts`) for sub-millisecond route protection and public/private access control.

---

## ✨ Signature Features & UX Polish

### 1. The SM-2 Algorithm Engine
Kenshō implements a mathematically precise SM-2 spaced repetition system:
- **Ease Factor (EF)**: Dynamically adjusted based on quality scores (0-5).
- **Interval Expansion**: Successful recalls increase intervals exponentially; failures reset the cycle.
- **Session Logic**: Prioritizes cards due today while integrating new cards seamlessly.

### 2. Hybrid Audio Interaction Engine
Custom-built audio engine designed for tactile "physical" feedback:
- **Zero-Latency Response**: Uses `pointerdown` on Desktop for instant response and `click` on Mobile to prevent accidental triggers during scrolls.
- **Minimalist Palette**: Short, crisp "Kenshō-click", "Trash", "Success", and "Flip" samples balanced with precision gain nodes (0.2 gain) for a premium, non-aggressive feel.

### 3. Tactile 3D Design System
- **Mechanical Physics**: Buttons feature 3D depth with `3px` displacement and `5px` shadows that respond instantly to touch.
- **Glassmorphism**: 20px blur refractive cards with 1px border-mix layering for a "Vision Pro" depth effect.
- **Visual Peek UX**: Hero sections set to `92vh` to subtly reveal the high-contrast footer, creating a "discovery cue" that encourages natural scrolling.

### 4. AI Learning Coach
A dedicated post-session feedback loop:
- **Quality Scale**: 0 (Blackout) to 5 (Instant Recall).
- **Instructional Design**: The AI analyzes quality patterns and provides 2-3 sentences of direct, warm, and specific coaching tips to improve retrieval strength.

### 5. Distraction-Free Workspace
- **Doc-Mode**: Standalone documentation pages stripped of all navigation and sidebars for focused reading.
- **Typewriter Slogan**: A custom CSS/JS typewriter effect on the landing page sets a meditative, focused tone from the first second.

---

## 📂 Repository Standards
- **Atomic Commits**: Every feature, fix, and style adjustment is committed with professional, descriptive titles.
- **Clean Architecture**: Atomic component structure (`/components`, `/hooks`, `/lib`, `/providers`) for maximum scalability and recruiter review.
- **SEO Optimized**: Semantic HTML5, dynamic metadata generation per deck, and optimized font loading (Outfit).

---

**"See through the noise. Master what matters."**
*© 2026 Kenshō Engine. Developed by Harshal Patel.*
