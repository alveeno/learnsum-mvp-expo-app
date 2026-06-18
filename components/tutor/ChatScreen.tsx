/**
 * Tutor app — CHAT (parents/students who reached out).
 *
 * Ported from `tutor/tutor-chat.jsx`. Front-end only: sending a message appends
 * locally, there is no messaging backend (in-app messaging is not in v1 per
 * CLAUDE.md — this is UI for a later release).
 */
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar } from "./feedUi";
import { C, CHATS, type Chat, type ChatMsg } from "./tutorData";

function ChatList({ onOpen }: { onOpen: (i: number) => void }) {
  return (
    <>
      <View style={{ paddingHorizontal: 16, paddingTop: 2, paddingBottom: 10 }}>
        <Text style={{ fontSize: 26, fontWeight: "800", letterSpacing: -0.6, color: C.ink }}>Messages</Text>
        <Text style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>Parents and students who reached out to you.</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        {CHATS.map((c, i) => (
          <Pressable key={c.id} onPress={() => onOpen(i)} style={styles.listRow}>
            <View>
              <Avatar name={c.who} size={52} />
              {c.unread > 0 && (
                <View style={styles.listUnread}>
                  <Text style={{ fontSize: 11.5, fontWeight: "800", color: "#fff" }}>{c.unread}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <Text style={{ fontSize: 15.5, fontWeight: "700", color: C.ink }} numberOfLines={1}>
                  {c.who}
                </Text>
                <Text style={{ fontSize: 12, color: C.unselIc, fontWeight: "600" }}>{c.time}</Text>
              </View>
              <Text style={{ fontSize: 12, color: C.greenD, fontWeight: "600", marginVertical: 2 }}>{c.sub}</Text>
              <Text
                style={{ fontSize: 13.5, color: c.unread > 0 ? C.ink : C.muted, fontWeight: c.unread > 0 ? "600" : "400" }}
                numberOfLines={1}
              >
                {c.last}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

function ChatThread({ c, onBack }: { c: Chat; onBack: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(c.thread);
  const [val, setVal] = useState("");
  const send = () => {
    if (!val.trim()) return;
    setMsgs((m) => [...m, { me: true, text: val.trim(), time: "now" }]);
    setVal("");
  };
  return (
    <>
      <View style={styles.threadHead}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Avatar name={c.who} size={40} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 15.5, fontWeight: "700", color: C.ink }}>{c.who}</Text>
          <Text style={{ fontSize: 12, color: C.greenD, fontWeight: "600" }}>{c.sub}</Text>
        </View>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="calendar-outline" size={22} color={C.green} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: C.surface }}
        contentContainerStyle={{ padding: 16, gap: 9 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ textAlign: "center", fontSize: 11.5, color: C.unselIc, fontWeight: "600", marginBottom: 4 }}>
          Interested in your profile
        </Text>
        {msgs.map((m, i) => (
          <View key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "78%" }}>
            <View
              style={[
                styles.bubble,
                m.me
                  ? { backgroundColor: C.green, borderBottomRightRadius: 6 }
                  : { backgroundColor: "#fff", borderWidth: 1, borderColor: C.hairline, borderBottomLeftRadius: 6 },
              ]}
            >
              <Text style={{ fontSize: 14.5, lineHeight: 20, color: m.me ? "#fff" : C.ink }}>{m.text}</Text>
            </View>
            <Text style={{ fontSize: 10.5, color: C.unselIc, fontWeight: "600", marginTop: 3, marginHorizontal: 4, textAlign: m.me ? "right" : "left" }}>
              {m.time}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={val}
          onChangeText={setVal}
          placeholder="Message…"
          placeholderTextColor={C.unselIc}
          style={styles.composerInput}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable onPress={send} style={[styles.sendBtn, { backgroundColor: val.trim() ? C.green : C.unselBg }]}>
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </Pressable>
      </View>
    </>
  );
}

export function ChatScreen() {
  const [open, setOpen] = useState<number | null>(null);
  if (open != null) return <ChatThread c={CHATS[open]} onBack={() => setOpen(null)} />;
  return <ChatList onOpen={setOpen} />;
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
