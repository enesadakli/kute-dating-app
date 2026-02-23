import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { authHeader } from '../utils/auth';
import GradientBackground from '../components/GradientBackground';

const API_URL = 'http://localhost:3001/api';

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

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.matchItem}
            onPress={() => navigation.navigate('Chat', {
                matchId: item.matchId,
                user,
                matchName: item.user.name,
            })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.user.name[0].toUpperCase()}</Text>
            </View>
            <View style={styles.matchInfo}>
                <Text style={styles.matchName}>{item.user.name}</Text>
                <Text style={styles.bio} numberOfLines={1}>{item.user.bio || 'No bio'}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );

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
                    <Text style={styles.emptySubText}>Keep swiping! 💕</Text>
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
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ff4b4b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: '#ff4b4b',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
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
    bio: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
    },
    chevron: {
        fontSize: 24,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '300',
    },
});
