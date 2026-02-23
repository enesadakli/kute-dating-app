import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
} from 'react-native-reanimated';

function Dot({ delay }) {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(-7, { duration: 280 }),
                    withTiming(0, { duration: 280 }),
                ),
                -1,
                false
            )
        );
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 280 }),
                    withTiming(0.4, { duration: 280 }),
                ),
                -1,
                false
            )
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return <Animated.View style={[styles.dot, style]} />;
}

export default function TypingIndicator({ name }) {
    return (
        <View style={styles.container}>
            <View style={styles.bubble}>
                <Dot delay={0} />
                <Dot delay={160} />
                <Dot delay={320} />
            </View>
            {name && <Text style={styles.label}>{name} yazıyor...</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 6,
        gap: 8,
    },
    bubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 5,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#999',
    },
    label: {
        fontSize: 12,
        color: '#aaa',
        fontStyle: 'italic',
    },
});
