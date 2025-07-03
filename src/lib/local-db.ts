import Dexie, { Table } from 'dexie';

export interface LocalChatMessage {
  id?: string; // Supabase message ID
  chatId: string; // ID of the chat (group or private)
  senderId: string;
  senderName: string;
  content: string;
  createdAt: number; // Timestamp
  type: 'text' | 'image' | 'file'; // Extendable message types
  status: 'sending' | 'sent' | 'failed'; // Message status
  // Add more fields as needed for future extensions
}

export interface LocalChat {
  id?: string; // Supabase chat ID
  type: 'group' | 'private';
  name?: string; // For group chats
  participants: string[]; // Array of user IDs
  lastMessageContent?: string;
  lastMessageAt?: number;
  // Add more fields as needed
}

export class LocalDatabase extends Dexie {
  messages!: Table<LocalChatMessage>;
  chats!: Table<LocalChat>;

  constructor() {
    super('synaplyLocalDb');
    this.version(1).stores({
      messages: '++id, chatId, senderId, createdAt',
      chats: '++id, type, *participants', // *participants for multi-entry indexing
    });
  }
}

export const localDb = new LocalDatabase();
