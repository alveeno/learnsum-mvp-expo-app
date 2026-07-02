/**
 * Tutor app — ANALYTICS.
 *
 * Open to ALL tiers now (no paywall/blur). The headline is a full-width "Profile
 * views" banner (total + seeker/tutor breakdown) that taps into the real
 * profile-viewers list (`/profile-viewers`); below it is the reach/post
 * dashboard. Viewer NAMES are the only tier-gated bit — Deluxe sees them, Free/
 * Premium see them blurred (in the list + on the seeker profile). The dashboard
 * numbers are still a front-end mock (payments/real metrics are on the Todo list).
 */
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { MediaSlot } from "./feedUi";
import { SAMPLE_VIEWERS } from "./sampleSeekers";
import { ANALYTICS, C } from "./tutorData";
import { getProfileViewers, type ProfileViewersResult } from "../../lib/api";

function StatCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  const up = delta.startsWith("+");
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 12, color: C.muted, fontWeight: "600" }}>{label}</Text>
      <Text style={{ fontSize: 26, fontWeight: "800", letterSpacing: -0.6, marginVertical: 4, color: C.ink }}>{value}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        <Ionicons name={up ? "trending-up" : "trending-down"} size={15} color={up ? C.green : C.destructive} />
        <Text style={{ fontSize: 12, fontWeight: "700", color: up ? C.green : C.destructive }}>{delta} this month</Text>
      </View>
    </View>
  );
}

function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 5, height: 88, paddingVertical: 2 }}>
      {data.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
            backgroundColor: i === data.length - 1 ? C.green : C.greenTint,
          }}
        />
      ))}
    </View>
  );
}

function AnalyticsBody() {
  const a = ANALYTICS;
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <StatCard label="Profile views" value={a.profileViews.toLocaleString()} delta={a.viewsDelta} />
        <StatCard label="Post reach" value={a.postReach} delta={a.reachDelta} />
      </View>

      <View style={styles.panel}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <Text style={{ fontSize: 14.5, fontWeight: "700", color: C.ink }}>Profile views</Text>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.green }}>{a.followersDelta} followers</Text>
        </View>
        <Spark data={a.spark} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={styles.axis}>Jan</Text>
          <Text style={styles.axis}>Jun</Text>
        </View>
      </View>

      <View>
        <Text style={styles.label}>Top performing post</Text>
        <View style={[styles.panel, { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, marginTop: 9 }]}>
          <View style={{ width: 56 }}>
            <MediaSlot label="" kind="image" height={56} radius={12} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13.5, fontWeight: "700", color: C.ink }} numberOfLines={1}>
              {a.topPost.label}
            </Text>
            <Text style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
              {a.topPost.views} views · {a.topPost.likes} likes
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Combined "Profile views" banner — total views + the seeker/tutor split, tappable
 * into the real profile-viewers list. Shown to every tier (no locked state).
 */
function ProfileViewsBanner() {
  const [res, setRes] = useState<ProfileViewersResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfileViewers()
      .then((r) => {
        if (!cancelled) setRes(r);
      })
      .catch(() => {
        // Offline / endpoint not built — sample counts (name-blur is local by tier).
        if (!cancelled) {
          const seekerCount = SAMPLE_VIEWERS.length;
          const tutorCount = 2;
          setRes({ tier: "free", count: seekerCount + tutorCount, seekerCount, tutorCount, viewers: SAMPLE_VIEWERS });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const seekerCount = res?.seekerCount ?? 0;
  const tutorCount = res?.tutorCount ?? 0;
  const total = seekerCount + tutorCount || res?.count || 0;

  return (
    <Pressable style={styles.banner} onPress={() => router.push("/profile-viewers" as Href)}>
      <View style={styles.bannerTop}>
        <View style={styles.bannerIcon}>
          <Ionicons name="eye-outline" size={20} color={C.green} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.bannerLabel}>Profile views</Text>
          {res === null ? (
            <ActivityIndicator color={C.green} style={{ alignSelf: "flex-start", marginTop: 6 }} />
          ) : (
            <Text style={styles.bannerNum}>{total.toLocaleString()}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={C.unselIc} />
      </View>

      {res !== null ? (
        <Text style={styles.bannerCounts}>
          <Text style={styles.bannerCountsNum}>{seekerCount}</Text> {seekerCount === 1 ? "seeker" : "seekers"}
          {"   ·   "}
          <Text style={styles.bannerCountsNum}>{tutorCount}</Text> {tutorCount === 1 ? "tutor" : "tutors"}
        </Text>
      ) : null}

      <View style={styles.bannerHintRow}>
        <Ionicons name="people-outline" size={14} color={C.green} />
        <Text style={styles.bannerHint}>Tap to see who viewed you</Text>
      </View>
    </Pressable>
  );
}

export function AnalyticsScreen() {
  return (
    <>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 26, fontWeight: "800", letterSpacing: -0.6, color: C.ink }}>Analytics</Text>
          <Text style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>
            Who viewed you, and how your posts perform.
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <ProfileViewsBanner />
        <AnalyticsBody />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 2, paddingBottom: 12 },
  statCard: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: 16, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 13 },
  panel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: 16, padding: 15 },
  axis: { fontSize: 10.5, color: C.unselIc, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3, color: C.muted, textTransform: "uppercase" },

  banner: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: 18, padding: 16, marginBottom: 18 },
  bannerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  bannerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.greenTint, alignItems: "center", justifyContent: "center" },
  bannerLabel: { fontSize: 12, color: C.muted, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase" },
  bannerNum: { fontSize: 30, fontWeight: "800", letterSpacing: -0.8, color: C.ink, marginTop: 1 },
  bannerCounts: { fontSize: 14, color: C.muted, fontWeight: "600", marginTop: 12 },
  bannerCountsNum: { color: C.ink, fontWeight: "800" },
  bannerHintRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.hairline },
  bannerHint: { fontSize: 13, fontWeight: "700", color: C.green },
});
