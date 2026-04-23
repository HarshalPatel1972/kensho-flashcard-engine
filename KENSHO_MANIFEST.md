# KENSHŌ — See Through the Noise
**AI-Powered Flashcard Engine & Spaced Repetition Workspace**

Built for the **Cuemath AI Builder Challenge** by **Harshal Patel**.

---

## 🚀 Overview
Kenshō is a high-fidelity learning platform designed to turn dense, complex information into durable long-term knowledge. It leverages advanced AI to automate the tedious process of flashcard creation and uses the scientific SM-2 algorithm to optimize the study schedule.

## 🛠️ The Tech Stack
- **Frontend**: Next.js 16 (App Router) + React 19 + Turbopack.
- **Backend (High Performance)**: Go (Golang) orchestration for AI processing and PDF handling.
- **Styling**: Vanilla CSS + Tailwind CSS (v4) with a custom "Apple-Glass" design system.
- **Database**: PostgreSQL (Neon Serverless) with Drizzle ORM.
- **Authentication**: Clerk (Secure session management).
- **AI Models**: Multi-model fallback chain (Groq Llama 3.1, Mistral 7B, Gemini 2.5 Flash).
- **Storage**: Vercel Blob & UploadThing for PDF assets.

## ✨ Key Features

### 1. AI-Driven Card Generation
Upload any PDF (lecture notes, textbooks, research papers) and Kenshō's AI automatically extracts the most salient points, formatting them into high-quality active recall questions and answers.

### 2. SM-2 Spaced Repetition
Every card in Kenshō is scheduled using a refined version of the SM-2 algorithm. It tracks your ease-factor, repetitions, and intervals, ensuring you review material exactly at the point of forgetting to maximize retention.

### 3. Tactile 3D Interface
The UI is designed with a "Physical Digital" philosophy. Buttons have weight and depth (3D displacement), and interactions are reinforced with a custom hybrid audio engine that provides subtle click and flip sounds.

### 4. Multi-Model AI Resilience
To ensure 100% availability, Kenshō uses a prioritized fallback system:
`Groq (Ultra-fast) -> Mistral (Reliable) -> Gemini (Deep analysis)`.

### 5. AI Learning Coach
After each study session, an AI Coach analyzes your performance data (quality scores, speed, patterns) and provides specific, actionable feedback to help you improve your study habits.

## 🎨 Design Philosophy
- **Minimalism**: Removing everything that doesn't help the user learn.
- **High Contrast**: Using deep blacks and high-contrast anchors (the "Visual Peek" footer) to guide focus.
- **Glassmorphism**: Layered depth using refractive blurs and subtle borders.
- **Accessibility**: Standardized 3D tactile feedback and keyboard-first navigation (1-4 rating shortcuts).

## 📊 Technical Architecture
- **Hybrid Backend**: Next.js handles the UI and user sessions, while a high-performance Go backend handles heavy-lifting AI tasks and PDF text parsing to keep the frontend responsive.
- **Edge Middleware**: Custom "Proxy" middleware manages public vs. private route protection at the edge for maximum performance.
- **Atomic Commits**: The repository is maintained with atomic, recruiter-ready commit logs reflecting a professional production timeline.

---

**"See through the noise. Master what matters."**
*© 2026 Kenshō Engine. Developed by Harshal Patel.*
