import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { onStepContinue } from "../../components/onboarding/tutorOnboarding";
import { EducationSection, EMPTY_EDU, type EduByLevel } from "../../components/onboarding/EducationSection";
import { useT } from "../../components/i18n/LanguageProvider";
import { type TranslationKey } from "../../components/i18n/translations";

/**
 * Tutor onboarding — "About you" (the final step, after everything else).
 *
 * Collects the tutor's name (required), a free-text bio, WhatsApp/WeChat contact,
 * gender and a per-level education history (the shared `EducationSection` — same
 * UI as the seeker `SeekerAbout`). Name + gender are required; the rest are
 * OPTIONAL. Everything is kept in the shared in-memory onboarding store
 * (`usePersistentState`). On Continue it marks onboarding's final step done and
 * leads into the review screen — no backend.
 */

const PROGRESS = 1; // final info step, just before the placeholder landing

const GENDERS: { key: string; labelKey: TranslationKey }[] = [
  { key: "male", labelKey: "about.gender.male" },
  { key: "female", labelKey: "about.gender.female" },
  { key: "lgbtq", labelKey: "about.gender.lgbtq" },
  { key: "na", labelKey: "about.gender.na" },
];

export default function TutorAbout() {
  const t = useT();

  // Real profile photo: pick → upload to Storage → keep the public URL (saved to
  // profiles.avatar_url on finish/edit). Empty string = no photo.
  const [avatarUrl, setAvatarUrl] = usePersistentState<string>("tutor:about:avatarUrl", "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const hasPhoto = avatarUrl.length > 0;

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

  const [firstName, setFirstName] = usePersistentState("tutor:about:firstName", "");
  const [lastName, setLastName] = usePersistentState("tutor:about:lastName", "");
  const [bio, setBio] = usePersistentState("tutor:about:bio", "");
  const [whatsapp, setWhatsapp] = usePersistentState("tutor:about:whatsapp", "");
  const [wechat, setWechat] = usePersistentState("tutor:about:wechat", "");
  const [gender, setGender] = usePersistentState<string | null>("tutor:about:gender", null);
  const [education, setEducation] = usePersistentState<EduByLevel>("tutor:about:eduByLevel", EMPTY_EDU);

  // The "about" step is the last data step; on Continue it leads into the
  // read-only review screen (TutorProfileConfirm), which then hands off to the
  // shared Welcome screen → /tutor-home. (Resuming a skipped step bypasses the
  // review and returns home, per onStepContinue's resume mode.)
  const proceed = () =>
    onStepContinue("about", () => router.push("/onboarding/TutorProfileConfirm"));

  // First name, last name and gender are now required to continue (photo is optional).
  const ready = firstName.trim().length > 0 && lastName.trim().length > 0 && !!gender;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoider>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${PROGRESS * 100}%` }]} />
      </View>

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
        <Text style={styles.h1}>{t("about.title")}</Text>
        <Text style={styles.sub}>{t("about.subtitle")}</Text>

        {/* Profile photo (optional) — real picker → upload; the public URL is
            saved to profiles.avatar_url on finish/edit. */}
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

        {/* Bio */}
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

        {/* Contact — how students reach the tutor (optional, shown on the profile) */}
        <Text style={styles.fieldLabel}>{t("about.contact.label")}</Text>
        <Text style={styles.helper}>{t("about.contact.helper")}</Text>
        <View style={styles.contactRow}>
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <TextInput
            style={[styles.input, styles.contactInput]}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder={t("about.contact.whatsappPlaceholder")}
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            autoCorrect={false}
          />
        </View>
        <View style={[styles.contactRow, styles.contactRowGap]}>
          <Ionicons name="logo-wechat" size={20} color="#09B83E" />
          <TextInput
            style={[styles.input, styles.contactInput]}
            value={wechat}
            onChangeText={setWechat}
            placeholder={t("about.contact.wechatPlaceholder")}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Gender */}
        <Text style={styles.fieldLabel}>
          {t("about.gender.label")} <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.genderGrid}>
          {GENDERS.map((g) => {
            const on = gender === g.key;
            return (
              <Pressable
                key={g.key}
                onPress={() => setGender(on ? null : g.key)}
                style={[styles.genderBtn, on && styles.genderBtnOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.genderText, on && styles.genderTextOn]}>{t(g.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Education — shared per-level school-history section */}
        <EducationSection value={education} onChange={setEducation} />
      </ScrollView>

      <View style={styles.footer}>
        {!ready ? <Text style={styles.requiredHint}>{t("about.requiredHint")}</Text> : null}
        <Button label={t("common.continue")} variant="primary" disabled={!ready} onPress={proceed} />
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
  helper: { fontSize: 12.5, color: "#6B7280", lineHeight: 18, marginTop: -2, marginBottom: 10 },

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
  contactRowGap: { marginTop: 10 },
  contactInput: { flex: 1 },

  genderGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  genderBtn: {
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
  genderBtnOn: { backgroundColor: "#2D6A4F", borderColor: "#2D6A4F" },
  genderText: { fontSize: 15, fontWeight: "600", color: "#16201C" },
  genderTextOn: { color: "#FFFFFF" },

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
});
