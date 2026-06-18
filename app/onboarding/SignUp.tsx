import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { LoginSheet } from "../../components/auth/LoginSheet";
import { Button } from "../../components/ui/Button";
import { usePersistentState } from "../../components/onboarding/onboardingStore";
import { useT } from "../../components/i18n/LanguageProvider";

/**
 * Tutor onboarding — sign-up / account gate (the entry screen).
 *
 * Collects email + password (and offers social sign-up) BEFORE any onboarding
 * info is filled in, so we can check whether the email already has an account.
 *
 * The existence check is a FRONT-END MOCK for now (REGISTERED_EMAILS) — swap the
 * `emailExists` body for a call to EXPO_PUBLIC_API_URL when the backend endpoint
 * is ready. If the email exists we open the existing LoginSheet (pre-filled);
 * otherwise we continue into the tutor onboarding flow.
 */

// On continue, a new account continues to the first info step. Tutor-only for
// now (per the product decision); parameterise this if other roles reuse it.
const NEXT_ROUTE = "/onboarding/TutorTeachLevels";

// MOCK: emails treated as "already registered". Replace with a backend lookup.
const REGISTERED_EMAILS = ["existing@learnsum.com", "demo@learnsum.com"];
function emailExists(email: string): boolean {
  return REGISTERED_EMAILS.includes(email.trim().toLowerCase());
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const t = useT();
  const [email, setEmail] = usePersistentState("tutor:signup:email", "");
  const [password, setPassword] = usePersistentState("tutor:signup:password", "");
  const [showPw, setShowPw] = useState(false);
  const [existing, setExisting] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);

  const valid = EMAIL_RE.test(email.trim()) && password.length >= 6;

  const proceed = () => router.push(NEXT_ROUTE);

  const onContinue = () => {
    if (!valid) return;
    if (emailExists(email)) {
      setExisting(true);
      setLoginVisible(true);
    } else {
      proceed();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable hitSlop={8} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </Pressable>
        <View />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>{t("signup.title")}</Text>
        <Text style={styles.sub}>{t("signup.subtitle")}</Text>

        {existing ? (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="#D98E0A" />
            <Text style={styles.infoText}>{t("signup.existing")}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>{t("signup.email")}</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (existing) setExisting(false);
            }}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={[styles.label, styles.labelGap]}>{t("signup.password")}</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t("signup.passwordPlaceholder")}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPw}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            hitSlop={8}
            onPress={() => setShowPw((s) => !s)}
            accessibilityRole="button"
            accessibilityLabel={showPw ? t("signup.hidePw") : t("signup.showPw")}
          >
            <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t("signup.or")}</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <Pressable
            style={styles.socialCircle}
            onPress={proceed}
            accessibilityRole="button"
            accessibilityLabel={t("signup.social.google")}
          >
            <Ionicons name="logo-google" size={24} color="#4285F4" />
          </Pressable>
          <Pressable
            style={[styles.socialCircle, styles.socialApple]}
            onPress={proceed}
            accessibilityRole="button"
            accessibilityLabel={t("signup.social.apple")}
          >
            <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable
            style={styles.socialCircle}
            onPress={proceed}
            accessibilityRole="button"
            accessibilityLabel={t("signup.social.microsoft")}
          >
            <Ionicons name="logo-microsoft" size={24} color="#5E5E5E" />
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t("common.continue")} variant="primary" disabled={!valid} onPress={onContinue} />
      </View>

      <LoginSheet visible={loginVisible} onClose={() => setLoginVisible(false)} initialEmail={email} />
    </SafeAreaView>
  );
}

const HAIRLINE = "rgba(60,60,67,0.12)";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    paddingHorizontal: 18,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 24 },
  h1: { marginTop: 6, fontSize: 28, fontWeight: "700", letterSpacing: -0.5, color: "#16201C" },
  sub: { marginTop: 6, fontSize: 15, color: "#6B7280", lineHeight: 21 },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FDF3DD",
  },
  infoText: { flex: 1, fontSize: 13.5, color: "#8a6d12", lineHeight: 19 },

  label: { fontSize: 13.5, fontWeight: "700", color: "#374151", marginTop: 22, marginBottom: 8 },
  labelGap: { marginTop: 16 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9F9F7",
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 16, color: "#16201C", paddingVertical: 0 },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ECECEC" },
  dividerText: { fontSize: 13, color: "#6B7280" },

  socialRow: { flexDirection: "row", justifyContent: "center", gap: 20 },
  socialCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  socialApple: { backgroundColor: "#000000", borderColor: "#000000" },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },
});
