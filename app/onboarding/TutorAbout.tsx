import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "../../components/ui/Button";
import { KeyboardAvoider } from "../../components/ui/KeyboardAvoider";
import { usePersistentState } from "../../components/onboarding/onboardingStore";
import { onStepContinue } from "../../components/onboarding/tutorOnboarding";
import { useT } from "../../components/i18n/LanguageProvider";
import { type TranslationKey } from "../../components/i18n/translations";

/**
 * Tutor onboarding — "About you" (the final step, after everything else).
 *
 * Collects the tutor's name (optional), a free-text bio, gender, a per-level
 * education history (Kindergarten / Primary / Secondary / University — multiple
 * schools each, for people who switched) and what they're currently studying.
 * Everything is OPTIONAL and kept in the shared in-memory onboarding store
 * (`usePersistentState`). On Continue it marks onboarding's final step done and
 * returns to the tutor home — no backend.
 */

const PROGRESS = 1; // final info step, just before the placeholder landing

type LevelId = "kindergarten" | "primary" | "secondary" | "university";
type SchoolEntry = { institution: string; qualification: string; score: string };
type CurrentEntry = { institution: string; programme: string };
type EduByLevel = Record<LevelId, SchoolEntry[]>;

// Kindergarten/primary only need a school name; secondary/university also take a
// qualification + score (e.g. IB 45, First class honours).
const LEVELS: { id: LevelId; labelKey: TranslationKey; detailed: boolean }[] = [
  { id: "kindergarten", labelKey: "about.edu.kindergarten", detailed: false },
  { id: "primary", labelKey: "about.edu.primary", detailed: false },
  { id: "secondary", labelKey: "about.edu.secondary", detailed: true },
  { id: "university", labelKey: "about.edu.university", detailed: true },
];

const EMPTY_EDU: EduByLevel = { kindergarten: [], primary: [], secondary: [], university: [] };

const GENDERS: { key: string; labelKey: TranslationKey }[] = [
  { key: "male", labelKey: "about.gender.male" },
  { key: "female", labelKey: "about.gender.female" },
  { key: "lgbtq", labelKey: "about.gender.lgbtq" },
  { key: "na", labelKey: "about.gender.na" },
];

