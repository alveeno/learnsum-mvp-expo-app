import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar, Qualified } from "./feedUi";
import { C } from "./tutorData";
import { qualDetailKind } from "../onboarding/tutorQuals";
import { type FormatId } from "../onboarding/PreferencesScreen";
import { subIconFor, type Interest } from "../../app/onboarding/StudentCatSel";

/**
 * ProfileBody — the rich, read-only tutor-profile layout (profile card, About,
 * Education accordion, Subjects-taught accordion, Languages, Levels track),
 * extracted from TutorProfileConfirm so EVERY profile surface looks identical:
 *  - the onboarding review (TutorProfileConfirm — store data),
 *  - the own Profile tab (/api/auth/me),
 *  - viewing another tutor (/api/tutors/[slug]).
 *
 * It takes already-normalized `data` (see ProfileBodyData) and renders only the
 * scrollable sections — the caller supplies the screen chrome (header / footer /
 * scroll container). Districts arrive as DISPLAY names (callers resolve enum
 * codes / store keys before passing them in).
 */

// ---- shared shapes -----------------------------------------------------------
export type LevelId = "kindergarten" | "primary" | "secondary" | "university";
export type SchoolEntry = {
  institution: string;
  qualification: string;
  score: string;
  ongoing?: boolean;
};
export type EduByLevel = Record<LevelId, SchoolEntry[]>;

export type Qualification = {
  type?: string;
  detail?: string;
  test?: string;
  subject?: string;
  grade?: string;
};
export type Experience = {
  text: string;
  kind: "duration" | "event";
  dur: string;
  unit: "months" | "years";
  ongoing: boolean;
  year: string;
};
export type Detail = {
  years: string;
  pay: number;
  format: FormatId;
  /** District DISPLAY names (already resolved by the caller). */
  districts: string[];
  achievements: string[];
  experiences: Experience[];
  quals: Qualification[];
};

export type ProfileBodyData = {
  fullName: string;
  gender: string | null;
  bio: string;
  levels: string[];
  interests: Interest[];
  /** keyed `${catId}:${subId}` */
  details: Record<string, Detail>;
  /** language id → proficiency 1..4 */
  langLevels: Record<string, number>;
  eduByLevel: EduByLevel;
};

export const EMPTY_EDU: EduByLevel = { kindergarten: [], primary: [], secondary: [], university: [] };
export const DEFAULT_DETAIL: Detail = {
  years: "0",
  pay: 300,
  format: "both",
  districts: [],
  achievements: [],
  experiences: [],
  quals: [],
};
const PAY_MAX = 3000;

// ---- label maps --------------------------------------------------------------
// Accepts both the app's onboarding values (lgbtq / na) and the backend enum
// values (lgbt / prefer_not_to_say / other) so the same screen renders either.
const GENDER_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
  lgbtq: "LGBTQ+",
  lgbt: "LGBTQ+",
  na: "Prefer not to say",
  prefer_not_to_say: "Prefer not to say",
  other: "Other",
};
const GENDER_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  male: "gender-male",
  female: "gender-female",
  lgbtq: "gender-non-binary",
  lgbt: "gender-non-binary",
  na: "account-outline",
  prefer_not_to_say: "account-outline",
  other: "account-outline",
};

const FORMAT_LABEL: Record<string, string> = {
  in_person: "In person",
  online: "Online",
  both: "In person & online",
};

const LANG_LABEL: Record<string, string> = {
  cantonese: "Cantonese",
  mandarin: "Mandarin",
  english: "English",
  japanese: "Japanese",
  korean: "Korean",
  french: "French",
  spanish: "Spanish",
  german: "German",
  italian: "Italian",
  portuguese: "Portuguese",
  thai: "Thai",
  hindi: "Hindi",
  arabic: "Arabic",
};
const LANG_ORDER = ["cantonese", "mandarin", "english"];
const FLUENCY = [null, "Beginner", "Intermediate", "Advanced", "Fluent"] as const;

