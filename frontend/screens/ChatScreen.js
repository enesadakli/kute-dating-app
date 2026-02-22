import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import io from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api';

export default function ChatScreen({ route, navigation }) {
    const { matchId, user, matchName } = route.params;
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const socketRef = useRef(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        navigation.setOptions({ title: matchName });

        // Initialize Socket
        socketRef.current = io(SOCKET_URL);

        // Join match room
        socketRef.current.emit('join_match', matchId);

        // Setup listeners
        socketRef.current.on('receive_message', (message) => {
            setMessages((prevMsg) => [...prevMsg, message]);
        });

        // Cleanup when component unmounts
        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const sendMessage = () => {
        if (!inputMessage.trim()) return;

        const messageData = {
            matchId,
            sender: user._id,
            senderName: user.name,
            content: inputMessage,
            createdAt: new Date().toISOString(),
            _id: Math.random().toString(36).substring(7), // Temporary ID pending DB integration
        };

        socketRef.current.emit('send_message', messageData);
        setInputMessage('');
    };

    const analyzeChat = async () => {
        if (messages.length < 2) {
            Alert.alert('Not enough data', 'Need a bit more conversation for the AI to analyze!');
            return;
        }

        setAnalyzing(true);
        try {
            const response = await axios.post(`${API_URL}/messages/${matchId}/analyze`);
            const analysis = response.data;

            Alert.alert(
                `Vibe: ${analysis.vibe} (Score: ${analysis.sentimentScore})`,
                analysis.advice
            );
        } catch (error) {
            console.error(error);
            Alert.alert('Analysis Failed', 'Could not reach the AI service or no messages found.');
        } finally {
            setAnalyzing(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isMe = item.sender === user._id || item.senderName === user.name;

        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.content}
                </Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <View style={styles.aiHeader}>
                <TouchableOpacity style={styles.aiButton} onPress={analyzeChat} disabled={analyzing}>
                    <Text style={styles.aiButtonText}>
                        {analyzing ? 'Analyzing vibe...' : '✨ Analyze Vibe'}
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    onSubmitEditing={sendMessage}
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    aiHeader: {
        padding: 10,
        backgroundColor: '#f8f8f8',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    aiButton: {
        backgroundColor: '#ff4b4b',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    aiButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    messageList: {
        padding: 15,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 15,
        borderRadius: 20,
        marginBottom: 10,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#ff4b4b',
        borderBottomRightRadius: 5,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#f1f1f1',
        borderBottomLeftRadius: 5,
    },
    messageText: {
        fontSize: 16,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#333',
    },
    senderName: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        backgroundColor: '#f1f1f1',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        fontSize: 16,
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ff4b4b',
        borderRadius: 20,
        paddingHorizontal: 20,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
