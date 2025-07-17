#!/usr/bin/env node
/**
 * Messaging Service CLI Test Tool
 *
 * Interactive CLI to test your actual messaging service endpoints
 * while monitoring real-time updates via Firebase.
 *
 * Usage: yarn tsx packages/services/messaging/src/test/manual/messaging-cli-test.ts
 */

import { FirebaseAdminClient } from '@pika/shared'
import { get } from 'lodash-es'
import * as readline from 'readline'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const AUTH_TOKEN =
  process.env.INTERNAL_API_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJpbnRlcm5hbCIsImVtYWlsIjoiaW50ZXJuYWxAYXBwLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQzMzg2NDU4LCJleHAiOjE3NzQ5NDQwNTh9.8NrrgnNflWNf3TlRv2YQlrPH7akQPFYRBBFJvc8dW0I'

// Firebase setup
const admin = FirebaseAdminClient.getInstance()
const db = admin.firestore

// State
let currentConversationId: string | null = null
let activeListeners: Array<() => void> = []

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Helper to print colored text
function print(message: string, color: keyof typeof colors = 'reset') {
  const colorsColor = get(colors, color)

  console.log(`${colorsColor}${message}${colors.reset}`)
}

// Helper to ask questions
function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

print('🚀 Pika Messaging CLI Test Tool\n', 'green')
print(`API URL: ${API_BASE_URL}`, 'blue')
print(
  `Using Firebase Emulator: ${process.env.FIREBASE_EMULATOR === 'true' ? 'Yes' : 'No'}\n`,
  'blue',
)

// API Helpers
async function apiCall(method: string, endpoint: string, body?: any) {
  const url = `${API_BASE_URL}${endpoint}`

  print(`\n→ ${method} ${endpoint}`, 'cyan')

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json()

    if (response.ok) {
      print(`✓ Success (${response.status})`, 'green')

      return { success: true, data }
    } else {
      print(`✗ Error (${response.status})`, 'red')
      print(`  ${data.error?.message || 'Unknown error'}`, 'red')

      return { success: false, error: data.error }
    }
  } catch (error: any) {
    print(`✗ Network Error: ${error.message}`, 'red')

    return { success: false, error: error.message }
  }
}

// Real-time Monitoring
function startRealtimeMonitoring(conversationId: string) {
  print('\n📡 Starting real-time monitoring...', 'yellow')

  // Clear previous listeners
  activeListeners.forEach((unsubscribe) => unsubscribe())
  activeListeners = []

  // Monitor messages
  const messagesUnsubscribe = db
    .collection('conversations')
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(10)
    .onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data()

            print(`\n💬 New message:`, 'green')
            console.log(`   From: ${data.senderId}`)
            console.log(`   Content: "${data.content}"`)
            console.log(
              `   Time: ${data.createdAt?.toDate?.()?.toLocaleTimeString() || 'N/A'}`,
            )
          }
        })
      },
      (error) => {
        print(`\n❌ Error monitoring messages: ${error.message}`, 'red')
      },
    )

  activeListeners.push(messagesUnsubscribe)

  // Monitor conversation updates
  const convUnsubscribe = db
    .collection('conversations')
    .doc(conversationId)
    .onSnapshot(
      (doc) => {
        if (doc.exists) {
          const data = doc.data()!

          if (data.lastMessage) {
            print(`\n📊 Conversation updated`, 'blue')
            console.log(`   Last message: "${data.lastMessage.content}"`)
            console.log(`   Unread counts:`)
            Object.entries(data.participants).forEach(
              ([userId, participant]: [string, any]) => {
                console.log(`     ${userId}: ${participant.unreadCount}`)
              },
            )
          }
        }
      },
      (error) => {
        print(`\n❌ Error monitoring conversation: ${error.message}`, 'red')
      },
    )

  activeListeners.push(convUnsubscribe)
}

// Menu Actions
async function createConversation() {
  const participant1 =
    (await ask(
      'Enter first participant ID (or press Enter for "internal"): ',
    )) || 'internal'
  const participant2 = await ask('Enter second participant ID: ')

  if (!participant2) {
    print('❌ Second participant ID is required', 'red')

    return
  }

  const includeContext = await ask('Include conversation context? (y/n): ')

  let context

  if (includeContext.toLowerCase() === 'y') {
    print('\nContext types:', 'cyan')
    console.log('1. GENERAL')
    console.log('2. VOUCHER_REDEMPTION')
    console.log('3. VOUCHER_INQUIRY')
    console.log('4. PROVIDER_INQUIRY')

    const contextChoice = await ask('Select context type (1-4): ')
    const contextTypes = [
      'GENERAL',
      'VOUCHER_REDEMPTION',
      'VOUCHER_INQUIRY',
      'PROVIDER_INQUIRY',
    ]
    const contextType = contextTypes[parseInt(contextChoice) - 1] || 'GENERAL'

    context = {
      type: contextType,
      id: generateUUID(),
      metadata: {},
    }
  }

  const result = await apiCall('POST', '/api/v1/conversations', {
    participantIds: [participant1, participant2],
    ...(context && { context }),
  })

  if (result.success) {
    currentConversationId = result.data.conversationId
    print(`\n✅ Conversation created: ${currentConversationId}`, 'green')

    if (currentConversationId) {
      startRealtimeMonitoring(currentConversationId)
    }
  }
}

