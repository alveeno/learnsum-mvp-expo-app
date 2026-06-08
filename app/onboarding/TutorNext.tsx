import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { useT } from "../../components/i18n/LanguageProvider";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Downstream placeholder for the step AFTER the tutor picks their subjects.
 *
 * The real next tutor screen isn't built yet; this exists so Continue / Skip
 * have somewhere to land, and it echoes the chosen teaching levels AND subjects
 * so the handoff can be verified by eye.
 */
const LEVEL_LABELS: Record<string, string> = {
  kindergarten: "Kindergarten",
  primary: "Primary",
  middle: "Middle School",
  high: "High School",
  university: "University",
  adult: "Adult / Pro",
};

type ForwardedInterest = { category?: string; label?: string };

export default function TutorNext() {
  const t = useT();
  const { levels, interests, tutorDetails, format, langLevels } =
    useLocalSearchParams<{
      levels?: string;
      interests?: string;
      tutorDetails?: string;
      format?: string;
      langLevels?: string;
    }>();

  const parsedLevels = useMemo<string[]>(() => {
    if (!levels) return [];
    try {
      const a = JSON.parse(levels);
      return Array.isArray(a) ? (a as string[]) : [];
    } catch {
      return [];
    }
  }, [levels]);

  const parsedInterests = useMemo<ForwardedInterest[]>(() => {
    if (!interests) return [];
    try {
      const a = JSON.parse(interests);
      return Array.isArray(a) ? (a as ForwardedInterest[]) : [];
    } catch {
      return [];
    }
  }, [interests]);

  const detailCount = useMemo<number>(() => {
    if (!tutorDetails) return 0;
    try {
      const o = JSON.parse(tutorDetails);
      return o && typeof o === "object" ? Object.keys(o).length : 0;
    } catch {
      return 0;
    }
  }, [tutorDetails]);

  const langRated = useMemo<number>(() => {
    if (!langLevels) return 0;
    try {
      const o = JSON.parse(langLevels);
      return o && typeof o === "object" ? Object.keys(o).length : 0;
    } catch {
      return 0;
    }
  }, [langLevels]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.backButton} hitSlop={8} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#2D6A4F" />
        </Pressable>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{t("next.title")}</Text>
          <Text style={styles.subtitle}>{t("next.subtitle")}</Text>

          <Text style={styles.passed}>Levels you teach: {parsedLevels.length}</Text>
          <View style={styles.list}>
            {parsedLevels.map((k) => (
              <Text key={k} style={styles.listItem}>
                • {LEVEL_LABELS[k] ?? k}
              </Text>
            ))}
          </View>

          <Text style={styles.passed}>
            Details captured for {detailCount} subject(s)
          </Text>

          <Text style={styles.passed}>Subjects to teach: {parsedInterests.length}</Text>
          <View style={styles.list}>
            {parsedInterests.map((it, i) => (
              <Text key={i} style={styles.listItem}>
                • {it.category} — {it.label}
              </Text>
            ))}
          </View>

          <Text style={styles.passed}>
            Preferences saved — format: {format || "(none)"}, languages rated:{" "}
            {langRated}
          </Text>
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
