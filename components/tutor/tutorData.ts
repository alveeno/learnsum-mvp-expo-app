/**
 * Tutor app — prototype data + design tokens.
 *
 * Ported 1:1 from the Claude Design source (`tutor/tutor-data.js` +
 * `app/tokens.css`). This is sample/placeholder content, NOT a backend shape —
 * the real data will come from `EXPO_PUBLIC_API_URL`.
 *
 * Text is intentionally English-only for this fidelity pass (see CLAUDE.md);
 * UI chrome will be wired into the 3-language `t()` system if we keep these.
 */

/* ===== LearnSum design tokens (mirrors app/tokens.css :root) ===== */
export const C = {
  green: "#2D6A4F", // primary forest green
  greenD: "#235741",
  greenTint: "#E8F1ED",
  gold: "#F4A923", // accent
  goldD: "#D98E0A",
  goldTint: "#FDF3DD",
  bg: "#FFFFFF",
  surface: "#F9F9F7",
  ink: "#16201C", // near-black, warm
  muted: "#6B7280",
  destructive: "#E63946",
  unselBg: "#E5E7EB", // greyed icon background
  unselIc: "#9CA3AF", // greyed icon colour
  hairline: "rgba(60,60,67,0.12)",
} as const;

/** Editorial visual direction: elevated cards on a tinted canvas. */
export const TH = {
  pageBg: C.greenTint,
  cardBg: "#FFFFFF",
  cardRadius: 24,
  cardGap: 16,
  mediaRadius: 18,
  accent: C.greenD,
} as const;

/* ===== avatar helpers (ported from app/data.js) ===== */
const AV_COLORS = [
  "#2D6A4F",
  "#3A86FF",
  "#9B5DE5",
  "#FF6B35",
  "#C1121F",
  "#0096C7",
  "#5F0F40",
  "#1A7431",
  "#C8102E",
  "#6A4C93",
];

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Parse follower counts like "3.2k" -> 3200. */
export function parseK(v: number | string): number {
  if (typeof v === "number") return v;
  const s = String(v).toLowerCase().trim();
  return s.endsWith("k") ? Math.round(parseFloat(s) * 1000) : parseInt(s, 10) || 0;
}

/* ===== types ===== */
export type PostKind = "video" | "image" | "whiteboard" | "quote";
export type Mode = "f2f" | "online" | "both";
export type Gender = "boy" | "girl" | "lgbt";

export type Stats = { rating: number; followers: number | string; years: number; sessions: number };
export type Comment = { who: string; text: string; ago: string; mine?: boolean };

/** One record covers every surface (feed, search, profile, suggestions). */
export type FullTutor = {
  id: string;
  name: string;
  username: string;
  qualified: boolean;
  subject: string;
  school: string;
  loc: string;
  price: number;
  age: number;
  gender: Gender;
  mode: Mode;
  stats: Stats;
  /** Real-data photo hooks. Omitted in sample data → Avatar shows initials.
      A real backend row sets these and the photo renders automatically. */
  avatarUrl?: string;
  post?: { type: string; kind: PostKind; label: string; caption: string; ago: string; mediaUrl?: string };
  counts?: { likes: number; comments: number };
  following?: boolean;
  comments?: Comment[];
  mutual?: number; // suggestions only
};

/** A tutor that definitely has a feed post (the home-feed pool). */
export type Tutor = FullTutor & Required<Pick<FullTutor, "post" | "counts" | "comments">>;

/* The signed-in tutor (Jordan Wei). */
export const ME = {
  id: "me",
  name: "Jordan Wei",
  username: "jordan.wei",
  qualified: true,
  subject: "Mathematics · Physics",
  school: "HKU",
  loc: "Causeway Bay",
  stats: { rating: 4.7, followers: 612, years: 4, sessions: 128 } as Stats,
} as const;

/**
 * Each tutor's `qualified` flag is earned through LearnSum's own qualification-
 * verification flow — NOT a generic "official account" check.
 */
