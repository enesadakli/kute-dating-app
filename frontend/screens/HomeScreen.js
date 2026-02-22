import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function HomeScreen({ route, navigation }) {
    const { user } = route.params || {};
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/users`);
            const otherUsers = response.data.filter(u => u._id !== user?._id);
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
            });

            if (response.data.matched) {
                Alert.alert('It\'s a Match! 🎉', `You and ${toUser.name} liked each other!`);
            }

            // Remove the liked user from the list
            setUsers(prev => prev.filter(u => u._id !== toUser._id));
        } catch (error) {
            console.error('Error liking user:', error);
        }
    };

    const handleNope = async (toUser) => {
        try {
            await axios.post(`${API_URL}/matches/nope`, {
                fromUserId: user._id,
                toUserId: toUser._id,
            });

            // Remove the noped user from the list
            setUsers(prev => prev.filter(u => u._id !== toUser._id));
        } catch (error) {
            console.error('Error noping user:', error);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
            </View>
            <Text style={styles.bio}>{item.bio || 'No bio provided'}</Text>
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.nopeButton]}
                    onPress={() => handleNope(item)}
                >
                    <Text style={styles.nopeText}>✗ Nope</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.likeButton]}
                    onPress={() => handleLike(item)}
                >
                    <Text style={styles.likeText}>♥ Like</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff4b4b" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Matches', { user })}>
                    <Text style={styles.matchesLink}>💬 Matches</Text>
                </TouchableOpacity>
            </View>

            {users.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No more users to discover!</Text>
                    <Text style={styles.emptySubText}>Check your matches 💬</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item._id}
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
        backgroundColor: '#f8f8f8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    matchesLink: {
        fontSize: 18,
        color: '#ff4b4b',
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        marginBottom: 10,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    bio: {
        fontSize: 16,
        color: '#555',
        marginBottom: 20,
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 35,
        borderRadius: 25,
    },
    nopeButton: {
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    likeButton: {
        backgroundColor: '#ff4b4b',
    },
    nopeText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#555',
    },
    likeText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#fff',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#888',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 15,
        color: '#bbb',
    },
});
