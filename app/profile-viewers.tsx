/**
 * Tutor — "Who viewed you" list — `/profile-viewers`.
 *
 * Reached from the Analytics "Profile views" banner. Lists the real people who
 * opened the tutor's profile; Deluxe sees names, Free/Premium see them blurred
 * (see `ProfileViewersScreen`). Tapping a viewer opens `/seekers/[id]`.
 *
 * English-only (mirrors the tutor shell, see CLAUDE.md).
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet } from "react-native";

import { ProfileViewersScreen } from "../components/tutor/ProfileViewersScreen";
import { C } from "../components/tutor/tutorData";

export default function ProfileViewers() {
  return (
    <SafeAreaView style={styles.safe}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={26} color={C.ink} />
      </Pressable>
      <ProfileViewersScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: 4, marginBottom: 2 },
});