export const TUTORS: Tutor[] = [
  {
    id: "jason",
    name: "Jason Chan",
    username: "coach.jason",
    qualified: true,
    subject: "Basketball Coaching",
    school: "PolyU · Sports Science",
    loc: "Sai Kung",
    price: 450,
    age: 28,
    gender: "boy",
    mode: "f2f",
    stats: { rating: 4.9, followers: "3.2k", years: 5, sessions: 320 },
    post: {
      type: "Highlight reel",
      kind: "video",
      label: "Game highlight reel · 0:42",
      caption:
        "Buzzer-beater from last weekend's div-1 final 🏀 This is the footwork I drill with every student — balance before power. DM to book a trial.",
      ago: "2h",
    },
    counts: { likes: 418, comments: 37 },
    following: false,
    comments: [
      { who: "amelia.reads", text: "That crossover is unreal 🔥", ago: "1h" },
      { who: "marcus.econ", text: "Do you take beginners too?", ago: "1h" },
      { who: "priya.codes", text: "Booked my nephew in. Thanks Jason!", ago: "42m" },
    ],
  },
  {
    id: "chloe",
    name: "Chloe Yip",
    username: "chloe.solves",
    qualified: true,
    subject: "Mathematics",
    school: "HKU · Education",
    loc: "Eastern",
    price: 380,
    age: 25,
    gender: "girl",
    mode: "both",
    stats: { rating: 4.8, followers: "1.8k", years: 3, sessions: 210 },
    post: {
      type: "Student win",
      kind: "image",
      label: "DSE result slip · Maths 5**",
      caption:
        "From a 3 to a 5** in seven months. So proud of Kelly 💚 My method: master the 12 question archetypes, then drill speed. Trial slots open for September.",
      ago: "5h",
      mediaUrl: "https://picsum.photos/seed/learnsum-chloe/800/600",
    },
    counts: { likes: 262, comments: 24 },
    following: true,
    comments: [
      { who: "rachel.chem", text: "Incredible turnaround 👏", ago: "3h" },
      { who: "coach.jason", text: "The archetype method works. Can confirm.", ago: "2h" },
    ],
  },
  {
    id: "rachel",
    name: "Rachel Ho",
    username: "rachel.chem",
    qualified: true,
    subject: "Chemistry",
    school: "HKU · Pharmacy",
    loc: "Wan Chai",
    price: 420,
    age: 27,
    gender: "girl",
    mode: "both",
    stats: { rating: 4.9, followers: "2.4k", years: 4, sessions: 280 },
    post: {
      type: "Teaching method",
      kind: "whiteboard",
      label: "Whiteboard · Mole concept in 3 steps",
      caption:
        "Everyone overcomplicates moles. Here's how I break it down so it never leaves your head again. Save this for your next mock 🧪",
      ago: "1d",
      mediaUrl: "https://picsum.photos/seed/learnsum-rachel/800/600",
    },
    counts: { likes: 511, comments: 63 },
    following: false,
    comments: [
      { who: "ivan.physics", text: "Stealing this for my mechanics intro", ago: "20h" },
      { who: "chloe.solves", text: "So clean. Wish I had this in S5.", ago: "18h" },
    ],
  },
  {
    id: "sophie",
    name: "Sophie Ng",
    username: "sophie.paints",
    qualified: false,
    subject: "Fine Arts",
    school: "HKBU · Fine Arts",
    loc: "Central & Western",
    price: 300,
    age: 31,
    gender: "lgbt",
    mode: "f2f",
    stats: { rating: 4.7, followers: 976, years: 6, sessions: 180 },
    post: {
      type: "Behind the scenes",
      kind: "image",
      label: "Studio shot · watercolour setup",
      caption:
        "Sunday studio reset. Every student gets their own bench and a full palette — no sharing, no rushing. Two evening slots left this term 🎨",
      ago: "1d",
      mediaUrl: "https://picsum.photos/seed/learnsum-sophie/800/600",
    },
    counts: { likes: 188, comments: 15 },
    following: false,
    comments: [{ who: "amelia.reads", text: "The light in here 😍", ago: "22h" }],
  },
  {
    id: "priya",
    name: "Priya Sharma",
    username: "priya.codes",
    qualified: true,
    subject: "Computer Science",
    school: "HKUST · Comp Sci",
    loc: "Sha Tin",
    price: 350,
    age: 24,
    gender: "girl",
    mode: "online",
    stats: { rating: 4.5, followers: "1.1k", years: 2, sessions: 140 },
    post: {
      type: "Project demo",
      kind: "video",
      label: "Screen recording · student game build",
      caption:
        "My S3 student built this platformer in 6 weeks — zero coding before we started. We learn Python by building things you actually want to play.",
      ago: "2d",
    },
    counts: { likes: 204, comments: 29 },
    following: true,
    comments: [{ who: "marcus.econ", text: "This is the way to teach kids to code", ago: "1d" }],
  },
  {
    id: "marcus",
    name: "Marcus Lam",
    username: "marcus.econ",
    qualified: false,
    subject: "Economics",
    school: "CUHK · Economics",
    loc: "Yau Tsim Mong",
    price: 320,
    age: 26,
    gender: "boy",
    mode: "both",
    stats: { rating: 4.6, followers: 842, years: 3, sessions: 160 },
    post: {
      type: "Testimonial",
      kind: "quote",
      label: "Parent testimonial",
      caption:
        '"Marcus turned Econ from Anson\'s worst subject into his best. Predicted grade up two bands." — still grinning about this one. DSE Econ trials open.',
      ago: "3d",
    },
    counts: { likes: 97, comments: 11 },
    following: false,
    comments: [{ who: "chloe.solves", text: "Love a good before/after 📈", ago: "2d" }],
  },
];

