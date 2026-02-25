import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { authHeader } from '../utils/auth';
import GradientBackground from '../components/GradientBackground';
import { HeartIcon, CheckIcon } from 'react-native-heroicons/outline';
import { CheckIcon as CheckSolid } from 'react-native-heroicons/solid';

const API_URL = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:3001';

function formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Şimdi';
    if (diffMin < 60) return `${diffMin}d`;
    if (diffDay < 1) return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (diffDay < 7) return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][date.getDay()];
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
}

export default function MatchesScreen({ route, navigation }) {
    const { user } = route.params || {};
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchMatches();
        }, [])
    );

    const fetchMatches = async () => {
        try {
            const response = await axios.get(`${API_URL}/matches/${user._id}`, { headers: authHeader() });
            setMatches(response.data);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => {
        const msg = item.lastMessage;
        const isUnread = msg && !msg.isFromMe && !msg.seen;

        return (
            <TouchableOpacity
                style={styles.matchItem}
                onPress={() => navigation.navigate('Chat', {
                    matchId: item.matchId,
                    user,
                    matchName: item.user.name,
                    matchPhoto: item.user.photos?.[0] || null,
                })}
            >
                {item.user.photos?.[0] ? (
                    <Image
                        source={{ uri: `${BASE_URL}${item.user.photos[0]}` }}
                        style={styles.avatarPhoto}
                    />
                ) : (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.user.name[0].toUpperCase()}</Text>
                    </View>
                )}
                <View style={styles.matchInfo}>
                    <Text style={[styles.matchName, isUnread && styles.matchNameUnread]}>
                        {item.user.name}
                    </Text>
                    {msg ? (
                        <Text style={[styles.lastMsg, isUnread && styles.lastMsgUnread]} numberOfLines={1}>
                            {msg.isFromMe ? 'Sen: ' : ''}{msg.content}
                        </Text>
                    ) : (
                        <Text style={styles.newMatch}>Merhaba de 👋</Text>
                    )}
                </View>

                {/* Right: time + seen indicator */}
                <View style={styles.rightCol}>
                    {msg && (
                        <Text style={[styles.timeText, isUnread && styles.timeTextUnread]}>
                            {formatTime(msg.createdAt)}
                        </Text>
                    )}
                    {msg?.isFromMe && (
                        <View style={styles.tickRow}>
                            {msg.seen ? (
                                <>
                                    <CheckSolid size={12} color="#c026d3" />
                                    <CheckSolid size={12} color="#c026d3" style={styles.tickOverlap} />
                                </>
                            ) : (
                                <CheckIcon size={12} color="rgba(255,255,255,0.3)" />
                            )}
                        </View>
                    )}
                    {isUnread && <View style={styles.unreadDot} />}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <GradientBackground>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            {matches.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>No matches yet.</Text>
                    <View style={styles.emptyIconRow}>
                        <HeartIcon size={18} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.emptySubText}>Keep swiping!</Text>
                    </View>
                </View>
            ) : (
                <FlatList
                    data={matches}
                    keyExtractor={(item) => item.matchId}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '700',
        marginBottom: 6,
    },
    emptyIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    emptySubText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
    },
    list: {
        padding: 16,
    },
    matchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    avatarPhoto: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(192,38,211,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    matchInfo: {
        flex: 1,
    },
    matchName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 3,
    },
    matchNameUnread: {
        fontWeight: '800',
    },
    lastMsg: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.45)',
    },
    lastMsgUnread: {
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
    },
    newMatch: {
        fontSize: 13,
        color: '#c026d3',
        fontStyle: 'italic',
    },
    rightCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 6,
        minWidth: 36,
        marginLeft: 8,
    },
    timeText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
    },
    timeTextUnread: {
        color: '#c026d3',
        fontWeight: '600',
    },
    tickRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tickOverlap: {
        marginLeft: -6,
    },
    unreadDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#c026d3',
    },
});
