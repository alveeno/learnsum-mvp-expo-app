/**
 * Tutor Analytics — `/analytics`.
 *
 * A drill-in from the Home feed's heart icon (it used to be a bottom tab; that
 * slot is now the Saved tab). Its headline is the FREE "Who viewed your profile"
 * list (parents/students who opened your profile → tap to view them, save them,
 * or spend a daily contact unlock). The reach/post dashboard below stays a
 * premium mock — "Upgrade" flips local state to reveal it.
 *
 * English-only (mirrors the tutor shell, see CLAUDE.md).
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet } from "react-native";

import { AnalyticsScreen } from "../components/tutor/AnalyticsScreen";
import { C } from "../components/tutor/tutorData";

export default function Analytics() {
  const [premium, setPremium] = useState(false);
  return (
    <SafeAreaView style={styles.safe}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={26} color={C.ink} />
      </Pressable>
      <AnalyticsScreen premium={premium} onUpgrade={() => setPremium(true)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: 4, marginBottom: 2 },
});
