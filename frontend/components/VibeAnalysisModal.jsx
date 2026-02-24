import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import CircularGauge from './CircularGauge';
import EmotionRadar from './EmotionRadar';
import AnimatedProgressBar from './AnimatedProgressBar';
import { SparklesIcon, ChatBubbleBottomCenterTextIcon } from 'react-native-heroicons/outline';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VibeAnalysisModal({ visible, onClose, data }) {
    // animKey forces child components to remount on each open → fresh animations
    const [animKey, setAnimKey] = useState(0);

    const backdropOpacity = useSharedValue(0);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const headerOpacity = useSharedValue(0);
    const headerScale = useSharedValue(0.85);

    useEffect(() => {
        if (visible) {
            // Step 1 (t=0): backdrop + sheet slide up with heavy spring
            backdropOpacity.value = withTiming(1, { duration: 300 });
            translateY.value = withSpring(0, { damping: 14, stiffness: 100 });

            // Step 2 (t=200ms): header scales + fades in
            headerOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
            headerScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 150 }));

            // Force children to remount so their delayed animations restart fresh
            // (CircularGauge @500ms, bars @500/800/1100ms, radar @1400ms)
            setAnimKey(k => k + 1);
        } else {
            backdropOpacity.value = withTiming(0, { duration: 250 });
            translateY.value = withTiming(SCREEN_HEIGHT, {
                duration: 350,
                easing: Easing.in(Easing.cubic),
            });
            headerOpacity.value = withTiming(0, { duration: 150 });
            headerScale.value = withTiming(0.85, { duration: 150 });
        }
    }, [visible]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    const headerStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
        transform: [{ scale: headerScale.value }],
    }));

    if (!data) return null;

    const vibeColor =
        data.sentimentScore >= 70 ? '#4ade80' :
        data.sentimentScore >= 40 ? '#fbbf24' : '#f87171';

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            {/* Dark backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
            </Animated.View>

            {/* Bottom sheet */}
            <Animated.View style={[styles.sheet, sheetStyle]}>
                <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
                    {/* Drag handle */}
                    <View style={styles.handle} />

                    <ScrollView
                        key={animKey}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.content}
                    >
                        {/* Header — t=200ms */}
                        <Animated.View style={[styles.header, headerStyle]}>
                            <Text style={[styles.vibeTag, { color: vibeColor }]}>
                                {(data.vibe || '').toUpperCase()}
                            </Text>
                            <View style={styles.titleRow}>
                                <SparklesIcon size={22} color="#fff" />
                                <Text style={styles.title}>Vibe Analizi</Text>
                                <SparklesIcon size={22} color="#fff" />
                            </View>
                        </Animated.View>

                        <View style={styles.divider} />

                        {/* Gauges — t=500ms each */}
                        <View style={styles.gaugesRow}>
                            <CircularGauge
                                value={data.sentimentScore ?? 0}
                                size={110}
                                label="Uyum"
                                color="#ff4b4b"
                                gradientId="vg1"
                                delay={500}
                                strokeWidth={9}
                                dark
                            />
                            <CircularGauge
                                value={data.compatibilityScore ?? 0}
                                size={110}
                                label="Uzun Vade"
                                color="#818cf8"
                                gradientId="vg2"
                                delay={500}
                                strokeWidth={9}
                                dark
                            />
                            <CircularGauge
                                value={Math.max(0, 100 - (data.toxicityScore ?? 0))}
                                size={110}
                                label="Sağlık"
                                color="#4ade80"
                                gradientId="vg3"
                                delay={500}
                                strokeWidth={9}
                                dark
                            />
                        </View>

                        {/* Progress bars — t=500, 800, 1100ms (300ms stagger) */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Detaylar</Text>
                            <AnimatedProgressBar
                                label="Flört Skoru"
                                value={data.sentimentScore ?? 0}
                                color="#ff4b4b"
                                delay={500}
                            />
                            <AnimatedProgressBar
                                label="Uyumluluk"
                                value={data.compatibilityScore ?? 0}
                                color="#818cf8"
                                delay={800}
                            />
                            <AnimatedProgressBar
                                label="Toksisite"
                                value={data.toxicityScore ?? 0}
                                color="#f87171"
                                delay={1100}
                            />
                        </View>

                        {/* Radar chart — t=1400ms */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Duygu Haritası</Text>
                            <View style={styles.radarContainer}>
                                <EmotionRadar
                                    emotions={data.emotions ?? {}}
                                    size={220}
                                    delay={1400}
                                    dark
                                />
                            </View>
                        </View>

                        {/* Advice */}
                        {data.advice ? (
                            <View style={styles.adviceCard}>
                                <ChatBubbleBottomCenterTextIcon size={22} color="#ff4b4b" />
                                <Text style={styles.adviceText}>{data.advice}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>Kapat</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </BlurView>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: SCREEN_HEIGHT * 0.9,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        shadowColor: '#ff4b4b',
        shadowOpacity: 0.15,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: -6 },
        elevation: 20,
    },
    blurContainer: {
        flex: 1,
        backgroundColor: 'rgba(8, 8, 14, 0.96)',
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 14,
        marginBottom: 4,
    },
    content: {
        padding: 24,
        paddingBottom: 48,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 6,
    },
    vibeTag: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2.8,
        marginBottom: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.07)',
        marginBottom: 26,
    },
    gaugesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 30,
    },
    section: {
        marginBottom: 26,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 14,
    },
    radarContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    adviceCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,75,75,0.08)',
        borderRadius: 14,
        padding: 16,
        borderLeftWidth: 2,
        borderLeftColor: '#ff4b4b',
        marginBottom: 24,
        gap: 10,
    },
    adviceText: {
        flex: 1,
        fontSize: 14,
        color: 'rgba(255,255,255,0.65)',
        lineHeight: 21,
    },
    closeBtn: {
        backgroundColor: '#ff4b4b',
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: '#ff4b4b',
        shadowOpacity: 0.5,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.3,
    },
});
