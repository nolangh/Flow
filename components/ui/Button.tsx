import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from "react-native";
import { Colors, pillShadow } from "@/constants/theme";

type Variant = "primary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const SIZE_STYLES: Record<Size, { paddingVertical: number; fontSize: number }> = {
  sm: { paddingVertical: 10, fontSize: 13 },
  md: { paddingVertical: 14, fontSize: 15 },
  lg: { paddingVertical: 17, fontSize: 17 },
};

const VARIANT_STYLES: Record<Variant, { bg: string; border: string; text: string; shadow: object }> = {
  primary: {
    bg: Colors.neonGreen,
    border: Colors.neonGreenDim,
    text: "#000000",
    shadow: pillShadow(Colors.neonGreen),
  },
  danger: {
    bg: Colors.dangerPink,
    border: Colors.dangerPinkDim,
    text: "#000000",
    shadow: pillShadow(Colors.dangerPink),
  },
  ghost: {
    bg: Colors.bg.surface,
    border: Colors.bg.surface,
    text: Colors.text.primary,
    shadow: {},
  },
  outline: {
    bg: "transparent",
    border: Colors.border.subtle,
    text: Colors.text.primary,
    shadow: {},
  },
};

export default function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: v.bg,
          borderRadius: 9999,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: 28,
          borderBottomWidth: variant === "primary" || variant === "danger" ? 3 : 1,
          borderBottomColor: v.border,
          borderColor: variant === "outline" ? Colors.border.subtle : undefined,
          borderWidth: variant === "outline" ? 1 : undefined,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: disabled ? 0.5 : 1,
          ...v.shadow,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "danger" ? "#000" : Colors.text.primary}
          size="small"
        />
      ) : (
        <Text style={{ color: v.text, fontWeight: "700", fontSize: s.fontSize, letterSpacing: 0.2 }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
