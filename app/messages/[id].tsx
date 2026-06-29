/**
 * A single chat thread route. `id` is the conversation id; `name` (optional) is
 * the other person's display name for the header; `otherId` (optional) is the
 * other participant's profile id.
 *
 * Reply gating: when the viewer is a **tutor** and hasn't unlocked the other
 * person (a seeker) yet, the composer is replaced by `TutorReplyGate` (free →
 * upgrade prompt; premium/deluxe → spend a daily contact). Seekers always reply
 * freely.
 */
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native";

import { ChatThread } from "../../components/chat/ChatThread";
import { TutorReplyGate } from "../../components/match/TutorReplyGate";
import { useContactQuota } from "../../components/tutor/contactQuota";
import { getMe, type Role } from "../../lib/api";

export default function MessageThread() {
  const { id, name, otherId } = useLocalSearchParams<{ id?: string; name?: string; otherId?: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const { isUnlocked } = useContactQuota();

  useEffect(() => {
    let active = true;
    getMe()
      .then((me) => active && setRole(me.profile.role))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const locked = role === "tutor" && !!otherId && !isUnlocked(otherId);
  const composerSlot = locked && otherId ? <TutorReplyGate seekerId={otherId} seekerName={name || "this student"} /> : undefined;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ChatThread conversationId={id ?? ""} title={name || "Chat"} onBack={() => router.back()} composerSlot={composerSlot} />
    </SafeAreaView>
  );
}
