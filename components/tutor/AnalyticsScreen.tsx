/**
 * Tutor app — ANALYTICS (premium).
 *
 * Ported from `tutor/tutor-analytics.jsx`. Front-end only: "Upgrade" flips local
 * state to reveal the dashboard — there is no real payment yet (payments are on
 * the CLAUDE.md Todo list). The locked dashboard is **frosted** with a real
 * `expo-blur` BlurView (was an opacity dim before the native build).
 */
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, MediaSlot } from "./feedUi";
import { SAMPLE_VIEWERS } from "./sampleSeekers";
import { useSavedPeople } from "./savedPeople";
import { ANALYTICS, C } from "./tutorData";
import { SaveButton } from "../seeker/SaveButton";
import { getProfileViewers, type ProfileViewer } from "../../lib/api";

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
 * Profile viewers — the parents/students who opened your profile. FREE (not
 * paywalled): this is the headline feature, the surface where a tutor finds
 * seekers to view, save and (quota permitting) contact. Each row is tappable
 * (→ the seeker profile) with a Save bookmark.
 */
function ProfileViewersSection() {
  const [viewers, setViewers] = useState<ProfileViewer[] | null>(null);
  const { isSaved, toggle } = useSavedPeople();

  useEffect(() => {
    let cancelled = false;
    getProfileViewers()
      .then((list) => {
        if (!cancelled) setViewers(list);
      })
      .catch(() => {
        // Offline / endpoint not built yet — fall back to sample viewers.
        if (!cancelled) setViewers(SAMPLE_VIEWERS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Ionicons name="eye-outline" size={18} color={C.green} />
        <Text style={{ fontSize: 16, fontWeight: "800", color: C.ink }}>Who viewed your profile</Text>
      </View>
      <Text style={{ fontSize: 12.5, color: C.muted, marginBottom: 6 }}>
        Tap a parent or student to see what they&apos;re looking for.
      </Text>
      {viewers === null ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={C.green} />
        </View>
      ) : viewers.length === 0 ? (
        <Text style={{ fontSize: 13.5, color: C.muted, paddingVertical: 14 }}>
          No profile views yet — keep posting to get noticed.
        </Text>
      ) : (
        viewers.map((v) => (
          <Pressable key={v.id} onPress={() => router.push(`/seekers/${v.id}` as Href)} style={styles.viewerRow}>
            <Avatar name={v.name} uri={v.avatar_url ?? undefined} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.ink }} numberOfLines={1}>
                {v.name}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 1 }} numberOfLines={1}>
                {v.note}
              </Text>
            </View>
            <Text style={{ fontSize: 11.5, color: C.unselIc, fontWeight: "600" }}>{v.ago}</Text>
            <SaveButton
              saved={isSaved(v.id)}
              onToggle={() =>
                toggle({ id: v.id, kind: v.role, name: v.name, subtitle: v.note, avatar_url: v.avatar_url })
              }
            />
          </Pressable>
        ))
      )}
    </View>
  );
}

export function AnalyticsScreen({ premium, onUpgrade }: { premium: boolean; onUpgrade: () => void }) {
  return (
    <>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 26, fontWeight: "800", letterSpacing: -0.6, color: C.ink }}>Analytics</Text>
          </View>
          <Text style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>
            Who viewed you, and how your posts perform.
          </Text>
        </View>
        {premium && (
          <View style={styles.premiumBadge}>
            <MaterialIcons name="workspace-premium" size={15} color="#3a2c06" />
            <Text style={{ fontSize: 11.5, fontWeight: "800", color: "#3a2c06" }}>Premium</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* FREE — the headline feature, not behind the paywall. */}
        <ProfileViewersSection />

        {/* The rest of the dashboard stays a premium mock. */}
        <View style={styles.dashboardWrap}>
          <View pointerEvents={premium ? "auto" : "none"}>
            <AnalyticsBody />
          </View>

          {!premium && (
            <>
              {/* Real frosted glass over the locked dashboard. */}
              <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />
              <View style={styles.lockTint} pointerEvents="none" />
              <View style={styles.lockOverlay} pointerEvents="box-none">
                <View style={styles.upgradeCard}>
                  <View style={styles.insightsCircle}>
                    <Ionicons name="stats-chart" size={30} color={C.goldD} />
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.4, color: C.ink }}>Unlock Analytics</Text>
                  <Text style={{ fontSize: 13.5, color: C.muted, lineHeight: 19, textAlign: "center", marginTop: 8, marginBottom: 16 }}>
                    See how each post performs and where your new followers come from.
                  </Text>
                  <View style={{ gap: 9, alignSelf: "stretch", marginBottom: 18 }}>
                    {["Reach & post performance", "Per-post views & saves", "Follower growth trends"].map((feat) => (
                      <View key={feat} style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                        <Ionicons name="checkmark-circle" size={19} color={C.green} />
                        <Text style={{ fontSize: 13.5, fontWeight: "600", color: C.ink }}>{feat}</Text>
                      </View>
                    ))}
                  </View>
                  <Pressable onPress={onUpgrade} style={styles.upgradeBtn}>
                    <LinearGradient
                      colors={["#F6B73C", "#E0941A"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[StyleSheet.absoluteFill, { borderRadius: 25 }]}
                    />
                    <MaterialIcons name="workspace-premium" size={20} color="#3a2c06" />
                    <Text style={{ fontSize: 17, fontWeight: "700", color: "#3a2c06" }}>Upgrade to Premium</Text>
                  </Pressable>
                  <Text style={{ fontSize: 12, color: C.unselIc, marginTop: 10, fontWeight: "600" }}>From $48/mo · cancel anytime</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 2, paddingBottom: 12 },
  premiumBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.gold, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 9 },
  statCard: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: 16, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 13 },
  panel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.hairline, borderRadius: 16, padding: 15 },
  axis: { fontSize: 10.5, color: C.unselIc, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3, color: C.muted, textTransform: "uppercase" },
  viewerRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.hairline },
  dashboardWrap: { position: "relative", borderRadius: 16, overflow: "hidden" },
  // A faint wash above the blur so the upgrade card reads clearly on busy charts.
  lockTint: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(249,249,247,0.45)" },
  lockOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  upgradeCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.hairline,
    padding: 22,
    paddingTop: 26,
    alignItems: "center",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 12,
  },
  insightsCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.goldTint, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, alignSelf: "stretch", borderRadius: 25, backgroundColor: C.gold },
});
