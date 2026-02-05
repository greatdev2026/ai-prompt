# AI Prompt — React + TypeScript + Tailwind

Lightweight AI prompt app built with React 18, TypeScript and Tailwind CSS.

Features
- Prompt input (controlled) + submit button
- Calls an AI provider OpenAI on backend
- Shows responses dynamically with loading & error states
- Saves chat history to localStorage
- Clear history button
- Accessible components (labels, aria-live, keyboard friendly)
- Reusable, small, and well-typed components

Quick start (dev)
1. Clone or copy this repo.
2. Create env files:
   - backend/.env (copy backend/.env.example and fill values)
   - frontend/.env (copy frontend/.env.example and fill values)

3. Start services:
   - Backend:
     cd backend
     npm install
     npm run dev

   - Frontend:
     cd frontend
     npm install
     npm run dev

4. Open the Vite URL (usually http://localhost:5173)

Environment
- VITE_BACKEND_URL — frontend will POST prompts to `${VITE_BACKEND_URL}/api/prompts` and GET history from `${VITE_BACKEND_URL}/api/prompts`. Use this for server-side OpenAI calls (recommended).

Notes
- For production, use a server-side proxy to keep API keys secret.
- This project focuses on frontend architecture, accessibility, and reusability.

Development notes
- Backend sets httpOnly cookies for access & refresh tokens; frontend uses credentials: 'include'.
- For production, set NODE_ENV=production and configure CORS_ORIGIN and secure cookies.
- Keep OPENAI_API_KEY and JWT secrets safe; do not commit them.

What’s included
- Authentication (register/login/refresh/logout)
- Protected prompts endpoints (POST /api/prompts) which call OpenAI server-side
- Prompt history stored per user in MongoDB
- Frontend UI with accessible components, toast system, client-side validation, and optimistic UI for prompt submissions

Tech stack
- React 18 (functional components)
- TypeScript
- Vite
- Tailwind CSS

Files of interest
- src/lib/api.ts — API client abstraction (supports backend)
- src/components/PromptInput.tsx — controlled input + submit UI
- src/components/MessageList.tsx — accessible history list
- src/App.tsx — glue + state management + persistence

License
- MIT
