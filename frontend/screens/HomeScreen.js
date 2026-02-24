import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, Image,
    Animated, PanResponder, Dimensions, TouchableOpacity
} from 'react-native';

const BASE_URL = 'http://localhost:3001';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { authHeader } from '../utils/auth';
import { LikeButton, NopeButton } from '../components/AnimatedLikeButton';
import MatchCelebration from '../components/MatchCelebration';
import GradientBackground from '../components/GradientBackground';
import { ChatBubbleLeftRightIcon, HeartIcon, XMarkIcon } from 'react-native-heroicons/outline';

const API_URL = 'http://localhost:3001/api';
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function HomeScreen({ route, navigation }) {
    const { user } = route.params || {};
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [celebration, setCelebration] = useState({ visible: false, matchName: '' });
    const position = useRef(new Animated.ValueXY()).current;

    const currentUserRef = useRef(null);
    useEffect(() => {
        currentUserRef.current = users[0] || null;
    }, [users]);

    useFocusEffect(
        useCallback(() => {
            fetchUsers();
        }, [])
    );

    const fetchUsers = async () => {
        try {
            const headers = authHeader();
            const [usersRes, interactedRes] = await Promise.all([
                axios.get(`${API_URL}/users`, { headers }),
                axios.get(`${API_URL}/matches/interacted/${user._id}`, { headers }),
            ]);
            const interactedIds = new Set(interactedRes.data);
            const myId = user?._id?.toString();
            const otherUsers = usersRes.data.filter(
                u => u._id.toString() !== myId && !interactedIds.has(u._id)
            );
            setUsers(otherUsers);
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
        const x = direction === 'right' ? SCREEN_WIDTH + 150 : -SCREEN_WIDTH - 150;
        Animated.timing(position, {
            toValue: { x, y: 0 },
            duration: 300,
            useNativeDriver: false,
        }).start(() => onSwipeCompleteRef.current(direction));
    };

    const resetPosition = () => {
        Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
        }).start();
    };

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
            position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
        },
        onPanResponderRelease: (_, gesture) => {
            if (gesture.dx > SWIPE_THRESHOLD) {
                swipeOutRef.current('right');
            } else if (gesture.dx < -SWIPE_THRESHOLD) {
                swipeOutRef.current('left');
            } else {
                resetPosition();
            }
        },
    })).current;

    const rotate = position.x.interpolate({
        inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        outputRange: ['-20deg', '0deg', '20deg'],
    });

    const likeOpacity = position.x.interpolate({
        inputRange: [0, SWIPE_THRESHOLD],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const nopeOpacity = position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const cardAnimStyle = {
        transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
        ],
    };

    if (loading) {
        return (
            <GradientBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            {/* Glass header */}
            <BlurView intensity={20} tint="light" style={styles.header}>
                <Text style={styles.headerTitle}>Discover</Text>
                <TouchableOpacity
                    style={styles.matchesBtn}
                    onPress={() => navigation.navigate('Matches', { user })}
                >
                    <ChatBubbleLeftRightIcon size={22} color="#fff" />
                    <Text style={styles.matchesLink}>Matches</Text>
                </TouchableOpacity>
            </BlurView>

            {users.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No more users to discover!</Text>
                    <Text style={styles.emptySubText}>Check your matches</Text>
                </View>
            ) : (
                <View style={styles.cardArea}>
                    {/* Background card */}
                    {users.length > 1 && (
                        <View style={[styles.card, styles.nextCard]}>
                            <View style={styles.cardContent}>
                                {users[1].photos?.[0] ? (
                                    <Image
                                        source={{ uri: `${BASE_URL}${users[1].photos[0]}` }}
                                        style={styles.cardPhoto}
                                    />
                                ) : (
                                    <View style={styles.avatarLarge}>
                                        <Text style={styles.avatarText}>
                                            {users[1].name[0].toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.name}>{users[1].name}</Text>
                                <Text style={styles.bio}>{users[1].bio || 'No bio provided'}</Text>
                            </View>
                        </View>
                    )}

                    {/* Swipeable top card */}
                    <Animated.View
                        style={[styles.card, cardAnimStyle]}
                        {...panResponder.panHandlers}
                    >
                        <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
                            <HeartIcon size={16} color="#4caf50" />
                            <Text style={styles.likeStampText}>LIKE</Text>
                        </Animated.View>

                        <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
                            <XMarkIcon size={16} color="#ff4b4b" />
                            <Text style={styles.nopeStampText}>NOPE</Text>
                        </Animated.View>

                        <View style={styles.cardContent}>
                            {users[0].photos?.[0] ? (
                                <Image
                                    source={{ uri: `${BASE_URL}${users[0].photos[0]}` }}
                                    style={styles.cardPhoto}
                                />
                            ) : (
                                <View style={styles.avatarLarge}>
                                    <Text style={styles.avatarText}>
                                        {users[0].name[0].toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <Text style={styles.name}>{users[0].name}</Text>
                            <Text style={styles.bio}>{users[0].bio || 'No bio provided'}</Text>
                        </View>

                        <View style={styles.actionContainer}>
                            <NopeButton onPress={() => swipeOutRef.current('left')} />
                            <LikeButton onPress={() => swipeOutRef.current('right')} />
                        </View>
                    </Animated.View>
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    matchesBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    matchesLink: { fontSize: 16, color: '#fff', fontWeight: '600' },
    cardArea: { flex: 1 },
    card: {
        position: 'absolute',
        top: 30,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 20,
        elevation: 10,
    },
    nextCard: {
        top: 42,
        transform: [{ scale: 0.97 }],
        zIndex: -1,
    },
    cardContent: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    cardPhoto: {
        width: 160,
        height: 200,
        borderRadius: 20,
        marginBottom: 20,
        backgroundColor: '#eee',
    },
    avatarLarge: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#ff4b4b',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#ff4b4b',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    avatarText: { color: '#fff', fontSize: 50, fontWeight: 'bold' },
    name: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, textAlign: 'center', color: '#111' },
    bio: { fontSize: 16, color: '#888', textAlign: 'center', paddingHorizontal: 10 },
    stamp: {
        position: 'absolute',
        top: 30,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 3,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    likeStamp: {
        left: 20,
        borderColor: '#4caf50',
        transform: [{ rotate: '-15deg' }],
    },
    nopeStamp: {
        right: 20,
        borderColor: '#ff4b4b',
        transform: [{ rotate: '15deg' }],
    },
    likeStampText: { color: '#4caf50', fontSize: 22, fontWeight: 'bold' },
    nopeStampText: { color: '#ff4b4b', fontSize: 22, fontWeight: 'bold' },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        paddingBottom: 10,
    },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontWeight: '600' },
    emptySubText: { fontSize: 15, color: 'rgba(255,255,255,0.6)' },
});
