import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { markRegistered } from "../auth/authState";
import { BottomSheet } from "../ui/BottomSheet";
import { ApiError, getMe, login, type Role } from "../../lib/api";

/**
 * Log-in bottom sheet.
 *
 * "Log in" calls the real backend (POST /api/auth/login): on success it stores
 * the session token, resolves the account's role (GET /api/auth/me), marks the
 * user registered (the session-only flag in authState) and hands off via
 * `onLoggedIn(role)` — so the caller can route to the right home (tutor →
 * /tutor-home, student/parent → /feed). A real session is REQUIRED: wrong
 * credentials or an unreachable backend show an inline error — there is no
 * offline fake-login (that previously left the user "logged in" with no session
 * whenever the backend was down). "Forgot password?" and the
 * social buttons are still inert. Copy is intentionally English-only for now
 * (it'll be translated with the rest of the auth build — see the i18n notes in
 * CLAUDE.md).
 */
export function LoginSheet({
  visible,
  onClose,
  initialEmail,
  onLoggedIn,
}: {
  visible: boolean;
  onClose: () => void;
  /** Pre-fill the email field (e.g. when redirected here from sign-up). */
  initialEmail?: string;
  /**
   * Called after a successful login with the account's role (or null when it
   * couldn't be resolved, e.g. the __DEV__ offline fallback) — navigate here.
   * Falls back to onClose.
   */
  onLoggedIn?: (role: Role | null) => void;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed the email when the sheet is opened with a pre-filled value, and clear
  // any stale error/submitting state each time it opens.
  useEffect(() => {
    if (!visible) return;
    if (initialEmail) setEmail(initialEmail);
    setError(null);
    setSubmitting(false);
  }, [visible, initialEmail]);

  const canSubmit = email.trim() !== "" && password !== "" && !submitting;

  const handleSuccess = (role: Role | null) => {
    markRegistered();
    if (onLoggedIn) onLoggedIn(role);
    else onClose();
  };

  const submit = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      // Resolve the account's role so the caller can route to the right home.
      // A failure here (e.g. transient) shouldn't block a successful login — we
      // just hand off a null role and let the caller fall back to a default.
      let role: Role | null = null;
      try {
        role = (await getMe()).profile.role;
      } catch {
        role = null;
      }
      handleSuccess(role);
    } catch (err) {
      // No offline fake-login: a real session is required. A network failure
      // shows a "can't reach the server" message rather than pretending the
      // login worked — the old fallback left the user "logged in" with no real
      // session (setup banner stuck on, profile tab empty) whenever the backend
      // was down. Start the backend (or point EXPO_PUBLIC_API_URL at it) to log
      // in for real.
      setError(
        err instanceof ApiError && !err.isNetworkError
          ? "Incorrect email or password."
          : "Can't reach the server. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to your LearnSum account</Text>
      </View>

      <Text style={styles.label}>Email</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Text style={[styles.label, styles.labelGap]}>Password</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPw}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          hitSlop={8}
          onPress={() => setShowPw((s) => !s)}
          accessibilityRole="button"
          accessibilityLabel={showPw ? "Hide password" : "Show password"}
        >
          <Ionicons
            name={showPw ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#6B7280"
          />
        </Pressable>
      </View>

      <Pressable style={styles.forgot} hitSlop={6} accessibilityRole="button">
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or log in with</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <Pressable
          style={styles.socialCircle}
          accessibilityRole="button"
          accessibilityLabel="Log in with Google"
        >
          <Ionicons name="logo-google" size={24} color="#4285F4" />
        </Pressable>
        <Pressable
          style={[styles.socialCircle, styles.socialApple]}
          accessibilityRole="button"
          accessibilityLabel="Log in with Apple"
        >
          <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
        </Pressable>
        <Pressable
          style={styles.socialCircle}
          accessibilityRole="button"
          accessibilityLabel="Log in with Microsoft"
        >
          <Ionicons name="logo-microsoft" size={24} color="#5E5E5E" />
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.loginBtn, canSubmit && styles.loginBtnActive]}
        disabled={!canSubmit}
        onPress={submit}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
      >
        <Text style={[styles.loginBtnText, canSubmit && styles.loginBtnTextActive]}>Log in</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", gap: 4, marginBottom: 18 },
  title: { fontSize: 22, fontWeight: "800", color: "#16201C" },
  subtitle: { fontSize: 14.5, color: "#6B7280" },

  label: { fontSize: 13.5, fontWeight: "700", color: "#374151", marginBottom: 8 },
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

  forgot: { alignSelf: "flex-end", marginTop: 12 },
  forgotText: { color: "#2D6A4F", fontSize: 14, fontWeight: "700" },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ECECEC" },
  dividerText: { fontSize: 13, color: "#6B7280" },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 22,
  },
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

  errorText: {
    color: "#E63946",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 10,
  },

  loginBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  loginBtnActive: { backgroundColor: "#2D6A4F" },
  loginBtnText: { fontSize: 16, fontWeight: "700", color: "#9CA3AF" },
  loginBtnTextActive: { color: "#FFFFFF" },
});
