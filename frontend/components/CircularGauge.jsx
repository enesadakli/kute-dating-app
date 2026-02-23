import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function CircularGauge({
    value = 0,
    size = 100,
    label = '',
    color = '#ff4b4b',
    gradientId,
    delay = 0,
    strokeWidth = 8,
    dark = false,
}) {
    const radius = (size - strokeWidth * 2 - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(
            delay,
            withTiming(value / 100, {
                duration: 1200,
                easing: Easing.out(Easing.cubic),
            })
        );
    }, [value, delay]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    const gid = gradientId || `grad_${label.replace(/\s/g, '_')}_${delay}`;
    const trackColor = dark ? 'rgba(255,255,255,0.08)' : '#eee';
    const labelColor = dark ? 'rgba(255,255,255,0.45)' : '#aaa';

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} style={styles.svg}>
                <Defs>
                    <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor={color} stopOpacity="1" />
                        <Stop offset="100%" stopColor={color} stopOpacity="0.45" />
                    </LinearGradient>
                </Defs>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`url(#${gid})`}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    transform={`rotate(-90, ${size / 2}, ${size / 2})`}
                />
            </Svg>
            <View style={styles.center}>
                <Text style={[styles.value, { color, fontSize: Math.round(size * 0.22) }]}>
                    {value}
                </Text>
                <Text style={[styles.label, { color: labelColor, fontSize: Math.round(size * 0.1) }]}>
                    {label}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        position: 'absolute',
    },
    center: {
        alignItems: 'center',
    },
    value: {
        fontWeight: '800',
    },
    label: {
        textAlign: 'center',
        marginTop: 2,
        fontWeight: '500',
    },
});
