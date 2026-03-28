/**
 * BezierChart — smooth spending curve with a glowing leading-edge dot.
 *
 * Uses react-native-svg to draw a cubic bezier through cumulative
 * daily spending data points. Color shifts green → pink based on
 * whether total spending exceeds the monthly budget limit.
 */
import { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Colors, useColors} from "@/constants/theme";
import type { SpendingDataPoint } from "@/types";

interface BezierChartProps {
  data: SpendingDataPoint[];
  limit: number;
  width: number;
  height: number;
}

/** Convert catmull-rom spline to SVG cubic bezier path. */
function buildPath(points: { x: number; y: number }[], h: number): string {
  if (points.length < 2) return "";

  const tension = 0.4;
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 2;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 2;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 2;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 2;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

export default function BezierChart({ data, limit, width, height }: BezierChartProps) {
  const Colors = useColors();
  const isOverBudget = limit > 0 && data.length > 0 && data[data.length - 1].cumulative > limit;
  const lineColor = isOverBudget ? Colors.dangerPink : Colors.neonGreen;
  const gradientId = isOverBudget ? "grad-pink" : "grad-green";
  const glowColor = isOverBudget ? Colors.dangerPink : Colors.neonGreen;

  const { svgPoints, linePath, fillPath, lastPoint } = useMemo(() => {
    if (!data || data.length === 0) return { svgPoints: [], linePath: "", fillPath: "", lastPoint: null };

    const padH = 12;
    const padV = 16;
    const drawW = width - padH * 2;
    const drawH = height - padV * 2;

    const maxVal = Math.max(...data.map((d) => d.cumulative), limit, 1);
    const minVal = 0;

    const mapped = data.map((d) => ({
      x: padH + (d.day / data.length) * drawW,
      y: padV + drawH - ((d.cumulative - minVal) / (maxVal - minVal)) * drawH,
    }));

    const line = buildPath(mapped, height);

    const last = mapped[mapped.length - 1];
    const fill =
      line +
      ` L ${last.x} ${height - padV} L ${mapped[0].x} ${height - padV} Z`;

    return { svgPoints: mapped, linePath: line, fillPath: fill, lastPoint: last };
  }, [data, limit, width, height]);

  if (!linePath) return <View style={{ width, height }} />;

  return (
    <Svg width={width} height={height}>
      <Defs>
        {/* gradient fill under line */}
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={lineColor} stopOpacity={0.22} />
          <Stop offset="100%" stopColor={lineColor} stopOpacity={0.0} />
        </LinearGradient>
      </Defs>

      {/* Gradient fill area */}
      <Path d={fillPath} fill={`url(#${gradientId})`} />

      {/* Main bezier line */}
      <Path
        d={linePath}
        stroke={lineColor}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glowing leading-edge dot — outer glow ring */}
      {lastPoint && (
        <>
          <Circle cx={lastPoint.x} cy={lastPoint.y} r={10} fill={glowColor} opacity={0.18} />
          <Circle cx={lastPoint.x} cy={lastPoint.y} r={6} fill={glowColor} opacity={0.35} />
          <Circle cx={lastPoint.x} cy={lastPoint.y} r={3.5} fill={glowColor} />
        </>
      )}
    </Svg>
  );
}
