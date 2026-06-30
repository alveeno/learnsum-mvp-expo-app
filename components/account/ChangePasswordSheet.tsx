/**
 * Change-password bottom sheet (all user types).
 *
 * UI ONLY — there is no change-password endpoint in the backend yet (the app
 * never talks to Supabase directly), so the submit is intentionally NOT wired:
 * pressing "Update password" shows a clear "not yet connected" notice and calls
 * no API. Wire it to a real endpoint later (see CLAUDE.md / the backend gap doc).
 *
 * Security (hard rules):
 *   • The real password is never fetched, stored, or measured — these inputs only
 *     hold what the user types for a future submit.
 *   • Inputs stay masked at all times (no reveal toggle) so a typed password is
 *     never shown in plain text.
 *   • Nothing here logs a password value.
 */
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { C } from "../tutor/tutorData";

export function ChangePasswordSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Clear everything when the sheet closes — never keep a typed password around.
  useEffect(() => {
    if (!visible) {
      setOldPw("");
      setNewPw("");
      setNotice(null);
    }
  }, [visible]);

  const onSubmit = () => {
    if (!oldPw || !newPw) {
      setNotice("Enter your current and new password.");
      return;
    }
    // No backend yet — make the unconnected state explicit, do not call any API.
    setNotice("Password change isn't connected yet — this is coming soon.");
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Change password">
      <Text style={styles.fieldLabel}>Old password</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={oldPw}
          onChangeText={(text) => {
            setOldPw(text);
            if (notice) setNotice(null);
          }}
          placeholder="Current password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
        />
      </View>

      <Text style={[styles.fieldLabel, styles.fieldGap]}>New password</Text>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.input}
          value={newPw}
          onChangeText={(text) => {
            setNewPw(text);
            if (notice) setNotice(null);
          }}
          placeholder="New password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
        />
      </View>

      {/* Inert placeholder for now (no action), right-aligned under the new-password field. */}
      <View style={styles.forgotRow}>
        <Text
          style={styles.forgotText}
          accessibilityRole="button"
          onPress={() => {}}
          suppressHighlighting
        >
          Forgot password
        </Text>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <Button label="Update password" variant="primary" onPress={onSubmit} style={styles.submit} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 13, fontWeight: "700", color: C.ink, marginBottom: 7 },
  fieldGap: { marginTop: 16 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, fontSize: 15.5, color: C.ink },
  forgotRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  forgotText: { fontSize: 13, fontWeight: "700", color: C.green },
  notice: { fontSize: 13, color: C.muted, lineHeight: 18, marginTop: 12, textAlign: "center" },
  submit: { marginTop: 16 },
});
