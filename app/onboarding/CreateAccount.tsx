import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";
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
import { submitSeekerOnboarding, type SeekerRole } from "../../components/onboarding/seekerOnboardingPayload";
import { useT } from "../../components/i18n/LanguageProvider";
import { ApiError, clearToken, signup } from "../../lib/api";

/**
 * Final onboarding step for STUDENT / PARENT — create the account (Option A:
 * credentials on the last step), then run the one-shot save and land on the
 * shared Welcome screen.
 *
 * Mirrors the tutor `SignUp` gate but at the END of the flow: a real backend is
 * required for signup (a network failure shows an error, no fake account), while
 * the data save itself is best-effort (see seekerOnboardingPayload) so onboarding
 * still completes even if the backend doesn't yet accept student/parent shapes.
 * Reuses the trilingual `signup.*` copy. Reached from StudentPrefs / the parent
 * review; the role + next home come in as params.
 */

function isAlreadyRegistered(err: ApiError): boolean {
  if (err.isNetworkError) return false;
  return err.status === 422 || /already|registered|exists/i.test(err.message);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CreateAccount() {
  const t = useT();
  const params = useLocalSearchParams<{ role?: string; next?: string }>();
  const role: SeekerRole = params.role === "parent" ? "parent" : "student";
  const next = (params.next ?? "/feed") as Href;

  const [email, setEmail] = usePersistentState("seeker:signup:email", "");
  const [password, setPassword] = usePersistentState("seeker:signup:password", "");
  const [showPw, setShowPw] = useState(false);
  const [existing, setExisting] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = EMAIL_RE.test(email.trim()) && password.length >= 6;

  const goWelcome = () =>
    router.push({ pathname: "/onboarding/Welcome", params: { next: String(next) } });

  const sendToLogin = () => {
    setExisting(true);
    setLoginVisible(true);
  };

  // Social buttons are placeholder UI (no OAuth yet): no session means nothing to
  // save, so just clear any stale token and finish. Use email sign-up to persist.
  const proceedSocial = () => {
    clearToken();
    goWelcome();
  };

  const onContinue = async () => {
    if (!valid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await signup(email, password, role);
      if (res.session) {
        // Account created + token stored. Save the answers (best-effort — never
        // blocks completion) and move on to the Welcome screen.
        await submitSeekerOnboarding(role);
        goWelcome();
      } else {
        sendToLogin(); // no session usually means the email already exists
      }
    } catch (err) {
      if (err instanceof ApiError && isAlreadyRegistered(err)) {
        sendToLogin();
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
            <Pressable style={styles.socialCircle} onPress={proceedSocial} accessibilityRole="button" accessibilityLabel={t("signup.social.google")}>
              <Ionicons name="logo-google" size={24} color="#4285F4" />
            </Pressable>
            <Pressable style={[styles.socialCircle, styles.socialApple]} onPress={proceedSocial} accessibilityRole="button" accessibilityLabel={t("signup.social.apple")}>
              <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable style={styles.socialCircle} onPress={proceedSocial} accessibilityRole="button" accessibilityLabel={t("signup.social.microsoft")}>
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
            loading={submitting}
            onPress={onContinue}
          />
          <Pressable
            style={styles.haveAccountRow}
            onPress={() => setLoginVisible(true)}
            accessibilityRole="button"
            disabled={submitting}
          >
            <Text style={styles.haveAccountText}>{t("signup.haveAccount")}</Text>
            <Text style={styles.haveAccountLink}>{t("signup.logIn")}</Text>
          </Pressable>
        </View>

        <LoginSheet
          visible={loginVisible}
          onClose={() => setLoginVisible(false)}
          initialEmail={email}
          onLoggedIn={() => router.dismissTo(next)}
        />
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 44, paddingHorizontal: 18 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 24 },
  h1: { marginTop: 6, fontSize: 28, fontWeight: "700", letterSpacing: -0.5, color: "#16201C" },
  sub: { marginTop: 6, fontSize: 15, color: "#6B7280", lineHeight: 21 },
  infoBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, padding: 12, borderRadius: 14, backgroundColor: "#FDF3DD" },
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
  errorText: { color: "#E63946", fontSize: 13, lineHeight: 18, textAlign: "center", marginBottom: 8 },
  haveAccountRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 14 },
  haveAccountText: { fontSize: 14, color: "#6B7280" },
  haveAccountLink: { fontSize: 14, fontWeight: "700", color: "#2D6A4F" },
});
