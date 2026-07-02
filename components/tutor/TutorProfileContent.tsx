/**
 * Shared tutor-profile content — header + bio/feed body + WhatsApp/WeChat contact.
 *
 * Extracted from `TutorProfileView` so the same fetch + `ProfileBody` layout +
 * contact buttons back BOTH:
 *   - the in-shell overlay (`TutorProfileView`, tutor app) and
 *   - the standalone public route (`app/tutors/[slug].tsx`, seeker side).
 *
 * The only things that differ between the two are the back behaviour and the
 * action row below the contact buttons (Connect/Message for the tutor overlay,
 * Save for the seeker route) — both passed in by the wrapper. Everything that
 * touches real data (the `getTutor` fetch, the sample-data fallback, and the
 * WhatsApp/WeChat deep-link logic) lives here, single-sourced.
 */
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProfileBody, EMPTY_EDU, type ProfileBodyData } from "./ProfileBody";
import { mapTutorToProfileBody } from "./profileMapping";
import { TutorPostFeed } from "./TutorPostFeed";
import { C, lookupTutor, type FullTutor } from "./tutorData";
import { copyText, notifySuccess, tapLight, tapMedium } from "../ui/feedback";
import { type FormatId } from "../onboarding/PreferencesScreen";
import { getTutor, recordProfileView, startConversation } from "../../lib/api";
import { useSeekerContactGate } from "../match/useSeekerContactGate";
import { useSavedTutors } from "../seeker/savedTutors";

// Sample tutor (FullTutor) → a thin ProfileBodyData for the offline / sample-id
// fallback. Real tutors (a real slug) get the full profile from the backend.
function sampleToBody(t: FullTutor): ProfileBodyData {
  const format: FormatId = t.mode === "f2f" ? "in_person" : t.mode === "online" ? "online" : "both";
  const gender = t.gender === "boy" ? "male" : t.gender === "girl" ? "female" : "lgbt";
  return {
    fullName: t.name,
    gender,
    bio: "",
    levels: [],
    interests: [{ catId: "", subId: t.id, label: t.subject, category: t.school }],
    details: {
      [`:${t.id}`]: {
        years: String(t.stats.years),
        pay: t.price,
        format,
        levels: [],
        districts: t.loc ? [t.loc] : [],
        achievements: [],
        experiences: [],
        quals: [],
      },
    },
    langLevels: {},
    eduByLevel: EMPTY_EDU,
  };
}