export default function TutorAbout() {
  const t = useT();

  const [photo, setPhoto] = usePersistentState<boolean>("tutor:about:photo", false);
  const [firstName, setFirstName] = usePersistentState("tutor:about:firstName", "");
  const [lastName, setLastName] = usePersistentState("tutor:about:lastName", "");
  const [bio, setBio] = usePersistentState("tutor:about:bio", "");
  const [gender, setGender] = usePersistentState<string | null>("tutor:about:gender", null);
  const [education, setEducation] = usePersistentState<EduByLevel>("tutor:about:eduByLevel", EMPTY_EDU);
  const [current, setCurrent] = usePersistentState<CurrentEntry[]>("tutor:about:currentStudies", []);

  const addSchool = (level: LevelId) =>
    setEducation((prev) => ({
      ...prev,
      [level]: [...(prev[level] ?? []), { institution: "", qualification: "", score: "" }],
    }));
  const updSchool = (level: LevelId, i: number, patch: Partial<SchoolEntry>) =>
    setEducation((prev) => ({
      ...prev,
      [level]: (prev[level] ?? []).map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  const removeSchool = (level: LevelId, i: number) =>
    setEducation((prev) => ({ ...prev, [level]: (prev[level] ?? []).filter((_, j) => j !== i) }));

  const addCurrent = () => setCurrent((prev) => [...prev, { institution: "", programme: "" }]);
  const updCurrent = (i: number, patch: Partial<CurrentEntry>) =>
    setCurrent((prev) => prev.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const removeCurrent = (i: number) => setCurrent((prev) => prev.filter((_, j) => j !== i));

  const proceed = () =>
    onStepContinue("about", () =>
      router.push({ pathname: "/onboarding/Welcome", params: { next: "/tutor-home" } }),
    );

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

        {/* Profile photo (optional) — placeholder uploader; selecting an image is
            mocked for now (no native picker → no EAS rebuild). */}
        <View style={styles.photoBlock}>
          <View style={styles.photoWrap}>
            <Pressable
              onPress={() => setPhoto(true)}
              style={[styles.photoCircle, photo && styles.photoCircleSet]}
              accessibilityRole="button"
              accessibilityLabel={photo ? t("about.photo.change") : t("about.photo.add")}
            >
              <Ionicons
                name={photo ? "person" : "camera-outline"}
                size={photo ? 44 : 30}
                color={photo ? "#FFFFFF" : "#9CA3AF"}
              />
            </Pressable>
            <View style={styles.photoBadge} pointerEvents="none">
              <Ionicons name={photo ? "pencil" : "add"} size={14} color="#FFFFFF" />
            </View>
            {photo ? (
              <Pressable
                onPress={() => setPhoto(false)}
                hitSlop={8}
                style={styles.photoRemove}
                accessibilityRole="button"
                accessibilityLabel={t("about.photo.remove")}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.photoLabel}>{photo ? t("about.photo.change") : t("about.photo.add")}</Text>
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

        {/* Education — one section per level, multiple schools each */}
        <Text style={styles.fieldLabel}>{t("about.edu.label")}</Text>
        <Text style={styles.helper}>{t("about.edu.helper")}</Text>
        {LEVELS.map((lvl) => {
          const entries = education[lvl.id] ?? [];
          return (
            <View key={lvl.id} style={styles.levelBlock}>
              <Text style={styles.levelTitle}>{t(lvl.labelKey)}</Text>
              {entries.map((e, i) => (
                <View key={i} style={styles.eduCard}>
                  <View style={styles.eduHead}>
                    <Text style={styles.eduTitle}>{t("about.edu.schoolN", { n: i + 1 })}</Text>
                    <TouchableOpacity
                      onPress={() => removeSchool(lvl.id, i)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t("about.edu.removeSchoolA11y", { n: i + 1 })}
                    >
                      <MaterialIcons name="delete" size={18} color="#E63946" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={lvl.detailed ? [styles.input, styles.stackInput] : styles.input}
                    value={e.institution}
                    onChangeText={(text) => updSchool(lvl.id, i, { institution: text })}
                    placeholder={t("about.edu.institution")}
                    placeholderTextColor="#9CA3AF"
                  />
                  {lvl.detailed ? (
                    <>
                      <TextInput
                        style={[styles.input, styles.stackInput]}
                        value={e.qualification}
                        onChangeText={(text) => updSchool(lvl.id, i, { qualification: text })}
                        placeholder={t("about.edu.qualification")}
                        placeholderTextColor="#9CA3AF"
                      />
                      <TextInput
                        style={styles.input}
                        value={e.score}
                        onChangeText={(text) => updSchool(lvl.id, i, { score: text })}
                        placeholder={t("about.edu.score")}
                        placeholderTextColor="#9CA3AF"
                      />
                    </>
                  ) : null}
                </View>
              ))}
              <TouchableOpacity style={styles.addRow} onPress={() => addSchool(lvl.id)} accessibilityRole="button">
                <MaterialIcons name="add-circle" size={20} color="#2D6A4F" />
                <Text style={styles.addRowText}>{t("about.edu.addSchool")}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Currently studying — multi-add */}
        <Text style={styles.fieldLabel}>{t("about.current.label")}</Text>
        <Text style={styles.helper}>{t("about.current.helper")}</Text>
        {current.map((e, i) => (
          <View key={i} style={styles.eduCard}>
            <View style={styles.eduHead}>
              <Text style={styles.eduTitle}>{t("about.current.n", { n: i + 1 })}</Text>
              <TouchableOpacity
                onPress={() => removeCurrent(i)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("about.current.removeA11y", { n: i + 1 })}
              >
                <MaterialIcons name="delete" size={18} color="#E63946" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.stackInput]}
              value={e.institution}
              onChangeText={(text) => updCurrent(i, { institution: text })}
              placeholder={t("about.current.institution")}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              value={e.programme}
              onChangeText={(text) => updCurrent(i, { programme: text })}
              placeholder={t("about.current.programme")}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        ))}
        <TouchableOpacity style={styles.addRow} onPress={addCurrent} accessibilityRole="button">
          <MaterialIcons name="add-circle" size={20} color="#2D6A4F" />
          <Text style={styles.addRowText}>{t("about.current.addStudy")}</Text>
        </TouchableOpacity>
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
  stackInput: { marginBottom: 8 },
  nameRow: { flexDirection: "row", gap: 10 },
  nameInput: { flex: 1 },

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

  eduCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  eduHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  eduTitle: { fontSize: 12.5, fontWeight: "700", color: "#6B7280" },
  levelBlock: { marginBottom: 4 },
  levelTitle: { fontSize: 14, fontWeight: "700", color: "#2D6A4F", marginTop: 10, marginBottom: 8 },

  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 14,
    marginTop: 2,
  },
  addRowText: { fontSize: 14.5, fontWeight: "600", color: "#2D6A4F" },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ECECEC",
  },
});
