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
} from 'react-native-reanimated';

// Gently drifting ambient blob
function Blob({ style, color, delay = 0 }) {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        tx.value = withRepeat(
            withSequence(
                withTiming(14, { duration: 6000 + delay, easing: Easing.inOut(Easing.sin) }),
                withTiming(-10, { duration: 5500 + delay, easing: Easing.inOut(Easing.sin) }),
            ),
            -1, true
        );
        ty.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 5200 + delay, easing: Easing.inOut(Easing.sin) }),
                withTiming(14, { duration: 6200 + delay, easing: Easing.inOut(Easing.sin) }),
            ),
            -1, true
        );
        scale.value = withRepeat(
            withSequence(
                withTiming(1.08, { duration: 4800 + delay, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.94, { duration: 5600 + delay, easing: Easing.inOut(Easing.sin) }),
            ),
            -1, true
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
            {/* Deep dark base gradient: near-black deep plum → midnight navy */}
            <LinearGradient
                colors={['#0e0514', '#1b0a35', '#12183d', '#070d1e']}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Subtle ambient blobs — very low opacity */}
            <Blob
                color="rgba(180, 50, 120, 0.18)"
                delay={0}
                style={{ width: 340, height: 340, top: -100, left: -80 }}
            />
            <Blob
                color="rgba(100, 60, 200, 0.14)"
                delay={900}
                style={{ width: 300, height: 300, top: 140, right: -80 }}
            />
            <Blob
                color="rgba(30, 80, 180, 0.12)"
                delay={1800}
                style={{ width: 260, height: 260, bottom: 40, left: 20 }}
            />
            <Blob
                color="rgba(160, 40, 100, 0.10)"
                delay={500}
                style={{ width: 200, height: 200, bottom: 160, right: 10 }}
            />

            {/* Very subtle top-left highlight */}
            <LinearGradient
                colors={['rgba(255,255,255,0.04)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.7 }}
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
    },
    highlightOverlay: {
        opacity: 0.8,
    },
});
