import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function MatchesScreen({ route, navigation }) {
    const { user } = route.params || {};
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const response = await axios.get(`${API_URL}/matches/${user._id}`);
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
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#ff4b4b" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {matches.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>No matches yet. Keep swiping!</Text>
                </View>
            ) : (
                <FlatList
                    data={matches}
                    keyExtractor={(item) => item.matchId}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
    list: {
        padding: 10,
    },
    matchItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#ff4b4b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    matchInfo: {
        flex: 1,
    },
    matchName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    bio: {
        fontSize: 14,
        color: '#888',
    },
});
