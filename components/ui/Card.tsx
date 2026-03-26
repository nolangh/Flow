import { View, type ViewProps } from "react-native";
import { Colors } from "@/constants/theme";

interface CardProps extends ViewProps {
  glow?: "green" | "pink" | null;
  padding?: number;
}

export default function Card({ children, glow, padding = 16, style, ...rest }: CardProps) {
  const glowColor =
    glow === "green" ? Colors.neonGreenBorder : glow === "pink" ? Colors.dangerPinkBorder : undefined;

  return (
    <View
      style={[
        {
          backgroundColor: Colors.bg.surface,
          borderRadius: 16,
          padding,
          borderWidth: 1,
          borderColor: glowColor ?? Colors.border.subtle,
          ...(glow === "green"
            ? { shadowColor: Colors.neonGreen, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }
            : glow === "pink"
            ? { shadowColor: Colors.dangerPink, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } }
            : {}),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
