import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

export default function MessageBubble({ item, isMe }) {
    return (
        <Animated.View
            entering={FadeInDown.springify().damping(18).stiffness(120)}
            style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}
        >
            {!isMe && (
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(item.senderName || '?')[0].toUpperCase()}
                    </Text>
                </View>
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
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#ff4b4b',
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
        backgroundColor: '#ff4b4b',
        borderBottomRightRadius: 4,
    },
    bubbleThem: {
        backgroundColor: '#f0f0f0',
        borderBottomLeftRadius: 4,
    },
    senderName: {
        fontSize: 11,
        color: '#999',
        marginBottom: 3,
        fontWeight: '600',
    },
    text: { fontSize: 15, lineHeight: 20 },
    textMe: { color: '#fff' },
    textThem: { color: '#222' },
    time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    timeMe: { color: 'rgba(255,255,255,0.6)' },
    timeThem: { color: '#bbb' },
});
