import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/**
 * Reusable pill-shaped button using the LearnSum design tokens.
 *
 * Variants:
 * - "primary": Forest Green (#2D6A4F) with white text — main actions.
 * - "accent":  Gold (#F4A923) with dark text — secondary / "Log in now".
 */
type ButtonVariant = "primary" | "accent";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isInactive = disabled || loading;

  // Flatten to a single style object. The `({ pressed }) => [...]` callback
  // form of `style` is dropped by NativeWind's runtime (this app sets
  // jsxImportSource: "nativewind"), so we pass a plain object instead.
  const buttonStyle = StyleSheet.flatten([
    styles.base,
    variant === "primary" ? styles.primary : styles.accent,
    isInactive && styles.disabled,
    style,
  ]);

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
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary" ? styles.labelPrimary : styles.labelAccent,
          ]}
        >
          {label}
        </Text>
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
  disabled: {
    opacity: 0.5,
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
});
