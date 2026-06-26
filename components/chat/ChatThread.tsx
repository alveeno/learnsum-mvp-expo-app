/**
 * A single chat thread — real messages over REST, polled every 3s while open.
 *
 * Loads the latest page newest-first and reverses it for chronological display.
 * Sending is optimistic (the bubble appears immediately, then reconciles with the
 * server on the next fetch; reverted on failure). Incoming messages are marked
 * read on open and whenever a poll brings new ones (PATCH …/messages). "My" bubbles
 * are the ones whose sender_id matches the signed-in user (getMyId).
 */
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { KeyboardAvoider } from "../ui/KeyboardAvoider";
import { Avatar } from "../tutor/feedUi";
import { C } from "../tutor/tutorData";
import { getMessages, getMyId, markConversationRead, sendMessage, type ChatMessage } from "../../lib/api";

function clockTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ChatThread({
  conversationId,
  title,
  onBack,
}: {
  conversationId: string;
  title: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [val, setVal] = useState("");
  const [sending, setSending] = useState(false);
  // myId drives bubble alignment (state → re-renders when it resolves); the ref
  // is the same value for use inside the polling/send closures without staleness.
  const [myId, setMyId] = useState<string | null>(null);
  const myIdRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const refresh = useCallback(async () => {
    try {
      const page = await getMessages(conversationId, 1);
      const chrono = [...page.messages].reverse(); // newest-first → chronological
      setMessages(chrono);
      const me = myIdRef.current;
      if (me && chrono.some((m) => !m.is_read && m.sender_id !== me)) {
        markConversationRead(conversationId).catch(() => {});
      }
    } catch {
      // Keep whatever we last had on a transient failure.
    }
  }, [conversationId]);

  useEffect(() => {
    let active = true;
    getMyId()
      .then((id) => {
        if (active) {
          setMyId(id);
          myIdRef.current = id;
        }
      })
      .catch(() => {});
    refresh();
    markConversationRead(conversationId).catch(() => {});
    const t = setInterval(refresh, 3000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [conversationId, refresh]);

  const send = async () => {
    const text = val.trim();
    if (!text || sending) return;
    setVal("");
    setSending(true);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: myIdRef.current ?? "me",
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...(m ?? []), optimistic]);
    try {
      await sendMessage(conversationId, text);
      await refresh(); // replace optimistic with the authoritative list
    } catch {
      setMessages((m) => (m ?? []).filter((x) => x.id !== optimistic.id));
      setVal(text); // restore so the user can retry
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoider>
      <View style={styles.threadHead}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Avatar name={title} size={40} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15.5, fontWeight: "700", color: C.ink }} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>

      {messages === null ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={C.green} />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: C.surface }}
          contentContainerStyle={{ padding: 16, gap: 9 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <Text style={styles.hint}>Say hello — start the conversation.</Text>
          ) : (
            messages.map((m, i) => {
              const mine = m.sender_id === myId;
              return (
                <View key={m.id ?? i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                  <View
                    style={[
                      styles.bubble,
                      mine
                        ? { backgroundColor: C.green, borderBottomRightRadius: 6 }
                        : { backgroundColor: "#fff", borderWidth: 1, borderColor: C.hairline, borderBottomLeftRadius: 6 },
                    ]}
                  >
                    <Text style={{ fontSize: 14.5, lineHeight: 20, color: mine ? "#fff" : C.ink }}>{m.content}</Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 10.5,
                      color: C.unselIc,
                      fontWeight: "600",
                      marginTop: 3,
                      marginHorizontal: 4,
                      textAlign: mine ? "right" : "left",
                    }}
                  >
                    {clockTime(m.created_at)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <View style={styles.composer}>
        <TextInput
          value={val}
          onChangeText={setVal}
          placeholder="Message…"
          placeholderTextColor={C.unselIc}
          style={styles.composerInput}
          onSubmitEditing={send}
          returnKeyType="send"
          editable={!sending}
        />
        <Pressable onPress={send} disabled={!val.trim() || sending} style={[styles.sendBtn, { backgroundColor: val.trim() && !sending ? C.green : C.unselBg }]}>
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  threadHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingLeft: 4,
    paddingRight: 10,
    paddingTop: 2,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.hairline,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
  hint: { textAlign: "center", fontSize: 12.5, color: C.unselIc, fontWeight: "600", marginTop: 8 },
  bubble: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: C.hairline,
  },
  composerInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: C.hairline,
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    fontSize: 16,
    color: C.ink,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
