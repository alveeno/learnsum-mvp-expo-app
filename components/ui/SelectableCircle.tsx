import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

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
};

const RESTING_BG = "#F0F1F3"; // grey circle before selection
const RESTING_ICON = "#9CA3AF"; // muted glyph before selection
const SELECTED_ICON = "#FFFFFF"; // white glyph once filled

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
}: SelectableCircleProps) {
  const glyphSize = iconSize ?? Math.round(size * 0.43);
  const glyphColor = selected ? SELECTED_ICON : RESTING_ICON;

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
    <Pressable
      style={wrapperStyle}
      onPress={onPress}
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
    </Pressable>
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
