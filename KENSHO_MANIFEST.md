# KENSHŌ — See Through the Noise
**The Definitive AI-Powered Flashcard Engine & Spaced Repetition Workspace**

Built for the **Cuemath AI Builder Challenge** by **Harshal Patel**.

---

## 🚀 Overview
Kenshō is a high-fidelity learning platform designed to turn dense, complex information into durable long-term knowledge. It leverages advanced AI to automate the tedious process of flashcard creation and uses the scientific SM-2 algorithm to optimize study schedules. It is characterized by an uncompromising "Apple-like" obsession with tactile feedback, minimalism, and performance.

---

## 🏗️ System Architecture & Background Flow

### 1. The Generation Pipeline (PDF to Knowledge)
When a user uploads a PDF, Kenshō executes a multi-stage background pipeline:
- **Phase A (Ingestion)**: The PDF is securely uploaded via **UploadThing** or **Vercel Blob**. A temporary pre-signed URL is generated.
- **Phase B (Text Extraction)**:
  - **Primary**: The Next.js API route proxies the task to the **Go Backend**.
  - **Process**: The Go backend utilizes high-performance parsing to extract raw text content while maintaining structural context.
- **Phase C (AI Structuring)**:
  - The extracted text is sent through the **AI Fallback Chain** (Groq -> Mistral -> Gemini).
  - The system uses "System Prompting" to force the AI to return a strict **JSON array** of flashcards.
- **Phase D (Persistence)**: The structured JSON is parsed and written to **PostgreSQL (Neon)** using **Drizzle ORM**. This stage also initializes the **SM-2 metadata** (Ease Factor 2.5, Interval 0) for each new card.

### 2. The Study & Review Loop (Active Recall)
- **Request**: When a user opens a deck, Kenshō queries the DB for cards where `dueDate <= now`.
- **Review**: The user rates a card (0-5).
- **Calculation**: The **SM-2 Algorithm** executes on the server:
  - New Interval = Old Interval * Ease Factor.
  - Ease Factor = Adjusted based on the quality score (lower for hard cards, higher for easy ones).
- **Update**: The new `dueDate` and `easeFactor` are persisted to the database.
- **Coaching**: The session logs are asynchronously sent to the AI Coach to generate a personalized performance summary.

### 3. Resilience & Fallback Orchestration
Kenshō is designed for 100% availability through a "Smart Proxy" architecture:
- **Rate Limit Handling**: If a primary AI provider (e.g., Groq) returns a 429 or 503, the **`generateWithFallback`** utility instantly switches to the next provider in the chain without user interruption.
- **Error Sanitization**: Server-side errors are intercepted and transformed into human-readable, non-technical feedback before reaching the UI.

### 4. Authentication & Security Layer
- **Identity**: **Clerk** manages the global user session.
- **Edge Protection**: A custom **Edge Middleware (`proxy.ts`)** validates every request. Only public assets (Docs, Landing) are accessible without a valid JWT.
- **Data Isolation**: Every database query is scoped by the Clerk `userId`, ensuring zero-leakage between user workspaces.

---

## 🛠️ The Technical Core

### Frontend Architecture
- **Framework**: Next.js 16 (App Router) + React 19.
- **Runtime**: Turbopack for lightning-fast development builds.
- **State Management**: Zustand for global UI states and AI generation status.
- **Animations**: Framer Motion with custom spring physics and reduced-motion fallbacks.

### Backend Orchestration
- **High Performance**: Go (Golang) backend for heavy-lifting PDF parsing and AI orchestration.
- **AI Stack**:
  1. `Groq Llama-3.1-8b-instant` (Ultra-low latency)
  2. `Mistral-7B-Instruct-v0.3` (Robust reliability)
  3. `Gemini 2.5 Flash-Lite` (Deep context extraction)

---

## ✨ Signature Features & UX Polish

### 1. High-Fidelity Audio Palette
- **Palette**: Kenshō-Click, Card-Flip, Trash-Sound, Success-Chime, and Warning/Error.
- **Hybrid Engine**: Desktop `pointerdown` (0ms latency) vs Mobile `click` (scroll-safe).

### 2. Tactile 3D Design System
- **Mechanical Physics**: 3D buttons with `3px` displacement and `5px` shadows.
- **Glassmorphism**: 20px blur refractive cards with 1px border-mix layering.
- **Visual Peek UX**: `92vh` hero sections for scroll-cue discovery.

### 3. Mobile-First UX Engineering
- **Adaptive UI**: Responsive Drawer navigation and fixed bottom action bars.
- **Touch Optimization**: Custom event listeners to eliminate mobile tap delay.

---

## 📂 Repository Standards
- **Atomic Commits**: Professional, descriptive version control history.
- **Clean Architecture**: Decoupled components, hooks, and service layers.
- **SEO Optimized**: Dynamic metadata and semantic HTML5 throughout.

---

**"See through the noise. Master what matters."**
*© 2026 Kenshō Engine. Developed by Harshal Patel.*
