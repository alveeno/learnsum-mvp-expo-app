import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { BottomSheet } from "../ui/BottomSheet";
import {
  HK_SECONDARY_SCHOOLS,
  SECONDARY_QUALIFICATIONS,
  SECONDARY_SCORE_OPTIONS,
  UNI_HONOURS,
  UNIVERSITIES,
} from "./eduOptions";
import { useT } from "../i18n/LanguageProvider";
import { type TranslationKey } from "../i18n/translations";
import { EMPTY_EDU, type EduByLevel, type LevelId, type SchoolEntry } from "./educationTypes";

// Re-export so the screens can import the section + its types from one place.
export { EMPTY_EDU };
export type { EduByLevel, LevelId, SchoolEntry };

/**
 * Shared per-level education-history section — the exact UI used on the tutor
 * "About you" (TutorAbout) and seeker "About you" (SeekerAbout) screens, so the
 * two stay identical.
 *
 * Collects a per-level school history (Kindergarten / Primary / Secondary /
 * University — multiple schools each). School names, qualifications and scores
 * come from searchable dropdowns (with a free-typed fallback); secondary /
 * university entries also carry a "Currently studying / Finished" status (and the
 * score is hidden while still studying). Controlled: the parent owns the
 * `EduByLevel` value and gets `onChange`.
 */

// Kindergarten/primary only need a school name; secondary/university also take a
// qualification + score (e.g. IB 45, First class honours).
const LEVELS: { id: LevelId; labelKey: TranslationKey; detailed: boolean }[] = [
  { id: "kindergarten", labelKey: "about.edu.kindergarten", detailed: false },
  { id: "primary", labelKey: "about.edu.primary", detailed: false },
  { id: "secondary", labelKey: "about.edu.secondary", detailed: true },
  { id: "university", labelKey: "about.edu.university", detailed: true },
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

/** Per-level education history (controlled). */
export function EducationSection({
  value,
  onChange,
}: {
  value: EduByLevel;
  onChange: (next: EduByLevel) => void;
}) {
  const t = useT();

  const addSchool = (level: LevelId) =>
    onChange({
      ...value,
      [level]: [...(value[level] ?? []), { institution: "", qualification: "", score: "", ongoing: false }],
    });
  const updSchool = (level: LevelId, i: number, patch: Partial<SchoolEntry>) =>
    onChange({
      ...value,
      [level]: (value[level] ?? []).map((e, j) => (j === i ? { ...e, ...patch } : e)),
    });
  const removeSchool = (level: LevelId, i: number) =>
    onChange({ ...value, [level]: (value[level] ?? []).filter((_, j) => j !== i) });

  return (
    <>
      <Text style={styles.fieldLabel}>{t("about.edu.label")}</Text>
      <Text style={styles.helper}>{t("about.edu.helper")}</Text>
      {LEVELS.map((lvl) => {
        const entries = value[lvl.id] ?? [];
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

                  {/* Detailed levels (secondary / university) collect a
                      qualification, a study status, and — once finished — a score.
                      Kindergarten / primary need none of these, so they show just
                      the school name. */}
                  {lvl.detailed ? (
                    <>
                      {/* Qualification — secondary picks from a list; university is
                          free text so people can type their exact degree. */}
                      {lvl.id === "university" ? (
                        <TextInput
                          style={styles.input}
                          value={e.qualification}
                          onChangeText={(text) => updSchool(lvl.id, i, { qualification: text })}
                          placeholder={t("about.edu.degreePlaceholder")}
                          placeholderTextColor="#9CA3AF"
                        />
                      ) : (
                        <SearchSelect
                          value={e.qualification}
                          options={SECONDARY_QUALIFICATIONS}
                          placeholder={t("about.pick.qualTitle")}
                          sheetTitle={t("about.pick.qualTitle")}
                          onChange={(v) => updSchool(lvl.id, i, { qualification: v })}
                        />
                      )}

                      <StatusToggle
                        ongoing={e.ongoing}
                        // Switching to "currently studying" clears any score —
                        // they wouldn't have a result yet.
                        onChange={(v) =>
                          updSchool(lvl.id, i, v ? { ongoing: true, score: "" } : { ongoing: false })
                        }
                      />

                      {/* Score / result — hidden while still studying. */}
                      {!e.ongoing ? (
                        lvl.id === "university" ? (
                          <SearchSelect
                            value={e.score}
                            options={UNI_HONOURS}
                            placeholder={t("about.pick.honoursTitle")}
                            sheetTitle={t("about.pick.honoursTitle")}
                            onChange={(v) => updSchool(lvl.id, i, { score: v })}
                          />
                        ) : (
                          <SearchSelect
                            value={e.score}
                            options={SECONDARY_SCORE_OPTIONS[e.qualification] ?? []}
                            placeholder={t("about.pick.scoreTitle")}
                            sheetTitle={t("about.pick.scoreTitle")}
                            emptyHint={t("about.pick.scoreHint")}
                            onChange={(v) => updSchool(lvl.id, i, { score: v })}
                          />
                        )
                      ) : null}
                    </>
                  ) : null}
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
    </>
  );
}

const HAIRLINE = "rgba(60,60,67,0.12)";

const styles = StyleSheet.create({
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
});
