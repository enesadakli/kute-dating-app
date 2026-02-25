import { useSharedValue, withSequence, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Smooth ease-out curve — fast start, gentle settle (no bounce)
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

// Press scale animation
export function usePressScale(scaleTo = 0.92) {
    const scale = useSharedValue(1);

    const onPressIn = () => {
        scale.value = withTiming(scaleTo, { duration: 110, easing: Easing.out(Easing.quad) });
    };

    const onPressOut = () => {
        scale.value = withTiming(1, { duration: 280, easing: easeOut });
    };

    return { scale, onPressIn, onPressOut };
}

// Heart icon animation for like button
export function useHeartPop() {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const pop = (callback) => {
        scale.value = withSequence(
            withTiming(1.18, { duration: 140, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: 260, easing: easeOut }),
        );
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}
        if (callback) {
            setTimeout(callback, 200);
        }
    };

    return { scale, opacity, pop };
}

// Shake animation for nope
export function useShake() {
    const translateX = useSharedValue(0);

    const shake = () => {
        translateX.value = withSequence(
            withTiming(-8, { duration: 55, easing: Easing.out(Easing.quad) }),
            withTiming(8, { duration: 55 }),
            withTiming(-6, { duration: 55 }),
            withTiming(6, { duration: 55 }),
            withTiming(0, { duration: 55, easing: easeOut }),
        );
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
    };

    return { translateX, shake };
}
