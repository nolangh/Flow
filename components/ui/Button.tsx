import { TouchableOpacity, Text, ActivityIndicator, View, type TouchableOpacityProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { pillShadow, Fonts, useColors } from "@/constants/theme";
import type { ThemeColors } from "@/constants/themes";

type Variant = "primary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

const SIZE_STYLES: Record<Size, { paddingVertical: number; fontSize: number }> = {
  sm: { paddingVertical: 10, fontSize: 13 },
  md: { paddingVertical: 15, fontSize: 15 },
  lg: { paddingVertical: 17, fontSize: 17 },
};

function buildVariantStyles(C: ThemeColors) {
  return {
    primary: {
      bg: C.accent,
      border: C.accentDim,
      text: "#000000",
      shadow: pillShadow(C.accent),
    },
    danger: {
      bg: C.danger,
      border: C.dangerDim,
      text: "#FFFFFF",
      shadow: pillShadow(C.danger),
    },
    ghost: {
      bg: C.bg.surface,
      border: C.bg.surface,
      text: C.text.primary,
      shadow: {},
    },
    outline: {
      bg: "transparent",
      border: C.border.subtle,
      text: C.text.primary,
      shadow: {},
    },
  };
}

export default function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  icon,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const Colors = useColors();
  const VARIANT_STYLES = buildVariantStyles(Colors);
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: v.bg,
          borderRadius: 9999,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: 28,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: variant === "outline" ? Colors.border.subtle : undefined,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: disabled ? 0.45 : 1,
          ...v.shadow,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#000" : Colors.text.primary}
          size="small"
        />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {icon && <Ionicons name={icon} size={s.fontSize + 1} color={v.text} />}
          <Text style={{ color: v.text, fontFamily: Fonts.bold, fontSize: s.fontSize, letterSpacing: 0.1 }}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
