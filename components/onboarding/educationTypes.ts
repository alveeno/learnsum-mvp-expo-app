/**
 * Shared education-history shape, in a dependency-free module so both the UI
 * (EducationSection) and the data modules (seekerProfile / payloads) can import
 * it without pulling in React Native.
 */
export type LevelId = "kindergarten" | "primary" | "secondary" | "university";
export type SchoolEntry = {
  institution: string;
  qualification: string;
  score: string;
  /** true = currently studying here; false = finished (default). */
  ongoing: boolean;
};
export type EduByLevel = Record<LevelId, SchoolEntry[]>;

export const EMPTY_EDU: EduByLevel = { kindergarten: [], primary: [], secondary: [], university: [] };
