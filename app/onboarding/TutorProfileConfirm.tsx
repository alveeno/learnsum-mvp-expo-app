import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { C } from "../../components/tutor/tutorData";
import {
  EMPTY_EDU,
  ProfileBody,
  type Detail,
  type EduByLevel,
  type ProfileBodyData,
} from "../../components/tutor/ProfileBody";
import { districtName } from "../../components/onboarding/hkDistricts";
import { getStored, setStored } from "../../components/onboarding/onboardingStore";
import { submitTutorOnboarding } from "../../components/onboarding/tutorOnboardingPayload";
import { type Prefs } from "../../components/onboarding/PreferencesScreen";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { ApiError, patchTutor } from "../../lib/api";
import { type Interest } from "./StudentCatSel";

/**
 * Tutor onboarding — final REVIEW screen ("Your profile").
 *
 * A read-only preview of everything entered across the flow, laid out the way
 * the public profile will look. The rich layout itself lives in the shared
 * `ProfileBody` (also used by the Profile tab + the "view another tutor" view) —
 * this screen just maps the in-memory onboarding store into it and adds the
 * publish bottom sheet.
 *
 * "Looks good — finish" opens the publish sheet, whose button performs the
 * one-shot `POST /api/onboarding`, then a best-effort `PATCH /api/tutors/[slug]`
 * for the bio + publish choice, then routes to Welcome → /tutor-home.
 */

/** A labelled on/off row used by the publish sheet. */
function ToggleRow({
  title,
  hint,
  value,
  onValueChange,
}: {
  title: string;
  hint: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: C.green, false: "#D1D5DB" }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D1D5DB"
        accessibilityLabel={title}
      />
    </View>
  );
}

export default function TutorProfileConfirm() {
  // One-shot snapshot of the onboarding store (read-only, last screen).
  const store = useMemo(() => {
    const firstName = getStored<string>("tutor:about:firstName", "");
    const lastName = getStored<string>("tutor:about:lastName", "");
    const bio = getStored<string>("tutor:about:bio", "");
    const gender = getStored<string | null>("tutor:about:gender", null);
    const levels = [...getStored<Set<string>>("tutor:levels", new Set<string>())];
    const interests = getStored<Interest[]>("tutor:interests", []).filter((it) => it.catId && it.subId);
    const details = getStored<Record<string, Detail>>("tutor:sd:details", {});
    const prefs = getStored<Prefs | null>("tutor:prefs", null);
    const eduByLevel = getStored<EduByLevel>("tutor:about:eduByLevel", EMPTY_EDU);
    return { firstName, lastName, bio, gender, levels, interests, details, prefs, eduByLevel };
  }, []);

  const fullName = `${store.firstName} ${store.lastName}`.trim() || "Your name";

  // Map the store into ProfileBody's normalized shape. Districts are stored as
  // keys ("<region>:<District>"); ProfileBody wants display names.
  const bodyData: ProfileBodyData = useMemo(
    () => ({
      fullName,
      gender: store.gender,
      bio: store.bio,
      levels: store.levels,
      interests: store.interests,
      details: Object.fromEntries(
        Object.entries(store.details).map(([k, d]) => [k, { ...d, districts: d.districts.map(districtName) }]),
      ),
      langLevels: store.prefs?.langLevels ?? {},
      eduByLevel: store.eduByLevel,
    }),
    [store, fullName],
  );

  // Publish sheet.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [seekersOn, setSeekersOn] = useState(true);
  const [tutorsOn, setTutorsOn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const noAudience = isPublic && !seekersOn && !tutorsOn;

  const goToWelcome = () => {
    setSheetOpen(false);
    router.push({ pathname: "/onboarding/Welcome", params: { next: "/tutor-home" } });
  };

  const finish = async () => {
    if (saving) return;
    setStored("tutor:visibility", {
      public: isPublic,
      parentsStudents: isPublic && seekersOn,
      tutors: isPublic && tutorsOn,
    });
    setSaveError(null);
    setSaving(true);
    try {
      const { slug } = await submitTutorOnboarding();
      // Apply the bio + publish choice in one best-effort PATCH.
      const bio = getStored<string>("tutor:about:bio", "").trim();
      const patch: Record<string, unknown> = {};
      if (bio) patch.bio = bio;
      if (isPublic) patch.is_published = true;
      if (Object.keys(patch).length > 0) {
        try {
          await patchTutor(slug, patch);
        } catch (patchErr) {
          if (__DEV__) console.warn("[finish] post-save patch (bio/publish) failed:", patchErr);
        }
      }
      goToWelcome();
    } catch (err) {
      const alreadyDone = err instanceof ApiError && err.status === 409 && /already completed/i.test(err.message);
      const devSkippable = err instanceof ApiError && (err.isNetworkError || err.status === 401) && __DEV__;
      if (alreadyDone || devSkippable) {
        goToWelcome();
        return;
      }
      setSaveError(
        err instanceof ApiError && !err.isNetworkError
          ? err.message
          : "Couldn't save your profile. Check your connection and try again.",
      );
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={C.ink} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {fullName}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ProfileBody data={bodyData} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>Tap back to edit any section.</Text>
        <Button label="Looks good — finish" variant="primary" onPress={() => setSheetOpen(true)} />
      </View>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Make your profile public?">
        <Text style={styles.sheetSub}>Choose who can find your profile. You can change this anytime later.</Text>

        <ToggleRow
          title="Public profile"
          hint={isPublic ? "People you choose below can find you." : "Hidden — only you can see it for now."}
          value={isPublic}
          onValueChange={setIsPublic}
        />

        {isPublic ? (
          <>
            <Text style={styles.sheetGroupLabel}>WHO CAN FIND YOU</Text>
            <ToggleRow title="Parents & students" hint="Discover you in search and on your public profile." value={seekersOn} onValueChange={setSeekersOn} />
            <ToggleRow title="Tutors" hint="See you in the tutor feed and suggestions." value={tutorsOn} onValueChange={setTutorsOn} />
          </>
        ) : null}

        {noAudience ? <Text style={styles.sheetWarn}>Pick at least one audience, or turn off Public profile.</Text> : null}
        {saveError ? <Text style={styles.sheetError}>{saveError}</Text> : null}

        <Button
          label={isPublic ? "Publish & finish" : "Keep private & finish"}
          variant="primary"
          onPress={finish}
          disabled={noAudience || saving}
          style={styles.sheetBtn}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingTop: 2, paddingBottom: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "800", color: C.ink },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },
  footerHint: { fontSize: 12.5, color: C.muted, textAlign: "center", marginBottom: 10 },
  // Publish sheet
  sheetSub: { fontSize: 13.5, lineHeight: 19, color: C.muted, textAlign: "center", marginBottom: 4 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.hairline,
  },
  toggleTitle: { fontSize: 15.5, fontWeight: "700", color: C.ink },
  toggleHint: { fontSize: 12.5, color: C.muted, marginTop: 2, lineHeight: 17 },
  sheetGroupLabel: { fontSize: 11.5, fontWeight: "800", letterSpacing: 0.5, color: C.muted, marginTop: 14, marginBottom: 2 },
  sheetWarn: { fontSize: 12.5, color: C.goldD, textAlign: "center", marginTop: 12 },
  sheetError: { fontSize: 12.5, color: "#E63946", textAlign: "center", marginTop: 12, lineHeight: 17 },
  sheetBtn: { marginTop: 18 },
});
