import { useSharedValue, withSpring, withSequence, withTiming, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Press scale animation — wrap a component with this
export function usePressScale(scaleTo = 0.92) {
    const scale = useSharedValue(1);

    const onPressIn = () => {
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 });
    };

    const onPressOut = () => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    };

    return { scale, onPressIn, onPressOut };
}

// Heart pop animation for like
export function useHeartPop() {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const pop = (callback) => {
        scale.value = withSequence(
            withTiming(1.4, { duration: 180 }),
            withSpring(1, { damping: 10, stiffness: 300 }),
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
            withTiming(-10, { duration: 60 }),
            withTiming(10, { duration: 60 }),
            withTiming(-8, { duration: 60 }),
            withTiming(8, { duration: 60 }),
            withTiming(0, { duration: 60 }),
        );
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
    };

    return { translateX, shake };
}
