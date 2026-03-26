import { View } from "react-native";
import { Colors } from "@/constants/theme";

export default function Divider({ mt = 0, mb = 0 }: { mt?: number; mb?: number }) {
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