const LEVEL_TRACK: { key: string; label: string }[] = [
  { key: "kindergarten", label: "KG" },
  { key: "primary", label: "Primary" },
  { key: "middle", label: "Jr Sec" },
  { key: "high", label: "Sr Sec" },
  { key: "university", label: "Uni" },
  { key: "adult", label: "Adult" },
];

type EduItem = {
  name: string;
  line: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  ongoing: boolean;
};
const LEVEL_META: { id: LevelId; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { id: "university", label: "University", icon: "school" },
  { id: "secondary", label: "Secondary", icon: "book-open-page-variant" },
  { id: "primary", label: "Primary", icon: "book-outline" },
  { id: "kindergarten", label: "Kindergarten", icon: "baby-face-outline" },
];
const TOP_LEVELS = new Set<LevelId>(["university", "secondary"]);
const cleanLine = (...parts: string[]) => parts.map((s) => s.trim()).filter(Boolean).join(" · ");

// ---- university logo lookup --------------------------------------------------
const SCHOOL_DOMAINS: { patterns: string[]; domain: string }[] = [
  { patterns: ["hkust", "science and technology"], domain: "ust.hk" },
  { patterns: ["chinese university", "cuhk"], domain: "cuhk.edu.hk" },
  { patterns: ["polytechnic", "polyu"], domain: "polyu.edu.hk" },
  { patterns: ["city university", "cityu"], domain: "cityu.edu.hk" },
  { patterns: ["baptist", "hkbu"], domain: "hkbu.edu.hk" },
  { patterns: ["education university", "institute of education", "eduhk"], domain: "eduhk.hk" },
  { patterns: ["lingnan"], domain: "ln.edu.hk" },
  { patterns: ["metropolitan", "open university", "ouhk", "hkmu"], domain: "hkmu.edu.hk" },
  { patterns: ["shue yan"], domain: "hksyu.edu" },
  { patterns: ["university of hong kong", "hku"], domain: "hku.hk" },
];
function domainFor(name: string): string | null {
  const n = name.toLowerCase();
  for (const d of SCHOOL_DOMAINS) {
    if (d.patterns.some((p) => n.includes(p))) return d.domain;
  }
  return null;
}

// ---- derivations -------------------------------------------------------------
const priceText = (pay: number) => (pay >= PAY_MAX ? "$3000+" : `$${pay}`);

function ownGrade(d: Detail): string | null {
  for (const q of d.quals) {
    const kind = qualDetailKind(q.type);
    if (kind === "exam" && q.grade) return q.grade;
    if (kind === "dropdown" && q.detail) return q.detail;
  }
  return null;
}

function subjectSubtitle(d: Detail, categoryLabel?: string): string {
  const q = d.quals.find((x) => !!x.type);
  if (q?.type) {
    const kind = qualDetailKind(q.type);
    if ((kind === "exam" || kind === "degree") && q.subject) return `${q.type} · ${q.subject}`;
    return q.type;
  }
  return categoryLabel ?? "";
}

function shortSubject(subject: string): string {
  const s = subject.trim();
  const abbr = s.match(/\(([^)]+)\)/)?.[1]?.trim();
  const noParen = s.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  const head = noParen.includes(":") ? noParen.slice(0, noParen.indexOf(":")).trim() : noParen;
  return abbr && noParen.includes(":") ? `${head}: ${abbr}` : head;
}

function qualView(q: Qualification): { big: string | null; label: string; line: string } {
  const kind = qualDetailKind(q.type);
  const type = q.type ?? "";
  const withSubject = q.subject ? `${type} ${shortSubject(q.subject)}` : type;
  if (kind === "exam" || kind === "degree") {
    return { big: q.grade || null, label: withSubject, line: [type, q.subject, q.grade].filter(Boolean).join(" · ") };
  }
  if (kind === "dropdown") {
    return { big: q.detail || null, label: type, line: [type, q.detail].filter(Boolean).join(" · ") };
  }
  if (kind === "ielts") {
    return { big: q.detail || null, label: q.test || type, line: [type, q.test, q.detail].filter(Boolean).join(" · ") };
  }
  return { big: null, label: type, line: [type, q.detail].filter(Boolean).join(" · ") };
}

