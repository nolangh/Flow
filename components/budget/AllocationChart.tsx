import { View, Text } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { Colors, useColors} from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: Slice[];
  centerLabel?: string;
  centerValue?: number;
  size?: number;
}

const STROKE = 28;
const GAP = 2;

export default function AllocationChart({ data, centerLabel, centerValue, size = 180 }: Props) {
  const Colors = useColors();
  const r = (size - STROKE) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let offset = 0;
  const slices = data.map((d) => {
    const fraction = d.value / total;
    const dash = fraction * circumference - GAP;
    const gap = circumference - dash;
    const result = { ...d, dash, gap, offset };
    offset += fraction * circumference;
    return result;
  });

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ position: "relative", width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background ring */}
          <Circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={Colors.bg.overlay}
            strokeWidth={STROKE}
          />
          <G rotation="-90" origin={`${cx},${cy}`}>
            {slices.map((s) => (
              <Circle
                key={s.label}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
              />
            ))}
          </G>
          {centerValue !== undefined && (
            <>
              <SvgText
                x={cx} y={cy - 8}
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill={Colors.text.primary}
              >
                {formatCurrency(centerValue)}
              </SvgText>
              <SvgText
                x={cx} y={cy + 12}
                textAnchor="middle"
                fontSize="11"
                fill={Colors.text.muted}
              >
                {centerLabel ?? "total"}
              </SvgText>
            </>
          )}
        </Svg>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 16, paddingHorizontal: 8 }}>
        {data.map((d) => (
          <View key={d.label} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
            <Text style={{ color: Colors.text.secondary, fontSize: 11 }}>{d.label}</Text>
            <Text style={{ color: Colors.text.muted, fontSize: 11 }}>
              {Math.round((d.value / (data.reduce((s, x) => s + x.value, 0))) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
