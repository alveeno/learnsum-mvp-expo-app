import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { C } from "../tutor/tutorData";
import { tapMedium } from "../ui/feedback";

/**
 * "Starting lessons with [name]?" notice bar with a green Yes / red No.
 *
 * Shown on the seeker's and tutor's Home + Chat screens while a match question is
 * unanswered. Answering either way clears it (and, for the seeker, frees them to
 * contact another tutor).
 */
export function MatchBanner({
  name,
  onYes,
  onNo,
}: {
  name: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.textWrap}>
        <Ionicons name="school-outline" size={18} color={C.greenD} />
        <Text style={styles.text} numberOfLines={2}>
          Starting lessons with <Text style={styles.name}>{name}</Text>?
        </Text>
      </View>
      <View style={styles.btnRow}>
        <Pressable
          style={[styles.btn, styles.yes]}
          onPress={() => {
            tapMedium();
            onYes();
          }}
          accessibilityRole="button"
          accessibilityLabel="Yes"
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.btnText}>Yes</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.no]}
          onPress={() => {
            tapMedium();
            onNo();
          }}
          accessibilityRole="button"
          accessibilityLabel="No"
        >
          <Ionicons name="close" size={16} color="#fff" />
          <Text style={styles.btnText}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: C.greenTint,
    borderWidth: 1,
    borderColor: "rgba(45,106,79,0.15)",
  },
  textWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  text: { flex: 1, fontSize: 13.5, fontWeight: "600", color: C.ink },
  name: { fontWeight: "800", color: C.greenD },
  btnRow: { flexDirection: "row", gap: 6 },
  btn: { flexDirection: "row", alignItems: "center", gap: 3, height: 34, paddingHorizontal: 13, borderRadius: 17 },
  yes: { backgroundColor: C.green },
  no: { backgroundColor: C.destructive },
  btnText: { color: "#fff", fontSize: 13.5, fontWeight: "800" },
});
