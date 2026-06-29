/**
 * Subscription paywall — `/subscribe`.
 *
 * Shown when a free tutor tries to reply to a student (or unlock a seeker's
 * contact). Lays out the three tiers with their perks and a CTA per card.
 *
 * There's no real payment yet: tapping "Choose …" flips the **mock** tier
 * (`subscription/tierStore`) and returns, so the tutor can carry straight on
 * (e.g. free → premium → reply). Same store the temporary Profile-tab switcher
 * uses. Prices are placeholders — edit `TIERS` below.
 */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { setTier, useTier, type Tier } from "../components/subscription/tierStore";
import { C } from "../components/tutor/tutorData";
import { notifySuccess, tapMedium } from "../components/ui/feedback";

type Perk = { label: string; on: boolean };
type TierCard = {
  key: Tier;
  name: string;
  price: string;
  tagline: string;
  highlight?: boolean;
  perks: Perk[];
};

// Placeholder pricing — swap for the real plans when payments are wired.
const TIERS: TierCard[] = [
  {
    key: "free",
    name: "Free",
    price: "HK$0",
    tagline: "Get discovered",
    perks: [
      { label: "Receive messages from students", on: true },
      { label: "Reply to students", on: false },
      { label: "WhatsApp & WeChat on your profile", on: false },
      { label: "See student phone numbers", on: false },
      { label: "Premium analytics", on: false },
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: "HK$98 / mo",
    tagline: "For active tutors",
    perks: [
      { label: "Reply to 1 new student / day", on: true },
      { label: "WhatsApp & WeChat on your profile", on: true },
      { label: "See student phone numbers", on: true },
      { label: "Premium analytics (reach & posts)", on: true },
    ],
  },
  {
    key: "deluxe",
    name: "Deluxe",
    price: "HK$188 / mo",
    tagline: "Best value",
    highlight: true,
    perks: [
      { label: "Reply to 3 new students / day", on: true },
      { label: "Everything in Premium", on: true },
      { label: "See student phone numbers", on: true },
      { label: "Premium analytics (reach & posts)", on: true },
      { label: "Priority placement in search (soon)", on: true },
    ],
  },
];

function PerkRow({ perk }: { perk: Perk }) {
  return (
    <View style={styles.perkRow}>
      <Ionicons
        name={perk.on ? "checkmark-circle" : "close-circle"}
        size={18}
        color={perk.on ? C.green : C.unselIc}
      />
      <Text style={[styles.perkText, !perk.on && styles.perkOff]}>{perk.label}</Text>
    </View>
  );
}

export default function Subscribe() {
  const current = useTier();

  const choose = (t: Tier) => {
    if (t === current) return;
    tapMedium();
    setTier(t);
    notifySuccess();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={C.ink} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reach more students</Text>
        <Text style={styles.sub}>
          Free tutors get discovered, but only Premium and Deluxe can reply to students and share contact details.
        </Text>

        {TIERS.map((tier) => {
          const isCurrent = tier.key === current;
          return (
            <View key={tier.key} style={[styles.card, tier.highlight && styles.cardHi]}>
              {tier.highlight ? (
                <View style={styles.ribbon}>
                  <Ionicons name="star" size={11} color="#3a2c06" />
                  <Text style={styles.ribbonText}>{tier.tagline.toUpperCase()}</Text>
                </View>
              ) : null}
              <View style={styles.cardHead}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  {!tier.highlight ? <Text style={styles.tierTagline}>{tier.tagline}</Text> : null}
                </View>
                <Text style={styles.price}>{tier.price}</Text>
              </View>

              <View style={styles.perks}>
                {tier.perks.map((p) => (
                  <PerkRow key={p.label} perk={p} />
                ))}
              </View>

              {isCurrent ? (
                <View style={[styles.cta, styles.ctaCurrent]}>
                  <Ionicons name="checkmark" size={17} color={C.green} />
                  <Text style={styles.ctaCurrentText}>Current plan</Text>
                </View>
              ) : tier.highlight ? (
                <Pressable onPress={() => choose(tier.key)} accessibilityRole="button">
                  <LinearGradient
                    colors={["#F6B73C", "#E0941A"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cta}
                  >
                    <Text style={styles.ctaGoldText}>Choose {tier.name}</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => choose(tier.key)}
                  style={[styles.cta, tier.key === "free" ? styles.ctaGhost : styles.ctaGreen]}
                  accessibilityRole="button"
                >
                  <Text style={tier.key === "free" ? styles.ctaGhostText : styles.ctaGreenText}>
                    {tier.key === "free" ? "Switch to Free" : `Choose ${tier.name}`}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}

        <Text style={styles.note}>No real payment yet — this just switches your test tier so you can try each plan.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  head: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 10, paddingTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 18, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: C.ink, letterSpacing: -0.6, marginTop: 4 },
  sub: { fontSize: 14.5, lineHeight: 21, color: C.muted, marginTop: 8, marginBottom: 18 },

  card: { borderRadius: 20, borderWidth: 1, borderColor: C.hairline, backgroundColor: "#fff", padding: 18, marginBottom: 14 },
  cardHi: { borderColor: C.gold, borderWidth: 2, shadowColor: C.gold, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 4 },
  ribbon: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: C.goldTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 10 },
  ribbonText: { fontSize: 10.5, fontWeight: "800", color: "#3a2c06", letterSpacing: 0.5 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  tierName: { fontSize: 20, fontWeight: "800", color: C.ink },
  tierTagline: { fontSize: 12.5, color: C.muted, marginTop: 1 },
  price: { fontSize: 17, fontWeight: "800", color: C.green },

  perks: { gap: 9, marginBottom: 16 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  perkText: { flex: 1, fontSize: 14, color: C.ink, fontWeight: "600" },
  perkOff: { color: C.unselIc, textDecorationLine: "line-through" },

  cta: { height: 48, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  ctaGreen: { backgroundColor: C.green },
  ctaGreenText: { fontSize: 15.5, fontWeight: "800", color: "#fff" },
  ctaGoldText: { fontSize: 15.5, fontWeight: "800", color: "#3a2c06" },
  ctaGhost: { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.hairline },
  ctaGhostText: { fontSize: 15.5, fontWeight: "800", color: C.muted },
  ctaCurrent: { backgroundColor: C.greenTint },
  ctaCurrentText: { fontSize: 15.5, fontWeight: "800", color: C.green },

  note: { fontSize: 12, color: C.unselIc, textAlign: "center", marginTop: 8, lineHeight: 17 },
});
