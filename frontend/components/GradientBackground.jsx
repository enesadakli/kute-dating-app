import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    interpolate,
} from 'react-native-reanimated';

// Soft animated blob that drifts slowly
function Blob({ style, color, delay = 0 }) {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        tx.value = withRepeat(
            withSequence(
                withTiming(18, { duration: 5000 + delay, easing: Easing.inOut(Easing.sin) }),
                withTiming(-12, { duration: 4500 + delay, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true
        );
        ty.value = withRepeat(
            withSequence(
                withTiming(-14, { duration: 4200 + delay, easing: Easing.inOut(Easing.sin) }),
                withTiming(20, { duration: 5200 + delay, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true
        );
        scale.value = withRepeat(
            withSequence(
                withTiming(1.12, { duration: 3800 + delay, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.92, { duration: 4600 + delay, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            true
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: scale.value },
        ],
    }));

    return (
        <Animated.View
            style={[styles.blob, style, animStyle, { backgroundColor: color }]}
        />
    );
}

export default function GradientBackground({ children, style }) {
    return (
        <View style={[styles.root, style]}>
            {/* Base gradient: pink → purple → deep blue */}
            <LinearGradient
                colors={['#ff2d78', '#c026d3', '#7c3aed', '#2563eb']}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Blob overlays for abstract depth */}
            <Blob
                color="rgba(255, 60, 130, 0.35)"
                delay={0}
                style={{ width: 320, height: 320, top: -80, left: -60 }}
            />
            <Blob
                color="rgba(139, 92, 246, 0.30)"
                delay={800}
                style={{ width: 280, height: 280, top: 120, right: -70 }}
            />
            <Blob
                color="rgba(37, 99, 235, 0.28)"
                delay={1600}
                style={{ width: 240, height: 240, bottom: 60, left: 30 }}
            />
            <Blob
                color="rgba(236, 72, 153, 0.22)"
                delay={400}
                style={{ width: 180, height: 180, bottom: 180, right: 20 }}
            />

            {/* Subtle top highlight */}
            <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.6 }}
                style={[StyleSheet.absoluteFill, styles.highlightOverlay]}
            />

            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
        // blur effect via opacity layering (expo-blur not needed here)
    },
    highlightOverlay: {
        opacity: 0.6,
    },
});
