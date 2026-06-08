import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";
import { useT } from "../../components/i18n/LanguageProvider";

/**
 * Tutor onboarding — step 1: the "inspiration deck" of sample tutor profiles.
 *
 * Placeholder for now (per brief): it just lets the tutor proceed to the next
 * step ("Who do you teach?"). Real sample profiles will be added later.
 */
const PROGRESS = 0.25;

export default function TutorInspiration() {
  const t = useT();
  const goNext = () => router.push("/onboarding/TutorTeachLevels");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable
            hitSlop={8}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={34} color="#2D6A4F" />
          </View>
          <Text style={styles.title}>{t("tutor.inspiration.title")}</Text>
          <Text style={styles.subtitle}>{t("tutor.inspiration.subtitle")}</Text>
        </View>

        <Button
          label={t("common.continue")}
          variant="primary"
          onPress={goNext}
          style={styles.continue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  progressTrack: { height: 4, backgroundColor: "#E5E7EB", width: "100%" },
  progressFill: { height: 4, backgroundColor: "#2D6A4F" },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", height: 44 },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F1EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", textAlign: "center" },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  continue: { marginBottom: 0 },
});
