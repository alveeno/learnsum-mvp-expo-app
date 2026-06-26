/**
 * A single chat thread route. `id` is the conversation id; `name` (optional) is
 * the other person's display name for the header, passed when navigating here.
 */
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native";

import { ChatThread } from "../../components/chat/ChatThread";

export default function MessageThread() {
  const { id, name } = useLocalSearchParams<{ id?: string; name?: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ChatThread conversationId={id ?? ""} title={name || "Chat"} onBack={() => router.back()} />
    </SafeAreaView>
  );
}
