/**
 * Conversation list (content only — callers add their own header).
 *
 * Real data via GET /api/conversations, refreshed on a 5s poll while mounted (the
 * app has no live connection — see chat.ts). Each row shows the other person, the
 * last-activity time and an unread badge. There's no last-message preview because
 * the list endpoint doesn't return message text. Tapping a row calls onOpen.
 */
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../tutor/feedUi";
import { C } from "../tutor/tutorData";
import { listConversations, type Conversation } from "../../lib/api";

function nameOf(c: Conversation): string {
  return c.other_participant?.display_name?.trim() || "LearnSum user";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(then).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChatList({ onOpen }: { onOpen: (c: Conversation) => void }) {
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    listConversations()
      .then((list) => {
        setItems(list);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  if (loading && items === null) {
    return (
      <View style={styles.stateWrap}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  }

  if (error && items === null) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cloud-offline-outline" size={36} color={C.unselIc} />
        <Text style={styles.emptyTitle}>Couldn&apos;t load messages</Text>
        <Pressable onPress={refresh} style={styles.retryBtn}>
          <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.ink }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="chatbubbles-outline" size={34} color={C.green} />
        </View>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptyBody}>
          When you message a tutor (or someone messages you), the conversation shows up here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
      {items.map((c) => {
        const name = nameOf(c);
        const unread = c.unread_count > 0;
        return (
          <Pressable key={c.id} onPress={() => onOpen(c)} style={styles.listRow}>
            <View>
              <Avatar name={name} uri={c.other_participant?.avatar_url ?? undefined} size={52} />
              {unread && (
                <View style={styles.listUnread}>
                  <Text style={{ fontSize: 11.5, fontWeight: "800", color: "#fff" }}>{c.unread_count}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <Text style={{ fontSize: 15.5, fontWeight: "700", color: C.ink }} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={{ fontSize: 12, color: C.unselIc, fontWeight: "600" }}>{relativeTime(c.last_message_at)}</Text>
              </View>
              <Text style={{ fontSize: 13.5, color: unread ? C.ink : C.muted, fontWeight: unread ? "600" : "400", marginTop: 3 }} numberOfLines={1}>
                {unread ? `${c.unread_count} new message${c.unread_count === 1 ? "" : "s"}` : "Tap to open"}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.hairline },
  listUnread: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  stateWrap: { flex: 1, paddingVertical: 56, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 56, paddingHorizontal: 28 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.greenTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 4 },
  emptyBody: { marginTop: 8, fontSize: 14, lineHeight: 20, color: C.muted, textAlign: "center" },
  retryBtn: { marginTop: 14, height: 38, paddingHorizontal: 18, borderRadius: 19, borderWidth: 1.5, borderColor: C.hairline, alignItems: "center", justifyContent: "center" },
});
