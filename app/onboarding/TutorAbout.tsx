import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { KeyboardAvoider } from "../../components/ui/KeyboardAvoider";
import { usePersistentState } from "../../components/onboarding/onboardingStore";
import { onStepContinue } from "../../components/onboarding/tutorOnboarding";
import {
  HK_SECONDARY_SCHOOLS,
  SECONDARY_QUALIFICATIONS,
  SECONDARY_SCORE_OPTIONS,
  UNI_DEGREES,
  UNI_HONOURS,
  UNIVERSITIES,
} from "../../components/onboarding/eduOptions";
import { useT } from "../../components/i18n/LanguageProvider";
import { type TranslationKey } from "../../components/i18n/translations";

/**
 * Tutor onboarding — "About you" (the final step, after everything else).
 *
 * Collects the tutor's name (optional), a free-text bio, gender and a per-level
 * education history (Kindergarten / Primary / Secondary / University — multiple
 * schools each, for people who switched). School names, qualifications and
 * scores are chosen from searchable dropdowns (with a free-typed fallback), and
 * each entry carries a "Currently studying / Finished" status. Everything is
 * OPTIONAL and kept in the shared in-memory onboarding store
 * (`usePersistentState`). On Continue it marks onboarding's final step done and
 * leads into the review screen — no backend.
 */

const PROGRESS = 1; // final info step, just before the placeholder landing

type LevelId = "kindergarten" | "primary" | "secondary" | "university";
type SchoolEntry = {
  institution: string;
  qualification: string;
  score: string;
  /** true = currently studying here; false = finished (default). */
  ongoing: boolean;
};
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

/**
 * A searchable dropdown: tap an option from the list, or type a value the list
 * doesn't have and confirm it ("Use …" / Return). Used for school names,
 * qualifications and scores. When `options` is empty (e.g. a score with no fixed
 * scale) it behaves as a plain type-your-own field.
 */
