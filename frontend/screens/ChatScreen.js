import { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    FlatList, KeyboardAvoidingView, Platform, StatusBar, Alert,
} from 'react-native';
import io from 'socket.io-client';
import axios from 'axios';
import { BlurView } from 'expo-blur';
import { authHeader } from '../utils/auth';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';
import VibeAnalysisModal from '../components/VibeAnalysisModal';
import GradientBackground from '../components/GradientBackground';
import { SparklesIcon, ClockIcon, EllipsisVerticalIcon, HeartSlashIcon, NoSymbolIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { PaperAirplaneIcon } from 'react-native-heroicons/solid';

const SOCKET_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api';

export default function ChatScreen({ route, navigation }) {
    const { matchId, user, matchName, matchPhoto } = route.params;
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const socketRef = useRef(null);
    const flatListRef = useRef(null);
    const typingTimerRef = useRef(null);
    const inputRef = useRef(null);
    // Store the matched user's ID for block/unmatch
    const matchedUserIdRef = useRef(null);

    useEffect(() => {
        navigation.setOptions({
            title: matchName,
            headerStyle: { backgroundColor: '#c026d3' },
            headerTitleStyle: { fontWeight: '700', color: '#fff' },
            headerTintColor: '#fff',
            headerRight: () => (
                <TouchableOpacity onPress={() => setShowOptions(true)} style={{ paddingRight: 4 }}>
                    <EllipsisVerticalIcon size={24} color="#fff" />
                </TouchableOpacity>
            ),
        });

        axios.get(`${API_URL}/messages/${matchId}`, { headers: authHeader() })
            .then(res => {
                const loaded = res.data.map(m => ({
                    ...m,
                    senderName: m.sender?.name || 'Unknown',
                    sender: m.sender?._id || m.sender,
                }));
                setMessages(loaded);
                // Capture the other user's ID from messages
                const other = res.data.find(m => {
                    const sid = m.sender?._id || m.sender;
                    return sid?.toString() !== user._id?.toString();
                });
                if (other) matchedUserIdRef.current = other.sender?._id || other.sender;
            })
            .catch(err => console.error('Error loading messages:', err));

        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('join_match', matchId);

        socketRef.current.on('receive_message', (message) => {
            setMessages(prev => [...prev, message]);
            setTypingUser(null);
            // capture other user ID from socket messages too
            if (message.sender?.toString() !== user._id?.toString()) {
                matchedUserIdRef.current = message.sender;
            }
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
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const analyzeChat = async () => {
        if (messages.length < 2) return;
        setAnalyzing(true);
        try {
            const response = await axios.post(
                `${API_URL}/messages/${matchId}/analyze`,
                {
                    messages: messages.map(m => ({ senderName: m.senderName, content: m.content })),
                    currentUserName: user.name,
                },
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

    const handleUnmatch = () => {
        setShowOptions(false);
        Alert.alert(
            'Eşleşmeyi Kaldır',
            `${matchName} ile eşleşmen kaldırılsın mı?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Kaldır', style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/matches/${matchId}`, { headers: authHeader() });
                            navigation.goBack();
                        } catch (err) {
                            Alert.alert('Hata', 'İşlem başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const handleBlock = () => {
        setShowOptions(false);
        Alert.alert(
            'Engelle',
            `${matchName} engellenmek isteniyor. Eşleşmen de silinecek.`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Engelle', style: 'destructive',
                    onPress: async () => {
                        try {
                            // We need the matched user's ID. Use matchedUserIdRef or look up from match.
                            // First get match data to find the other user
                            const matchRes = await axios.get(`${API_URL}/matches/${user._id}`, { headers: authHeader() });
                            const match = matchRes.data.find(m => m.matchId === matchId);
                            const targetId = match?.user?._id;
                            if (targetId) {
                                await axios.post(`${API_URL}/users/block/${targetId}`, {}, { headers: authHeader() });
                            }
                            navigation.goBack();
                        } catch (err) {
                            Alert.alert('Hata', 'İşlem başarısız.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item, index }) => {
        const isMe = item.sender === user._id || item.senderName === user.name;

        // Find last message sent by me
        let lastMineIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            const m = messages[i];
            if (m.sender === user._id || m.senderName === user.name) {
                lastMineIndex = i;
                break;
            }
        }
        const isLastMine = isMe && index === lastMineIndex;

        // "Seen" = there's at least one message from them after our last message
        const seen = isLastMine && messages.slice(lastMineIndex + 1).some(
            m => m.sender !== user._id && m.senderName !== user.name
        );

        return <MessageBubble item={item} isMe={isMe} matchPhoto={matchPhoto} isLastMine={isLastMine} seen={seen} />;
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
                        {analyzing
                            ? <ClockIcon size={16} color="#fff" />
                            : <SparklesIcon size={16} color="#fff" />
                        }
                        <Text style={styles.analyzeBtnText}>
                            {analyzing ? 'Analiz ediliyor...' : 'Vibe Analizi'}
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
                                ref={inputRef}
                                style={styles.input}
                                placeholder="Mesaj yaz..."
                                placeholderTextColor="#bbb"
                                value={inputMessage}
                                onChangeText={handleInputChange}
                                onSubmitEditing={sendMessage}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !inputMessage.trim() && styles.sendBtnDisabled]}
                                onPress={sendMessage}
                                disabled={!inputMessage.trim()}
                            >
                                <PaperAirplaneIcon size={18} color="#fff" />
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

            {/* Options bottom sheet (unmatch / block) — plain View avoids web BlurView freeze */}
            {showOptions && (
                <TouchableOpacity
                    style={styles.optionsOverlay}
                    activeOpacity={1}
                    onPress={() => setShowOptions(false)}
                >
                    <View style={styles.optionsSheet}>
                        <View style={styles.optionsHandle} />
                        <Text style={styles.optionsTitle}>{matchName}</Text>

                        <TouchableOpacity style={styles.optionItem} onPress={handleUnmatch}>
                            <HeartSlashIcon size={20} color="#f87171" />
                            <Text style={[styles.optionText, { color: '#f87171' }]}>Eşleşmeyi Kaldır</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem} onPress={handleBlock}>
                            <NoSymbolIcon size={20} color="#f87171" />
                            <Text style={[styles.optionText, { color: '#f87171' }]}>Engelle</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.optionItem, styles.cancelItem]} onPress={() => setShowOptions(false)}>
                            <XMarkIcon size={20} color="rgba(255,255,255,0.5)" />
                            <Text style={[styles.optionText, { color: 'rgba(255,255,255,0.5)' }]}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ff4b4b',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 7,
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
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    inputBlur: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(10,4,22,0.6)',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#fff',
        maxHeight: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(192,38,211,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#c026d3',
        shadowOpacity: 0.45,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 },
    // Options modal
    optionsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    optionsSheet: {
        borderTopLeftRadius: 14,
        borderTopRightRadius: 14,
        overflow: 'hidden',
        backgroundColor: 'rgba(20,10,40,0.97)',
        padding: 20,
        paddingBottom: 36,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    optionsHandle: {
        width: 36,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 18,
    },
    optionsTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    cancelItem: {
        borderBottomWidth: 0,
        marginTop: 6,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
