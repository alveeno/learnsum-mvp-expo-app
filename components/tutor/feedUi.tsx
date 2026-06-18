/**
 * Tutor Home — shared visual primitives.
 *
 * Ported from the Claude Design source (`tutor/tutor-shared.jsx`, `app/ui.jsx`).
 * Material Symbols in the source are mapped to `@expo/vector-icons` (Ionicons /
 * MaterialIcons) per CLAUDE.md. The source's striped media placeholder and
 * CSS gradients are approximated with flat colours — true gradients would need
 * `expo-linear-gradient`, a native module that forces a new EAS build.
 */
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { avatarColor, C, initials, type PostKind, type Stats } from "./tutorData";

/* ===== Avatar — initials on a deterministic colour (no fake photos) ===== */
export function Avatar({ name, size = 72, style }: { name: string; size?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarColor(name),
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ color: "#fff", fontWeight: "600", fontSize: size * 0.36, letterSpacing: -0.3 }}>
        {initials(name)}
      </Text>
    </View>
  );
}

/* ===== "Qualified" tag — earned via LearnSum's verification flow ===== */
export function Qualified({ mini = false }: { mini?: boolean }) {
  if (mini) {
    return (
      <View style={styles.qualMini}>
        <Ionicons name="school" size={11} color="#fff" />
      </View>
    );
  }
  return (
    <View style={styles.qualTag}>
      <Ionicons name="school" size={13} color={C.green} />
      <Text style={styles.qualText}>Qualified</Text>
    </View>
  );
}

/* ===== striped placeholder for post media (we never fake photos) ===== */
const SLOT_ICON: Record<PostKind, keyof typeof Ionicons.glyphMap> = {
  video: "play-circle",
  image: "image",
  whiteboard: "brush",
  quote: "chatbox-ellipses",
};

export function MediaSlot({
  label,
  kind,
  height = 296,
  radius = 0,
}: {
  label: string;
  kind: PostKind;
  height?: number;
  radius?: number;
}) {
  // Special green "quote" slot for testimonials.
  if (kind === "quote") {
    return (
      <View style={[styles.quoteSlot, { height, borderRadius: radius }]}>
        <MaterialIcons
          name="format-quote"
          size={64}
          color="rgba(255,255,255,0.18)"
          style={{ position: "absolute", top: 14, left: 16 }}
        />
        {!!label && <Text style={styles.quoteLabel}>{label}</Text>}
      </View>
    );
  }
  // NOTE: the source uses a diagonal repeating-stripe gradient; flattened to a
  // solid tint here (RN has no CSS repeating-linear-gradient).
  return (
    <View style={[styles.mediaSlot, { height, borderRadius: radius }]}>
      <View style={styles.mediaIconWrap}>
        <Ionicons name={SLOT_ICON[kind]} size={30} color={C.green} />
      </View>
      {!!label && <Text style={styles.mediaLabel}>{label}</Text>}
    </View>
  );
}

/* ===== Connect pill (marketplace peer action, not a social "follow") ===== */
export function FollowBtn({
  following,
  onToggle,
  size = "md",
}: {
  following: boolean;
  onToggle: () => void;
  size?: "xs" | "sm" | "md";
}) {
  const xs = size === "xs";
  const sm = size === "sm";
  const h = xs ? 28 : sm ? 30 : 34;
  const fs = xs ? 11.5 : sm ? 12.5 : 13.5;
  const is = xs ? 14 : sm ? 15 : 17;
  const padH = xs ? 10 : sm ? 12 : 15;

  return (
    <Pressable
      onPress={onToggle}
      style={{
        height: h,
        paddingHorizontal: padH,
        borderRadius: h / 2,
        flexDirection: "row",
        alignItems: "center",
        gap: xs ? 4 : 5,
        backgroundColor: following ? "#fff" : C.green,
        borderWidth: following ? 1.5 : 0,
        borderColor: C.hairline,
      }}
    >
      <Ionicons
        name={following ? "checkmark-circle-outline" : "person-add"}
        size={is}
        color={following ? C.muted : "#fff"}
      />
      <Text style={{ fontSize: fs, fontWeight: "700", letterSpacing: -0.1, color: following ? C.muted : "#fff" }}>
        {following ? "Connected" : "Connect"}
      </Text>
    </Pressable>
  );
}

/* ===== engagement row: likes / comments (editorial "chip" treatment) =====
   `likes` is the post's base count; the signed-in user's own like adds +1 on
   top. Liking pops the heart and turns it red. */
