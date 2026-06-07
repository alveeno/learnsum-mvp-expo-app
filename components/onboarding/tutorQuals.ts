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
    "HSC",
    "Gaokao",
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

// ---- Academic exam types: Subject dropdown + Grade dropdown -----------------
// Subjects are taken verbatim from learnsum_qualification_subjects.md.
export const EXAM_SUBJECTS: Record<string, string[]> = {
  DSE: [
    "Chinese Language",
    "English Language",
    "Mathematics (Compulsory Part)",
    "Mathematics Extended Part — Module 1: Calculus and Statistics",
    "Mathematics Extended Part — Module 2: Algebra and Calculus",
    "Citizenship and Social Development",
    "Biology",
    "Chemistry",
    "Physics",
    "Combined Science (Biology + Chemistry)",
    "Combined Science (Biology + Physics)",
    "Combined Science (Chemistry + Physics)",
    "Economics",
    "Geography",
    "History",
    "Chinese History",
    "Chinese Literature",
    "Literature in English",
    "Information and Communication Technology (ICT)",
    "Business, Accounting and Financial Studies — Accounting Module",
    "Business, Accounting and Financial Studies — Business Management Module",
  ],
  IB: [
    "Language A: Literature (English)",
    "Language A: Language and Literature (English)",
    "Language A: Literature (Chinese)",
    "Language A: Language and Literature (Chinese)",
    "Language B (English)",
    "Language B (Chinese)",
    "Language Ab Initio (Chinese)",
    "Economics",
    "Geography",
    "History",
    "Philosophy",
    "Psychology",
    "Business Management",
    "Biology",
    "Chemistry",
    "Physics",
    "Computer Science",
    "Environmental Systems and Societies (SL only)",
    "Mathematics: Analysis and Approaches SL (AA SL)",
    "Mathematics: Analysis and Approaches HL (AA HL)",
    "Mathematics: Applications and Interpretation SL (AI SL)",
    "Mathematics: Applications and Interpretation HL (AI HL)",
  ],
  IGCSE: [
    "Mathematics (0580)",
    "Additional Mathematics (0606)",
    "International Mathematics (0607)",
    "English as a First Language (0500)",
    "English as a Second Language (0510 / 0511)",
    "English Literature (0475)",
    "Literature in English (0486)",
    "Chinese as a First Language (0509)",
    "Chinese as a Second Language (0523)",
    "Chinese Literature (0251)",
    "Biology (0610)",
    "Chemistry (0620)",
    "Physics (0625)",
    "Combined Science (0653)",
    "Co-ordinated Sciences (0654) — Double Award",
    "History (0470)",
    "Geography (0460)",
    "Economics (0455)",
    "Accounting (0452)",
    "Business Studies (0450)",
    "Psychology (0478)",
    "Computer Science (0478)",
    "Information and Communication Technology — ICT (0417)",
  ],
  "A-Level": [
    "Mathematics",
    "Further Mathematics",
    "Statistics (standalone AS)",
    "English Language",
    "English Literature",
    "English Language and Literature",
    "Literature in English",
    "Chinese Language",
    "Mandarin Chinese",
    "Biology",
    "Chemistry",
    "Physics",
    "History",
    "Geography",
    "Economics",
    "Psychology",
    "Business Studies",
    "Accounting",
    "Sociology",
    "Philosophy",
    "Law",
    "Computer Science",
  ],
  "AP (Advanced Placement)": [
    "AP Calculus AB",
    "AP Calculus BC",
    "AP Precalculus",
    "AP Statistics",
    "AP English Language and Composition",
    "AP English Literature and Composition",
    "AP Biology",
    "AP Chemistry",
    "AP Physics 1: Algebra-Based",
    "AP Physics 2: Algebra-Based",
    "AP Physics C: Mechanics",
    "AP Physics C: Electricity and Magnetism",
    "AP Environmental Science",
    "AP World History: Modern",
    "AP United States History",
    "AP European History",
    "AP Human Geography",
    "AP Macroeconomics",
    "AP Microeconomics",
    "AP Psychology",
    "AP Comparative Government and Politics",
    "AP United States Government and Politics",
    "AP Computer Science A",
    "AP Computer Science Principles",
    "AP Cybersecurity",
    "AP Business with Personal Finance",
    "AP Chinese Language and Culture",
  ],
  HSC: [
    "Mathematics Standard 2",
    "Mathematics Advanced",
    "Mathematics Extension 1",
    "Mathematics Extension 2 (Year 12 only)",
    "English Standard",
    "English Advanced",
    "English Extension 1",
    "English Extension 2 (Year 12 only)",
    "English Studies",
    "English EAL/D (English as an Additional Language or Dialect)",
    "Biology",
    "Chemistry",
    "Physics",
    "Earth and Environmental Science",
    "Investigating Science",
    "Science Extension (Year 12 only)",
    "Modern History",
    "Ancient History",
    "History Extension (Year 12 only)",
    "Geography",
    "Economics",
    "Business Studies",
    "Legal Studies",
    "Psychology (via Society and Culture or standalone where offered)",
    "Software Engineering",
    "Information Processes and Technology (IPT)",
  ],
  Gaokao: [
    "Chinese Language and Literature (语文)",
    "Mathematics (数学)",
    "Foreign Language — English (外语)",
    "Physics (物理)",
    "Chemistry (化学)",
    "Biology (生物)",
    "History (历史)",
    "Geography (地理)",
    "Political Science / Ethics (政治)",
  ],
};

export const EXAM_GRADES: Record<string, string[]> = {
  DSE: ["5**", "5*", "5", "4", "3", "2", "1"],
  IB: ["7", "6", "5", "4", "3", "2", "1"],
  IGCSE: ["A*", "A", "B", "C", "D", "E", "F", "G"],
  "A-Level": ["A*", "A", "B", "C", "D", "E"],
  "AP (Advanced Placement)": ["5", "4", "3", "2", "1"],
  HSC: ["Band 6", "Band 5", "Band 4", "Band 3", "Band 2", "Band 1"],
  Gaokao: ["90%+", "80–89%", "70–79%", "60–69%", "Below 60%"],
};

// Academic, non-exam types: free-text subject + free-text grade.
const DEGREE_TYPES = new Set([
  "University Course",
  "Degree",
  "Postgraduate Degree",
  "Professional Certification",
]);

export type QualFieldKind =
  | "exam"
  | "degree"
  | "dropdown"
  | "ielts"
  | "freetext"
  | "none";

/** Which Field 2 control a chosen qualification type renders. */
export function qualDetailKind(type?: string): QualFieldKind {
  if (!type) return "none";
  if (EXAM_SUBJECTS[type]) return "exam";
  if (DEGREE_TYPES.has(type)) return "degree";
  if (type === QUAL_IELTS_TYPE) return "ielts";
  if (QUAL_DETAIL_OPTS[type]) return "dropdown";
  if (QUAL_FREETEXT_PLACEHOLDERS[type]) return "freetext";
  return "none";
}
