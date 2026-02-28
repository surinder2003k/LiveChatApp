# LiveChat (Next.js + Express + Socket.io + MongoDB)

Production-ready full-stack real-time chat app.

## Tech

- Frontend: Next.js 15 (App Router), Tailwind CSS, shadcn/ui, Framer Motion, next-themes
- Backend: Node.js, Express, Socket.io, MongoDB (Mongoose), JWT auth

## Features

- Auth: register/login, JWT, protected routes via Next middleware
- Real-time: one-to-one DMs, online/offline presence, typing indicator, seen ticks, **image sharing (NEW)**
- UX: codehelp.in-inspired blue/indigo/purple gradients, card UI, dark/light mode, smooth animations, premium image viewer

## Project structure

- `frontend/` Next.js app
- `backend/` Express API + Socket server

## Environment variables

Create these files:

- `backend/.env` (copy from `backend/.env.example`)
- `frontend/.env.local` (copy from `frontend/.env.local.example`)

## Run locally

### 1) Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Socket events (high level)

- `onlineUsers` → list of online userIds
- `joinChat` → join a deterministic DM room
- `message` → new message payload
- `typing` / `stopTyping`
- `seenUpdate`

## Deployment

- Frontend: Vercel
  - Build: `next build`
  - Env: `NEXT_PUBLIC_BACKEND_URL`
- Backend: Render
  - Start: `node server.js`
  - Env: `MONGO_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`

## Image Sharing Constraints (Render Free Tier)

> [!WARNING]
> Since this project uses **local storage** for images (in `backend/uploads`), files may be deleted when the Render instance restarts or goes to sleep (normal for free tier). For long-term production, it is highly recommended to use **Cloudinary** or **AWS S3** for persistent media storage.

