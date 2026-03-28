import { View, type ViewProps } from "react-native";
import { Colors, useColors} from "@/constants/theme";

interface CardProps extends ViewProps {
  glow?: "green" | "pink" | null;
  padding?: number;
}

export default function Card({ children, glow, padding = 16, style, ...rest }: CardProps) {
  const Colors = useColors();
  const glowColor =
    glow === "green" ? Colors.accentBorder : glow === "pink" ? Colors.dangerBorder : undefined;

  return (
    <View
      style={[
        {
          backgroundColor: Colors.bg.surface,
          borderRadius: 20,
          padding,
          borderWidth: 1,
          borderColor: glowColor ?? Colors.border.subtle,
          ...(glow === "green"
            ? { shadowColor: Colors.accent, shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 2 } }
            : glow === "pink"
            ? { shadowColor: Colors.danger, shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 2 } }
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