function formatExp(ex: Experience): string {
  const name = ex.text.trim() || "Experience";
  if (ex.kind === "event") return ex.year ? `${name} · ${ex.year}` : name;
  return `${name} · ${ex.dur} ${ex.unit} · ${ex.ongoing ? "Ongoing" : "Ended"}`;
}

// ---- pieces -----------------------------------------------------------------
function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SchoolLogo({ name, icon }: { name: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }) {
  const domain = domainFor(name);
  const [failed, setFailed] = useState(false);
  const showImg = !!domain && !failed;
  return showImg ? (
    <View style={styles.logoTile}>
      <Image
        source={{ uri: `https://logo.clearbit.com/${domain}` }}
        style={styles.logoImg}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    </View>
  ) : (
    <View style={[styles.logoTile, styles.logoFallback]}>
      <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" />
    </View>
  );
}

function EduCard({ item }: { item: EduItem }) {
  return (
    <View style={styles.eduCard}>
      <SchoolLogo name={item.name} icon={item.icon} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.eduName}>{item.name}</Text>
        {item.line ? <Text style={styles.eduLine}>{item.line}</Text> : null}
        {item.ongoing ? (
          <View style={styles.nowBadge}>
            <View style={styles.nowDot} />
            <Text style={styles.nowBadgeText}>Currently studying</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function EduGroup({ label, items }: { label: string; items: EduItem[] }) {
  return (
    <View style={styles.eduGroup}>
      <Text style={styles.eduGroupLabel}>{label}</Text>
      {items.map((e, i) => (
        <EduCard key={i} item={e} />
      ))}
    </View>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function GradeTile({ big, label }: { big: string; label: string }) {
  return (
    <View style={styles.gradeTile}>
      <Text style={styles.gradeTileValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
        {big}
      </Text>
      <Text style={styles.gradeTileLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

function SectionHeading({
  icon,
  color,
  children,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  children: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <MaterialIcons name={icon} size={18} color={color} />
      <Text style={styles.sectionHeading}>{children}</Text>
    </View>
  );
}

function SubjectCard({
  interest,
  detail,
  formatText,
  areas,
  open,
  onToggle,
}: {
  interest: Interest;
  detail: Detail;
  formatText: string | null;
  areas: string[];
  open: boolean;
  onToggle: () => void;
}) {
  const grade = ownGrade(detail);
  const subtitle = subjectSubtitle(detail, interest.category);
  const quals = detail.quals.filter((q) => !!q.type);
  const achievements = detail.achievements.filter((a) => a.trim().length > 0);
  const experiences = detail.experiences.filter((e) => e.text.trim().length > 0);

  const qualViews = quals.map(qualView);
  const gradeTiles = qualViews.filter((v): v is { big: string; label: string; line: string } => !!v.big);
  const qualLines = qualViews.filter((v) => !v.big).map((v) => v.line).filter(Boolean);

  return (
    <View style={styles.subCard}>
      <Pressable
        style={styles.subHeader}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={[styles.disc, { backgroundColor: interest.color ?? C.green }]}>
          <MaterialCommunityIcons name={subIconFor(interest.catId, interest.subId)} size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.subName} numberOfLines={1}>
            {interest.label ?? interest.subId}
          </Text>
          {subtitle ? (
            <Text style={styles.subSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {grade ? (
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeBadgeText}>{grade}</Text>
          </View>
        ) : null}
        <Text style={styles.subPrice}>{priceText(detail.pay)}</Text>
        <MaterialIcons name={open ? "expand-less" : "expand-more"} size={22} color={C.unselIc} />
      </Pressable>

      {open ? (
        <View style={styles.subBody}>
          {formatText ? (
            <View style={styles.pill}>
              <Ionicons name="book-outline" size={14} color={C.greenD} />
              <Text style={styles.pillText}>{formatText}</Text>
            </View>
          ) : null}

          {areas.length > 0 ? (
            <View style={styles.areaRow}>
              <Ionicons name="location-outline" size={14} color={C.muted} />
              <Text style={styles.areaText}>{areas.join(" · ")}</Text>
            </View>
          ) : null}

          <View style={styles.statRow}>
            <StatTile value={detail.years} label="YEARS EXP" />
            <StatTile value={priceText(detail.pay)} label="PER HOUR" />
          </View>

          {quals.length > 0 ? (
            <View style={styles.sectionCard}>
              <SectionHeading icon="workspace-premium" color={C.goldD}>
                Qualifications
              </SectionHeading>
              {gradeTiles.length > 0 ? (
                <View style={styles.gradeGrid}>
                  {gradeTiles.map((g, i) => (
                    <GradeTile key={i} big={g.big} label={g.label} />
                  ))}
                </View>
              ) : null}
              {qualLines.map((l, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{l}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {achievements.length > 0 ? (
            <View style={styles.sectionCard}>
              <SectionHeading icon="emoji-events" color={C.goldD}>
                Achievements
              </SectionHeading>
              {achievements.map((a, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{a}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {experiences.length > 0 ? (
            <View style={styles.sectionCard}>
              <SectionHeading icon="work-history" color={C.green}>
                Experience
              </SectionHeading>
              {experiences.map((e, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{formatExp(e)}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---- the body ---------------------------------------------------------------
export function ProfileBody({ data }: { data: ProfileBodyData }) {
  const getDetail = (it: Interest) => data.details[`${it.catId}:${it.subId}`] ?? DEFAULT_DETAIL;

  const hasAnyQual = data.interests.some((it) => getDetail(it).quals.some((q) => !!q.type));

  const [openKey, setOpenKey] = useState<string>(
    data.interests[0] ? `${data.interests[0].catId}:${data.interests[0].subId}` : "",
  );

  const eduGroups = useMemo(
    () =>
      LEVEL_META.map((lvl) => ({
        level: lvl,
        items: (data.eduByLevel[lvl.id] ?? [])
          .filter((e) => e.institution.trim())
          .map<EduItem>((e) => ({
            name: e.institution.trim(),
            line: cleanLine(e.qualification, e.score),
            icon: lvl.icon,
            ongoing: !!e.ongoing,
          })),
      })).filter((g) => g.items.length > 0),
    [data.eduByLevel],
  );

  const [eduOpen, setEduOpen] = useState(false);
  const topGroups = eduGroups.filter((g) => TOP_LEVELS.has(g.level.id));
  const collapsedGroups = topGroups.length > 0 ? topGroups : eduGroups;
  const hiddenCount =
    topGroups.length > 0
      ? eduGroups.filter((g) => !TOP_LEVELS.has(g.level.id)).reduce((n, g) => n + g.items.length, 0)
      : 0;
  const visibleGroups = eduOpen ? eduGroups : collapsedGroups;

  const langs = useMemo(() => {
    const levels = data.langLevels ?? {};
    const ids = Object.keys(levels).filter((id) => (levels[id] ?? 0) > 0);
    ids.sort((a, b) => {
      const ai = LANG_ORDER.indexOf(a);
      const bi = LANG_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return ids.map((id) => ({ id, label: LANG_LABEL[id] ?? id, level: levels[id] ?? 0 }));
  }, [data.langLevels]);

  const levelsSet = useMemo(() => new Set(data.levels), [data.levels]);
  const hasLevels = LEVEL_TRACK.some((l) => levelsSet.has(l.key));

  return (
    <>
      {/* Profile card */}
      <View style={styles.profileCard}>
        <Avatar name={data.fullName} size={84} />
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {data.fullName}
          </Text>
          {hasAnyQual ? <Qualified /> : null}
        </View>
        {data.gender ? (
          <View style={styles.genderRow}>
            <MaterialCommunityIcons name={GENDER_ICON[data.gender] ?? "account-outline"} size={15} color={C.muted} />
            <Text style={styles.genderText}>{GENDER_LABEL[data.gender] ?? data.gender}</Text>
          </View>
        ) : null}
      </View>

      {/* About / bio */}
      {data.bio.trim() ? (
        <>
          <SectionLabel>About</SectionLabel>
          <View style={styles.card}>
            <Text style={styles.bioText}>{data.bio.trim()}</Text>
          </View>
        </>
      ) : null}

      {/* Education */}
      {eduGroups.length > 0 ? (
        <>
          <SectionLabel>Education</SectionLabel>
          <View style={styles.cardGroup}>
            {visibleGroups.map((g) => (
              <EduGroup key={g.level.id} label={g.level.label} items={g.items} />
            ))}
            {hiddenCount > 0 ? (
              <Pressable style={styles.eduToggle} onPress={() => setEduOpen((o) => !o)} accessibilityRole="button">
                <Text style={styles.eduToggleText}>
                  {eduOpen ? "Show less" : `Show all education (${hiddenCount} more)`}
                </Text>
                <MaterialIcons name={eduOpen ? "expand-less" : "expand-more"} size={20} color={C.greenD} />
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}

      {/* Subjects taught */}
      {data.interests.length > 0 ? (
        <>
          <SectionLabel>Subjects taught</SectionLabel>
          <View style={{ gap: 10 }}>
            {data.interests.map((it) => {
              const key = `${it.catId}:${it.subId}`;
              const d = getDetail(it);
              const inPerson = d.format === "in_person" || d.format === "both";
              const areas = inPerson ? d.districts : [];
              return (
                <SubjectCard
                  key={key}
                  interest={it}
                  detail={d}
                  formatText={FORMAT_LABEL[d.format] ?? null}
                  areas={areas}
                  open={openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? "" : key)}
                />
              );
            })}
          </View>
        </>
      ) : null}

      {/* Languages */}
      {langs.length > 0 ? (
        <>
          <SectionLabel>Languages</SectionLabel>
          <View style={styles.card}>
            {langs.map((l, i) => (
              <View key={l.id} style={[styles.langRow, i > 0 && styles.langRowDivider]}>
                <View style={styles.langTop}>
                  <Text style={styles.langName}>{l.label}</Text>
                  <Text style={styles.langLevel}>{FLUENCY[l.level] ?? ""}</Text>
                </View>
                <View style={styles.langTrack}>
                  <View style={[styles.langFill, { width: `${(l.level / 4) * 100}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {/* Levels taught */}
      {hasLevels ? (
        <>
          <SectionLabel>Levels taught</SectionLabel>
          <View style={styles.card}>
            <View style={styles.levelTrack}>
              <View style={styles.levelLine} />
              <View style={styles.levelDotsRow}>
                {LEVEL_TRACK.map((l) => {
                  const on = levelsSet.has(l.key);
                  return (
                    <View key={l.key} style={styles.levelCol}>
                      <View style={[styles.levelDot, on ? styles.levelDotOn : styles.levelDotOff]} />
                      <Text style={[styles.levelLabel, on && styles.levelLabelOn]}>{l.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { marginTop: 24, marginBottom: 12, fontSize: 13, fontWeight: "800", letterSpacing: 0.4, color: C.ink },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16 },
  cardGroup: { backgroundColor: C.surface, borderRadius: 16, padding: 10, gap: 2 },
  eduGroup: { marginTop: 2 },
  eduGroupLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, color: C.muted, paddingHorizontal: 8, marginTop: 8, marginBottom: 2 },
  profileCard: { marginTop: 6, backgroundColor: C.surface, borderRadius: 20, paddingVertical: 22, paddingHorizontal: 16, alignItems: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, maxWidth: "100%" },
  name: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4, color: C.ink, flexShrink: 1 },
  genderRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  genderText: { fontSize: 13.5, color: C.muted, fontWeight: "600" },
  bioText: { fontSize: 14.5, lineHeight: 21, color: C.ink },
  eduCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  logoTile: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: C.hairline, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoFallback: { backgroundColor: C.greenD, borderWidth: 0 },
  logoImg: { width: 32, height: 32 },
  eduName: { fontSize: 15, fontWeight: "700", color: C.ink },
  eduLine: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  nowBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: C.greenTint, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5 },
  nowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  nowBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2, color: C.greenD },
  eduToggle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12, marginTop: 2 },
  eduToggleText: { fontSize: 13.5, fontWeight: "700", color: C.greenD },
  subCard: { backgroundColor: C.surface, borderRadius: 16, overflow: "hidden" },
  subHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  disc: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  subName: { fontSize: 15.5, fontWeight: "700", color: C.ink },
  subSubtitle: { fontSize: 12.5, color: C.muted, marginTop: 1 },
  gradeBadge: { backgroundColor: C.goldTint, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  gradeBadgeText: { fontSize: 13, fontWeight: "800", color: C.goldD },
  subPrice: { fontSize: 14.5, fontWeight: "800", color: C.greenD },
  subBody: { paddingHorizontal: 14, paddingBottom: 16, gap: 14 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: C.greenTint, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontSize: 13, fontWeight: "700", color: C.greenD },
  areaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  areaText: { flex: 1, fontSize: 13, color: C.muted, fontWeight: "600" },
  statRow: { flexDirection: "row", gap: 10 },
  statTile: { flex: 1, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: C.hairline, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: C.greenD },
  statLabel: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.3, color: C.muted, marginTop: 4 },
  sectionCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: C.hairline, borderRadius: 14, padding: 14, gap: 10 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 7 },
  sectionHeading: { fontSize: 17, fontWeight: "800", letterSpacing: -0.2, color: C.ink },
  gradeGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  gradeTile: { width: "48.5%", backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, alignItems: "center" },
  gradeTileValue: { fontSize: 22, fontWeight: "800", color: C.goldD, textAlign: "center" },
  gradeTileLabel: { fontSize: 11.5, fontWeight: "600", color: C.muted, marginTop: 5, textAlign: "center", lineHeight: 15 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.green, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: C.ink },
  langRow: { paddingVertical: 10 },
  langRowDivider: { borderTopWidth: 1, borderTopColor: C.hairline },
  langTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  langName: { fontSize: 15, fontWeight: "700", color: C.ink },
  langLevel: { fontSize: 13, fontWeight: "600", color: C.muted },
  langTrack: { height: 6, borderRadius: 3, backgroundColor: "#E5E7EB", overflow: "hidden" },
  langFill: { height: 6, borderRadius: 3, backgroundColor: C.green },
  levelTrack: { position: "relative", justifyContent: "center" },
  levelLine: { position: "absolute", left: "8.33%", right: "8.33%", top: 6, height: 2, backgroundColor: "#E5E7EB" },
  levelDotsRow: { flexDirection: "row" },
  levelCol: { flex: 1, alignItems: "center" },
  levelDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  levelDotOn: { backgroundColor: C.green, borderColor: C.green },
  levelDotOff: { backgroundColor: "#FFFFFF", borderColor: "#D1D5DB" },
  levelLabel: { fontSize: 11, color: C.muted, fontWeight: "600", marginTop: 8, textAlign: "center" },
  levelLabelOn: { color: C.greenD, fontWeight: "800" },
});
