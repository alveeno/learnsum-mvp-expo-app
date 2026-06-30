/**
 * "Account information" — shared section for every user type's profile/account
 * screen (tutor Profile tab + seeker Account tab). Shows the account details the
 * user signed up with: sign-in method, email, a masked password (+ Change
 * password sheet), phone (read-only) and an EDITABLE WeChat ID.
 *
 * Wiring differs by role and is supplied by the host via `onSaveWechat`:
 *   • seeker (student/parent) → patchProfileMe({ wechat_id })  (profiles.wechat_id, migration 0031)
 *   • tutor                   → patchTutor(slug, { wechat_id }) (tutor_profiles.wechat_id)
 *
 * Security: the password value is a fixed masked literal ("********") — it is
 * never fetched, stored, or measured. The Change-password sheet's submit is UI
 * only (no backend endpoint exists yet). See ChangePasswordSheet.
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ChangePasswordSheet } from "./ChangePasswordSheet";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { C } from "../tutor/tutorData";

export type SignInMethod = "email" | "google" | "apple";

// The sign-in indicator. Only "email" is reachable today (Google/Apple OAuth
// isn't wired and no endpoint exposes the provider) — but it's prop-driven so the
// other methods light up automatically once the backend reports them.
const METHOD: Record<SignInMethod, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  email: { label: "Email", icon: "mail" },
  google: { label: "Google", icon: "logo-google" },
  apple: { label: "Apple", icon: "logo-apple" },
};

const MASKED_PASSWORD = "********";

export function AccountInfoSection({
  email,
  phone,
  wechat,
  onSaveWechat,
  signInMethod = "email",
}: {
  email: string;
  phone: string;
  wechat: string | null;
  onSaveWechat: (value: string) => Promise<void>;
  signInMethod?: SignInMethod;
}) {
  const [pwOpen, setPwOpen] = useState(false);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Re-seed the edit field whenever the sheet opens (or the saved value changes).
  useEffect(() => {
    if (wechatOpen) {
      setDraft(wechat ?? "");
      setErr(null);
    }
  }, [wechatOpen, wechat]);

  const method = METHOD[signInMethod];
  const wechatValue = (wechat ?? "").trim();

  const saveWechat = async () => {
    if (saving) return;
    setErr(null);
    setSaving(true);
    try {
      await onSaveWechat(draft.trim());
      setSaving(false);
      setWechatOpen(false);
    } catch {
      setSaving(false);
      setErr("Couldn't save. Check your connection and try again.");
    }
  };

  return (
    <>
      <Text style={styles.sectionLabel}>Account information</Text>
      <View style={styles.group}>
        {/* Sign-in method — value is a small indicator badge on the right. */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="key-outline" size={19} color={C.green} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Sign-in method</Text>
          </View>
          <View style={styles.methodBadge}>
            <Ionicons name={method.icon} size={13} color={C.green} />
            <Text style={styles.methodText}>{method.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Email */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="at-outline" size={19} color={C.green} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowSub} numberOfLines={1}>{email || "—"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Password — fixed masked literal (never the real password). */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="lock-closed-outline" size={19} color={C.green} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Password</Text>
            <Text style={styles.rowSub}>{MASKED_PASSWORD}</Text>
          </View>
        </View>
        {/* Change password — opens the (UI-only) change-password sheet. */}
        <Pressable
          style={styles.actionRow}
          onPress={() => setPwOpen(true)}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>Change password</Text>
          <Ionicons name="chevron-forward" size={18} color={C.unselIc} />
        </Pressable>

        <View style={styles.divider} />

        {/* Phone — read-only (no editing in this surface). */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="call-outline" size={19} color={C.green} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Phone</Text>
            <Text style={[styles.rowSub, !phone && styles.rowSubEmpty]}>{phone || "Not added"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* WeChat ID — editable, Edit button at the row's top-right. */}
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="logo-wechat" size={19} color={C.green} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>WeChat ID</Text>
            <Text style={[styles.rowSub, !wechatValue && styles.rowSubEmpty]} numberOfLines={1}>
              {wechatValue || "Not added"}
            </Text>
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => setWechatOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit WeChat ID"
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={15} color={C.green} />
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <ChangePasswordSheet visible={pwOpen} onClose={() => setPwOpen(false)} />

      {/* WeChat ID edit sheet. */}
      <BottomSheet visible={wechatOpen} onClose={() => setWechatOpen(false)} title="WeChat ID">
        <Text style={styles.sheetSub}>
          Students and parents who unlock you can add you on WeChat with this ID.
        </Text>
        <View style={styles.inputBox}>
          <Ionicons name="logo-wechat" size={20} color="#09B83E" />
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={(text) => {
              setDraft(text);
              if (err) setErr(null);
            }}
            placeholder="Your WeChat ID"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {err ? <Text style={styles.sheetError}>{err}</Text> : null}
        <Button
          label={saving ? "Saving…" : "Save"}
          variant="primary"
          disabled={saving}
          loading={saving}
          onPress={saveWechat}
          style={styles.sheetBtn}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: C.muted,
    textTransform: "uppercase",
  },
  group: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.hairline,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 14, paddingVertical: 14 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.greenTint,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 15.5, fontWeight: "700", color: C.ink },
  rowSub: { fontSize: 12.5, color: C.muted, marginTop: 1 },
  rowSubEmpty: { fontStyle: "italic", color: C.unselIc },
  divider: { height: 1, backgroundColor: C.hairline, marginLeft: 63 },
  methodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.greenTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  methodText: { fontSize: 12.5, fontWeight: "700", color: C.green },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginLeft: 49,
  },
  actionText: { fontSize: 14, fontWeight: "700", color: C.green },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.greenTint,
  },
  editText: { fontSize: 12.5, fontWeight: "700", color: C.green },
  sheetSub: { fontSize: 13.5, lineHeight: 19, color: C.muted, marginBottom: 12 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: C.hairline,
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, fontSize: 15.5, color: C.ink },
  sheetError: { fontSize: 13, color: C.destructive, lineHeight: 18, marginTop: 12, textAlign: "center" },
  sheetBtn: { marginTop: 16 },
});
