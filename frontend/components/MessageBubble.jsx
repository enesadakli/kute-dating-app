import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { CheckIcon } from 'react-native-heroicons/outline';
import { CheckIcon as CheckSolid } from 'react-native-heroicons/solid';

const BASE_URL = 'http://localhost:3001';

export default function MessageBubble({ item, isMe, matchPhoto, isLastMine, seen }) {
    return (
        <Animated.View
            entering={FadeInDown.duration(260).easing(Easing.bezier(0.16, 1, 0.3, 1))}
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
                <View style={styles.metaRow}>
                    <Text style={[styles.time, isMe ? styles.timeMe : styles.timeThem]}>
                        {item.createdAt
                            ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                    </Text>
                    {/* Seen ticks — only on last message from me */}
                    {isMe && isLastMine && (
                        <View style={styles.tickRow}>
                            {seen ? (
                                <>
                                    <CheckSolid size={11} color="rgba(167,139,250,0.9)" />
                                    <CheckSolid size={11} color="rgba(167,139,250,0.9)" style={styles.tickOverlap} />
                                </>
                            ) : (
                                <CheckIcon size={11} color="rgba(255,255,255,0.45)" />
                            )}
                        </View>
                    )}
                </View>
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
        borderRadius: 12,
    },
    bubbleMe: {
        backgroundColor: 'rgba(192,38,211,0.85)',
        borderBottomRightRadius: 3,
    },
    bubbleThem: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderBottomLeftRadius: 3,
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
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        marginTop: 4,
    },
    time: { fontSize: 10 },
    timeMe: { color: 'rgba(255,255,255,0.5)' },
    timeThem: { color: 'rgba(255,255,255,0.35)' },
    tickRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tickOverlap: {
        marginLeft: -5,
    },
});
