import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withSequence,
    withDelay,
    withRepeat,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: W, height: H } = Dimensions.get('window');

const PARTICLE_COUNT = 18;
const PARTICLE_COLORS = ['#ff4b4b', '#ff9f43', '#ffd32a', '#0be881', '#67e8f9', '#a78bfa', '#f472b6'];

function Particle({ index }) {
    const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
    const distance = 80 + Math.random() * 80;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 40;
    const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
    const size = 8 + Math.random() * 8;

    const progress = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        progress.value = withDelay(
            index * 30,
            withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) })
        );
        opacity.value = withDelay(
            index * 30 + 500,
            withTiming(0, { duration: 400 })
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: progress.value * tx },
            { translateY: progress.value * ty },
            { scale: interpolate(progress.value, [0, 0.3, 1], [0, 1.2, 0.8]) },
        ],
        opacity: opacity.value,
        backgroundColor: color,
        borderRadius: size / 2,
        width: size,
        height: size,
        position: 'absolute',
    }));

    return <Animated.View style={style} />;
}

export default function MatchCelebration({ visible, matchName, currentUserName, onContinue }) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const heartScale = useSharedValue(0);
    const heartRotate = useSharedValue(-10);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 300 });
            scale.value = withSpring(1, { damping: 14, stiffness: 180 });
            heartScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 200 }));
            heartRotate.value = withDelay(
                300,
                withRepeat(
                    withSequence(
                        withTiming(-8, { duration: 200 }),
                        withTiming(8, { duration: 200 }),
                    ),
                    3,
                    true
                )
            );
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        } else {
            opacity.value = withTiming(0, { duration: 200 });
            scale.value = withTiming(0.8, { duration: 200 });
        }
    }, [visible]);

    const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    const heartStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: heartScale.value },
            { rotate: `${heartRotate.value}deg` },
        ],
    }));

    if (!visible) return null;

    return (
        <Animated.View style={[styles.overlay, overlayStyle]}>
            <Animated.View style={[styles.card, cardStyle]}>
                {/* Particles */}
                <View style={styles.particleContainer} pointerEvents="none">
                    {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
                        <Particle key={i} index={i} />
                    ))}
                </View>

                {/* Avatars + Heart */}
                <View style={styles.avatarsRow}>
                    <View style={[styles.avatar, styles.avatarLeft]}>
                        <Text style={styles.avatarText}>
                            {(currentUserName || '?')[0].toUpperCase()}
                        </Text>
                    </View>

                    <Animated.Text style={[styles.heartEmoji, heartStyle]}>💕</Animated.Text>

                    <View style={[styles.avatar, styles.avatarRight]}>
                        <Text style={styles.avatarText}>
                            {(matchName || '?')[0].toUpperCase()}
                        </Text>
                    </View>
                </View>

                <Text style={styles.title}>It's a Match!</Text>
                <Text style={styles.subtitle}>
                    Sen ve <Text style={styles.name}>{matchName}</Text> birbirinizi beğendiniz ✨
                </Text>

                <TouchableOpacity style={styles.button} onPress={onContinue}>
                    <Text style={styles.buttonText}>Mesaj Gönder 💬</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipBtn} onPress={onContinue}>
                    <Text style={styles.skipText}>Şimdi değil</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 32,
        alignItems: 'center',
        width: W * 0.85,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
    },
    particleContainer: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#ff4b4b',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarLeft: { backgroundColor: '#ff4b4b' },
    avatarRight: { backgroundColor: '#6366f1' },
    avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    heartEmoji: { fontSize: 32 },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#ff4b4b',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    name: { fontWeight: '700', color: '#333' },
    button: {
        backgroundColor: '#ff4b4b',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#ff4b4b',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    skipBtn: { paddingVertical: 8 },
    skipText: { color: '#bbb', fontSize: 14 },
});
