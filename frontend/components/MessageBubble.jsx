import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const BASE_URL = 'http://localhost:3001';

export default function MessageBubble({ item, isMe, matchPhoto }) {
    return (
        <Animated.View
            entering={FadeInDown.springify().damping(18).stiffness(120)}
            style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}
        >
            {!isMe && (
                matchPhoto ? (
                    <Image
                        source={{ uri: `${BASE_URL}${matchPhoto}` }}
                        style={styles.avatarPhoto}
                    />
                ) : (
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {(item.senderName || '?')[0].toUpperCase()}
                        </Text>
                    </View>
                )
            )}
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                {!isMe && (
                    <Text style={styles.senderName}>{item.senderName}</Text>
                )}
                <Text style={[styles.text, isMe ? styles.textMe : styles.textThem]}>
                    {item.content}
                </Text>
                <Text style={[styles.time, isMe ? styles.timeMe : styles.timeThem]}>
                    {item.createdAt
                        ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 8,
        paddingHorizontal: 12,
    },
    rowMe: { justifyContent: 'flex-end' },
    rowThem: { justifyContent: 'flex-start' },
    avatarPhoto: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(192,38,211,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 2,
    },
    avatarText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    bubble: {
        maxWidth: '72%',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
    },
    bubbleMe: {
        backgroundColor: 'rgba(192,38,211,0.85)',
        borderBottomRightRadius: 4,
    },
    bubbleThem: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    senderName: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 3,
        fontWeight: '600',
    },
    text: { fontSize: 15, lineHeight: 20 },
    textMe: { color: '#fff' },
    textThem: { color: 'rgba(255,255,255,0.9)' },
    time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    timeMe: { color: 'rgba(255,255,255,0.5)' },
    timeThem: { color: 'rgba(255,255,255,0.35)' },
});
