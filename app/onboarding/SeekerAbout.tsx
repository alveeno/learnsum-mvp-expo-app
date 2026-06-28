import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "../../components/ui/Button";
import { KeyboardAvoider } from "../../components/ui/KeyboardAvoider";
import { notifyError, tapLight } from "../../components/ui/feedback";
import { pickFromLibrary, takePhoto, type PickedAsset } from "../../components/ui/mediaPicker";
import { uploadFile } from "../../lib/api";
import { usePersistentState } from "../../components/onboarding/onboardingStore";
import { EducationSection, EMPTY_EDU, type EduByLevel } from "../../components/onboarding/EducationSection";
import {
  SEEKER_ABOUT,
  SEEKER_EDU_KEY,
  SEEKER_EDU_HISTORY_KEY,
  saveSeekerProfile,
} from "../../components/onboarding/seekerProfile";
import { useT } from "../../components/i18n/LanguageProvider";
import { type TranslationKey } from "../../components/i18n/translations";

/**
 * Seeker (student / parent) "About you".
 *
 * Modeled on the tutor `TutorAbout`, simplified: profile photo, name, gender,
 * bio, phone number and — for students only — a single education level. Name +
 * gender are required; the rest are optional. Everything is kept in the shared
 * in-memory onboarding store (`seeker:about:*` keys; education reuses the student
 * `student:eduLevel` key).
 *
 * Used in TWO modes via the `mode` param:
 *   - "onboarding" (default): the last data step before CreateAccount. Continue →
 *     /onboarding/CreateAccount (which creates the account + runs the one-shot
 *     save that now includes this profile block).
 *   - "edit": opened from the seeker Account tab (the store is pre-seeded there
 *     from GET /api/auth/me). Save → PATCH /api/profiles/me (saveSeekerProfile),
 *     then back.
 *
 * For parents the education field is hidden (it's the child's level, not theirs).
 */

const GENDERS: { key: string; labelKey: TranslationKey }[] = [
  { key: "male", labelKey: "about.gender.male" },
  { key: "female", labelKey: "about.gender.female" },
  { key: "lgbtq", labelKey: "about.gender.lgbtq" },
  { key: "na", labelKey: "about.gender.na" },
];

const LEVELS: { key: string; labelKey: TranslationKey }[] = [
  { key: "kindergarten", labelKey: "level.kindergarten" },
  { key: "primary", labelKey: "level.primary" },
  { key: "middle", labelKey: "level.middle" },
  { key: "high", labelKey: "level.high" },
  { key: "university", labelKey: "level.university" },
  { key: "adult", labelKey: "level.adult" },
];

