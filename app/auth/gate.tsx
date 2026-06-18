import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { LoginSheet } from "../../components/auth/LoginSheet";
import { useT } from "../../components/i18n/LanguageProvider";
import { startTutorSetup } from "../../components/onboarding/tutorOnboarding";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/tutor/feedUi";

/**
 * Auth gate — shown when an unregistered tutor tries to like, comment, connect,
 * post, or open the advanced search filters in `/tutor-home`.
 *
 * Two ways forward:
 *  - "Sign up" → the tutor onboarding gate (`startTutorSetup`), which collects
 *    credentials then walks the set-up-profile steps.
 *  - "Log in"  → the existing (placeholder) LoginSheet.
 *
 * Reached via `router.push("/auth/gate")`, so Back returns to the tab the user
 * was on; finishing onboarding `dismissTo`s `/tutor-home`, clearing this route.
 */
export default function AuthGate() {
  const t = useT();
  const [loginVisible, setLoginVisible] = useState(false);

  const onSignUp = () => startTutorSetup();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable hitSlop={8} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </Pressable>
        <View />
      </View>

      <View style={styles.body}>
        <Logo size={30} />
        <Text style={styles.h1}>{t("authGate.title")}</Text>
        <Text style={styles.sub}>{t("authGate.subtitle")}</Text>
      </View>

      <View style={styles.footer}>
        <Button label={t("authGate.signUp")} variant="primary" onPress={onSignUp} />
        <Button label={t("authGate.logIn")} variant="ghost" onPress={() => setLoginVisible(true)} style={styles.logInBtn} />
      </View>

      <LoginSheet
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onLoggedIn={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    paddingHorizontal: 18,
  },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 14 },
  h1: { marginTop: 4, fontSize: 28, fontWeight: "700", letterSpacing: -0.5, color: "#16201C", textAlign: "center" },
  sub: { fontSize: 15.5, color: "#6B7280", lineHeight: 22, textAlign: "center" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },
  logInBtn: { marginTop: 10 },
});