function SearchSelect({
  value,
  options,
  placeholder,
  sheetTitle,
  emptyHint,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  sheetTitle: string;
  emptyHint?: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const query = q.trim();
  const filtered =
    query.length === 0
      ? options
      : options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const exact = options.some((o) => o.toLowerCase() === query.toLowerCase());

  const close = () => {
    setOpen(false);
    setQ("");
  };
  const choose = (v: string) => {
    onChange(v);
    close();
  };
  const useTyped = () => {
    if (query.length > 0) choose(query);
  };

  return (
    <>
      <Pressable
        style={styles.select}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={value || placeholder}
      >
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <MaterialIcons name="expand-more" size={20} color="#9CA3AF" />
      </Pressable>

      <BottomSheet visible={open} onClose={close} title={sheetTitle}>
        <View style={styles.sheetSearch}>
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.sheetInput}
            value={q}
            onChangeText={setQ}
            placeholder={t("about.pick.search")}
            placeholderTextColor="#9CA3AF"
            autoFocus
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={useTyped}
          />
          {q.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => setQ("")} accessibilityRole="button" accessibilityLabel="Clear">
              <MaterialIcons name="close" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        {query.length > 0 && !exact ? (
          <TouchableOpacity style={styles.useTypedRow} onPress={useTyped} accessibilityRole="button">
            <MaterialIcons name="add-circle" size={20} color="#2D6A4F" />
            <Text style={styles.useTypedText} numberOfLines={1}>
              {t("about.pick.use", { q: query })}
            </Text>
          </TouchableOpacity>
        ) : null}

        {filtered.length === 0 && query.length === 0 ? (
          <Text style={styles.pickEmpty}>{emptyHint ?? t("about.pick.search")}</Text>
        ) : (
          <FlatList
            style={styles.pickList}
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            renderItem={({ item }) => {
              const on = item === value;
              return (
                <TouchableOpacity
                  style={[styles.optRow, on && styles.optRowOn]}
                  onPress={() => choose(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.optText, on && styles.optTextOn]} numberOfLines={2}>
                    {item}
                  </Text>
                  {on ? <Ionicons name="checkmark" size={20} color="#2D6A4F" /> : null}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </BottomSheet>
    </>
  );
}

/** Two-button "Currently studying / Finished" toggle below each school entry. */
function StatusToggle({ ongoing, onChange }: { ongoing: boolean; onChange: (v: boolean) => void }) {
  const t = useT();
  const opts: { key: "ongoing" | "finished"; label: string }[] = [
    { key: "ongoing", label: t("about.status.ongoing") },
    { key: "finished", label: t("about.status.finished") },
  ];
  const value = ongoing ? "ongoing" : "finished";
  return (
    <View style={styles.seg}>
      {opts.map((o) => {
        const on = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            style={[styles.segBtn, on && styles.segBtnOn]}
            onPress={() => onChange(o.key === "ongoing")}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.segText, on && styles.segTextOn]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TutorAbout() {
  const t = useT();

  const [photo, setPhoto] = usePersistentState<boolean>("tutor:about:photo", false);
  const [firstName, setFirstName] = usePersistentState("tutor:about:firstName", "");
  const [lastName, setLastName] = usePersistentState("tutor:about:lastName", "");
  const [bio, setBio] = usePersistentState("tutor:about:bio", "");
  const [gender, setGender] = usePersistentState<string | null>("tutor:about:gender", null);
  const [education, setEducation] = usePersistentState<EduByLevel>("tutor:about:eduByLevel", EMPTY_EDU);

  const addSchool = (level: LevelId) =>
    setEducation((prev) => ({
      ...prev,
      [level]: [...(prev[level] ?? []), { institution: "", qualification: "", score: "", ongoing: false }],
    }));
  const updSchool = (level: LevelId, i: number, patch: Partial<SchoolEntry>) =>
    setEducation((prev) => ({
      ...prev,
      [level]: (prev[level] ?? []).map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  const removeSchool = (level: LevelId, i: number) =>
    setEducation((prev) => ({ ...prev, [level]: (prev[level] ?? []).filter((_, j) => j !== i) }));

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
                  <View style={styles.eduFields}>
                    {lvl.id === "university" ? (
                      <SearchSelect
                        value={e.institution}
                        options={UNIVERSITIES}
                        placeholder={t("about.edu.institution")}
                        sheetTitle={t("about.pick.schoolTitle")}
                        onChange={(v) => updSchool(lvl.id, i, { institution: v })}
                      />
                    ) : lvl.id === "secondary" ? (
                      <SearchSelect
                        value={e.institution}
                        options={HK_SECONDARY_SCHOOLS}
                        placeholder={t("about.edu.institution")}
                        sheetTitle={t("about.pick.schoolTitle")}
                        onChange={(v) => updSchool(lvl.id, i, { institution: v })}
                      />
                    ) : (
                      <TextInput
                        style={styles.input}
                        value={e.institution}
                        onChangeText={(text) => updSchool(lvl.id, i, { institution: text })}
                        placeholder={t("about.edu.institution")}
                        placeholderTextColor="#9CA3AF"
                      />
                    )}

                    {lvl.detailed ? (
                      lvl.id === "university" ? (
                        <>
                          <SearchSelect
                            value={e.qualification}
                            options={UNI_DEGREES}
                            placeholder={t("about.pick.degreeTitle")}
                            sheetTitle={t("about.pick.degreeTitle")}
                            onChange={(v) => updSchool(lvl.id, i, { qualification: v })}
                          />
                          <SearchSelect
                            value={e.score}
                            options={UNI_HONOURS}
                            placeholder={t("about.pick.honoursTitle")}
                            sheetTitle={t("about.pick.honoursTitle")}
                            onChange={(v) => updSchool(lvl.id, i, { score: v })}
                          />
                        </>
                      ) : (
                        <>
                          <SearchSelect
                            value={e.qualification}
                            options={SECONDARY_QUALIFICATIONS}
                            placeholder={t("about.pick.qualTitle")}
                            sheetTitle={t("about.pick.qualTitle")}
                            onChange={(v) => updSchool(lvl.id, i, { qualification: v })}
                          />
                          <SearchSelect
                            value={e.score}
                            options={SECONDARY_SCORE_OPTIONS[e.qualification] ?? []}
                            placeholder={t("about.pick.scoreTitle")}
                            sheetTitle={t("about.pick.scoreTitle")}
                            emptyHint={t("about.pick.scoreHint")}
                            onChange={(v) => updSchool(lvl.id, i, { score: v })}
                          />
                        </>
                      )
                    ) : null}

                    <StatusToggle
                      ongoing={e.ongoing}
                      onChange={(v) => updSchool(lvl.id, i, { ongoing: v })}
                    />
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addRow} onPress={() => addSchool(lvl.id)} accessibilityRole="button">
                <MaterialIcons name="add-circle" size={20} color="#2D6A4F" />
                <Text style={styles.addRowText}>{t("about.edu.addSchool")}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
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

  // Fields inside one school card (school / qualification / score / status).
  eduFields: { gap: 8 },

  // SearchSelect trigger (mirrors `input`, with a dropdown chevron).
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 46,
    borderWidth: 1.5,
    borderColor: HAIRLINE,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "#F9F9F7",
  },
  selectText: { flex: 1, fontSize: 16, color: "#16201C" },
  selectPlaceholder: { color: "#9CA3AF" },

  // SearchSelect sheet contents.
  sheetSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  sheetInput: { flex: 1, fontSize: 16, color: "#16201C", paddingVertical: 0 },
  useTypedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#E8F1ED",
    marginBottom: 8,
  },
  useTypedText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#2D6A4F" },
  pickList: { maxHeight: 360 },
  pickEmpty: { fontSize: 14.5, color: "#9CA3AF", paddingVertical: 18, textAlign: "center" },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 50,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: "#F9F9F7",
  },
  optRowOn: { backgroundColor: "#E8F1ED" },
  optText: { flex: 1, fontSize: 15.5, color: "#16201C" },
  optTextOn: { fontWeight: "700", color: "#2D6A4F" },

  // Status toggle (Currently studying / Finished).
  seg: { flexDirection: "row", backgroundColor: "#EFEFEF", borderRadius: 14, padding: 4, gap: 4, marginTop: 2 },
  segBtn: { flex: 1, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  segBtnOn: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segText: { fontSize: 13.5, fontWeight: "600", color: "#6B7280" },
  segTextOn: { color: "#16201C", fontWeight: "700" },

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
