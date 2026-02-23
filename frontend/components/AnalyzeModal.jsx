import React, { useEffect } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import CircularGauge from './CircularGauge';
import EmotionRadar from './EmotionRadar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function SentimentBar({ label, value, color }) {
    const width = useSharedValue(0);

    useEffect(() => {
        width.value = withTiming(value, {
            duration: 1000,
            easing: Easing.out(Easing.cubic),
        });
    }, [value]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${width.value}%`,
    }));

    return (
        <View style={barStyles.container}>
            <View style={barStyles.labelRow}>
                <Text style={barStyles.label}>{label}</Text>
                <Text style={[barStyles.value, { color }]}>{value}</Text>
            </View>
            <View style={barStyles.track}>
                <Animated.View style={[barStyles.fill, { backgroundColor: color }, barStyle]} />
            </View>
        </View>
    );
}

const barStyles = StyleSheet.create({
    container: { marginBottom: 12 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    label: { fontSize: 13, color: '#666' },
    value: { fontSize: 13, fontWeight: 'bold' },
    track: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
    fill: { height: 8, borderRadius: 4 },
});

export default function AnalyzeModal({ visible, onClose, data }) {
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 300 });
            translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
        } else {
            opacity.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
        }
    }, [visible]);

    const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

    if (!data) return null;

    const vibeColor =
        data.sentimentScore >= 70 ? '#4ade80' :
        data.sentimentScore >= 40 ? '#fbbf24' : '#f87171';

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <Animated.View style={[styles.overlay, overlayStyle]}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
            </Animated.View>

            <Animated.View style={[styles.sheet, sheetStyle]}>
                <BlurView intensity={40} tint="light" style={styles.blurContainer}>
                    {/* Handle bar */}
                    <View style={styles.handle} />

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.vibe, { color: vibeColor }]}>{data.vibe}</Text>
                            <Text style={styles.title}>Vibe Analizi ✨</Text>
                        </View>

                        {/* Gauges row */}
                        <View style={styles.gaugesRow}>
                            <CircularGauge
                                value={data.sentimentScore}
                                size={100}
                                label={'Uyum'}
                                color="#ff4b4b"
                                gradientId="gauge1"
                            />
                            <CircularGauge
                                value={data.compatibilityScore}
                                size={100}
                                label={'Uzun Vade'}
                                color="#6366f1"
                                gradientId="gauge2"
                            />
                            <CircularGauge
                                value={100 - data.toxicityScore}
                                size={100}
                                label={'Sağlık'}
                                color="#4ade80"
                                gradientId="gauge3"
                            />
                        </View>

                        {/* Bars */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Detaylar</Text>
                            <SentimentBar label="Flört Skoru" value={data.sentimentScore} color="#ff4b4b" />
                            <SentimentBar label="Uyumluluk" value={data.compatibilityScore} color="#6366f1" />
                            <SentimentBar label="Toksisite" value={data.toxicityScore} color="#f87171" />
                        </View>

                        {/* Radar */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Duygu Haritası</Text>
                            <View style={styles.radarContainer}>
                                <EmotionRadar emotions={data.emotions} size={200} />
                            </View>
                        </View>

                        {/* Advice */}
                        <View style={styles.adviceCard}>
                            <Text style={styles.adviceIcon}>💬</Text>
                            <Text style={styles.adviceText}>{data.advice}</Text>
                        </View>

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
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: { flex: 1 },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: SCREEN_HEIGHT * 0.88,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    blurContainer: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.92)',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#ddd',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    vibe: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111',
    },
    gaugesRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    radarContainer: {
        alignItems: 'center',
    },
    adviceCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,75,75,0.06)',
        borderRadius: 14,
        padding: 14,
        borderLeftWidth: 3,
        borderLeftColor: '#ff4b4b',
        marginBottom: 20,
        gap: 10,
    },
    adviceIcon: { fontSize: 20 },
    adviceText: {
        flex: 1,
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
    },
    closeBtn: {
        backgroundColor: '#ff4b4b',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