/* Stories row (your story is rendered first, separately). */
export const STORIES = ["jason", "chloe", "rachel", "priya", "sophie", "marcus"];

/* "Tutors you may know" suggestion strip. */
export const SUGGEST: FullTutor[] = [
  { id: "ivan", name: "Ivan Wong", username: "ivan.physics", subject: "Physics", school: "HKUST", mutual: 4, qualified: false, loc: "Eastern", price: 360, age: 27, gender: "boy", mode: "online", stats: { rating: 4.5, followers: "1.0k", years: 3, sessions: 150 } },
  { id: "amelia", name: "Amelia Fung", username: "amelia.reads", subject: "English", school: "HKU", mutual: 7, qualified: true, loc: "Wan Chai", price: 400, age: 30, gender: "girl", mode: "both", stats: { rating: 4.8, followers: "2.1k", years: 5, sessions: 260 } },
  { id: "kevin", name: "Kevin Tsang", username: "kevin.chinese", subject: "Chinese", school: "EdUHK", mutual: 2, qualified: false, loc: "Sham Shui Po", price: 280, age: 29, gender: "boy", mode: "f2f", stats: { rating: 3.9, followers: 640, years: 2, sessions: 90 } },
  { id: "megan", name: "Megan Lau", username: "megan.bio", subject: "Biology", school: "CUHK", mutual: 5, qualified: false, loc: "Tai Po", price: 340, age: 28, gender: "girl", mode: "both", stats: { rating: 4.4, followers: 880, years: 3, sessions: 170 } },
];

/* Extra searchable tutors (TUTORS ONLY — no parents/students). */
const EXTRA: FullTutor[] = [
  { id: "daniel", name: "Daniel Cheung", username: "daniel.english", subject: "English", school: "CityU · Translation", loc: "Kowloon City", qualified: false, price: 260, age: 32, gender: "lgbt", mode: "online", stats: { rating: 4.2, followers: 520, years: 2, sessions: 110 } },
  { id: "oscar", name: "Oscar Tang", username: "oscar.maths", subject: "Mathematics", school: "PolyU · Engineering", loc: "Sha Tin", qualified: false, price: 240, age: 23, gender: "boy", mode: "f2f", stats: { rating: 4.1, followers: 430, years: 1, sessions: 70 } },
];

/** Full searchable directory across every pool. */
export const DIRECTORY: FullTutor[] = [...TUTORS, ...SUGGEST, ...EXTRA];

const POOL: Record<string, FullTutor> = {};
[...DIRECTORY, ME as unknown as FullTutor].forEach((t) => {
  POOL[t.id] = t;
});

/** Lookup any tutor by id across all pools (falls back to ME). */
export function lookupTutor(id: string): FullTutor {
  return POOL[id] ?? (ME as unknown as FullTutor);
}

/** Lookup a home-feed tutor (one with a post) by id. */
export function tutorById(id: string): Tutor | undefined {
  return TUTORS.find((t) => t.id === id);
}

