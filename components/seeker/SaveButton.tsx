/**
 * Save / bookmark a tutor — the seeker's primary action (in place of the tutor
 * app's peer "Connect"). Two shapes: a bare icon for feed/search rows, and a
 * full pill for the public profile route's action bar.
 */
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";

import { tapLight } from "../ui/feedback";
import { C } from "../tutor/tutorData";

export function SaveButton({
  saved,
  onToggle,
  variant = "icon",
}: {
  saved: boolean;
  onToggle: () => void;
  variant?: "icon" | "pill";
}) {
  const press = () => {
    tapLight();
    onToggle();
  };

  if (variant === "pill") {
    return (
      <Pressable
        onPress={press}
        style={[styles.pill, saved ? styles.pillOn : styles.pillOff]}
        accessibilityRole="button"
        accessibilityLabel={saved ? "Saved" : "Save tutor"}
      >
        <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={17} color={saved ? "#fff" : C.green} />
        <Text style={[styles.pillText, { color: saved ? "#fff" : C.green }]}>{saved ? "Saved" : "Save"}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={press}
      hitSlop={8}
      style={styles.iconBtn}
      accessibilityRole="button"
      accessibilityLabel={saved ? "Saved" : "Save tutor"}
    >
      <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={22} color={saved ? C.green : C.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  pill: {
    height: 34,
    paddingHorizontal: 15,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pillOn: { backgroundColor: C.green },
  pillOff: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: C.green },
  pillText: { fontSize: 13.5, fontWeight: "700", letterSpacing: -0.1 },
});
