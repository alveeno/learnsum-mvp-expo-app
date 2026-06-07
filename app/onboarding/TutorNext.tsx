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
 * Downstream placeholder for the step AFTER "Who do you teach?".
 *
 * The real next tutor screen isn't built yet; this exists so Continue / Skip
 * have somewhere to land, and it echoes the chosen levels so the handoff can be
 * verified by eye.
 */
const LEVEL_LABELS: Record<string, string> = {
  kindergarten: "Kindergarten",
  primary: "Primary",
  middle: "Middle School",
  high: "High School",
  university: "University",
  adult: "Adult / Pro",
};

export default function TutorNext() {
  const { levels } = useLocalSearchParams<{ levels?: string }>();
  const parsed = useMemo<string[]>(() => {
    if (!levels) return [];
    try {
      const a = JSON.parse(levels);
      return Array.isArray(a) ? (a as string[]) : [];
    } catch {
      return [];
    }
  }, [levels]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.backButton} hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#2D6A4F" />
        </Pressable>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Next step</Text>
          <Text style={styles.subtitle}>Coming soon — placeholder.</Text>

          <Text style={styles.passed}>Levels you teach: {parsed.length}</Text>

          <View style={styles.list}>
            {parsed.map((k) => (
              <Text key={k} style={styles.listItem}>
                • {LEVEL_LABELS[k] ?? k}
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
