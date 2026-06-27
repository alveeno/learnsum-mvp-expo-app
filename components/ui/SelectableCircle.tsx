import {
  InteractionManager,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useEffect, type ReactNode } from "react";
import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";

import { playTap, playPop, primePops } from "./sound";

/**
 * Reusable "grey circle that fills with a colour when selected" used by the
 * onboarding pickers (education level, interest categories / subcategories).
 *
 * Design tokens: circular avatar, resting grey #F0F1F3, muted glyph #9CA3AF,
 * white glyph once filled. The fill colour is supplied per item so the same
 * component covers every category and subcategory.
 *
 * Icon-family agnostic: pass `renderIcon`, which receives the resolved glyph
 * size and colour (white when selected, grey when resting) so the caller can
 * draw with Ionicons, MaterialCommunityIcons, etc.
 */
type IconRenderer = (opts: { size: number; color: string }) => ReactNode;

type SelectableCircleProps = {
  label: string;
  selected: boolean;
  /** Colour the grey circle fills with once selected. */
  color: string;
  renderIcon: IconRenderer;
  /** Omit to render a non-interactive (disabled) circle. */
  onPress?: () => void;
  /** Circle diameter in px. Default 84. */
  size?: number;
  /** Glyph size. Defaults to ~43% of the circle. */
  iconSize?: number;
  /** Optional count badge, top-right (hidden when undefined or 0). */
  badge?: number;
  /** Badge background colour. Default Forest Green. */
  badgeColor?: string;
  /** Wrapper style — e.g. a grid column width. */
  style?: StyleProp<ViewStyle>;
  /** Extra style for the label text (e.g. a smaller font so long words fit). */
  labelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  /**
   * When a number (ms), the circle pops/​fades in after this delay and plays a
   * `pop` sound as it lands — staggered per index for a cascade effect (used by
   * the onboarding category/subject grids). Omit / null = render statically.
   */
  entranceDelay?: number | null;
};

const RESTING_BG = "#F0F1F3"; // grey circle before selection
const RESTING_ICON = "#9CA3AF"; // muted glyph before selection
const SELECTED_ICON = "#FFFFFF"; // white glyph once filled

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ENTRANCE_SPRING = { damping: 13, stiffness: 200, mass: 0.6 };
const PRESS_SPRING = { damping: 16, stiffness: 360, mass: 0.45 };
// When (after a circle's stagger delay) the pop should sound: the moment the
// ENTRANCE_SPRING first reaches full size — its visual "land", ~150ms in. Tuned
// to ENTRANCE_SPRING above; bump it if you make the entrance bouncier/slower.
const POP_LAND_LEAD_MS = 150;

export function SelectableCircle({
  label,
  selected,
  color,
  renderIcon,
  onPress,
  size = 84,
  iconSize,
  badge,
  badgeColor = "#2D6A4F",
  style,
  labelStyle,
  accessibilityLabel,
  entranceDelay,
}: SelectableCircleProps) {
  const glyphSize = iconSize ?? Math.round(size * 0.43);
  const glyphColor = selected ? SELECTED_ICON : RESTING_ICON;

  // Staggered entrance: start small + transparent, then spring to full once the
  // screen has finished opening; the pop sound fires as each circle lands. Hooks
  // run unconditionally.
  const animate = typeof entranceDelay === "number" && entranceDelay >= 0;
  const progress = useSharedValue(animate ? 0 : 1);
  const soundCue = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => {
    const entranceScale = 0.6 + 0.4 * progress.value;
    return {
      opacity: progress.value,
      transform: [{ scale: entranceScale * pressScale.value }],
    };
  });
  useEffect(() => {
    cancelAnimation(progress);
    cancelAnimation(soundCue);
    if (!animate) {
      progress.value = 1;
      return;
    }
    // Stay hidden until the screen-open transition finishes (runAfterInteractions)
    // so route/mount work can't stutter the cascade, then spring in on the stagger
    // delay. The pop is driven by a UI-clock timer at the spring's visual land
    // (stagger + POP_LAND_LEAD_MS), not a JS timer — so pops stay evenly spaced
    // and synced to each icon even while the JS thread is busy, instead of the old
    // JS-timer behaviour where they bunched up and played at once.
    progress.value = 0;
    soundCue.value = 0;
    let cancelled = false;
    const handle = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      primePops(); // create the pop players up front so the first pop doesn't hitch
      progress.value = withDelay(entranceDelay as number, withSpring(1, ENTRANCE_SPRING));
      soundCue.value = withDelay(
        (entranceDelay as number) + POP_LAND_LEAD_MS,
        withTiming(1, { duration: 1 }, (finished) => {
          if (finished) runOnJS(playPop)();
        }),
      );
    });
    return () => {
      cancelled = true;
      handle.cancel();
      cancelAnimation(progress);
      cancelAnimation(soundCue);
    };
  }, [animate, entranceDelay, progress, soundCue]);

  // Flatten to a plain object: this app routes JSX through NativeWind's runtime
  // (jsxImportSource), which drops the function form of `style` on Pressable.
  const wrapperStyle = StyleSheet.flatten([styles.wrapper, style]);
  const circleStyle = StyleSheet.flatten([
    styles.circle,
    { width: size, height: size, borderRadius: size / 2 },
    selected
      ? { backgroundColor: color, shadowColor: color, ...styles.selectedShadow }
      : styles.resting,
  ]);

  const showBadge = typeof badge === "number" && badge > 0;

  return (
    <AnimatedPressable
      style={[wrapperStyle, animatedStyle]}
      onPressIn={() => {
        pressScale.value = withSpring(0.92, PRESS_SPRING);
      }}
      onPressOut={() => {
        pressScale.value = withSpring(1, PRESS_SPRING);
      }}
      onPress={
        onPress
          ? () => {
              playTap();
              onPress();
            }
          : undefined
      }
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
    >
      {/* Circle-sized box so the badge anchors to the circle, not the column. */}
      <View style={{ width: size, height: size }}>
        <View style={circleStyle}>
          {renderIcon({ size: glyphSize, color: glyphColor })}
        </View>
        {showBadge ? (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  circle: { alignItems: "center", justifyContent: "center" },
  resting: { backgroundColor: RESTING_BG },
  selectedShadow: {
    // Soft coloured halo to match the selected mockups.
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
});
