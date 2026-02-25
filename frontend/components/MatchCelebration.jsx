import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { HeartIcon, PaperAirplaneIcon } from 'react-native-heroicons/solid';

const { width: W } = Dimensions.get('window');

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

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
            index * 25,
            withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
        );
        opacity.value = withDelay(
            index * 25 + 400,
            withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) })
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: progress.value * tx },
            { translateY: progress.value * ty },
            { scale: interpolate(progress.value, [0, 0.25, 1], [0, 1.05, 0.85]) },
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
    const scale = useSharedValue(0.88);
    const opacity = useSharedValue(0);
    const heartScale = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
            scale.value = withTiming(1, { duration: 320, easing: easeOut });
            heartScale.value = withDelay(180, withTiming(1, { duration: 280, easing: easeOut }));
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        } else {
            opacity.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.quad) });
            scale.value = withTiming(0.92, { duration: 180, easing: Easing.in(Easing.quad) });
        }
    }, [visible]);

    const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const cardScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    const heartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
    }));

    if (!visible) return null;

    return (
        <Animated.View style={[styles.overlay, overlayStyle]}>
            <Animated.View style={cardScaleStyle}>
                <BlurView intensity={40} tint="dark" style={styles.card}>
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

                        <Animated.View style={[styles.heartEmoji, heartStyle]}>
                            <HeartIcon size={34} color="#ff4b8b" />
                        </Animated.View>

                        <View style={[styles.avatar, styles.avatarRight]}>
                            <Text style={styles.avatarText}>
                                {(matchName || '?')[0].toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.title}>It's a Match!</Text>
                    <Text style={styles.subtitle}>
                        Sen ve <Text style={styles.name}>{matchName}</Text> birbirinizi beğendiniz
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={onContinue}>
                        <PaperAirplaneIcon size={18} color="#fff" />
                        <Text style={styles.buttonText}>Mesaj Gönder</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipBtn} onPress={onContinue}>
                        <Text style={styles.skipText}>Şimdi değil</Text>
                    </TouchableOpacity>
                </BlurView>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.72)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    card: {
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        width: W * 0.85,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        shadowColor: '#000',
        shadowOpacity: 0.45,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 10 },
        elevation: 16,
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
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarLeft: { backgroundColor: 'rgba(255,75,75,0.65)' },
    avatarRight: { backgroundColor: 'rgba(99,102,241,0.65)' },
    avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    heartEmoji: {},
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ff6b9d',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.55)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    name: { fontWeight: '700', color: '#fff' },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(192,38,211,0.8)',
        borderRadius: 7,
        paddingVertical: 14,
        paddingHorizontal: 32,
        width: '100%',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    skipBtn: { paddingVertical: 8 },
    skipText: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
});
