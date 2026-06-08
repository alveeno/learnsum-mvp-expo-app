import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Button } from "../components/ui/Button";
import { useT } from "../components/i18n/LanguageProvider";

/**
 * Home feed — placeholder.
 *
 * The student and parent onboarding flows land here when finished or skipped
 * (the tutor flow lands on TutorNext for now). The real feed of matched tutors
 * isn't built yet (see the route map in CLAUDE.md); this just gives every flow a
 * real screen to arrive on instead of an unmatched route.
 */
export default function Feed() {
  const t = useT();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={32} color="#2D6A4F" />
        </View>
        <Text style={styles.title}>{t("feed.title")}</Text>
        <Text style={styles.subtitle}>{t("feed.subtitle")}</Text>
        <Button
          label={t("feed.back")}
          variant="ghost"
          onPress={() => router.replace("/")}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E8F1ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#16201C" },
  subtitle: {
    marginTop: 10,
    fontSize: 15.5,
    lineHeight: 22,
    color: "#6B7280",
    textAlign: "center",
  },
  btn: { marginTop: 28, paddingHorizontal: 28 },
});
