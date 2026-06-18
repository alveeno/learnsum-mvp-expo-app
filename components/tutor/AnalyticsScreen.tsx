/**
 * Tutor app — ANALYTICS (premium).
 *
 * Ported from `tutor/tutor-analytics.jsx`. Front-end only: "Upgrade" flips local
 * state to reveal the dashboard — there is no real payment yet (payments are on
 * the CLAUDE.md Todo list). The source blurs the locked dashboard; RN can't blur
 * without a native module (EAS rebuild), so it's dimmed (low opacity) instead.
 */
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, MediaSlot } from "./feedUi";
import { ANALYTICS, C } from "./tutorData";

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

      <View>
        <Text style={styles.label}>Who viewed you</Text>
        <View style={{ marginTop: 9 }}>
          {a.viewers.map((v, i) => (
            <View key={i} style={styles.viewerRow}>
              <Avatar name={v.who} size={40} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: C.ink }}>{v.who}</Text>
                <Text style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{v.note}</Text>
              </View>
              <Text style={{ fontSize: 11.5, color: C.unselIc, fontWeight: "600" }}>{v.ago}</Text>
            </View>
          ))}
        </View>
      </View>
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
            {!premium && <Ionicons name="lock-closed" size={20} color={C.goldD} />}
          </View>
          <Text style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>
            {premium ? "Your reach over the last 6 months." : "See who’s watching — with Premium."}
          </Text>
        </View>
        {premium && (
          <View style={styles.premiumBadge}>
            <MaterialIcons name="workspace-premium" size={15} color="#3a2c06" />
            <Text style={{ fontSize: 11.5, fontWeight: "800", color: "#3a2c06" }}>Premium</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={premium ? undefined : { opacity: 0.35 }} pointerEvents={premium ? "auto" : "none"}>
            <AnalyticsBody />
          </View>
        </ScrollView>

        {!premium && (
          <View style={styles.lockOverlay} pointerEvents="box-none">
            <View style={styles.upgradeCard}>
              <View style={styles.insightsCircle}>
                <Ionicons name="stats-chart" size={30} color={C.goldD} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.4, color: C.ink }}>Unlock Analytics</Text>
              <Text style={{ fontSize: 13.5, color: C.muted, lineHeight: 19, textAlign: "center", marginTop: 8, marginBottom: 16 }}>
                See who viewed your profile, how each post performs, and where your new followers come from.
              </Text>
              <View style={{ gap: 9, alignSelf: "stretch", marginBottom: 18 }}>
                {["Who viewed your profile", "Per-post views & saves", "Follower growth trends"].map((feat) => (
                  <View key={feat} style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                    <Ionicons name="checkmark-circle" size={19} color={C.green} />
                    <Text style={{ fontSize: 13.5, fontWeight: "600", color: C.ink }}>{feat}</Text>
                  </View>
                ))}
              </View>
              <Pressable onPress={onUpgrade} style={styles.upgradeBtn}>
                <MaterialIcons name="workspace-premium" size={20} color="#3a2c06" />
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#3a2c06" }}>Upgrade to Premium</Text>
              </Pressable>
              <Text style={{ fontSize: 12, color: C.unselIc, marginTop: 10, fontWeight: "600" }}>From $48/mo · cancel anytime</Text>
            </View>
          </View>
        )}
      </View>
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