export function EngagementRow({
  likes,
  comments,
  liked,
  onLike,
  onComment,
}: {
  likes: number;
  comments: number;
  liked: boolean;
  onLike: () => void;
  onComment: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const wasLiked = useRef(liked);
  useEffect(() => {
    if (liked && !wasLiked.current) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 50, bounciness: 14 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 9 }),
      ]).start();
    }
    wasLiked.current = liked;
  }, [liked, scale]);

  const count = likes + (liked ? 1 : 0);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <Pressable onPress={onLike} style={[styles.engChip, liked && { backgroundColor: "rgba(230,57,70,0.12)" }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={19} color={liked ? C.destructive : C.ink} />
        </Animated.View>
        <Text style={[styles.engChipText, liked && { color: C.destructive }]}>{count}</Text>
      </Pressable>
      <Pressable onPress={onComment} style={styles.engChip}>
        <Ionicons name="chatbubble-outline" size={19} color={C.ink} />
        <Text style={styles.engChipText}>{comments}</Text>
      </Pressable>
    </View>
  );
}

/* ===== brand wordmark ===== */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: size * 0.28 }}>
      <View
        style={{
          width: size * 1.16,
          height: size * 1.16,
          borderRadius: size * 1.16 * 0.3,
          backgroundColor: C.green,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="school" size={size * 0.7} color={C.gold} />
      </View>
      <Text style={{ fontSize: size, fontWeight: "800", letterSpacing: -size * 0.03, lineHeight: size * 1.1 }}>
        <Text style={{ color: C.greenD }}>Learn</Text>
        <Text style={{ color: C.goldD }}>Sum</Text>
      </Text>
    </View>
  );
}

/* ===== profile stat block (Columns treatment — the file's default) ===== */
export function StatBlock({ stats }: { stats: Stats }) {
  const items = [
    { k: "rating", label: "Rating", val: stats.rating, star: true },
    { k: "sessions", label: "Sessions", val: stats.sessions, star: false },
    { k: "followers", label: "Followers", val: stats.followers, star: false },
    { k: "years", label: "Years", val: stats.years, star: false },
  ];
  return (
    <View style={styles.statRow}>
      {items.map((it, i) => (
        <View
          key={it.k}
          style={[styles.statCol, i > 0 && { borderLeftWidth: 1, borderLeftColor: C.hairline }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 }}>
            {it.star && <Ionicons name="star" size={15} color={C.gold} />}
            <Text style={styles.statVal}>{it.val}</Text>
          </View>
          <Text style={styles.statLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

/* ===== posts grid (3-up striped placeholders) ===== */
export function PostsGrid({ items }: { items: { kind: PostKind }[] }) {
  const [w, setW] = useState(0);
  const cell = w > 0 ? (w - 6) / 3 : 0;
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 3 }}
    >
      {w > 0 &&
        items.map((it, i) => (
          <View key={i} style={{ width: cell, height: 112 }}>
            <MediaSlot label="" kind={it.kind} height={112} radius={0} />
            {it.kind === "video" ? (
              <MaterialIcons name="play-arrow" size={16} color="#fff" style={styles.gridBadge} />
            ) : (
              <Ionicons name="heart" size={14} color="#fff" style={styles.gridBadge} />
            )}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  qualMini: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  qualTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 20,
    paddingLeft: 7,
    paddingRight: 9,
    borderRadius: 10,
    backgroundColor: C.greenTint,
  },
  qualText: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.2, color: C.greenD },
  mediaSlot: {
    backgroundColor: "#EAECEB",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    overflow: "hidden",
  },
  mediaIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaLabel: {
    fontFamily: "Menlo",
    fontSize: 11.5,
    color: "#5b635f",
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 7,
    maxWidth: "82%",
    textAlign: "center",
  },
  quoteSlot: { backgroundColor: C.green, justifyContent: "center", paddingHorizontal: 26, overflow: "hidden" },
  quoteLabel: {
    fontFamily: "Menlo",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: C.gold,
  },
  engChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: C.surface,
  },
  engChipText: { fontSize: 13.5, fontWeight: "700", color: C.ink },
  statRow: { flexDirection: "row", marginTop: 16, marginBottom: 2, paddingVertical: 2 },
  statCol: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 17, fontWeight: "700", letterSpacing: -0.3, color: C.ink },
  statLabel: { fontSize: 11.5, color: C.muted, fontWeight: "600", marginTop: 2 },
  gridBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
