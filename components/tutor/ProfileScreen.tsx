/**
 * Tutor app — own PROFILE tab.
 *
 * Shows the tutor's own real profile (GET /api/auth/me) using the shared
 * ProfileBody layout — the same rich layout as the onboarding review and the
 * "view another tutor" overlay. Adds a settings button (top-right, inert for
 * now) and a "Change preferences" button that opens a sheet to pick which
 * onboarding section(s) to edit, then routes into those screens.
 *
 * Editing is fully wired: tapping Continue pre-fills the onboarding store from
 * the tutor's real saved data (hydrateTutorStoreFromMe — so the screens show
 * current values and a full-replace save can't wipe an untouched section), then
 * walks the chosen screens; the final TutorEditSave step flushes everything back
 * to the backend (saveTutorEdits → the five edit endpoints). On return the tab
 * refetches (consumeProfileDirty) so the changes show.
 *
 * Falls back to sample data if there's no session / the backend is unreachable
 * in __DEV__ so the tab still demos.
 */
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EMPTY_EDU, ProfileBody, type ProfileBodyData } from "./ProfileBody";
import { mapMeToProfileBody } from "./profileMapping";
import { TutorPosts } from "./TutorPosts";
import { consumeProfileDirty, hydrateTutorStoreFromMe } from "./tutorEditStore";
import { C, ME } from "./tutorData";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { resetStore } from "../onboarding/onboardingStore";
import { startEditing } from "../onboarding/tutorOnboarding";
import { ApiError, getAvailability, getMe, logout } from "../../lib/api";

// The "Change preferences" sheet — one option per onboarding screen.
const EDIT_SECTIONS: { key: string; label: string; hint?: string; route: string }[] = [
  { key: "subjects", label: "Subjects", route: "/onboarding/TutorCatSel" },
  { key: "details", label: "Strengths & details", hint: "Levels, pay, format, location, qualifications", route: "/onboarding/TutorSD" },
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
    "academics:mathematics": { years: "4", pay: 350, format: "both", levels: ["high", "university"], districts: ["Causeway Bay"], achievements: [], experiences: [], quals: [] },
    "academics:physics": { years: "3", pay: 350, format: "online", levels: ["high"], districts: [], achievements: [], experiences: [], quals: [] },
  },
  langLevels: { english: 4, cantonese: 3 },
  eduByLevel: EMPTY_EDU,
};

