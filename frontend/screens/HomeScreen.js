import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, Image,
    Animated, PanResponder, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { authHeader } from '../utils/auth';
import { LikeButton, NopeButton } from '../components/AnimatedLikeButton';
import MatchCelebration from '../components/MatchCelebration';
import GradientBackground from '../components/GradientBackground';
import {
    HeartIcon, XMarkIcon, FaceSmileIcon,
} from 'react-native-heroicons/outline';
import { HeartIcon as HeartSolid } from 'react-native-heroicons/solid';

const API_URL = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:3001';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.68, 540);

function calcAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

// Photo carousel shown inside each card
function CardPhotos({ photos, photoIndex, onLeft, onRight }) {
    const photo = photos?.[photoIndex];
    return (
        <View style={styles.photoContainer}>
            {photo ? (
                <Image
                    source={{ uri: `${BASE_URL}${photo}` }}
                    style={styles.cardFullPhoto}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.photoPlaceholder}>
                    <FaceSmileIcon size={64} color="rgba(255,255,255,0.25)" />
                </View>
            )}

            {/* Tap zones for navigation */}
            {photos?.length > 1 && (
                <>
                    <TouchableOpacity style={styles.tapLeft} onPress={onLeft} activeOpacity={1} />
                    <TouchableOpacity style={styles.tapRight} onPress={onRight} activeOpacity={1} />
                </>
            )}

            {/* Progress bars */}
            {photos?.length > 1 && (
                <View style={styles.progressBars}>
                    {photos.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.progressBar,
                                i === photoIndex ? styles.progressBarActive : styles.progressBarInactive,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

export default function HomeScreen({ route, navigation }) {
    const { user } = route.params || {};
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [celebration, setCelebration] = useState({ visible: false, matchName: '' });
    const [photoIndex, setPhotoIndex] = useState(0);
    const position = useRef(new Animated.ValueXY()).current;

    const currentUserRef = useRef(null);
    useEffect(() => {
        currentUserRef.current = users[0] || null;
        setPhotoIndex(0); // reset carousel when top card changes
    }, [users[0]?._id]);

    useFocusEffect(
        useCallback(() => {
            fetchUsers();
        }, [])
    );

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const headers = authHeader();
            const [usersRes, interactedRes] = await Promise.all([
                axios.get(`${API_URL}/users`, { headers }),
                axios.get(`${API_URL}/matches/interacted/${user._id}`, { headers }),
            ]);
            const interactedIds = new Set(interactedRes.data);
            const myId = user?._id?.toString();
            const filtered = usersRes.data.filter(
                u => u._id.toString() !== myId && !interactedIds.has(u._id)
            );
            setUsers(filtered);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (toUser) => {
        try {
            const response = await axios.post(`${API_URL}/matches/like`, {
                fromUserId: user._id,
                toUserId: toUser._id,
            }, { headers: authHeader() });
            if (response.data.matched) {
                setCelebration({ visible: true, matchName: toUser.name });
            }
        } catch (error) {
            console.error('Error liking user:', error);
        }
    };

    const handleNope = async (toUser) => {
        try {
            await axios.post(`${API_URL}/matches/nope`, {
                fromUserId: user._id,
                toUserId: toUser._id,
            }, { headers: authHeader() });
        } catch (error) {
            console.error('Error noping user:', error);
        }
    };

    const onSwipeCompleteRef = useRef(null);
    onSwipeCompleteRef.current = (direction) => {
        const item = currentUserRef.current;
        if (!item) return;
        if (direction === 'right') handleLike(item);
        else handleNope(item);
        position.setValue({ x: 0, y: 0 });
        setUsers(prev => prev.slice(1));
    };

    const swipeOutRef = useRef(null);
    swipeOutRef.current = (direction) => {
        const x = direction === 'right' ? SCREEN_WIDTH + 200 : -SCREEN_WIDTH - 200;
        Animated.spring(position, {
            toValue: { x, y: direction === 'right' ? -30 : -30 },
            useNativeDriver: false,
            speed: 14,
            bounciness: 2,
        }).start(() => onSwipeCompleteRef.current(direction));
    };

    const resetPosition = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 40,
            useNativeDriver: false,
        }).start();
    };

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
            position.setValue({ x: gesture.dx, y: gesture.dy * 0.25 });
        },
        onPanResponderRelease: (_, gesture) => {
            if (gesture.dx > SWIPE_THRESHOLD) swipeOutRef.current('right');
            else if (gesture.dx < -SWIPE_THRESHOLD) swipeOutRef.current('left');
            else resetPosition();
        },
    })).current;

    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        outputRange: ['-18deg', '0deg', '18deg'],
    });
    const likeOpacity = position.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD * 0.6],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const nopeOpacity = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD * 0.6, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });
    const cardAnimStyle = {
        transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
    };

    if (loading) {
        return (
            <GradientBackground>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" />
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerLogo}>kute</Text>
            </View>

            {users.length === 0 ? (
                /* Empty state */
                <View style={styles.centered}>
                    <HeartSolid size={56} color="rgba(192,38,211,0.4)" />
                    <Text style={styles.emptyTitle}>Hepsi bu kadar!</Text>
                    <Text style={styles.emptySubText}>Yeni kullanıcılar gelince burada görünecek.</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchUsers}>
                        <Text style={styles.refreshBtnText}>Yenile</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.cardArea}>
                    {/* Background (next) card */}
                    {users.length > 1 && (
                        <View style={[styles.card, styles.nextCard]}>
                            <CardPhotos photos={users[1].photos} photoIndex={0} />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.82)']}
                                style={styles.cardOverlay}
                            >
                                <Text style={styles.cardName}>
                                    {users[1].name}
                                    {calcAge(users[1].birthDate) ? `, ${calcAge(users[1].birthDate)}` : ''}
                                </Text>
                            </LinearGradient>
                        </View>
                    )}

                    {/* Swipeable top card */}
                    <Animated.View
                        style={[styles.card, cardAnimStyle]}
                        {...panResponder.panHandlers}
                    >
                        {/* LIKE stamp */}
                        <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
                            <HeartIcon size={18} color="#4ade80" />
                            <Text style={styles.likeStampText}>LIKE</Text>
                        </Animated.View>
                        {/* NOPE stamp */}
                        <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
                            <XMarkIcon size={18} color="#f87171" />
                            <Text style={styles.nopeStampText}>NOPE</Text>
                        </Animated.View>

                        <CardPhotos
                            photos={users[0].photos}
                            photoIndex={photoIndex}
                            onLeft={() => setPhotoIndex(i => Math.max(0, i - 1))}
                            onRight={() => setPhotoIndex(i => Math.min((users[0].photos?.length || 1) - 1, i + 1))}
                        />

                        {/* Bottom gradient overlay with name/bio */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.75)']}
                            style={styles.cardOverlay}
                            pointerEvents="none"
                        >
                            <Text style={styles.cardName}>
                                {users[0].name}
                                {calcAge(users[0].birthDate) ? `, ${calcAge(users[0].birthDate)}` : ''}
                            </Text>
                            {users[0].bio ? (
                                <Text style={styles.cardBio} numberOfLines={2}>{users[0].bio}</Text>
                            ) : null}
                        </LinearGradient>
                    </Animated.View>

                    {/* Action buttons below card */}
                    <View style={styles.actionContainer}>
                        <NopeButton onPress={() => swipeOutRef.current('left')} />
                        <LikeButton onPress={() => swipeOutRef.current('right')} />
                    </View>
                </View>
            )}

            <MatchCelebration
                visible={celebration.visible}
                matchName={celebration.matchName}
                currentUserName={user?.name}
                onContinue={() => setCelebration({ visible: false, matchName: '' })}
            />
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        alignItems: 'center',
    },
    headerLogo: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1.5,
    },
    cardArea: {
        flex: 1,
        alignItems: 'center',
    },
    card: {
        position: 'absolute',
        top: 6,
        left: 14,
        right: 14,
        height: CARD_HEIGHT,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#1a0a30',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 24,
        elevation: 16,
    },
    nextCard: {
        top: 18,
        transform: [{ scale: 0.96 }],
        zIndex: -1,
    },
    photoContainer: {
        flex: 1,
        position: 'relative',
    },
    cardFullPhoto: {
        width: '100%',
        height: '100%',
    },
    photoPlaceholder: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tapLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '40%',
        height: '100%',
    },
    tapRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: '40%',
        height: '100%',
    },
    progressBars: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        flexDirection: 'row',
        gap: 4,
    },
    progressBar: {
        flex: 1,
        height: 3,
        borderRadius: 2,
    },
    progressBarActive: {
        backgroundColor: 'rgba(255,255,255,0.92)',
    },
    progressBarInactive: {
        backgroundColor: 'rgba(255,255,255,0.32)',
    },
    cardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 18,
        paddingBottom: 18,
        paddingTop: 60,
    },
    cardName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.3,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    cardBio: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.78)',
        marginTop: 4,
        lineHeight: 20,
    },
    stamp: {
        position: 'absolute',
        top: 30,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderWidth: 3,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    likeStamp: {
        left: 18,
        borderColor: '#4ade80',
        backgroundColor: 'rgba(0,0,0,0.3)',
        transform: [{ rotate: '-18deg' }],
    },
    nopeStamp: {
        right: 18,
        borderColor: '#f87171',
        backgroundColor: 'rgba(0,0,0,0.3)',
        transform: [{ rotate: '18deg' }],
    },
    likeStampText: { color: '#4ade80', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
    nopeStampText: { color: '#f87171', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
    actionContainer: {
        position: 'absolute',
        bottom: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 36,
    },
    // Empty state
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        marginTop: 18,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    refreshBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    refreshBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