/* ===== HK regions / districts (matches the onboarding location picker) ===== */
export const REGIONS = [
  { id: "hki", label: "HK Island", districts: ["Central & Western", "Eastern", "Southern", "Wan Chai"] },
  { id: "kln", label: "Kowloon", districts: ["Yau Tsim Mong", "Sham Shui Po", "Kowloon City", "Wong Tai Sin", "Kwun Tong"] },
  { id: "nt", label: "New Terr.", districts: ["Kwai Tsing", "Tsuen Wan", "Tuen Mun", "Yuen Long", "North", "Tai Po", "Sha Tin", "Sai Kung", "Islands"] },
];

/** First Chinese character per district (same glyphs as onboarding). */
export const DISTRICT_ZH: Record<string, string> = {
  "Central & Western": "中",
  Eastern: "東",
  Southern: "南",
  "Wan Chai": "灣",
  "Yau Tsim Mong": "油",
  "Sham Shui Po": "深",
  "Kowloon City": "九",
  "Wong Tai Sin": "黃",
  "Kwun Tong": "觀",
  "Kwai Tsing": "葵",
  "Tsuen Wan": "荃",
  "Tuen Mun": "屯",
  "Yuen Long": "元",
  North: "北",
  "Tai Po": "大",
  "Sha Tin": "沙",
  "Sai Kung": "西",
  Islands: "離",
};

export const GENDERS: { v: Gender; label: string }[] = [
  { v: "boy", label: "Male" },
  { v: "girl", label: "Female" },
  { v: "lgbt", label: "LGBT+" },
];

/** Bounds for the range sliders. */
export const BOUNDS = { price: [100, 1000] as [number, number], age: [18, 65] as [number, number] };

/* ===== Chat: parents/students who reached out to the signed-in tutor ===== */
export type ChatMsg = { me: boolean; text: string; time: string };
export type Chat = { id: string; who: string; sub: string; last: string; time: string; unread: number; thread: ChatMsg[] };

export const CHATS: Chat[] = [
  {
    id: "chan",
    who: "Mrs. Chan",
    sub: "Maths · Emma (P3)",
    last: "Could we try a trial this Saturday morning?",
    time: "9:41 AM",
    unread: 2,
    thread: [
      { me: false, text: "Hi Jordan, I found your profile through a friend. Emma needs help with P3 maths.", time: "9:20 AM" },
      { me: true, text: "Hi Mrs. Chan! Happy to help — I have weekend morning slots open.", time: "9:34 AM" },
      { me: false, text: "Could we try a trial this Saturday morning?", time: "9:41 AM" },
    ],
  },
  {
    id: "lau",
    who: "Mr. Lau",
    sub: "Physics · self (S5)",
    last: "Great, see you Thursday 7:30.",
    time: "Yesterday",
    unread: 0,
    thread: [
      { me: false, text: "Interested in DSE physics tutoring for my son.", time: "Mon" },
      { me: true, text: "Sure — Thursday evenings work. Shall we start this week?", time: "Mon" },
      { me: false, text: "Great, see you Thursday 7:30.", time: "Yesterday" },
    ],
  },
  {
    id: "wong",
    who: "Ms. Wong",
    sub: "Maths · Lucas (S1)",
    last: "Thank you! Will confirm with you tonight.",
    time: "Tue",
    unread: 0,
    thread: [
      { me: false, text: "Do you cover S1 maths? Lucas is struggling with algebra.", time: "Tue" },
      { me: true, text: "Yes, algebra foundations are my favourite to teach. I'll send a plan.", time: "Tue" },
      { me: false, text: "Thank you! Will confirm with you tonight.", time: "Tue" },
    ],
  },
];

/* ===== Analytics (premium) ===== */
export const ANALYTICS = {
  profileViews: 1284,
  viewsDelta: "+18%",
  postReach: "9.6k",
  reachDelta: "+32%",
  newFollowers: 146,
  followersDelta: "+12%",
  spark: [28, 34, 30, 46, 42, 58, 64, 60, 78, 72, 90, 86],
  topPost: { label: "DSE result slip · Maths 5**", views: "4.2k", likes: 262 },
  viewers: [
    { who: "Mrs. Chan", note: "Parent · looked at your profile twice", ago: "2h" },
    { who: "coach.jason", note: "Tutor · viewed your Maths post", ago: "5h" },
    { who: "Mr. Lau", note: "Parent · saved your profile", ago: "1d" },
    { who: "priya.codes", note: "Tutor · viewed 3 of your posts", ago: "1d" },
  ],
};

/* Profile tab: posts you've liked. */
export const LIKED = ["chloe", "priya"];
