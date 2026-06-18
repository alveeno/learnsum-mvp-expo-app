import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { markRegistered } from "../auth/authState";
import { BottomSheet } from "../ui/BottomSheet";

/**
 * Log-in bottom sheet — DEMO mock (no backend wired yet).
 *
 * The email/password fields are typeable and the eye toggles password
 * visibility. "Forgot password?" and the social buttons are still inert, but
 * "Log in" now mocks a successful login: it marks the user registered (the
 * session-only flag in authState) and hands off via `onLoggedIn` so the caller
 * can navigate. When real auth is built this is where it hooks in. Copy is
 * intentionally English-only until then (it'll be translated with the real auth
 * build — see the i18n notes in CLAUDE.md).
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
  /** Called after a (mock) successful login — navigate here. Falls back to onClose. */
  onLoggedIn?: () => void;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Seed the email when the sheet is opened with a pre-filled value.
  useEffect(() => {
    if (visible && initialEmail) setEmail(initialEmail);
  }, [visible, initialEmail]);

  // Demo login: needs both fields, then marks registered and hands off.
  const canSubmit = email.trim() !== "" && password !== "";
  const submit = () => {
    if (!canSubmit) return;
    markRegistered();
    if (onLoggedIn) onLoggedIn();
    else onClose();
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
