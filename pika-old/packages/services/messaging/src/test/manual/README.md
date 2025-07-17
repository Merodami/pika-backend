# Firebase Real-time Testing Guide

This directory contains tools to test Firebase real-time functionality with your actual backend services.

## 🚀 Quick Start

1. **Start all required services**

   ```bash
   # Start Docker services (PostgreSQL, Redis, Firebase Emulator)
   docker compose up -d

   # Generate Prisma client and run migrations
   yarn local:generate

   # Start all backend services
   yarn local
   ```

2. **Open the Web Test Interface**

   ```bash
   # Open in your browser
   open packages/services/messaging/src/test/manual/test-realtime-messaging.html
   ```

3. **Or use the CLI Tool**
   ```bash
   yarn tsx packages/services/messaging/src/test/manual/messaging-cli-test.ts
   ```

## 🔥 What You Can Test

### Web Interface (`test-realtime-messaging.html`)

This interface works with your actual backend API:

- **API Integration**: All operations go through your real REST API endpoints
- **Real-time Updates**: Firebase listeners show changes instantly
- **Authentication**: Uses JWT tokens from your backend
- **Full Flow Testing**: Create conversations, send messages, see notifications

### CLI Tool (`messaging-cli-test.ts`)

Interactive command-line tool that:

- **Calls your API endpoints** directly
- **Monitors Firebase** for real-time updates
- **Shows both API responses** and real-time changes
- **Supports all messaging operations**

## 🎯 Testing Scenarios

### 1. Basic Message Flow with Real Backend

1. Open the HTML file in your browser
2. Enter a User ID for User 2 (or use a test UUID)
3. Click "Create via API" - this calls your `POST /api/v1/conversations` endpoint
4. Type a message and click "Send via API" - this calls your `POST /api/v1/conversations/:id/messages` endpoint
5. Watch the message appear instantly via Firebase real-time listener
6. See the notification appear in real-time

### 2. API + Real-time Sync

1. Use the CLI tool to create a conversation
2. Open the web interface and load conversations
3. Send a message from the CLI
4. Watch it appear instantly in the web interface

### 3. Multiple Users

1. Open the web interface in multiple browser tabs
2. Use different JWT tokens for different users
3. Create conversations between users
4. See real-time updates across all tabs

## 🛠️ How It Works

```
┌─────────────────┐      HTTP API       ┌─────────────────┐
│                 │───────────────────▶│                 │
│   Web Browser   │                     │  Your Backend   │
│  (or CLI Tool)  │                     │    Services     │
│                 │                     │                 │
└────────┬────────┘                     └────────┬────────┘
         │                                       │
         │ WebSocket                             │ Write
         │ (Listen)                              │
         ▼                                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Firebase Firestore                     │
│                  (Emulator or Production)                │
└─────────────────────────────────────────────────────────┘
```

1. **API Calls**: All create/update operations go through your backend API
2. **Backend Processing**: Your services handle business logic, validation, etc.
3. **Firebase Write**: Your backend writes to Firebase (via FirebaseAdminClient)
4. **Real-time Updates**: Web clients listen directly to Firebase for instant updates

## 📊 Firebase Emulator UI

Visit http://localhost:5002 to see:

- All your Firestore data in real-time
- Messages, conversations, notifications as they're created
- Manual data inspection and modification

## 🔍 Debugging Tips

1. **Check Backend Logs**

   ```bash
   # See logs from all services
   yarn local
   ```

2. **Monitor API Calls**
   - Web interface shows all API responses in the log panel
   - CLI tool shows detailed request/response info

3. **Verify Firebase Connection**
   - Green "Connected" status in web interface
   - Check browser console for Firebase errors

4. **Test Authentication**
   - Use the token from `.env` (INTERNAL_API_TOKEN)
   - Or generate new tokens with proper claims

## 🏗️ Architecture

Your actual implementation flow:

1. **Client** → REST API → **Messaging Service**
2. **Messaging Service** → Business Logic → **Firebase Admin SDK**
3. **Firebase** → WebSocket → **Client (Real-time updates)**

## 🔑 Key Points

- **No Mocking**: Uses your real backend services
- **Real Firebase**: Connects to Firebase Emulator (or production)
- **Full Integration**: Tests the complete flow from API to real-time updates
- **JWT Auth**: Uses your actual authentication system

## 📝 Example Usage

### Web Interface

1. Start all services
2. Open the HTML file
3. Create a conversation using the "Create via API" button
4. Send messages and watch them appear in real-time
5. Check the API log to see all backend interactions

### CLI Tool

```bash
yarn tsx packages/services/messaging/src/test/manual/messaging-cli-test.ts

# Then:
# 1. Create new conversation
# 2. Send message
# 3. Watch real-time updates in the terminal
```

## 🎉 Benefits

1. **Test Real Implementation**: No mocks, uses your actual code
2. **See Full Flow**: API request → Backend processing → Firebase → Real-time update
3. **Debug Integration**: Identify issues between services
4. **Local Development**: Everything runs on your machine
5. **Production-Ready**: Same code works with production Firebase
