# Real-Time Chat Application

This project contains a **NestJS** backend and a **React + Vite** frontend for a real-time chat application.

## Prerequisites
- Node.js (v16+)
- npm

## Setup & Running

### Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   npm install
   ```
2. Start the server:
   ```bash
   npm run start:dev
   ```
   - The API will be available at `http://localhost:3000`.
   - Swagger documentation is at `http://localhost:3000/api`.

### Frontend
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   - The application will be running at `http://localhost:3001` (or similar).

## Features
- **Real-time Messaging**: Uses Socket.io.
- **Room Management**: Create and join rooms via REST API.
- **History**: Chat history fetched via REST API.
- **Swagger Docs**: Fully documented backend endpoints.
- **Strict Typing**: TypeScript used throughout.
