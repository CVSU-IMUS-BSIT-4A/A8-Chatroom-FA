# Activity Document - Real-Time Chat Application

## Activity Title
**Building a Real-Time Chat Application with NestJS and React**

## Activity Date
**January 15, 2026**

---

## Objective

Develop a full-stack real-time chat application that enables users to create chat rooms, join conversations, and exchange messages instantly using WebSocket technology.

---

## Activity Description

This activity involves building a complete real-time chat system consisting of two main components:

1. **Backend Server** - A NestJS application that handles API requests and WebSocket connections
2. **Frontend Client** - A React application that provides the user interface for chatting

### What the Application Does

The chat application allows multiple users to:
- **Create chat rooms** with custom names and descriptions
- **Join existing rooms** to participate in conversations
- **Send and receive messages in real-time** without page refreshes
- **See who's online** in each room
- **Edit and delete rooms** they've created
- **View chat history** when joining a room

---

## Technologies Used

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend Framework | NestJS 10 | Server-side application framework |
| Frontend Framework | React 18 | User interface library |
| Build Tool | Vite 4 | Frontend development and bundling |
| Real-Time Communication | Socket.io | WebSocket-based bidirectional messaging |
| HTTP Client | Axios | REST API calls from frontend |
| Database | SQLite (TypeORM) | Persistent data storage |
| API Documentation | Swagger | Interactive API documentation |
| Language | TypeScript | Type-safe JavaScript for both frontend and backend |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                         Port: 3001                              │
├─────────────────────────────────────────────────────────────────┤
│  ChatInterface Component                                        │
│  ├── Room List (sidebar)                                        │
│  ├── Message Display (main area)                                │
│  ├── Message Input (form)                                       │
│  └── Active Users Panel                                         │
├─────────────────────────────────────────────────────────────────┤
│          │ REST API (Axios)          │ WebSocket (Socket.io)    │
│          ▼                           ▼                          │
├─────────────────────────────────────────────────────────────────┤
│                         BACKEND (NestJS)                        │
│                         Port: 3000                              │
├─────────────────────────────────────────────────────────────────┤
│  ChatController (REST)     │     ChatGateway (WebSocket)        │
│  ├── POST /chat/rooms      │     ├── joinRoom                   │
│  ├── GET /chat/rooms       │     ├── leaveRoom                  │
│  ├── PATCH /chat/rooms/:id │     ├── sendMessage                │
│  ├── DELETE /chat/rooms/:id│     ├── updateRoom                 │
│  └── GET /rooms/:id/msgs   │     └── deleteRoom                 │
├─────────────────────────────────────────────────────────────────┤
│                       ChatService                               │
│                  (Business Logic Layer)                         │
├─────────────────────────────────────────────────────────────────┤
│                    SQLite Database                              │
│              ├── rooms table                                    │
│              └── messages table                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Room
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | String (max 100) | Room display name |
| description | String (max 500) | Optional room description |
| createdAt | DateTime | When the room was created |

### Message
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| roomId | UUID | Reference to the room |
| sender | String (max 50) | Username of the sender |
| content | String (max 2000) | Message text content |
| createdAt | DateTime | When the message was sent |

---

## User Flow

1. **User opens the application** → Frontend loads and connects to WebSocket server
2. **Room list is fetched** → GET request retrieves all available rooms
3. **User clicks on a room** → 
   - WebSocket emits `joinRoom` event
   - REST API fetches message history
   - User sees existing messages
4. **User types and sends a message** →
   - WebSocket emits `sendMessage` event
   - Server broadcasts message to all room members
   - All connected clients receive `receiveMessage` event
5. **Message appears instantly** → Real-time update without page refresh

---

## Key Features Implemented

### Real-Time Messaging
Messages are delivered instantly to all users in a room using WebSocket connections. No polling or page refresh required.

### Room Management
Users can create new rooms, edit room names/descriptions, and delete rooms. All changes are broadcast to connected clients.

### Active Users Tracking
The system tracks who is currently online in each room and displays this information to participants.

### Message Persistence
All messages are stored in a SQLite database, so chat history is preserved even after server restarts.

### Connection Status Indicators
The frontend shows visual feedback about connection status (connected/disconnected/reconnecting).

### Auto-Reconnection
If the WebSocket connection drops, the client automatically attempts to reconnect and rejoins the previous room.

### Input Validation
All user inputs are validated on the server to prevent malicious data from being stored.

### Rate Limiting
API requests are throttled to prevent abuse (100 requests per minute per IP).

---

## How to Run

### Prerequisites
- Node.js v16 or higher
- npm package manager

### Backend Setup
```bash
cd backend
npm install
npm run start:dev
```
The server starts at `http://localhost:3000`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application opens at `http://localhost:3001`

### API Documentation
Swagger UI is available at `http://localhost:3000/api`

---

## Learning Outcomes

Through this activity, the following concepts were practiced:

1. **Full-Stack Development** - Building both frontend and backend components
2. **WebSocket Communication** - Implementing real-time bidirectional messaging
3. **REST API Design** - Creating CRUD endpoints for resources
4. **TypeScript** - Using static typing for safer code
5. **Database Integration** - Persisting data with TypeORM and SQLite
6. **Input Validation** - Sanitizing and validating user inputs
7. **Error Handling** - Managing connection failures and edge cases
8. **Component-Based UI** - Building reusable React components

---

## Project Structure

```
A8-Chatroom-FA/
├── backend/
│   ├── src/
│   │   ├── main.ts                 # Application entry point
│   │   ├── app.module.ts           # Root module configuration
│   │   └── chat/
│   │       ├── chat.controller.ts  # REST API endpoints
│   │       ├── chat.gateway.ts     # WebSocket event handlers
│   │       ├── chat.service.ts     # Business logic
│   │       ├── dto/                # Data transfer objects
│   │       └── entities/           # Database entities
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Root component
│   │   ├── api.ts                  # API client functions
│   │   ├── components/
│   │   │   └── ChatInterface.tsx   # Main chat UI
│   │   └── types/
│   │       └── chat.ts             # TypeScript interfaces
│   └── package.json
└── README.md
```

---

## Conclusion

This activity demonstrated how to build a modern real-time web application using industry-standard technologies. The combination of NestJS for the backend and React for the frontend, connected via Socket.io, provides a responsive and scalable chat solution suitable for learning and extending with additional features.
