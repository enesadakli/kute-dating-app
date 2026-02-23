import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { usePressScale, useHeartPop } from '../hooks/useMicroInteractions';

export function LikeButton({ onPress }) {
    const { scale, onPressIn, onPressOut } = usePressScale(0.88);
    const { scale: heartScale, pop } = useHeartPop();

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const heartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
    }));

    const handlePress = () => {
        pop();
        if (onPress) onPress();
    };

    return (
        <TouchableOpacity
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={handlePress}
            activeOpacity={1}
        >
            <Animated.View style={[styles.button, styles.likeButton, containerStyle]}>
                <Animated.Text style={[styles.icon, heartStyle]}>♥</Animated.Text>
                <Text style={styles.likeText}>Like</Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

export function NopeButton({ onPress }) {
    const { scale, onPressIn, onPressOut } = usePressScale(0.88);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <TouchableOpacity
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={onPress}
            activeOpacity={1}
        >
            <Animated.View style={[styles.button, styles.nopeButton, containerStyle]}>
                <Text style={styles.nopeIcon}>✗</Text>
                <Text style={styles.nopeText}>Nope</Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 36,
        borderRadius: 30,
        gap: 6,
    },
    likeButton: {
        backgroundColor: '#ff4b4b',
        shadowColor: '#ff4b4b',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    nopeButton: {
        backgroundColor: '#f8f8f8',
        borderWidth: 1.5,
        borderColor: '#e0e0e0',
    },
    icon: { fontSize: 18, color: '#fff' },
    likeText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    nopeIcon: { fontSize: 18, color: '#888' },
    nopeText: { fontSize: 16, fontWeight: '700', color: '#666' },
});
