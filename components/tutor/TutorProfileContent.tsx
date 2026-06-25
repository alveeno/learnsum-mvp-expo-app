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
import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProfileBody, EMPTY_EDU, type ProfileBodyData } from "./ProfileBody";
import { mapTutorToProfileBody } from "./profileMapping";
import { C, lookupTutor, type FullTutor } from "./tutorData";
import { copyText, notifySuccess, tapMedium } from "../ui/feedback";
import { type FormatId } from "../onboarding/PreferencesScreen";
import { getTutor } from "../../lib/api";

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
}: {
  /** Tutor slug (real) or a sample tutor id (falls back to sample data). */
  id: string;
  onBack: () => void;
  /** Action row rendered below the contact buttons (e.g. Connect/Message, Save). */
  actions?: ReactNode;
}) {
  const [data, setData] = useState<ProfileBodyData | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState<{ whatsapp: string | null; wechat: string | null }>({
    whatsapp: null,
    wechat: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTutor(id)
      .then((tutor) => {
        if (cancelled) return;
        setData(mapTutorToProfileBody(tutor));
        setName(tutor.slug ?? id);
        setContact({ whatsapp: tutor.whatsapp_number ?? null, wechat: tutor.wechat_id ?? null });
      })
      .catch(() => {
        if (cancelled) return;
        const sample = lookupTutor(id);
        setData(sampleToBody(sample));
        setName(sample.username);
        setContact({ whatsapp: null, wechat: null }); // sample tutors have no real contact
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
  const hasContact = !!contact.whatsapp || !!contact.wechat;

  return (
    <>
      <View style={styles.head}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Text style={styles.headTitle} numberOfLines={1}>
          {name || id}
        </Text>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={C.ink} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading && !data ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={C.green} />
          </View>
        ) : data ? (
          <>
            <ProfileBody data={data} />
            {hasContact ? (
              <View style={styles.contactRow}>
                {contact.whatsapp ? (
                  <Pressable
                    style={[styles.contactBtn, styles.whatsappBtn]}
                    onPress={openWhatsApp}
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
                    onPress={showWeChat}
                    accessibilityRole="button"
                    accessibilityLabel="Show WeChat ID"
                  >
                    <Ionicons name="logo-wechat" size={18} color="#fff" />
                    <Text style={styles.contactBtnText}>WeChat</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {actions}
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 4, paddingRight: 10, paddingTop: 2, paddingBottom: 8 },
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
});
