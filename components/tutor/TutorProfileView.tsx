/**
 * Tutor app — viewing ANOTHER tutor's profile (overlay).
 *
 * Opened from the feed, search results, and the suggestions strip; replaces the
 * tab content while the bottom tab bar stays visible. The header + bio/feed body
 * + WhatsApp/WeChat contact live in the shared `TutorProfileContent` (also used
 * by the public `app/tutors/[slug].tsx` route); this overlay just supplies the
 * Connect/Message action row that the tutor app shares across tabs.
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FollowBtn } from "./feedUi";
import { TutorProfileContent } from "./TutorProfileContent";
import { C } from "./tutorData";

export function TutorProfileView({
  id,
  connected,
  onConnect,
  onBack,
}: {
  /** Tutor slug (real) or a sample tutor id (falls back to sample data). */
  id: string;
  connected: boolean;
  onConnect: () => void;
  onBack: () => void;
}) {
  return (
    <TutorProfileContent
      id={id}
      onBack={onBack}
      actions={
        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <FollowBtn following={connected} onToggle={onConnect} />
          </View>
          <Pressable style={styles.messageBtn}>
            <Ionicons name="chatbubble-outline" size={16} color={C.ink} />
            <Text style={styles.messageText}>Message</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", gap: 9, marginTop: 12 },
  messageBtn: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: C.hairline,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  messageText: { fontSize: 13.5, fontWeight: "700", color: C.ink },
});
