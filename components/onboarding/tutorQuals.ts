/**
 * Qualification data + logic for the tutor "Strengths & Details" screen.
 * Ported verbatim from the brief (§4 / §5). Placeholders, en-dashes ("–") and
 * the em-dash ("—") in the helper line are intentional and must stay exact.
 */

export const QUAL_GROUPS: Record<string, string[]> = {
  academics: [
    "DSE",
    "IB",
    "IGCSE",
    "A-Level",
    "AP (Advanced Placement)",
    "University Course",
    "Degree",
    "Postgraduate Degree",
    "Professional Certification",
  ],
  sports: [
    "HKCC Coaching Accreditation",
    "Sport-Specific Association Certification",
    "Royal Life Saving Society (RLSS)",
    "First Aid / CPR Certification",
    "Higher Diploma in Sports Coaching",
    "Degree",
    "Professional Certification",
  ],
  languages: [
    "TEFL / TESOL",
    "CELTA",
    "IELTS / TOEFL / TOEIC (own attainment)",
    "JLPT (Japanese Language Proficiency Test)",
    "HSK (Mandarin Proficiency)",
    "DELF / DALF (French)",
    "DELE (Spanish)",
    "Goethe-Zertifikat (German)",
    "Putonghua Proficiency Test",
    "Degree",
    "Professional Certification",
  ],
  culinary: [
    "Culinary Diploma",
    "City & Guilds Food & Beverage",
    "WSET (Wine & Spirit Education Trust)",
    "Food Hygiene / Safety Certificate",
    "Trade Test Certificate (VTC)",
    "Degree",
    "Professional Certification",
  ],
  arts: [
    "ABRSM Grade",
    "Trinity College London Grade",
    "HKSMF Certificate",
    "Music Degree / Diploma",
    "BTEC Art & Design",
    "Art Foundation Diploma",
    "Fine Arts Degree",
    "Professional Certification",
  ],
};

// Subjects that straddle Academics + Languages get the COMBINED, de-duped list.
// Adapted to this app's subject ids (language-English shares the id "english").
const QUAL_OVERLAP_SUBJECTS = new Set([
  "english",
  "chinese",
  "mandarin",
  "cantonese",
]);

export function qualTypes(subId: string, catId: string): string[] {
  let list: string[];
  if (QUAL_OVERLAP_SUBJECTS.has(subId)) {
    const seen = new Set<string>();
    list = [];
    [...QUAL_GROUPS.academics, ...QUAL_GROUPS.languages].forEach((x) => {
      if (!seen.has(x)) {
        seen.add(x);
        list.push(x);
      }
    });
  } else {
    list = QUAL_GROUPS[catId] ?? QUAL_GROUPS.academics;
  }
  return [...list, "Other"];
}

// §5a — fixed-option dropdowns.
export const QUAL_DETAIL_OPTS: Record<string, string[]> = {
  DSE: ["Level 5**", "Level 5*", "Level 5", "Level 4", "Level 3", "Level 2", "Level 1"],
  IB: ["45", "44", "43", "42", "41", "40", "39", "38", "37", "36", "35", "Below 35"],
  "ABRSM Grade": [
    "Grade 8",
    "Grade 7",
    "Grade 6",
    "Grade 5",
    "Grade 4",
    "Grade 3",
    "Grade 2",
    "Grade 1",
    "DipABRSM",
    "LRSM",
    "FRSM",
  ],
  "Trinity College London Grade": [
    "Grade 8",
    "Grade 7",
    "Grade 6",
    "Grade 5",
    "Grade 4",
    "Grade 3",
    "Grade 2",
    "Grade 1",
    "Associate",
    "Licentiate",
    "Fellow",
  ],
  "JLPT (Japanese Language Proficiency Test)": ["N1", "N2", "N3", "N4", "N5"],
  "HSK (Mandarin Proficiency)": [
    "Level 9",
    "Level 8",
    "Level 7",
    "Level 6",
    "Level 5",
    "Level 4",
    "Level 3",
    "Level 2",
    "Level 1",
  ],
  "HKCC Coaching Accreditation": ["Level 3", "Level 2", "Level 1"],
  "DELF / DALF (French)": ["DALF C2", "DALF C1", "DELF B2", "DELF B1", "DELF A2", "DELF A1"],
  "DELE (Spanish)": ["C2", "C1", "B2", "B1", "A2", "A1"],
  "Goethe-Zertifikat (German)": ["C2", "C1", "B2", "B1", "A2", "A1"],
};

