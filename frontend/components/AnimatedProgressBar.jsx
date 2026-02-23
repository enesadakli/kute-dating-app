import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';

export default function AnimatedProgressBar({ label, value = 0, color = '#ff4b4b', delay = 0 }) {
    const width = useSharedValue(0);

    useEffect(() => {
        width.value = withDelay(
            delay,
            withTiming(value, {
                duration: 1400,
                easing: Easing.out(Easing.exp),
            })
        );
    }, [value, delay]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${width.value}%`,
    }));

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Text style={styles.label}>{label}</Text>
                <Text style={[styles.valueText, { color }]}>{Math.round(value)}</Text>
            </View>
            <View style={styles.track}>
                <Animated.View style={[styles.fill, { backgroundColor: color }, barStyle]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 18 },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 7,
    },
    label: { fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: '500', letterSpacing: 0.2 },
    valueText: { fontSize: 14, fontWeight: '700' },
    track: {
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    fill: {
        height: 5,
        borderRadius: 3,
    },
});
