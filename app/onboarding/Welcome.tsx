import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { useT } from "../../components/i18n/LanguageProvider";
import { Button } from "../../components/ui/Button";

/**
 * Shared onboarding completion screen — "Welcome to LearnSum".
 *
 * Reached after the final Continue of every role's flow (tutor / student /
 * parent). The destination home differs by role, so each caller passes it as a
 * `next` route param: tutor → /tutor-home, student & parent → /feed.
 *
 * Continue clears the whole onboarding stack and lands on that home, so there's
 * no swiping back into the onboarding screens.
 */
const DEFAULT_HOME = "/feed";

export default function Welcome() {
  const t = useT();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const home = (next ?? DEFAULT_HOME) as Href;

  const goHome = () => {
    router.dismissAll();
    router.replace(home);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.body}>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={44} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>{t("welcomeDone.title")}</Text>
        <Text style={styles.subtitle}>{t("welcomeDone.subtitle")}</Text>
      </View>
      <View style={styles.footer}>
        <Button label={t("common.continue")} variant="primary" onPress={goHome} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, color: "#16201C", textAlign: "center" },
  subtitle: { marginTop: 10, fontSize: 15.5, lineHeight: 22, color: "#6B7280", textAlign: "center" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },
});