export default function SeekerAbout() {
  const t = useT();
  const params = useLocalSearchParams<{ role?: string; mode?: string; next?: string }>();
  const role: "student" | "parent" = params.role === "parent" ? "parent" : "student";
  const isEdit = params.mode === "edit";
  const next = (params.next ?? "/feed") as Href;

  // Real profile photo: pick → upload to Storage → keep the public URL.
  const [avatarUrl, setAvatarUrl] = usePersistentState<string>(SEEKER_ABOUT.avatarUrl, "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const hasPhoto = avatarUrl.length > 0;

  const [firstName, setFirstName] = usePersistentState<string>(SEEKER_ABOUT.firstName, "");
  const [lastName, setLastName] = usePersistentState<string>(SEEKER_ABOUT.lastName, "");
  const [bio, setBio] = usePersistentState<string>(SEEKER_ABOUT.bio, "");
  const [phone, setPhone] = usePersistentState<string>(SEEKER_ABOUT.phone, "");
  const [gender, setGender] = usePersistentState<string | null>(SEEKER_ABOUT.gender, null);
  const [eduLevel, setEduLevel] = usePersistentState<string | null>(SEEKER_EDU_KEY, null);
  const [eduHistory, setEduHistory] = usePersistentState<EduByLevel>(SEEKER_EDU_HISTORY_KEY, EMPTY_EDU);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const runPhoto = async (pick: () => Promise<PickedAsset | null>) => {
    const a = await pick();
    if (!a) return;
    setUploadingPhoto(true);
    try {
      const up = await uploadFile("avatar", { uri: a.uri, mimeType: a.mimeType });
      setAvatarUrl(up.publicUrl);
      tapLight();
    } catch {
      notifyError();
      Alert.alert(t("about.photo.add"), t("about.photo.uploadFailed"));
    } finally {
      setUploadingPhoto(false);
    }
  };
  const choosePhoto = () => {
    Alert.alert(t("about.photo.add"), undefined, [
      { text: t("about.photo.library"), onPress: () => runPhoto(() => pickFromLibrary({ square: true })) },
      { text: t("about.photo.camera"), onPress: () => runPhoto(() => takePhoto({ square: true })) },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  // Name + gender are required (everything else is optional).
  const ready = firstName.trim().length > 0 && lastName.trim().length > 0 && !!gender;

  const proceed = () =>
    router.push({ pathname: "/onboarding/CreateAccount", params: { role, next: String(next) } });

  const onSave = async () => {
    if (!ready || saving) return;
    setSaveError(null);
    setSaving(true);
    try {
      await saveSeekerProfile(role);
      router.back();
    } catch {
      notifyError();
      setSaveError(t("seekerAbout.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoider>
        {!isEdit ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
        ) : null}

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
          <Text style={styles.h1}>{isEdit ? t("seekerAbout.editTitle") : t("seekerAbout.title")}</Text>
          {!isEdit ? <Text style={styles.sub}>{t("seekerAbout.subtitle")}</Text> : null}

          {/* Profile photo (optional) */}
          <View style={styles.photoBlock}>
            <View style={styles.photoWrap}>
              <Pressable
                onPress={choosePhoto}
                disabled={uploadingPhoto}
                style={[styles.photoCircle, hasPhoto && styles.photoCircleSet]}
                accessibilityRole="button"
                accessibilityLabel={hasPhoto ? t("about.photo.change") : t("about.photo.add")}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color={hasPhoto ? "#FFFFFF" : "#2D6A4F"} />
                ) : hasPhoto ? (
                  <Image source={{ uri: avatarUrl }} style={styles.photoImage} />
                ) : (
                  <Ionicons name="camera-outline" size={30} color="#9CA3AF" />
                )}
              </Pressable>
              <View style={styles.photoBadge} pointerEvents="none">
                <Ionicons name={hasPhoto ? "pencil" : "add"} size={14} color="#FFFFFF" />
              </View>
              {hasPhoto ? (
                <Pressable
                  onPress={() => setAvatarUrl("")}
                  hitSlop={8}
                  style={styles.photoRemove}
                  accessibilityRole="button"
                  accessibilityLabel={t("about.photo.remove")}
                >
                  <Ionicons name="close" size={14} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.photoLabel}>{hasPhoto ? t("about.photo.change") : t("about.photo.add")}</Text>
          </View>

          {/* Name (required) */}
          <Text style={styles.fieldLabel}>
            {t("about.name.label")} <Text style={styles.req}>*</Text>
          </Text>
          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t("about.name.firstPlaceholder")}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t("about.name.lastPlaceholder")}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Bio (optional) */}
          <Text style={styles.fieldLabel}>{t("about.bio.label")}</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={bio}
            onChangeText={setBio}
            placeholder={t("about.bio.placeholder")}
            placeholderTextColor="#9CA3AF"
            multiline
            textAlignVertical="top"
          />

          {/* Gender (required) */}
          <Text style={styles.fieldLabel}>
            {t("about.gender.label")} <Text style={styles.req}>*</Text>
          </Text>
          <View style={styles.grid}>
            {GENDERS.map((g) => {
              const on = gender === g.key;
              return (
                <Pressable
                  key={g.key}
                  onPress={() => setGender(on ? null : g.key)}
                  style={[styles.pill, on && styles.pillOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.pillText, on && styles.pillTextOn]}>{t(g.labelKey)}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Education — students only (a parent's level belongs to their child):
              a quick current level (for matching) + the full school history. */}
          {role === "student" ? (
            <>
              <Text style={styles.fieldLabel}>{t("seekerAbout.edu.label")}</Text>
              <View style={styles.grid}>
                {LEVELS.map((lvl) => {
                  const on = eduLevel === lvl.key;
                  return (
                    <Pressable
                      key={lvl.key}
                      onPress={() => setEduLevel(on ? null : lvl.key)}
                      style={[styles.pill, on && styles.pillOn]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.pillText, on && styles.pillTextOn]}>{t(lvl.labelKey)}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <EducationSection value={eduHistory} onChange={setEduHistory} />
            </>
          ) : null}

          {/* Phone (optional) */}
          <Text style={styles.fieldLabel}>{t("seekerAbout.phone.label")}</Text>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={20} color="#2D6A4F" />
            <TextInput
              style={[styles.input, styles.contactInput]}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("seekerAbout.phone.placeholder")}
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              autoCorrect={false}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
          {!ready ? <Text style={styles.requiredHint}>{t("about.requiredHint")}</Text> : null}
          {isEdit ? (
            <Button
              label={t("seekerAbout.save")}
              variant="primary"
              disabled={!ready || saving}
              loading={saving}
              onPress={onSave}
            />
          ) : (
            <Button label={t("common.continue")} variant="primary" disabled={!ready} onPress={proceed} />
          )}
        </View>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}

const HAIRLINE = "rgba(60,60,67,0.12)";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  progressTrack: { height: 4, backgroundColor: "#E5E7EB", width: "100%" },
  progressFill: { height: 4, backgroundColor: "#2D6A4F" },
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

  fieldLabel: { fontSize: 13.5, fontWeight: "700", color: "#16201C", marginTop: 22, marginBottom: 8 },

  input: {
    minHeight: 46,
    borderWidth: 1.5,
    borderColor: HAIRLINE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#16201C",
    backgroundColor: "#F9F9F7",
  },
  multiline: { minHeight: 110, paddingTop: 12 },
  nameRow: { flexDirection: "row", gap: 10 },
  nameInput: { flex: 1 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  contactInput: { flex: 1 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  pill: {
    width: "48.5%",
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: HAIRLINE,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  pillOn: { backgroundColor: "#2D6A4F", borderColor: "#2D6A4F" },
  pillText: { fontSize: 15, fontWeight: "600", color: "#16201C" },
  pillTextOn: { color: "#FFFFFF" },

  photoBlock: { alignItems: "center", marginTop: 18, marginBottom: 2 },
  photoWrap: { width: 96, height: 96 },
  photoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F1F3F2",
    borderWidth: 1.5,
    borderColor: HAIRLINE,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCircleSet: { backgroundColor: "#2D6A4F", borderStyle: "solid", borderColor: "#2D6A4F" },
  photoImage: { width: 96, height: 96, borderRadius: 48 },
  photoBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  photoRemove: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E63946",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  photoLabel: { marginTop: 10, fontSize: 13.5, fontWeight: "600", color: "#2D6A4F" },
  req: { color: "#E63946", fontWeight: "800" },
  requiredHint: { fontSize: 12.5, color: "#6B7280", textAlign: "center", marginBottom: 10 },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },
  errorText: { color: "#E63946", fontSize: 13, lineHeight: 18, textAlign: "center", marginBottom: 8 },
});
