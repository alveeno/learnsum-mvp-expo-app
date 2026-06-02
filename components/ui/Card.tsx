import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

/**
 * Reusable surface card using the LearnSum design tokens:
 * 16pt rounded corners, white surface, subtle border.
 *
 * Pass `onPress` to make it tappable. Pass `selected` to show the
 * Forest Green selection ring (used by the role pickers).
 */
type CardProps = {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Accessibility label for the tappable card. */
  accessibilityLabel?: string;
};

export function Card({
  children,
  selected = false,
  onPress,
  style,
  accessibilityLabel,
}: CardProps) {
  // Flatten to a single style object. Passing a plain object (rather than
  // the `({ pressed }) => [...]` callback form) is required because this app
  // routes all JSX through NativeWind's runtime (jsxImportSource), which
  // drops the function form of `style` on Pressable.
  const cardStyle = StyleSheet.flatten([
    styles.base,
    selected ? styles.selected : styles.unselected,
    style,
  ]);

  // Static (non-tappable) card.
  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  // Tappable / selectable card.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={cardStyle}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16, // 16pt rounded corners
    padding: 16,
  },
  unselected: {
    // Same 2px width as the selected state so toggling selection only
    // swaps the border colour and never nudges the layout by a pixel.
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  selected: {
    // Forest Green ring.
    borderWidth: 2,
    borderColor: "#2D6A4F",
    // Soft green-tinted lift to match the selected mockups.
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
});
