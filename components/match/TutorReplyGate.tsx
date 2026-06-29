import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { addTutorMatch } from "./tutorMatch";
import { isUnlocked as quotaIsUnlocked, unlockSeeker, useContactQuota } from "../tutor/contactQuota";
import { C } from "../tutor/tutorData";
import { quotaForTier, useTier } from "../subscription/tierStore";
import { ConfirmModal } from "../ui/ConfirmModal";
import { notifySuccess } from "../ui/feedback";

/**
 * Reply gate shown (in place of the composer) when a TUTOR opens a thread a
 * seeker started and hasn't unlocked them yet.
 *
 *   - **Free** (0/day): "Reply" → upgrade prompt; "Not now" leaves the thread.
 *   - **Premium/Deluxe**: "Reply" → confirm spending 1 of the daily contacts →
 *     unlock the seeker (composer + phone open) and start the tutor's match
 *     question. Out of quota → "resets tomorrow".
 *
 * The seeker's full profile (name/age/education/category) opens via the
 * "View profile" link → `/seekers/[id]` (Req 3 — available in all tiers).
 */
export function TutorReplyGate({ seekerId, seekerName }: { seekerId: string; seekerName: string }) {
  const tier = useTier();
  const { remaining } = useContactQuota();
  const allowance = quotaForTier(tier);
  const [confirm, setConfirm] = useState(false);

  const onReply = () => {
    if (allowance === 0) {
      router.push("/subscribe" as Href);
      return;
    }
    if (remaining <= 0) {
      Alert.alert("No contacts left today", "You've used today's contacts. Your allowance resets tomorrow.", [
        { text: "OK" },
      ]);
      return;
    }
    setConfirm(true);
  };

  const doSpend = () => {
    setConfirm(false);
    const wasUnlocked = quotaIsUnlocked(seekerId);
    const ok = unlockSeeker(seekerId);
    if (ok) {
      if (!wasUnlocked) addTutorMatch(seekerId, seekerName);
      notifySuccess();
      // The parent thread watches isUnlocked() and swaps in the composer.
    } else {
      Alert.alert("No contacts left today", "You've used today's contacts. Your allowance resets tomorrow.", [
        { text: "OK" },
      ]);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={16} color={C.goldD} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>
            {seekerName} messaged you
          </Text>
          <Text style={styles.sub}>
            {allowance === 0
              ? "Upgrade to reply and see their number."
              : `Reply uses 1 of ${remaining} contacts left today.`}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.viewProfile}
        onPress={() => router.push(`/seekers/${encodeURIComponent(seekerId)}` as never)}
        accessibilityRole="button"
      >
        <Ionicons name="person-circle-outline" size={18} color={C.green} />
        <Text style={styles.viewProfileText}>View {seekerName}&apos;s profile</Text>
        <Ionicons name="chevron-forward" size={16} color={C.muted} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actBtn, styles.notNow]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Not now"
        >
          <Text style={styles.notNowText}>Not now</Text>
        </Pressable>
        <Pressable style={[styles.actBtn, styles.reply]} onPress={onReply} accessibilityRole="button" accessibilityLabel="Reply">
          <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
          <Text style={styles.replyText}>Reply</Text>
        </Pressable>
      </View>

      <ConfirmModal
        visible={confirm}
        title="Use a daily contact?"
        message={`Use 1 of your ${allowance} daily contacts to reply to ${seekerName}? You'll also see their phone number. This stays unlocked — replying later is free.`}
        confirmLabel="Use 1 contact"
        cancelLabel="Not now"
        onConfirm={doSpend}
        onCancel={() => setConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderTopWidth: 1, borderTopColor: C.hairline, backgroundColor: "#fff", gap: 10 },
  headRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  lockIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.goldTint, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800", color: C.ink },
  sub: { fontSize: 12.5, color: C.muted, marginTop: 1 },
  viewProfile: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline },
  viewProfileText: { flex: 1, fontSize: 14, fontWeight: "700", color: C.ink },
  actions: { flexDirection: "row", gap: 9 },
  actBtn: { flex: 1, height: 46, borderRadius: 23, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  notNow: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.hairline },
  notNowText: { fontSize: 14.5, fontWeight: "800", color: C.muted },
  reply: { backgroundColor: C.green },
  replyText: { fontSize: 14.5, fontWeight: "800", color: "#fff" },
});
