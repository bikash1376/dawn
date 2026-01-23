# Architecture & Data Flow

## Overview
**Dropdawn** is a modern, AI-powered chat application built with Next.js 14, leveraging the Vercel AI SDK for streaming responses and Supabase for authentication and data persistence. It features a premium, glassmorphism UI and supports multiple AI models and active tool integrations.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Framer Motion (Animations)
- **Database & Auth**: Supabase (PostgreSQL + GoTrue)
- **AI Engine**: Vercel AI SDK (Streaming, Tool Calling)

## System Architecture

### 1. Frontend Layer (`src/app`)
- **Single Page Application (SPA)** feel using Next.js App Router.
- **`page.tsx`**: Main entry point. Handles:
  - Chat interface (`useChat` hook).
  - Sidebar navigation (History).
  - Modals (Auth, Settings, Tools).
  - Real-time tool UI rendering.
- **`layout.tsx`**: enhanced with `ThemeProvider` for Light/Dark mode.
- **Components**:
  - `AuthModal`: Custom glassmorphic authentication flow.
  - UI Library: extensive use of `radix-ui` primitives via `shadcn/ui`.

### 2. Backend API Layer (`src/app/api`)
- **`/api/chat/route.ts`**: The core intelligence engine.
  - **Dynamic Model Selection**: Switches between Google Gemini, Mistral, Cohere, etc., based on user choice.
  - **Tool Definitions**: Server-side execution of tools:
    - `calculate`: Math operations.
    - `weather`: Real-time weather data.
    - `webSearch`: Tavily search API.
    - `pdfGenerator`: Server-side PDF creation.
    - `landingPageGenerator`: On-demand HTML generation.
  - **Streaming**: Returns a `StreamingTextResponse` for low-latency feedback.

### 3. Data Persistence Layer (Supabase)
- **Authentication**:
  - OAuth (Google) and Email/Password login.
  - Row Level Security (RLS) ensures users only access their own data.
- **Database Schema**:
  - `conversations`: Stores chat sessions (id, user_id, title).
  - `messages`: Stores individual exchanges (role, content, tool_invocations).

## Data Flow
1. **User Interaction**: User types a message in the UI.
2. **Optimistic UI**: Message appears immediately.
3. **API Request**: `useChat` sends POST request to `/api/chat` with history.
4. **Server Processing**:
   - Validates tool usage.
   - Calls selected LLM Provider.
   - Executes Tools (if invoked by LLM).
5. **Streaming Response**: Chunks are sent back to client via HTTP Streaming.
6. **Persistence**:
   - `onFinish` callback in client syncs the completed exchange to Supabase.
   - Images/Tool results are stored in the `images` JSONB column (mapped to tool invocations).

## Directory Structure
```
src/
├── app/
│   ├── api/chat/       # Main chat endpoint
│   ├── auth/           # Auth callbacks
│   ├── layout.tsx      # Root layout + Providers
│   └── page.tsx        # Main application logic
├── components/         # React components (auth-modal, ui)
├── lib/               
│   ├── supabase/       # Client/Server Supabase utilities
│   └── utils.ts        # CN helper
└── ...
```