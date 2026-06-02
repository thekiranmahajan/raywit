/**
 * Type definitions for Socket.IO-related functionality
 */

import { Socket } from "socket.io-client";
import { Dispatch, SetStateAction } from "react";

// Basic message types
export type MessageType = "system" | "user";

// Chat message structure
export interface ChatMessage {
  type: MessageType;
  sender?: string;
  message: string;
  timestamp: string;
  rawTimestamp?: number; // Raw millisecond timestamp for comparisons
  isSent?: boolean;
  messageId?: string;
  deliveryStatus?: "pending" | "sent" | "delivered"; // pending: retrying, sent: on server, delivered: received by other users
  replyTo?: {
    messageId?: string;
    message: string;
    sender?: string;
  };
}

// Socket event data types
export interface UserJoinLeaveData {
  userId: string;
  users: string[];
}

export interface TypingEventData {
  userIds: string[];
}

export interface MessageEventData {
  encryptedData: string;
  userId: string;
  userName?: string;
  messageId?: string;
  timestamp?: number;
  replyTo?: {
    messageId?: string;
    message: string;
    sender?: string;
  };
}

// Server message format for load-old-messages
export interface ServerMessage {
  encryptedData: string;
  userId: string;
  userName?: string;
  messageId?: string;
  timestamp?: number;
  replyTo?: {
    messageId?: string;
    message: string;
    sender?: string;
  };
}

export interface LoadOldMessagesData {
  messages: ServerMessage[];
}

// User events tracking
export interface UserEvents {
  joined?: string;
  left?: string;
}

// Socket hook return type
export interface SocketHookReturn {
  socket: Socket | null;
  userId: string;
  sendMessage: (
    encryptedData: string,
    userId: string,
    replyTo?: { message: string; sender?: string; messageId?: string },
  ) => void;
  sendTyping: (isTyping: boolean) => void;
  usersTyping: string[];
  userEvents: UserEvents;
  users: string[];
  isConnected: boolean;
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}
