import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Downstream placeholder for the step AFTER interest selection.
 *
 * The real next screen is not built yet (see CLAUDE.md). This exists only so
 * Continue / Skip have somewhere to land, and it echoes the data passed forward
 * from StudentCatSel so the handoff can be verified by eye.
 */
type ForwardedInterest = { category?: string; label?: string };

export default function OnboardingNextPlaceholder() {
  const { educationLevel, interests } = useLocalSearchParams<{
    educationLevel?: string;
    interests?: string;
  }>();

  const parsed = useMemo<ForwardedInterest[]>(() => {
    if (!interests) return [];
    try {
      return JSON.parse(interests) as ForwardedInterest[];
    } catch {
      return [];
    }
  }, [interests]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.backButton} hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#2D6A4F" />
        </Pressable>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Next step</Text>
          <Text style={styles.subtitle}>Coming soon — placeholder.</Text>

          <Text style={styles.passed}>
            Education level: {educationLevel ?? "(skipped)"}
          </Text>
          <Text style={styles.passed}>
            Interests passed in: {parsed.length}
          </Text>

          <View style={styles.list}>
            {parsed.map((it, i) => (
              <Text key={i} style={styles.listItem}>
                • {it.category} — {it.label}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#F9F9F7",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingTop: 24, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  subtitle: { marginTop: 8, fontSize: 14, color: "#6B7280" },
  passed: { marginTop: 16, fontSize: 14, fontWeight: "600", color: "#2D6A4F" },
  list: { marginTop: 12 },
  listItem: { marginTop: 4, fontSize: 14, color: "#111827" },
});