// A neutral profile silhouette shown (frosted) behind the setup gate.
function GateSkeleton() {
  return (
    <View style={styles.skWrap} pointerEvents="none">
      <View style={styles.skAvatar} />
      <View style={[styles.skBlock, { width: 160, height: 18, marginTop: 14 }]} />
      <View style={[styles.skBlock, { width: 110, height: 13, marginTop: 8 }]} />
      <View style={styles.skStatRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.skStat} />
        ))}
      </View>
      <View style={[styles.skCard, { marginTop: 18 }]} />
      <View style={[styles.skCard, { marginTop: 12 }]} />
    </View>
  );
}

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
  const [error, setError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  // True on the offline/no-session mock path — the username then isn't a real
  // slug, so the Posts section (which fetches by slug) is hidden.
  const [isMock, setIsMock] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getMe()
      .then((me) => {
        const { data: d, slug } = mapMeToProfileBody(me);
        setData(d);
        setUsername(slug);
        setIsMock(false);
      })
      .catch((err) => {
        // Only fall back to sample data when the backend is genuinely
        // unreachable (offline demo). A 401 / other error means there's no real
        // session — show a clear state instead of misleading fake data.
        if (err instanceof ApiError && err.isNetworkError && __DEV__) {
          setData(MOCK_BODY);
          setUsername(ME.username);
          setIsMock(true);
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showSetup) load();
  }, [showSetup, load]);

  // Returning from a "Change preferences" edit marks the profile dirty
  // (saveTutorEdits) — refetch so the saved changes show.
  useFocusEffect(
    useCallback(() => {
      if (!showSetup && consumeProfileDirty()) load();
    }, [showSetup, load]),
  );

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Open the chosen onboarding screens to edit — but first pre-fill the store
  // from the tutor's real saved data, so the screens show current values and the
  // full-replace save can't wipe an untouched section.
  const applyEdit = async () => {
    const routes = EDIT_SECTIONS.filter((s) => selected.has(s.key)).map((s) => s.route);
    if (routes.length === 0 || applying) return;
    setApplyError(null);
    setApplying(true);
    try {
      const [me, availability] = await Promise.all([getMe(), getAvailability()]);
      hydrateTutorStoreFromMe(me, availability);
    } catch (err) {
      // Offline demo: edit whatever's already in the store. Any real error
      // (e.g. no session) aborts — entering edit blank could wipe the profile.
      if (!(err instanceof ApiError && err.isNetworkError && __DEV__)) {
        setApplying(false);
        setApplyError("Couldn't load your current profile. Check your connection and try again.");
        return;
      }
    }
    setApplying(false);
    setSheetOpen(false);
    setSelected(new Set());
    startEditing(routes);
  };

  // Log out: clear the session (token + keychain) and wipe the in-memory
  // onboarding draft/completion so signing up a NEW account re-runs onboarding
  // from scratch, then return to the welcome screen. Immediate, no confirm.
  const onLogOut = () => {
    void logout();
    resetStore();
    router.replace("/");
  };

  return (
    <>
      <View style={styles.topRow}>
        <Text style={styles.headerName}>{username}</Text>
        <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={24} color={C.ink} />
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* A placeholder silhouette sits behind the frosted setup gate so the
              tab looks like a real (locked) profile rather than empty space. */}
          <View pointerEvents={showSetup ? "none" : "auto"}>
            {showSetup ? (
              <GateSkeleton />
            ) : loading && !data ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={C.green} />
              </View>
            ) : error ? (
              <View style={styles.errorWrap}>
                <Ionicons name="cloud-offline-outline" size={34} color={C.unselIc} />
                <Text style={styles.errorText}>Couldn't load your profile. Make sure you're signed in.</Text>
              </View>
            ) : data ? (
              <>
                <ProfileBody data={data} />
                {!isMock && username ? <TutorPosts slug={username} /> : null}
                <Button
                  label="Change preferences"
                  variant="primary"
                  onPress={() => setSheetOpen(true)}
                  style={styles.changeBtn}
                />
                <Button
                  label="Log out"
                  variant="destructive"
                  onPress={onLogOut}
                  style={styles.logoutBtn}
                />
              </>
            ) : null}
          </View>
        </ScrollView>

        {/* Real frosted glass over the placeholder, then the gold gate card. */}
        {showSetup && (
          <>
            <BlurView intensity={22} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={styles.gateTint} pointerEvents="none" />
          </>
        )}

        {/* Centered setup gate (gold) → tutor onboarding. */}
        {showSetup && (
          <View style={styles.gateOverlay} pointerEvents="box-none">
            <Pressable style={styles.gateCard} onPress={onSetup}>
              <LinearGradient
                colors={["#F6B73C", "#E0941A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
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
        {applyError ? <Text style={styles.sheetError}>{applyError}</Text> : null}
        <Button
          label={applying ? "Loading…" : "Continue"}
          variant="primary"
          disabled={selected.size === 0 || applying}
          onPress={applyEdit}
          style={styles.sheetBtn}
        />
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
  errorWrap: { paddingVertical: 64, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 14.5, color: C.muted, textAlign: "center", lineHeight: 21 },
  changeBtn: { marginTop: 28 },
  logoutBtn: { marginTop: 12 },
  gateTint: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(249,249,247,0.4)" },
  skWrap: { alignItems: "center", paddingTop: 8 },
  skAvatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: "#E9EBEE" },
  skBlock: { backgroundColor: "#E9EBEE", borderRadius: 8 },
  skStatRow: { flexDirection: "row", gap: 10, marginTop: 20, alignSelf: "stretch" },
  skStat: { flex: 1, height: 64, borderRadius: 14, backgroundColor: "#EDEFF1" },
  skCard: { alignSelf: "stretch", height: 96, borderRadius: 16, backgroundColor: "#EDEFF1" },
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
  sheetError: { fontSize: 13, color: C.destructive, lineHeight: 18, marginTop: 12, textAlign: "center" },
  sheetBtn: { marginTop: 18 },
});