async function listConversations() {
  const result = await apiCall('GET', '/api/v1/conversations?limit=10')

  if (result.success) {
    print(`\nFound ${result.data.conversations.length} conversations:`, 'cyan')

    result.data.conversations.forEach((conv: any, index: number) => {
      console.log(`\n${index + 1}. ${colors.yellow}${conv.id}${colors.reset}`)
      console.log(
        `   Participants: ${conv.participants.map((p: any) => p.userId).join(', ')}`,
      )
      if (conv.lastMessage) {
        console.log(`   Last message: "${conv.lastMessage.content}"`)
        console.log(`   Sent by: ${conv.lastMessage.senderId}`)
      }
    })

    if (result.data.conversations.length > 0) {
      const selectConversation = await ask(
        '\nSelect a conversation number to monitor (or press Enter to skip): ',
      )

      if (selectConversation) {
        const index = parseInt(selectConversation) - 1

        if (index >= 0 && index < result.data.conversations.length) {
          const conversation = get(result.data.conversations, index)

          if (!conversation) {
            print('❌ Conversation not found', 'red')

            return
          }

          currentConversationId = get(conversation, 'id')

          if (currentConversationId) {
            startRealtimeMonitoring(currentConversationId)
          }
        }
      }
    }
  }
}

async function sendMessage() {
  if (!currentConversationId) {
    print(
      '\n❌ No conversation selected. Please create or select one first.',
      'red',
    )

    return
  }

  const content = await ask('Enter message content: ')

  if (!content) {
    print('❌ Message cannot be empty', 'red')

    return
  }

  const result = await apiCall(
    'POST',
    `/api/v1/conversations/${currentConversationId}/messages`,
    {
      type: 'TEXT',
      content,
    },
  )

  if (result.success) {
    print(`\n✅ Message sent: ${result.data.messageId}`, 'green')
  }
}

async function getMessages() {
  if (!currentConversationId) {
    print(
      '\n❌ No conversation selected. Please create or select one first.',
      'red',
    )

    return
  }

  const result = await apiCall(
    'GET',
    `/api/v1/conversations/${currentConversationId}/messages?limit=20`,
  )

  if (result.success) {
    print(`\nFound ${result.data.messages.length} messages:`, 'cyan')

    result.data.messages.forEach((msg: any) => {
      console.log(`\n${colors.yellow}${msg.id}${colors.reset}`)
      console.log(`   From: ${msg.senderId} (${msg.senderType})`)
      console.log(`   Content: "${msg.content}"`)
      console.log(`   Time: ${msg.createdAt}`)
    })
  }
}

async function markAsRead() {
  if (!currentConversationId) {
    print(
      '\n❌ No conversation selected. Please create or select one first.',
      'red',
    )

    return
  }

  // Get recent messages to mark as read
  const messagesResult = await apiCall(
    'GET',
    `/api/v1/conversations/${currentConversationId}/messages?limit=10`,
  )

  if (messagesResult.success && messagesResult.data.messages.length > 0) {
    const messageIds = messagesResult.data.messages.map((m: any) => m.id)

    const result = await apiCall(
      'PATCH',
      `/api/v1/conversations/${currentConversationId}/read`,
      {
        messageIds,
      },
    )

    if (result.success) {
      print(`\n✅ Marked ${messageIds.length} messages as read`, 'green')
    }
  } else {
    print('\n⚠️  No messages to mark as read', 'yellow')
  }
}

async function checkHealth() {
  const result = await apiCall('GET', '/health')

  if (result.success) {
    print('\n✅ Service is healthy', 'green')
    console.log(`   Status: ${result.data.status}`)
    console.log(`   Version: ${result.data.version}`)
    console.log(
      `   Services: ${result.data.services?.map((s: any) => s.name).join(', ')}`,
    )
  }
}

// Utility function
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8

    return v.toString(16)
  })
}

// Main Menu
async function showMenu() {
  print('\n════════════════════════════════════════', 'cyan')
  if (currentConversationId) {
    print(`Current conversation: ${currentConversationId}`, 'green')
  }

  console.log('\nWhat would you like to do?')
  console.log('1. 📝 Create new conversation')
  console.log('2. 📋 List conversations')
  console.log('3. 💬 Send message')
  console.log('4. 📖 Get messages')
  console.log('5. ✓  Mark messages as read')
  console.log('6. 🏥 Check service health')
  console.log('7. 🚪 Exit')

  const choice = await ask('\nEnter your choice (1-7): ')

  switch (choice) {
    case '1':
      await createConversation()
      break
    case '2':
      await listConversations()
      break
    case '3':
      await sendMessage()
      break
    case '4':
      await getMessages()
      break
    case '5':
      await markAsRead()
      break
    case '6':
      await checkHealth()
      break
    case '7':
      print('\n👋 Goodbye!', 'yellow')
      activeListeners.forEach((unsubscribe) => unsubscribe())
      rl.close()
      process.exit(0)
      break
    default:
      print('\n❌ Invalid choice. Please try again.', 'red')
      break
  }

  // Show menu again
  setTimeout(showMenu, 1000)
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  print('\n\n👋 Shutting down...', 'yellow')
  activeListeners.forEach((unsubscribe) => unsubscribe())
  rl.close()
  process.exit(0)
})

// Start the application
showMenu()
