import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

/**
 * Reusable pill-shaped button using the LearnSum design tokens.
 *
 * Variants:
 * - "primary": Forest Green (#2D6A4F) with white text — main actions.
 * - "accent":  Gold (#F4A923) with dark text — secondary / "Log in now".
 * - "ghost":   Off-white surface with dark text — low-emphasis actions
 *              (e.g. "Back to categories").
 */
type ButtonVariant = "primary" | "accent" | "ghost";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Optional leading icon element (e.g. an <Ionicons/> / <MaterialCommunityIcons/>). */
  icon?: ReactNode;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  icon,
}: ButtonProps) {
  const isInactive = disabled || loading;

  const variantStyle =
    variant === "primary"
      ? styles.primary
      : variant === "accent"
        ? styles.accent
        : styles.ghost;
  const labelColorStyle =
    variant === "primary"
      ? styles.labelPrimary
      : variant === "accent"
        ? styles.labelAccent
        : styles.labelGhost;

  // Flatten to a single style object. The `({ pressed }) => [...]` callback
  // form of `style` is dropped by NativeWind's runtime (this app sets
  // jsxImportSource: "nativewind"), so we pass a plain object instead.
  const buttonStyle = StyleSheet.flatten([
    styles.base,
    variantStyle,
    isInactive && styles.disabled,
    style,
  ]);

  const labelNode = (
    <Text style={[styles.label, labelColorStyle]}>{label}</Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive }}
      disabled={isInactive}
      onPress={onPress}
      style={buttonStyle}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFFFFF" : "#1A1A1A"}
        />
      ) : icon ? (
        <View style={styles.content}>
          {icon}
          {labelNode}
        </View>
      ) : (
        labelNode
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 999, // pill shape
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: "#2D6A4F",
  },
  accent: {
    backgroundColor: "#F4A923",
  },
  ghost: {
    backgroundColor: "#F9F9F7", // Surface / off-white
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  labelPrimary: {
    color: "#FFFFFF",
  },
  labelAccent: {
    color: "#1A1A1A",
  },
  labelGhost: {
    color: "#111827",
  },
});
