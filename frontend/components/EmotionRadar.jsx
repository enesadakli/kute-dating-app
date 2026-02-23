import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    interpolate,
    Easing,
} from 'react-native-reanimated';

const LABELS = ['Mutluluk', 'Üzüntü', 'Öfke', 'Korku', 'Şaşkınlık'];
const EMOTION_KEYS = ['joy', 'sadness', 'anger', 'fear', 'surprise'];
const COLORS = ['#4ade80', '#60a5fa', '#f87171', '#c084fc', '#fbbf24'];

function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

function getPolygonPoints(cx, cy, maxR, values) {
    return values.map((v, i) => {
        const angle = (360 / values.length) * i;
        const r = maxR * Math.max(0, Math.min(1, v));
        const pt = polarToCartesian(cx, cy, r, angle);
        return `${pt.x},${pt.y}`;
    }).join(' ');
}

export default function EmotionRadar({ emotions = {}, size = 200, delay = 0, dark = false }) {
    const cx = size / 2;
    const cy = size / 2;
    const maxR = (size / 2) - 28;
    const values = EMOTION_KEYS.map(k => emotions[k] ?? 0.1);
    const dataPoints = getPolygonPoints(cx, cy, maxR, values);

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            delay,
            withTiming(1, {
                duration: 1200,
                easing: Easing.out(Easing.exp),
            })
        );
    }, [delay]);

    const gridColor = dark ? 'rgba(255,255,255,0.12)' : '#eee';
    const axisColor = dark ? 'rgba(255,255,255,0.08)' : '#eee';

    const rings = [0.25, 0.5, 0.75, 1.0];
    const gridPoints = rings.map(scale =>
        EMOTION_KEYS.map((_, i) => {
            const angle = (360 / EMOTION_KEYS.length) * i;
            const pt = polarToCartesian(cx, cy, maxR * scale, angle);
            return `${pt.x},${pt.y}`;
        }).join(' ')
    );

    // Data layer animates: scale from 0.55 → 1 and opacity 0 → 1
    const dataLayerStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [
            { scale: interpolate(progress.value, [0, 1], [0.55, 1]) },
        ],
    }));

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Static grid layer */}
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                {gridPoints.map((pts, i) => (
                    <Polygon key={i} points={pts} fill="none" stroke={gridColor} strokeWidth={1} />
                ))}
                {EMOTION_KEYS.map((_, i) => {
                    const angle = (360 / EMOTION_KEYS.length) * i;
                    const pt = polarToCartesian(cx, cy, maxR, angle);
                    return (
                        <Line
                            key={i}
                            x1={cx} y1={cy}
                            x2={pt.x} y2={pt.y}
                            stroke={axisColor}
                            strokeWidth={1}
                        />
                    );
                })}
                {/* Labels are always visible */}
                {EMOTION_KEYS.map((_, i) => {
                    const angle = (360 / EMOTION_KEYS.length) * i;
                    const pt = polarToCartesian(cx, cy, maxR + 18, angle);
                    return (
                        <SvgText
                            key={i}
                            x={pt.x}
                            y={pt.y + 4}
                            textAnchor="middle"
                            fontSize={10}
                            fill={COLORS[i]}
                            fontWeight="700"
                        >
                            {LABELS[i]}
                        </SvgText>
                    );
                })}
            </Svg>

            {/* Animated data layer: polygon + dots scale/fade in */}
            <Animated.View style={[StyleSheet.absoluteFill, dataLayerStyle]}>
                <Svg width={size} height={size}>
                    <Polygon
                        points={dataPoints}
                        fill="rgba(255,75,75,0.2)"
                        stroke="#ff4b4b"
                        strokeWidth={2.5}
                    />
                    {values.map((v, i) => {
                        const angle = (360 / values.length) * i;
                        const r = maxR * Math.max(0, Math.min(1, v));
                        const pt = polarToCartesian(cx, cy, r, angle);
                        return (
                            <Circle key={i} cx={pt.x} cy={pt.y} r={4.5} fill={COLORS[i]} />
                        );
                    })}
                </Svg>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
});
