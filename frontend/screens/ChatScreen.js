import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    FlatList, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import io from 'socket.io-client';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { authHeader } from '../utils/auth';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import VibeAnalysisModal from '../components/VibeAnalysisModal';
import GradientBackground from '../components/GradientBackground';

const SOCKET_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api';

export default function ChatScreen({ route, navigation }) {
    const { matchId, user, matchName } = route.params;
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const socketRef = useRef(null);
    const flatListRef = useRef(null);
    const typingTimerRef = useRef(null);

    useEffect(() => {
        navigation.setOptions({
            title: matchName,
            headerStyle: { backgroundColor: '#c026d3' },
            headerTitleStyle: { fontWeight: '700', color: '#fff' },
            headerTintColor: '#fff',
        });

        axios.get(`${API_URL}/messages/${matchId}`, { headers: authHeader() })
            .then(res => {
                setMessages(res.data.map(m => ({
                    ...m,
                    senderName: m.sender?.name || 'Unknown',
                    sender: m.sender?._id || m.sender,
                })));
            })
            .catch(err => console.error('Error loading messages:', err));

        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('join_match', matchId);

        socketRef.current.on('receive_message', (message) => {
            setMessages(prev => [...prev, message]);
            setTypingUser(null);
        });

        socketRef.current.on('typing_start', ({ senderName }) => {
            setTypingUser(senderName);
        });

        socketRef.current.on('typing_stop', () => {
            setTypingUser(null);
        });

        return () => { socketRef.current.disconnect(); };
    }, []);

    const handleInputChange = (text) => {
        setInputMessage(text);
        socketRef.current.emit('typing_start', { matchId, senderName: user.name });
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socketRef.current.emit('typing_stop', { matchId });
        }, 2000);
    };

    const sendMessage = () => {
        if (!inputMessage.trim()) return;
        clearTimeout(typingTimerRef.current);
        socketRef.current.emit('typing_stop', { matchId });

        const messageData = {
            matchId,
            sender: user._id,
            senderName: user.name,
            content: inputMessage,
            createdAt: new Date().toISOString(),
            _id: Math.random().toString(36).substring(7),
        };
        socketRef.current.emit('send_message', messageData);
        setInputMessage('');
    };

    const analyzeChat = async () => {
        if (messages.length < 2) return;
        setAnalyzing(true);
        try {
            const response = await axios.post(
                `${API_URL}/messages/${matchId}/analyze`,
                { messages: messages.map(m => ({ senderName: m.senderName, content: m.content })) },
                { headers: authHeader() }
            );
            setAnalysisData(response.data);
            setShowModal(true);
        } catch (error) {
            console.error(error);
        } finally {
            setAnalyzing(false);
        }
    };

    const renderItem = ({ item }) => {
        const isMe = item.sender === user._id || item.senderName === user.name;
        return <MessageBubble item={item} isMe={isMe} />;
    };

    return (
        <GradientBackground style={styles.container}>
            <StatusBar barStyle="light-content" />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Glass analyze bar */}
                <BlurView intensity={20} tint="light" style={styles.analyzeBar}>
                    <TouchableOpacity
                        style={[styles.analyzeBtn, analyzing && styles.analyzeBtnLoading]}
                        onPress={analyzeChat}
                        disabled={analyzing}
                    >
                        <Text style={styles.analyzeBtnText}>
                            {analyzing ? '⏳ Analiz ediliyor...' : '✨ Vibe Analizi'}
                        </Text>
                    </TouchableOpacity>
                </BlurView>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={
                        typingUser ? <TypingIndicator name={typingUser} /> : null
                    }
                />

                {/* Floating input */}
                <View style={styles.inputWrapper}>
                    <BlurView intensity={60} tint="light" style={styles.inputBlur}>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Mesaj yaz..."
                                placeholderTextColor="#bbb"
                                value={inputMessage}
                                onChangeText={handleInputChange}
                                onSubmitEditing={sendMessage}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !inputMessage.trim() && styles.sendBtnDisabled]}
                                onPress={sendMessage}
                                disabled={!inputMessage.trim()}
                            >
                                <Text style={styles.sendBtnText}>↑</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </KeyboardAvoidingView>

            <VibeAnalysisModal
                visible={showModal}
                onClose={() => setShowModal(false)}
                data={analysisData}
            />
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    analyzeBar: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.15)',
    },
    analyzeBtn: {
        backgroundColor: '#ff4b4b',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: '#ff4b4b',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    analyzeBtnLoading: { backgroundColor: '#ccc' },
    analyzeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    messageList: { paddingTop: 12, paddingBottom: 20 },
    inputWrapper: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    inputBlur: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.95)',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#f2f2f2',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111',
        maxHeight: 100,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ff4b4b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff4b4b',
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    sendBtnDisabled: { backgroundColor: '#ddd', shadowOpacity: 0 },
    sendBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', lineHeight: 22 },
});
