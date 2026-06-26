import { apiFetch } from "./client";
import { getMe } from "./auth";

/**
 * In-app chat (REST). The backend supports Realtime, but the app polls instead —
 * it has no Supabase client and stays request-only (see the chat screens, which
 * re-fetch on an interval while open).
 *
 *   GET   /api/conversations                  → list (each with other_participant + unread_count)
 *   POST  /api/conversations { participant_id } → start/find a 1:1 thread
 *   GET   /api/conversations/[id]/messages?page=N → newest-first, paginated
 *   POST  /api/conversations/[id]/messages { content } → send
 *   PATCH /api/conversations/[id]/messages    → mark received messages read
 */

export interface ChatParticipant {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Conversation {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string | null;
  created_at: string;
  other_participant: ChatParticipant | null;
  unread_count: number;
}

export interface ChatMessage {
  id?: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MessagesPage {
  messages: ChatMessage[];
  pagination: { page: number; page_size: number; total: number; has_more: boolean };
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await apiFetch<{ conversations: Conversation[] }>("/api/conversations");
  return res.conversations;
}

/** Start a 1:1 conversation (or return the existing one) with another profile. */
export async function startConversation(participantId: string): Promise<{ id: string; created: boolean }> {
  const res = await apiFetch<{ conversation: { id: string }; created: boolean }>("/api/conversations", {
    method: "POST",
    body: { participant_id: participantId },
  });
  return { id: res.conversation.id, created: res.created };
}

/** Messages for a thread, newest-first (reverse for chronological display). */
export async function getMessages(conversationId: string, page = 1): Promise<MessagesPage> {
  return apiFetch<MessagesPage>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
    query: { page },
  });
}

export async function sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
  const res = await apiFetch<{ message: ChatMessage }>(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "POST", body: { content } },
  );
  return res.message;
}

/** Mark every message the caller received in this thread as read; returns the count. */
export async function markConversationRead(conversationId: string): Promise<number> {
  const res = await apiFetch<{ marked_read: number }>(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "PATCH" },
  );
  return res.marked_read;
}

// The caller's own profile id, cached for the session — used to tell "my" message
// bubbles from the other person's (a message is mine when sender_id === this id).
let cachedMyId: string | null = null;
export async function getMyId(): Promise<string> {
  if (cachedMyId) return cachedMyId;
  const me = await getMe();
  cachedMyId = me.user.id;
  return cachedMyId;
}
