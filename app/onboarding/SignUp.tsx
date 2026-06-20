import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
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
import { KeyboardAvoider } from "../../components/ui/KeyboardAvoider";
import { usePersistentState } from "../../components/onboarding/onboardingStore";
import { goAfterSignUp } from "../../components/onboarding/tutorOnboarding";
import { useT } from "../../components/i18n/LanguageProvider";
import { ApiError, signup } from "../../lib/api";

/**
 * Tutor onboarding — sign-up / account gate (the entry screen).
 *
 * Collects email + password (and offers social sign-up) BEFORE any onboarding
 * info is filled in. Continue now calls the real backend (POST /api/auth/signup):
 *  - success → the account exists + the token is stored → continue into onboarding.
 *  - already registered (or no session returned) → open the LoginSheet pre-filled.
 *  - backend unreachable in __DEV__ → fall back to the old mock so the app still
 *    demos offline (REGISTERED_EMAILS below decides login-vs-continue).
 */

// __DEV__ OFFLINE FALLBACK ONLY: emails treated as "already registered" when the
// backend can't be reached during a demo. Real existence comes from signup() now.
const REGISTERED_EMAILS = ["existing@learnsum.com", "demo@learnsum.com"];
function emailExists(email: string): boolean {
  return REGISTERED_EMAILS.includes(email.trim().toLowerCase());
}

/** A signup error that means the email already has an account → send to login. */
function isAlreadyRegistered(err: ApiError): boolean {
  if (err.isNetworkError) return false;
  return err.status === 422 || /already|registered|exists/i.test(err.message);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const t = useT();
  const [email, setEmail] = usePersistentState("tutor:signup:email", "");
  const [password, setPassword] = usePersistentState("tutor:signup:password", "");
  const [showPw, setShowPw] = useState(false);
  const [existing, setExisting] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email.trim()) && password.length >= 6;

  // A new account continues into the first not-completed onboarding step
  // (marks the user registered; the token is already stored by signup()).
  const proceed = () => goAfterSignUp();

  const sendToLogin = () => {
    setExisting(true);
    setLoginVisible(true);
  };

  const onContinue = async () => {
    if (!valid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await signup(email, password, "tutor");
      // With email confirmation OFF a real new account returns a session. No
      // session usually means the email already exists → send them to log in.
      if (res.session) proceed();
      else sendToLogin();
    } catch (err) {
      if (err instanceof ApiError && isAlreadyRegistered(err)) {
        sendToLogin();
      } else if (err instanceof ApiError && err.isNetworkError && __DEV__) {
        // Offline demo fallback: mimic the old mock behaviour.
        if (emailExists(email)) sendToLogin();
        else proceed();
      } else {
        setError(
          err instanceof ApiError && !err.isNetworkError
            ? err.message
            : "Can't reach the server. Check your connection and try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoider>
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
              if (error) setError(null);
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
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button
          label={t("common.continue")}
          variant="primary"
          disabled={!valid || submitting}
          onPress={onContinue}
        />
      </View>

      <LoginSheet
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        initialEmail={email}
        onLoggedIn={() => router.dismissTo("/tutor-home" as Href)}
      />
      </KeyboardAvoider>
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
  errorText: {
    color: "#E63946",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 8,
  },
});
