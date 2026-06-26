/**
 * Messages — the conversation list as a standalone route, reachable from the
 * seeker Account screen and (via push) the tutor shell. Tapping a row opens the
 * thread route `app/messages/[id].tsx`.
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { ChatList } from "../../components/chat/ChatList";
import { C } from "../../components/tutor/tutorData";
import type { Conversation } from "../../lib/api";

export default function MessagesList() {
  const open = (c: Conversation) => {
    const name = c.other_participant?.display_name ?? "LearnSum user";
    router.push({ pathname: "/messages/[id]", params: { id: c.id, name } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.iconBtn} />
      </View>
      <ChatList onOpen={open} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  head: { flexDirection: "row", alignItems: "center", paddingLeft: 4, paddingRight: 10, paddingTop: 2, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 20, fontWeight: "800", color: C.ink },
});