export function TutorProfileContent({
  id,
  onBack,
  actions,
  contactMode = "tutor",
}: {
  /** Tutor slug (real) or a sample tutor id (falls back to sample data). */
  id: string;
  onBack: () => void;
  /** Action row rendered below the contact buttons (e.g. Connect/Message, Save). */
  actions?: ReactNode;
  /**
   * "seeker" (public route) applies the one-tutor-at-a-time contact flow + hides
   * WhatsApp/WeChat for free-tier tutors; "tutor" (in-shell overlay) is direct.
   */
  contactMode?: "seeker" | "tutor";
}) {
  const [data, setData] = useState<ProfileBodyData | null>(null);
  const [name, setName] = useState("");
  // The real slug when the backend fetch succeeds; null for the sample-data
  // fallback (sample tutors have no real posts to show or like).
  const [postsSlug, setPostsSlug] = useState<string | null>(null);
  // Who the in-app "Message" button starts a chat with (the tutor's profile id).
  const [chatTarget, setChatTarget] = useState<{ id: string; name: string } | null>(null);
  const [contact, setContact] = useState<{ whatsapp: string | null; wechat: string | null }>({
    whatsapp: null,
    wechat: null,
  });
  const [loading, setLoading] = useState(true);

  // Seeker contact flow (only in "seeker" mode): one tutor at a time + a confirm,
  // and WhatsApp/WeChat gated behind the VIEWED tutor's real tier (free hides them).
  // The confirm/check-in gate is shared with the Saved tab via useSeekerContactGate.
  const { requestContact, modals: contactModals } = useSeekerContactGate();
  // Seeker saved store (shared with the wrapper's bottom "Save tutor" bar and the
  // Saved tab), keyed by slug. Only surfaced via the header button in seeker mode.
  const { ids: savedIds, toggle: toggleSaved } = useSavedTutors();
  const saved = savedIds.has(id);
  const [viewedTier, setViewedTier] = useState<"free" | "premium" | "deluxe">("free");
  const showOffApp = contactMode === "tutor" || viewedTier !== "free";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTutor(id)
      .then((tutor) => {
        if (cancelled) return;
        setData(mapTutorToProfileBody(tutor));
        setName(tutor.slug ?? id);
        setPostsSlug(tutor.slug ?? id);
        setChatTarget(tutor.id ? { id: tutor.id, name: tutor.slug ?? id } : null);
        setContact({ whatsapp: tutor.whatsapp_number ?? null, wechat: tutor.wechat_id ?? null });
        setViewedTier(tutor.tier ?? "free");
        // Record this view so the tutor's "who viewed your profile" list fills up
        // (best-effort, no-op offline / for sample tutors).
        void recordProfileView(tutor.slug ?? id);
      })
      .catch(() => {
        if (cancelled) return;
        const sample = lookupTutor(id);
        setData(sampleToBody(sample));
        setName(sample.username);
        setPostsSlug(null); // sample fallback — no real posts
        setChatTarget(null); // sample fallback — no real account to message
        setContact({ whatsapp: null, wechat: null }); // sample tutors have no real contact
        setViewedTier("free");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // WhatsApp opens a pre-filled chat; WeChat has no deep link, so we copy the ID
  // to the clipboard and confirm it.
  const openWhatsApp = () => {
    if (!contact.whatsapp) return;
    tapMedium();
    const digits = contact.whatsapp.replace(/\D/g, "");
    if (!digits) return;
    const subject = data?.interests?.[0]?.label;
    const msg = `Hi, I found you on LearnSum and I'm interested in tutoring${subject ? ` for ${subject}` : ""}.`;
    Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`).catch(() => {});
  };
  const showWeChat = async () => {
    if (!contact.wechat) return;
    tapMedium();
    const ok = await copyText(contact.wechat);
    if (ok) notifySuccess();
    Alert.alert(
      "WeChat",
      ok
        ? `Copied "${contact.wechat}" — open WeChat and add this ID.`
        : `Add this tutor on WeChat:\n\n${contact.wechat}`,
      [{ text: "Done" }],
    );
  };
  // Start (or reopen) an in-app chat with this tutor, then open the thread.
  const onMessage = async () => {
    if (!chatTarget) return;
    tapMedium();
    try {
      const { id: convId } = await startConversation(chatTarget.id);
      router.push({ pathname: "/messages/[id]", params: { id: convId, name: chatTarget.name, otherId: chatTarget.id } });
    } catch {
      Alert.alert("Messaging", "Please log in to message this tutor.");
    }
  };

  // Perform the chosen contact action (after any confirm/check-in has cleared).
  const runAction = (a: "whatsapp" | "wechat" | "message") => {
    if (a === "whatsapp") openWhatsApp();
    else if (a === "wechat") void showWeChat();
    else void onMessage();
  };

  // Seeker taps a contact button: enforce one-tutor-at-a-time via the shared gate
  // (confirm + resolve-previous check-in). Tutor mode is direct.
  const handleContact = (a: "whatsapp" | "wechat" | "message") => {
    if (contactMode !== "seeker") return runAction(a);
    requestContact(id, name || id, () => runAction(a));
  };

  return (
    <>
      <View style={styles.head}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Text style={styles.headTitle} numberOfLines={1}>
          {name || id}
        </Text>
        {contactMode === "seeker" ? (
          <View style={styles.headActions}>
            {chatTarget ? (
              <Pressable
                onPress={() => handleContact("message")}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Message this tutor"
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={C.ink} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                tapLight();
                toggleSaved(id);
              }}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={saved ? "Saved" : "Save tutor"}
            >
              <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={22} color={saved ? C.green : C.ink} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.iconBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={C.ink} />
          </Pressable>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && !data ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={C.green} />
          </View>
        ) : data ? (
          <>
            <ProfileBody data={data} />
            {showOffApp && (contact.whatsapp || contact.wechat) ? (
              <View style={styles.contactRow}>
                {contact.whatsapp ? (
                  <Pressable
                    style={[styles.contactBtn, styles.whatsappBtn]}
                    onPress={() => handleContact("whatsapp")}
                    accessibilityRole="button"
                    accessibilityLabel="Message on WhatsApp"
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                    <Text style={styles.contactBtnText}>WhatsApp</Text>
                  </Pressable>
                ) : null}
                {contact.wechat ? (
                  <Pressable
                    style={[styles.contactBtn, styles.wechatBtn]}
                    onPress={() => handleContact("wechat")}
                    accessibilityRole="button"
                    accessibilityLabel="Show WeChat ID"
                  >
                    <Ionicons name="logo-wechat" size={18} color="#fff" />
                    <Text style={styles.contactBtnText}>WeChat</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {chatTarget ? (
              <Pressable
                style={styles.messageBtn}
                onPress={() => handleContact("message")}
                accessibilityRole="button"
                accessibilityLabel="Message this tutor in the app"
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                <Text style={styles.messageBtnText}>Message</Text>
              </Pressable>
            ) : null}
            {actions}
            {postsSlug ? <TutorPostFeed slug={postsSlug} /> : null}
          </>
        ) : null}
      </ScrollView>

      {contactModals}
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 4, paddingRight: 10, paddingTop: 2, paddingBottom: 8 },
  headActions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: C.ink },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  loadingWrap: { paddingVertical: 64, alignItems: "center", justifyContent: "center" },
  contactRow: { flexDirection: "row", gap: 9, marginTop: 22 },
  contactBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  contactBtnText: { fontSize: 14.5, fontWeight: "800", color: "#fff" },
  whatsappBtn: { backgroundColor: "#25D366" },
  wechatBtn: { backgroundColor: "#09B83E" },
  messageBtn: {
    height: 46,
    borderRadius: 23,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.green,
  },
  messageBtnText: { fontSize: 14.5, fontWeight: "800", color: "#fff" },
});