// §5b — IELTS / TOEFL / TOEIC two-step (en-dashes, not hyphens).
export const QUAL_IELTS_TYPE = "IELTS / TOEFL / TOEIC (own attainment)";
export const QUAL_IELTS_TESTS = ["IELTS", "TOEFL", "TOEIC"];
export const QUAL_IELTS_SCORES: Record<string, string[]> = {
  IELTS: ["9.0", "8.5", "8.0", "7.5", "7.0", "6.5", "6.0", "5.5"],
  TOEFL: ["110+", "100–109", "90–99"],
  TOEIC: ["900+", "800–899", "700–799"],
};

// §5c — free-text inputs (placeholders must match exactly).
export const QUAL_FREETEXT_PLACEHOLDERS: Record<string, string> = {
  IGCSE: "e.g. Mathematics A*, Physics A",
  "A-Level": "e.g. Mathematics A*, Chemistry A",
  "AP (Advanced Placement)": "e.g. Calculus BC Score 5",
  "University Course": "e.g. BSc Computer Science, HKU",
  Degree: "e.g. Bachelor of Engineering, CUHK",
  "Postgraduate Degree": "e.g. MSc Data Science, HKU",
  "Professional Certification": "e.g. CPA, CFA Level 2",
  "TEFL / TESOL": "e.g. 120-hour TESOL, International TEFL Academy",
  CELTA: "e.g. CELTA Pass A, Cambridge",
  "Sport-Specific Association Certification":
    "e.g. AFC C Licence (Football), HKASA Level 2 (Swimming)",
  "Royal Life Saving Society (RLSS)": "e.g. RLSS National Pool Lifeguard",
  "First Aid / CPR Certification": "e.g. St John Ambulance First Aid Certificate",
  "Higher Diploma in Sports Coaching": "e.g. Higher Diploma in Sports Coaching, VTC",
  "Culinary Diploma": "e.g. Diploma in Culinary Arts, ICI Hong Kong",
  "City & Guilds Food & Beverage": "e.g. City & Guilds Level 2 Food & Beverage",
  "WSET (Wine & Spirit Education Trust)": "e.g. WSET Level 3 Award in Wines",
  "Food Hygiene / Safety Certificate": "e.g. Basic Food Hygiene Certificate, FEHD",
  "Trade Test Certificate (VTC)": "e.g. Trade Test in Western Cuisine, VTC",
  "Putonghua Proficiency Test": "e.g. Putonghua Proficiency Test Grade 2 Level 1",
  "HKSMF Certificate": "e.g. HKSMF Gold Award, Piano",
  "Music Degree / Diploma": "e.g. Bachelor of Music, HKAPA",
  "BTEC Art & Design": "e.g. BTEC Level 3 Art & Design, Distinction",
  "Art Foundation Diploma": "e.g. Art Foundation Diploma, HKDI",
  "Fine Arts Degree": "e.g. Bachelor of Fine Arts, CUHK",
  Other: "Please describe your qualification",
};

export type QualFieldKind = "dropdown" | "ielts" | "freetext" | "none";

/** Which Field 2 (Detail) control a chosen qualification type renders. */
export function qualDetailKind(type?: string): QualFieldKind {
  if (!type) return "none";
  if (type === QUAL_IELTS_TYPE) return "ielts";
  if (QUAL_DETAIL_OPTS[type]) return "dropdown";
  if (QUAL_FREETEXT_PLACEHOLDERS[type]) return "freetext";
  return "none";
}
