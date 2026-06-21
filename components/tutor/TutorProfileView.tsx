/**
 * Tutor app — viewing ANOTHER tutor's profile (overlay).
 *
 * Opened from the feed, search results, and the suggestions strip; replaces the
 * tab content while the bottom tab bar stays visible. Now renders the shared
 * `ProfileBody` (same rich layout as the own Profile tab + onboarding review),
 * fed by `GET /api/tutors/[slug]`.
 *
 * The lists that open this still pass sample tutor ids (the real tutor lists
 * aren't wired yet), so a failed fetch falls back to mapping the sample tutor —
 * the screen always shows something. The Connect/Message buttons are the
 * existing prototype actions; the real WhatsApp/IG/WeChat contact buttons are
 * still → Todo (contact info isn't collected yet).
 */
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { FollowBtn } from "./feedUi";
import { ProfileBody, EMPTY_EDU, type ProfileBodyData } from "./ProfileBody";
import { mapTutorToProfileBody } from "./profileMapping";
import { C, lookupTutor, type FullTutor } from "./tutorData";
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

export function TutorProfileView({
  id,
  connected,
  onConnect,
  onBack,
}: {
  /** Tutor slug (real) or a sample tutor id (falls back to sample data). */
  id: string;
  connected: boolean;
  onConnect: () => void;
  onBack: () => void;
}) {
  const [data, setData] = useState<ProfileBodyData | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTutor(id)
      .then((tutor) => {
        if (cancelled) return;
        setData(mapTutorToProfileBody(tutor));
        setName(tutor.slug ?? id);
      })
      .catch(() => {
        if (cancelled) return;
        const sample = lookupTutor(id);
        setData(sampleToBody(sample));
        setName(sample.username);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

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
            <View style={styles.actionRow}>
              <View style={{ flex: 1 }}>
                <FollowBtn following={connected} onToggle={onConnect} />
              </View>
              <Pressable style={styles.messageBtn}>
                <Ionicons name="chatbubble-outline" size={16} color={C.ink} />
                <Text style={styles.messageText}>Message</Text>
              </Pressable>
            </View>
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
  actionRow: { flexDirection: "row", gap: 9, marginTop: 22 },
  messageBtn: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: C.hairline,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  messageText: { fontSize: 13.5, fontWeight: "700", color: C.ink },
});
