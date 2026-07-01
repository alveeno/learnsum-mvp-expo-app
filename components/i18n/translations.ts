/**
 * App translations.
 *
 * One entry per user-facing phrase, each with all three languages. Screens never
 * hardcode visible text — they call `t("some.key")` (see LanguageProvider), which
 * returns the phrase for the currently-selected language.
 *
 * The Chinese here is a first draft for review. Add new keys as each screen is
 * swept; the `satisfies` check below forces every entry to provide all three
 * languages, so nothing can be half-translated by accident.
 *
 * Deferred (a later content pass — see the Todo in CLAUDE.md): content lists
 * (subject names, district names, etc.). Those use this exact same mechanism —
 * just more keys.
 */

export type Lang = "en" | "zh-Hant" | "zh-Hans";

/** Languages shown in the picker, in display order. */
export const LANGUAGES: { id: Lang; label: string; native: string }[] = [
  { id: "en", label: "English", native: "" },
  { id: "zh-Hant", label: "Traditional Chinese", native: "繁體中文" },
  { id: "zh-Hans", label: "Simplified Chinese", native: "简体中文" },
];

export const DEFAULT_LANG: Lang = "en";

export const translations = {
  // ---- language picker ----
  "lang.title": { en: "Language", "zh-Hant": "語言", "zh-Hans": "语言" },
  "lang.button": {
    en: "Language: {lang}",
    "zh-Hant": "語言：{lang}",
    "zh-Hans": "语言：{lang}",
  },

  // ---- welcome / index ----
  "welcome.tagline": {
    en: "Find the perfect tutor within minutes.",
    "zh-Hant": "幾分鐘內找到最合適的導師。",
    "zh-Hans": "几分钟内找到最合适的导师。",
  },
  "welcome.iAmA": { en: "I AM A...", "zh-Hant": "我是…", "zh-Hans": "我是…" },
  "role.student": { en: "Student", "zh-Hant": "學生", "zh-Hans": "学生" },
  "role.parent": { en: "Parent", "zh-Hant": "家長", "zh-Hans": "家长" },
  "role.tutor": { en: "Tutor", "zh-Hant": "導師", "zh-Hans": "导师" },
  "role.student.desc": {
    en: "I am looking for a tutor to help me learn",
    "zh-Hant": "我想找導師幫助我學習",
    "zh-Hans": "我想找导师帮助我学习",
  },
  "role.parent.desc": {
    en: "I am looking for a tutor for my children",
    "zh-Hant": "我想為孩子尋找導師",
    "zh-Hans": "我想为孩子寻找导师",
  },
  "role.tutor.desc": {
    en: "I want to offer my teaching services",
    "zh-Hant": "我想提供教學服務",
    "zh-Hans": "我想提供教学服务",
  },
  "welcome.member": {
    en: "Already a member?",
    "zh-Hant": "已經是會員？",
    "zh-Hans": "已经是会员？",
  },
  "welcome.login": { en: "Log in now", "zh-Hant": "立即登入", "zh-Hans": "立即登录" },

  // ---- shared ----
  "common.continue": { en: "Continue", "zh-Hant": "繼續", "zh-Hans": "继续" },
  "common.skip": { en: "Skip", "zh-Hant": "略過", "zh-Hans": "跳过" },

  // ---- education levels (shared) ----
  "level.kindergarten": { en: "Kindergarten", "zh-Hant": "幼稚園", "zh-Hans": "幼儿园" },
  "level.primary": { en: "Primary", "zh-Hant": "小學", "zh-Hans": "小学" },
  "level.middle": { en: "Middle School", "zh-Hant": "初中", "zh-Hans": "初中" },
  "level.high": { en: "High School", "zh-Hant": "高中", "zh-Hans": "高中" },
  "level.university": { en: "University", "zh-Hant": "大學", "zh-Hans": "大学" },
  "level.adult": { en: "Adult / Pro", "zh-Hant": "成人／專業", "zh-Hans": "成人／专业" },

  // ---- student: education level ----
  "student.level.title": {
    en: "What's your education level?",
    "zh-Hant": "你的教育程度是？",
    "zh-Hans": "你的教育程度是？",
  },
  "student.level.subtitle": {
    en: "We'll find tutors who specialise in your stage.",
    "zh-Hant": "我們會為你找到專精於該階段的導師。",
    "zh-Hans": "我们会为你找到专精于该阶段的导师。",
  },

  // ---- tutor: teaching levels ----
  "tutor.levels.title": {
    en: "Who do you teach?",
    "zh-Hant": "你教哪些程度？",
    "zh-Hans": "你教哪些程度？",
  },
  "tutor.levels.subtitle": {
    en: "Select all the levels you can teach.",
    "zh-Hant": "選擇你能教授的所有程度。",
    "zh-Hans": "选择你能教授的所有程度。",
  },

  // ---- parent: children ----
  "parent.children.title": { en: "Your children", "zh-Hant": "你的孩子", "zh-Hans": "你的孩子" },
  "parent.children.subtitle": {
    en: "Set each child's education level.",
    "zh-Hant": "設定每位孩子的教育程度。",
    "zh-Hans": "设定每位孩子的教育程度。",
  },
  "parent.children.editLater": {
    en: "You can edit this later.",
    "zh-Hant": "你之後可以修改。",
    "zh-Hans": "你之后可以修改。",
  },
  "parent.children.unit.one": { en: "child", "zh-Hant": "個孩子", "zh-Hans": "个孩子" },
  "parent.children.unit.other": { en: "children", "zh-Hant": "個孩子", "zh-Hans": "个孩子" },
  "parent.child.heading": {
    en: "Child {n}",
    "zh-Hant": "第 {n} 位孩子",
    "zh-Hans": "第 {n} 位孩子",
  },
  "parent.child.nameLabel": {
    en: "CHILD'S NAME",
    "zh-Hant": "孩子的名字",
    "zh-Hans": "孩子的名字",
  },
  "parent.child.required": { en: "Required", "zh-Hant": "必填", "zh-Hans": "必填" },
  "parent.child.namePlaceholder": {
    en: "Enter their name",
    "zh-Hant": "輸入孩子的名字",
    "zh-Hans": "输入孩子的名字",
  },
  "parent.child.ageLabel": {
    en: "CHILD'S AGE",
    "zh-Hant": "孩子的年齡",
    "zh-Hans": "孩子的年龄",
  },
  "parent.child.agePlaceholder": {
    en: "e.g. 9",
    "zh-Hant": "例如 9",
    "zh-Hans": "例如 9",
  },
  "parent.child.optional": { en: "Optional", "zh-Hant": "可選", "zh-Hans": "可选" },

  // ---- skip confirmation ----
  "skip.title": { en: "Skip this step?", "zh-Hant": "略過此步驟？", "zh-Hans": "跳过此步骤？" },
  "skip.message": {
    en: "Skipping this step may reduce the quality of your matches. Are you sure?",
    "zh-Hant": "略過此步驟可能會降低配對的質素。你確定嗎？",
    "zh-Hans": "跳过此步骤可能会降低匹配的质量。你确定吗？",
  },
  "skip.confirm": { en: "Skip anyway", "zh-Hant": "仍然略過", "zh-Hans": "仍然跳过" },
  "skip.cancel": { en: "Go back", "zh-Hant": "返回", "zh-Hans": "返回" },

  // ---- shared chrome ----
  "common.others": { en: "Others", "zh-Hant": "其他", "zh-Hans": "其他" },
  "common.cancel": { en: "Cancel", "zh-Hant": "取消", "zh-Hans": "取消" },
  "common.done": { en: "Done", "zh-Hant": "完成", "zh-Hans": "完成" },
  "common.delete": { en: "Delete", "zh-Hant": "刪除", "zh-Hans": "删除" },

  // ---- category / subcategory selection ----
  "cat.heading.default": {
    en: "What are you interested in?",
    "zh-Hant": "你對甚麼感興趣？",
    "zh-Hans": "你对什么感兴趣？",
  },
  "cat.subtitle.default": {
    en: "Pick a category to explore subjects.",
    "zh-Hant": "選擇一個類別來探索科目。",
    "zh-Hans": "选择一个类别来探索科目。",
  },
  "cat.confirm": { en: "Confirm", "zh-Hant": "確認", "zh-Hans": "确认" },
  "cat.search.placeholder": { en: "Search…", "zh-Hant": "搜尋…", "zh-Hans": "搜索…" },
  "cat.noMatch": {
    en: "Can't find what you're looking for?",
    "zh-Hant": "找不到你想要的嗎？",
    "zh-Hans": "找不到你想要的吗？",
  },
  "cat.suggest": {
    en: "Suggest a new category",
    "zh-Hant": "建議新類別",
    "zh-Hans": "建议新类别",
  },
  "cat.selected.one": {
    en: "{n} subject selected",
    "zh-Hant": "已選 {n} 個科目",
    "zh-Hans": "已选 {n} 个科目",
  },
  "cat.selected.other": {
    en: "{n} subjects selected",
    "zh-Hant": "已選 {n} 個科目",
    "zh-Hans": "已选 {n} 个科目",
  },
  "tutor.cat.heading": {
    en: "What subject would you like to teach?",
    "zh-Hant": "你想教甚麼科目？",
    "zh-Hans": "你想教什么科目？",
  },
  "tutor.cat.subtitle": {
    en: "Select all that applies.",
    "zh-Hant": "選擇所有適用項目。",
    "zh-Hans": "选择所有适用项目。",
  },

  // ---- preferences ----
  "prefs.heading.default": { en: "Your preferences", "zh-Hant": "你的偏好", "zh-Hans": "你的偏好" },
  "prefs.subtitle.default": {
    en: "Help us find you the best matches.",
    "zh-Hant": "讓我們為你找到最合適的配對。",
    "zh-Hans": "让我们为你找到最合适的匹配。",
  },
  "tutor.prefs.heading": {
    en: "Your teaching preferences",
    "zh-Hant": "你的教學偏好",
    "zh-Hans": "你的教学偏好",
  },
  "tutor.prefs.subtitle": {
    en: "Tell students how and what you teach.",
    "zh-Hant": "告訴學生你如何教學以及教授甚麼。",
    "zh-Hans": "告诉学生你如何教学以及教授什么。",
  },
  "prefs.section.format": { en: "LESSON FORMAT", "zh-Hant": "上課形式", "zh-Hans": "上课形式" },
  "format.in_person": { en: "In Person", "zh-Hant": "面授", "zh-Hans": "面授" },
  "format.online": { en: "Online", "zh-Hant": "網上", "zh-Hans": "网上" },
  "format.both": { en: "Both", "zh-Hant": "兩者皆可", "zh-Hans": "两者皆可" },
  "prefs.section.location": { en: "LOCATION", "zh-Hant": "地點", "zh-Hans": "地点" },
  "prefs.section.language": {
    en: "PREFERRED LANGUAGE",
    "zh-Hant": "偏好語言",
    "zh-Hans": "偏好语言",
  },
  "prefs.section.language.tutor": {
    en: "LANGUAGES YOU TEACH",
    "zh-Hant": "你教授的語言",
    "zh-Hans": "你教授的语言",
  },
  "prefs.langHint": {
    en: "Tap a language to set your fluency. Tap again to raise it: Beginner → Intermediate → Advanced → Fluent (one more tap clears it).",
    "zh-Hant": "點按語言以設定流利程度，再次點按可提升：初學 → 中級 → 高級 → 流利（再點一次清除）。",
    "zh-Hans": "点按语言以设定流利程度，再次点按可提升：初学 → 中级 → 高级 → 流利（再点一次清除）。",
  },
  "fluency.beginner": { en: "Beginner", "zh-Hant": "初學", "zh-Hans": "初学" },
  "fluency.intermediate": { en: "Intermediate", "zh-Hant": "中級", "zh-Hans": "中级" },
  "fluency.advanced": { en: "Advanced", "zh-Hant": "高級", "zh-Hans": "高级" },
  "fluency.fluent": { en: "Fluent", "zh-Hant": "流利", "zh-Hans": "流利" },
  "prefs.section.availability": {
    en: "WHEN ARE YOU AVAILABLE?",
    "zh-Hant": "你甚麼時候有空？",
    "zh-Hans": "你什么时候有空？",
  },
  "prefs.slot.scrollStart": {
    en: "Scroll to your start time",
    "zh-Hant": "滑動以選擇開始時間",
    "zh-Hans": "滑动以选择开始时间",
  },
  "prefs.slot.scrollEnd": {
    en: "Scroll to your end time",
    "zh-Hant": "滑動以選擇結束時間",
    "zh-Hans": "滑动以选择结束时间",
  },
  "prefs.slot.review": {
    en: "Review your time slot",
    "zh-Hant": "檢查你的時段",
    "zh-Hans": "检查你的时段",
  },
  "prefs.slot.add": { en: "Add time slot", "zh-Hant": "新增時段", "zh-Hans": "新增时段" },
  "prefs.slot.setStart": { en: "Set Start", "zh-Hant": "設定開始", "zh-Hans": "设定开始" },
  "prefs.slot.setEnd": { en: "Set End", "zh-Hant": "設定結束", "zh-Hans": "设定结束" },
  "prefs.slot.editStart": { en: "Edit Start", "zh-Hant": "修改開始", "zh-Hans": "修改开始" },
  "prefs.slot.editEnd": { en: "Edit End", "zh-Hant": "修改結束", "zh-Hans": "修改结束" },
  "prefs.slot.startAt": { en: "Start: {time}", "zh-Hant": "開始：{time}", "zh-Hans": "开始：{time}" },
  "prefs.slot.applyAll": {
    en: "Apply to all days",
    "zh-Hant": "套用至所有日子",
    "zh-Hans": "应用至所有日子",
  },
  "prefs.slot.clearAll": {
    en: "Clear all days",
    "zh-Hant": "清除所有日子",
    "zh-Hans": "清除所有日子",
  },
  "prefs.sheet.title.tutor": {
    en: "Languages you teach",
    "zh-Hant": "你教授的語言",
    "zh-Hans": "你教授的语言",
  },
  "prefs.sheet.title.add": { en: "Add languages", "zh-Hant": "新增語言", "zh-Hans": "新增语言" },
  "prefs.sheet.search": {
    en: "Search languages…",
    "zh-Hant": "搜尋語言…",
    "zh-Hans": "搜索语言…",
  },

  // ---- shared chrome (review/details) ----
  "common.edit": { en: "Edit", "zh-Hant": "編輯", "zh-Hans": "编辑" },
  "common.confirm": { en: "Confirm", "zh-Hant": "確認", "zh-Hans": "确认" },
  "common.notSet": { en: "Not set", "zh-Hant": "未設定", "zh-Hans": "未设定" },

  // ---- parent: review ----
  "parent.banner": {
    en: "{name} · Child {i} of {n}",
    "zh-Hant": "{name} · 第 {i} 位孩子（共 {n} 位）",
    "zh-Hans": "{name} · 第 {i} 位孩子（共 {n} 位）",
  },
  "parent.review.title": { en: "Review", "zh-Hant": "檢查", "zh-Hans": "检查" },
  "parent.review.subtitle": {
    en: "Check everything looks right. Tap a section to edit it.",
    "zh-Hant": "檢查所有資料是否正確。點按任何部分即可編輯。",
    "zh-Hans": "检查所有资料是否正确。点按任何部分即可编辑。",
  },
  "parent.review.noLevel": { en: "No level", "zh-Hant": "未設定程度", "zh-Hans": "未设定程度" },
  "parent.review.interests": { en: "Interests", "zh-Hant": "興趣", "zh-Hans": "兴趣" },
  "parent.review.preferences": { en: "Preferences", "zh-Hant": "偏好", "zh-Hans": "偏好" },
  "parent.review.format": { en: "Format", "zh-Hant": "形式", "zh-Hans": "形式" },
  "parent.review.location": { en: "Location", "zh-Hant": "地點", "zh-Hans": "地点" },
  "parent.review.languages": { en: "Languages", "zh-Hant": "語言", "zh-Hans": "语言" },
  "parent.review.availability": {
    en: "Availability",
    "zh-Hant": "可上課時間",
    "zh-Hans": "可上课时间",
  },

  // ---- tutor: Strengths & Details ----
  "sd.title": { en: "Strengths & Details", "zh-Hant": "強項與詳情", "zh-Hans": "强项与详情" },
  "sd.subtitle": {
    en: "Add details per subject to improve your matches. You can skip for now.",
    "zh-Hant": "為每個科目新增詳情以提升配對。你可以暫時略過。",
    "zh-Hans": "为每个科目新增详情以提升匹配。你可以暂时跳过。",
  },
  "sd.field.years": { en: "Years of teaching experience", "zh-Hant": "教學年資", "zh-Hans": "教学年资" },
  "sd.field.pay": {
    en: "Preferred pay (HKD/hr)",
    "zh-Hant": "期望時薪（港幣／小時）",
    "zh-Hans": "期望时薪（港币／小时）",
  },
  "sd.field.format": { en: "Lesson format", "zh-Hant": "上課形式", "zh-Hans": "上课形式" },
  "sd.field.location": { en: "Location", "zh-Hant": "上課地區", "zh-Hans": "上课地区" },
  "sd.location.samePrev": {
    en: "Same as previous",
    "zh-Hant": "與上一項相同",
    "zh-Hans": "与上一项相同",
  },
  "sd.field.achievements": { en: "Achievements", "zh-Hant": "成就", "zh-Hans": "成就" },
  "sd.field.experience": { en: "Relevant experience", "zh-Hant": "相關經驗", "zh-Hans": "相关经验" },
  "sd.field.qualifications": { en: "Qualifications", "zh-Hant": "資歷", "zh-Hans": "资历" },
  "sd.add.achievement": { en: "Add achievement", "zh-Hant": "新增成就", "zh-Hans": "新增成就" },
  "sd.add.experience": { en: "Add experience", "zh-Hant": "新增經驗", "zh-Hans": "新增经验" },
  "sd.add.qualification": { en: "Add qualification", "zh-Hant": "新增資歷", "zh-Hans": "新增资历" },
  "sd.seg.duration": { en: "Duration", "zh-Hant": "持續時間", "zh-Hans": "持续时间" },
  "sd.seg.event": { en: "One-off event", "zh-Hant": "單次活動", "zh-Hans": "单次活动" },
  "sd.seg.ongoing": { en: "Ongoing", "zh-Hant": "進行中", "zh-Hans": "进行中" },
  "sd.seg.ended": { en: "Ended", "zh-Hant": "已結束", "zh-Hans": "已结束" },
  "sd.qualHelper": {
    en: "Adding qualifications is strongly recommended — it significantly improves your match quality.",
    "zh-Hant": "強烈建議新增資歷 — 這能大幅提升你的配對質素。",
    "zh-Hans": "强烈建议新增资历 — 这能大幅提升你的匹配质量。",
  },
  "sd.qual.n": { en: "Qualification {n}", "zh-Hant": "資歷 {n}", "zh-Hans": "资历 {n}" },
  "sd.field.subject": { en: "Subject", "zh-Hant": "科目", "zh-Hans": "科目" },
  "sd.field.grade": { en: "Grade", "zh-Hant": "成績", "zh-Hans": "成绩" },
  "sd.field.detail": { en: "Detail", "zh-Hant": "詳情", "zh-Hans": "详情" },
  "sd.select.subject": { en: "Select subject", "zh-Hant": "選擇科目", "zh-Hans": "选择科目" },
  "sd.select.grade": { en: "Select grade", "zh-Hant": "選擇成績", "zh-Hans": "选择成绩" },
  "sd.select.generic": { en: "Select…", "zh-Hant": "選擇…", "zh-Hans": "选择…" },
  "sd.select.test": { en: "Select test", "zh-Hant": "選擇考試", "zh-Hans": "选择考试" },
  "sd.select.qualType": {
    en: "Qualification type",
    "zh-Hant": "資歷類型",
    "zh-Hans": "资历类型",
  },
  "sd.select.year": { en: "Year", "zh-Hant": "年份", "zh-Hans": "年份" },
  "sd.placeholder.degreeSubject": {
    en: "e.g. Computer Science",
    "zh-Hant": "例如：電腦科學",
    "zh-Hans": "例如：计算机科学",
  },
  "sd.placeholder.degreeGrade": {
    en: "e.g. First Class Honours",
    "zh-Hant": "例如：一級榮譽",
    "zh-Hans": "例如：一级荣誉",
  },
  "sd.placeholder.achievement": {
    en: "e.g., HK Maths Olympiad — Gold",
    "zh-Hant": "例如：香港數學奧林匹克 — 金獎",
    "zh-Hans": "例如：香港数学奥林匹克 — 金奖",
  },
  "sd.placeholder.experience": {
    en: "e.g., Learn-to-swim coach",
    "zh-Hant": "例如：游泳教練",
    "zh-Hans": "例如：游泳教练",
  },
  "sd.banner.title": {
    en: "Qualifications recommended for High School + University",
    "zh-Hant": "建議為高中及大學程度提供資歷",
    "zh-Hans": "建议为高中及大学程度提供资历",
  },
  "sd.banner.progress": {
    en: "Completed {completed} / {total} subjects",
    "zh-Hant": "已完成 {completed} / {total} 個科目",
    "zh-Hans": "已完成 {completed} / {total} 个科目",
  },
  "sd.banner.addMissing": {
    en: "Add missing subjects",
    "zh-Hant": "補充缺少的科目",
    "zh-Hans": "补充缺少的科目",
  },
  "sd.modal.title": { en: "Finish later?", "zh-Hant": "稍後完成？", "zh-Hans": "稍后完成？" },
  "sd.modal.text": {
    en: "You can complete this later in your profile.",
    "zh-Hant": "你可以稍後在個人檔案中完成。",
    "zh-Hans": "你可以稍后在个人档案中完成。",
  },
  "sd.modal.addNow": { en: "Add now", "zh-Hant": "立即新增", "zh-Hans": "立即新增" },
  "sd.modal.continueAnyway": {
    en: "Continue anyway",
    "zh-Hant": "仍然繼續",
    "zh-Hans": "仍然继续",
  },
  "sd.review.title": {
    en: "Review your profile",
    "zh-Hant": "檢查你的檔案",
    "zh-Hans": "检查你的档案",
  },
  "sd.review.subtitle": {
    en: "Check everything's right. Tap Edit on a subject to change it.",
    "zh-Hant": "檢查所有資料是否正確。點按科目上的「編輯」即可修改。",
    "zh-Hans": "检查所有资料是否正确。点按科目上的「编辑」即可修改。",
  },
  "sd.review.teaches": { en: "Teaches: ", "zh-Hant": "教授：", "zh-Hans": "教授：" },
  "sd.review.noneAdded": { en: "None added", "zh-Hant": "未新增", "zh-Hans": "未新增" },
  "sd.exp.unnamed": { en: "(unnamed)", "zh-Hant": "（未命名）", "zh-Hans": "（未命名）" },
  "sd.years.one": { en: "{n} year", "zh-Hant": "{n} 年", "zh-Hans": "{n} 年" },
  "sd.years.other": { en: "{n} years", "zh-Hant": "{n} 年", "zh-Hans": "{n} 年" },
  "sd.reminder.multi": {
    en: "You're teaching {n} subjects — open each one and add its details.",
    "zh-Hant": "你正在教授 {n} 個科目 — 請逐一展開並填寫詳情。",
    "zh-Hans": "你正在教授 {n} 个科目 — 请逐一展开并填写详情。",
  },
  "sd.empty.title": {
    en: "Some subjects have no details",
    "zh-Hant": "部分科目尚未填寫詳情",
    "zh-Hans": "部分科目尚未填写详情",
  },
  "sd.empty.text": {
    en: "You haven't added any details for: {subjects}. Go back and fill them in, or continue anyway.",
    "zh-Hant": "你尚未為以下科目填寫任何詳情：{subjects}。請返回填寫，或仍然繼續。",
    "zh-Hans": "你尚未为以下科目填写任何详情：{subjects}。请返回填写，或仍然继续。",
  },
  "sd.empty.goBack": {
    en: "Go back and fill",
    "zh-Hant": "返回填寫",
    "zh-Hans": "返回填写",
  },

  // ---- placeholder (student/parent "you're all set" feed) ----
  "feed.title": { en: "You're all set!", "zh-Hant": "全部完成！", "zh-Hans": "全部完成！" },
  "feed.subtitle": {
    en: "Your home feed of matched tutors will live here. We're still building it — thanks for your patience.",
    "zh-Hant": "你的配對導師主頁將會在這裡顯示。我們仍在建設中，感謝你的耐心。",
    "zh-Hans": "你的匹配导师主页将会在这里显示。我们仍在建设中，感谢你的耐心。",
  },
  "feed.back": { en: "Back to start", "zh-Hant": "返回開始", "zh-Hans": "返回开始" },

  // ---- tutor onboarding: About you ----
  "about.title": { en: "About you", "zh-Hant": "關於你", "zh-Hans": "关于你" },
  "about.subtitle": {
    en: "Tell students and parents who you are — everything here is optional.",
    "zh-Hant": "讓學生和家長認識你——以下全部為選填。",
    "zh-Hans": "让学生和家长认识你——以下全部为选填。",
  },
  "about.name.label": { en: "Your name", "zh-Hant": "你的姓名", "zh-Hans": "你的姓名" },
  "about.name.firstPlaceholder": { en: "First name", "zh-Hant": "名字", "zh-Hans": "名字" },
  "about.name.lastPlaceholder": { en: "Last name", "zh-Hant": "姓氏", "zh-Hans": "姓氏" },
  "about.bio.label": { en: "Bio", "zh-Hant": "個人簡介", "zh-Hans": "个人简介" },
  "about.bio.placeholder": {
    en: "Tell students and parents about your teaching style and what makes you a great tutor…",
    "zh-Hant": "向學生和家長介紹你的教學風格，以及你作為導師的優勢⋯⋯",
    "zh-Hans": "向学生和家长介绍你的教学风格，以及你作为导师的优势⋯⋯",
  },
  "about.contact.label": { en: "How can students reach you?", "zh-Hant": "學生如何聯絡你？", "zh-Hans": "学生如何联系你？" },
  "about.contact.helper": {
    en: "Optional — shown on your profile so students and parents can message you. Add either or both.",
    "zh-Hant": "選填——會顯示在你的檔案，方便學生和家長聯絡你。可填一項或兩項。",
    "zh-Hans": "选填——会显示在你的资料，方便学生和家长联系你。可填一项或两项。",
  },
  "about.contact.whatsapp": { en: "WhatsApp number", "zh-Hant": "WhatsApp 號碼", "zh-Hans": "WhatsApp 号码" },
  "about.contact.whatsappPlaceholder": { en: "e.g. 852 1234 5678", "zh-Hant": "例如 852 1234 5678", "zh-Hans": "例如 852 1234 5678" },
  "about.contact.wechat": { en: "WeChat ID", "zh-Hant": "微信號", "zh-Hans": "微信号" },
  "about.contact.wechatPlaceholder": { en: "Your WeChat ID", "zh-Hant": "你的微信號", "zh-Hans": "你的微信号" },
  "about.gender.label": { en: "Gender", "zh-Hant": "性別", "zh-Hans": "性别" },
  "about.gender.male": { en: "Male", "zh-Hant": "男", "zh-Hans": "男" },
  "about.gender.female": { en: "Female", "zh-Hant": "女", "zh-Hans": "女" },
  "about.gender.lgbtq": { en: "LGBTQ+", "zh-Hant": "LGBTQ+", "zh-Hans": "LGBTQ+" },
  "about.gender.na": { en: "Rather not say", "zh-Hant": "不願透露", "zh-Hans": "不愿透露" },
  "about.edu.label": { en: "Education", "zh-Hant": "學歷", "zh-Hans": "学历" },
  "about.edu.helper": {
    en: "List the schools you attended at each level — add more than one if you switched.",
    "zh-Hant": "列出你在各階段就讀的學校——如有轉校可新增多於一間。",
    "zh-Hans": "列出你在各阶段就读的学校——如有转校可新增多于一间。",
  },
  "about.edu.kindergarten": { en: "Kindergarten", "zh-Hant": "幼稚園", "zh-Hans": "幼儿园" },
  "about.edu.primary": { en: "Primary school", "zh-Hant": "小學", "zh-Hans": "小学" },
  "about.edu.secondary": { en: "Secondary school", "zh-Hant": "中學", "zh-Hans": "中学" },
  "about.edu.university": { en: "University", "zh-Hant": "大學", "zh-Hans": "大学" },
  "about.edu.schoolN": { en: "School {n}", "zh-Hant": "學校 {n}", "zh-Hans": "学校 {n}" },
  "about.edu.addSchool": { en: "Add school", "zh-Hant": "新增學校", "zh-Hans": "新增学校" },
  "about.edu.removeSchoolA11y": {
    en: "Remove school {n}",
    "zh-Hant": "移除學校 {n}",
    "zh-Hans": "移除学校 {n}",
  },
  "about.edu.institution": { en: "School name", "zh-Hant": "學校名稱", "zh-Hans": "学校名称" },

  // ---- tutor onboarding: sign-up / account gate ----
  "signup.title": { en: "Create your account", "zh-Hant": "建立你的帳戶", "zh-Hans": "创建你的账户" },
  "signup.subtitle": {
    en: "Sign up with your email to get started. Already registered? We'll take you to log in.",
    "zh-Hant": "以電郵註冊即可開始。已有帳戶？我們會帶你前往登入。",
    "zh-Hans": "以电邮注册即可开始。已有账户？我们会带你前往登录。",
  },
  "signup.existing": {
    en: "This email already has an account — log in below.",
    "zh-Hant": "此電郵已有帳戶——請在下方登入。",
    "zh-Hans": "此电邮已有账户——请在下方登录。",
  },
  "signup.email": { en: "Email", "zh-Hant": "電郵", "zh-Hans": "电邮" },
  "signup.password": { en: "Password", "zh-Hant": "密碼", "zh-Hans": "密码" },
  "signup.passwordPlaceholder": {
    en: "At least 6 characters",
    "zh-Hant": "至少 6 個字元",
    "zh-Hans": "至少 6 个字符",
  },
  "signup.or": { en: "or sign up with", "zh-Hant": "或使用以下方式註冊", "zh-Hans": "或使用以下方式注册" },
  "signup.showPw": { en: "Show password", "zh-Hant": "顯示密碼", "zh-Hans": "显示密码" },
  "signup.hidePw": { en: "Hide password", "zh-Hant": "隱藏密碼", "zh-Hans": "隐藏密码" },
  "signup.social.google": { en: "Sign up with Google", "zh-Hant": "以 Google 註冊", "zh-Hans": "以 Google 注册" },
  "signup.social.apple": { en: "Sign up with Apple", "zh-Hant": "以 Apple 註冊", "zh-Hans": "以 Apple 注册" },
  "signup.social.microsoft": {
    en: "Sign up with Microsoft",
    "zh-Hant": "以 Microsoft 註冊",
    "zh-Hans": "以 Microsoft 注册",
  },
  "signup.haveAccount": {
    en: "Already have an account?",
    "zh-Hant": "已經有帳戶？",
    "zh-Hans": "已经有账户？",
  },
  "signup.logIn": { en: "Log in", "zh-Hant": "登入", "zh-Hans": "登录" },

  // ---- onboarding complete (shared "Welcome to LearnSum" screen) ----
  "welcomeDone.title": { en: "Welcome to LearnSum", "zh-Hant": "歡迎使用 LearnSum", "zh-Hans": "欢迎使用 LearnSum" },
  "welcomeDone.subtitle": {
    en: "You're all set. Let's get you started.",
    "zh-Hant": "一切準備就緒，開始使用吧。",
    "zh-Hans": "一切准备就绪，开始使用吧。",
  },

  // ---- tutor about: profile photo + required fields ----
  "about.photo.add": { en: "Add profile photo", "zh-Hant": "新增個人相片", "zh-Hans": "添加个人照片" },
  "about.photo.change": { en: "Change photo", "zh-Hant": "更換相片", "zh-Hans": "更换照片" },
  "about.photo.remove": { en: "Remove photo", "zh-Hant": "移除相片", "zh-Hans": "移除照片" },
  "about.photo.library": { en: "Choose from library", "zh-Hant": "從相簿選擇", "zh-Hans": "从相册选择" },
  "about.photo.camera": { en: "Take a photo", "zh-Hant": "拍照", "zh-Hans": "拍照" },
  "about.photo.uploadFailed": { en: "Couldn't upload that photo. Please try again.", "zh-Hant": "無法上載該相片，請再試一次。", "zh-Hans": "无法上传该照片，请再试一次。" },
  "about.requiredHint": {
    en: "Add your first name, last name and gender to continue.",
    "zh-Hant": "請填寫名字、姓氏及性別以繼續。",
    "zh-Hans": "请填写名字、姓氏及性别以继续。",
  },

  // ---- tutor about: searchable school / qualification / score pickers ----
  "about.pick.search": { en: "Search or type…", "zh-Hant": "搜尋或輸入…", "zh-Hans": "搜索或输入…" },
  "about.pick.use": { en: "Use “{q}”", "zh-Hant": "使用「{q}」", "zh-Hans": "使用「{q}」" },
  "about.pick.schoolTitle": {
    en: "Search your school",
    "zh-Hant": "搜尋你的學校",
    "zh-Hans": "搜索你的学校",
  },
  "about.pick.qualTitle": { en: "Qualification", "zh-Hant": "學歷", "zh-Hans": "学历" },
  "about.edu.degreePlaceholder": {
    en: "Degree (e.g. BSc Computer Science)",
    "zh-Hant": "學位（例如電腦科學理學士）",
    "zh-Hans": "学位（例如计算机科学理学士）",
  },
  "about.pick.scoreTitle": { en: "Score / result", "zh-Hant": "成績／等級", "zh-Hans": "成绩／等级" },
  "about.pick.honoursTitle": { en: "Result / honours", "zh-Hant": "成績／榮譽", "zh-Hans": "成绩／荣誉" },
  "about.pick.scoreHint": { en: "Type your score", "zh-Hant": "輸入你的成績", "zh-Hans": "输入你的成绩" },
  "about.status.ongoing": { en: "Currently studying", "zh-Hant": "現正就讀", "zh-Hans": "现正就读" },
  "about.status.finished": { en: "Finished", "zh-Hant": "已畢業", "zh-Hans": "已毕业" },

  // ---- seeker "About you" (student / parent profile) ----
  "seekerAbout.title": { en: "About you", "zh-Hant": "關於你", "zh-Hans": "关于你" },
  "seekerAbout.subtitle": {
    en: "Add a few details so tutors know who they're teaching.",
    "zh-Hant": "填寫一些資料，讓導師了解你。",
    "zh-Hans": "填写一些资料，让导师了解你。",
  },
  "seekerAbout.editTitle": { en: "Edit profile", "zh-Hant": "編輯個人檔案", "zh-Hans": "编辑个人资料" },
  "seekerAbout.phone.label": { en: "Phone number", "zh-Hant": "電話號碼", "zh-Hans": "电话号码" },
  "seekerAbout.phone.placeholder": { en: "e.g. 852 1234 5678", "zh-Hant": "例如 852 1234 5678", "zh-Hans": "例如 852 1234 5678" },
  "seekerAbout.privacy.section": { en: "Privacy", "zh-Hant": "私隱", "zh-Hans": "隐私" },
  "seekerAbout.privacy.visibleQ": { en: "Make your profile visible to all users?", "zh-Hant": "讓所有使用者看到你的個人檔案？", "zh-Hans": "让所有用户看到你的个人资料？" },
  "seekerAbout.privacy.visibleHint": { en: "Students, parents and tutors can find you in search.", "zh-Hant": "學生、家長和導師可以在搜尋中找到你。", "zh-Hans": "学生、家长和导师可以在搜索中找到你。" },
  "seekerAbout.privacy.shareQ": { en: "Include your personal information (age, education, school, name, phone) in your profile?", "zh-Hant": "在個人檔案中包含你的個人資料（年齡、學歷、學校、姓名、電話）？", "zh-Hans": "在个人资料中包含你的个人信息（年龄、学历、学校、姓名、电话）？" },
  "seekerAbout.privacy.shareWarn": { en: "Warning: tutors will not be able to reach you directly through your phone number.", "zh-Hant": "警告：導師將無法透過你的電話號碼直接聯絡你。", "zh-Hans": "警告：导师将无法通过你的电话号码直接联系你。" },
  "seekerAbout.edu.label": { en: "Education level", "zh-Hant": "教育程度", "zh-Hans": "教育程度" },
  "seekerAbout.save": { en: "Save", "zh-Hant": "儲存", "zh-Hans": "保存" },
  "seekerAbout.saveFailed": {
    en: "Couldn't save your changes. Check your connection and try again.",
    "zh-Hant": "無法儲存變更，請檢查網絡後再試。",
    "zh-Hans": "无法保存更改，请检查网络后再试。",
  },

  // ---- auth gate (shown when an unregistered tutor likes / comments / filters) ----
  "authGate.title": { en: "Join LearnSum", "zh-Hant": "加入 LearnSum", "zh-Hans": "加入 LearnSum" },
  "authGate.subtitle": {
    en: "Log in or sign up to like, connect with tutors and use advanced filters.",
    "zh-Hant": "登入或註冊即可讚好、聯繫導師及使用進階篩選。",
    "zh-Hans": "登录或注册即可点赞、联系导师及使用高级筛选。",
  },
  "authGate.signUp": { en: "Sign up", "zh-Hant": "註冊", "zh-Hans": "注册" },
  "authGate.logIn": { en: "Log in", "zh-Hant": "登入", "zh-Hans": "登录" },
} satisfies Record<string, Record<Lang, string>>;

/** Every valid translation key (derived from the dictionary above). */
export type TranslationKey = keyof typeof translations;
