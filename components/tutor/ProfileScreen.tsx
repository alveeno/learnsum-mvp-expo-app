/**
 * Tutor app — own PROFILE tab.
 *
 * Shows the tutor's own real profile (GET /api/auth/me) using the shared
 * ProfileBody layout — the same rich layout as the onboarding review and the
 * "view another tutor" overlay. Adds a settings button (top-right, inert for
 * now) and a "Change preferences" button that opens a sheet to pick which
 * onboarding section(s) to edit, then routes into those screens.
 *
 * (Step 1 of the redesign: the display + the edit ENTRY point. Actually saving
 * the edits back to the backend — and pre-filling the screens from the backend
 * for a returning tutor — is the next step; today the edit screens drive off the
 * in-memory store, so editing works within a session.)
 *
 * Falls back to sample data if there's no session / the backend is unreachable
 * in __DEV__ so the tab still demos.
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EMPTY_EDU, ProfileBody, type ProfileBodyData } from "./ProfileBody";
import { mapMeToProfileBody } from "./profileMapping";
import { C, ME } from "./tutorData";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { startEditing } from "../onboarding/tutorOnboarding";
import { getMe } from "../../lib/api";

// The "Change preferences" sheet — one option per onboarding screen.
const EDIT_SECTIONS: { key: string; label: string; hint?: string; route: string }[] = [
  { key: "subjects", label: "Subjects", route: "/onboarding/TutorCatSel" },
  { key: "details", label: "Strengths & details", hint: "Pay, format, location, qualifications", route: "/onboarding/TutorSD" },
  { key: "levels", label: "Teaching levels", route: "/onboarding/TutorTeachLevels" },
  { key: "prefs", label: "Availability & languages", route: "/onboarding/TutorPrefs" },
  { key: "about", label: "About you", hint: "Name, photo, bio, education", route: "/onboarding/TutorAbout" },
];

// __DEV__ offline / no-session fallback so the tab still demos.
const MOCK_BODY: ProfileBodyData = {
  fullName: ME.name,
  gender: "male",
  bio: "DSE & IB maths and physics. I teach the why, not just the how. 📈",
  levels: ["high", "university"],
  interests: [
    { catId: "academics", subId: "mathematics", label: "Mathematics", category: "Academics" },
    { catId: "academics", subId: "physics", label: "Physics", category: "Academics" },
  ],
  details: {
    "academics:mathematics": { years: "4", pay: 350, format: "both", districts: ["Causeway Bay"], achievements: [], experiences: [], quals: [] },
    "academics:physics": { years: "3", pay: 350, format: "online", districts: [], achievements: [], experiences: [], quals: [] },
  },
  langLevels: { english: 4, cantonese: 3 },
  eduByLevel: EMPTY_EDU,
};

export function ProfileScreen({
  premium: _premium,
  showSetup,
  onSetup,
}: {
  premium: boolean;
  showSetup: boolean;
  onSetup: () => void;
}) {
  const [data, setData] = useState<ProfileBodyData | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (showSetup) return;
    let cancelled = false;
    setLoading(true);
    getMe()
      .then((me) => {
        if (cancelled) return;
        const { data: d, slug } = mapMeToProfileBody(me);
        setData(d);
        setUsername(slug);
      })
      .catch(() => {
        if (!cancelled && __DEV__) {
          setData(MOCK_BODY);
          setUsername(ME.username);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showSetup]);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const applyEdit = () => {
    const routes = EDIT_SECTIONS.filter((s) => selected.has(s.key)).map((s) => s.route);
    setSheetOpen(false);
    setSelected(new Set());
    startEditing(routes);
  };

  return (
    <>
      <View style={styles.topRow}>
        <Text style={styles.headerName}>{username || ME.username}</Text>
        <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={24} color={C.ink} />
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Dimmed behind the setup gate until onboarding is complete. */}
          <View style={{ opacity: showSetup ? 0.3 : 1 }} pointerEvents={showSetup ? "none" : "auto"}>
            {!showSetup && loading && !data ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={C.green} />
              </View>
            ) : data ? (
              <>
                <ProfileBody data={data} />
                <Button
                  label="Change preferences"
                  variant="primary"
                  onPress={() => setSheetOpen(true)}
                  style={styles.changeBtn}
                />
              </>
            ) : null}
          </View>
        </ScrollView>

        {/* Centered setup gate (gold) → tutor onboarding. */}
        {showSetup && (
          <View style={styles.gateOverlay} pointerEvents="box-none">
            <Pressable style={styles.gateCard} onPress={onSetup}>
              <View style={styles.gateKicker}>
                <Ionicons name="rocket" size={14} color="#3a2c06" />
                <Text style={styles.gateKickerText}>Get started</Text>
              </View>
              <Text style={styles.gateTitle}>Set up your profile</Text>
              <Text style={styles.gateBody}>Add your photo, subjects and rate so parents and students can find you.</Text>
              <View style={styles.gateCta}>
                <Text style={styles.gateCtaText}>Complete profile</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </Pressable>
          </View>
        )}
      </View>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Change preferences">
        <Text style={styles.sheetSub}>
          Pick what you'd like to update — we'll take you to the same screens you filled in during setup.
        </Text>
        {EDIT_SECTIONS.map((s) => {
          const on = selected.has(s.key);
          return (
            <Pressable key={s.key} style={styles.optRow} onPress={() => toggle(s.key)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
              <View style={[styles.checkbox, on && styles.checkboxOn]}>{on ? <Ionicons name="checkmark" size={15} color="#fff" /> : null}</View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.optLabel}>{s.label}</Text>
                {s.hint ? <Text style={styles.optHint}>{s.hint}</Text> : null}
              </View>
            </Pressable>
          );
        })}
        <Button label="Continue" variant="primary" disabled={selected.size === 0} onPress={applyEdit} style={styles.sheetBtn} />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 14, paddingRight: 10, paddingTop: 2, paddingBottom: 8 },
  headerName: { fontSize: 19, fontWeight: "800", letterSpacing: -0.3, color: C.ink },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  loadingWrap: { paddingVertical: 64, alignItems: "center", justifyContent: "center" },
  changeBtn: { marginTop: 28 },
  gateOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  gateCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    backgroundColor: C.gold,
    padding: 20,
    alignItems: "center",
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 8,
  },
  gateKicker: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(58,44,6,0.16)", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginBottom: 11 },
  gateKickerText: { color: "#3a2c06", fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  gateTitle: { fontSize: 22, fontWeight: "800", color: "#3a2c06", letterSpacing: -0.5, textAlign: "center" },
  gateBody: { marginTop: 6, marginBottom: 16, fontSize: 13.5, color: "#5a4a18", lineHeight: 19, textAlign: "center" },
  gateCta: { flexDirection: "row", alignItems: "center", gap: 7, height: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: C.ink },
  gateCtaText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sheetSub: { fontSize: 13.5, lineHeight: 19, color: C.muted, marginBottom: 8 },
  optRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.hairline },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: C.green, borderColor: C.green },
  optLabel: { fontSize: 15.5, fontWeight: "700", color: C.ink },
  optHint: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  sheetBtn: { marginTop: 18 },
});
