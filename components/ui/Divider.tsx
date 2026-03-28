import { View } from "react-native";
import { Colors, useColors} from "@/constants/theme";

export default function Divider({ mt = 0, mb = 0 }: { mt?: number; mb?: number }) {
  const Colors = useColors();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: Colors.border.subtle,
        marginTop: mt,
        marginBottom: mb,
      }}
    />
  );
}
