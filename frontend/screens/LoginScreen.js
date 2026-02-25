import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { setToken } from '../utils/auth';
import GradientBackground from '../components/GradientBackground';

const API_URL = 'http://localhost:3001/api';
const GENDER_OPTIONS = ['male', 'female', 'other'];

export default function LoginScreen({ navigation }) {
    const [isLogin, setIsLogin] = useState(false);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState('other');
    const [interestedIn, setInterestedIn] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleInterestedIn = (val) => {
        setInterestedIn(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const handleSubmit = async () => {
        if (!name.trim() || !password.trim()) {
            setError('Name and password are required.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const endpoint = isLogin ? '/users/login' : '/users/register';
            const payload = isLogin
                ? { name, password }
                : { name, password, bio, gender, interestedIn, interests: [] };
            const response = await axios.post(`${API_URL}${endpoint}`, payload);
            const { token, user } = response.data;
            setToken(token);
            navigation.replace('Main', { user });
        } catch (err) {
            const msg = err.response?.data?.message || 'Connection failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Logo */}
                <Text style={styles.title}>kute</Text>
                <Text style={styles.subtitle}>Find your match.</Text>

                {/* Glass card */}
                <BlurView intensity={25} tint="light" style={styles.card}>
                    {/* Toggle */}
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
                            onPress={() => { setIsLogin(false); setError(''); }}
                        >
                            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>
                                Register
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, isLogin && styles.toggleActive]}
                            onPress={() => { setIsLogin(true); setError(''); }}
                        >
                            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                                Login
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor="rgba(255,255,255,0.45)"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="none"
                    />

                    {!isLogin && (
                        <TextInput
                            style={styles.input}
                            placeholder="A short bio (optional)"
                            placeholderTextColor="rgba(255,255,255,0.45)"
                            value={bio}
                            onChangeText={setBio}
                        />
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="rgba(255,255,255,0.45)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {/* Gender and preference only on register */}
                    {!isLogin && (
                        <>
                            <Text style={styles.fieldLabel}>I am</Text>
                            <View style={styles.chipRow}>
                                {GENDER_OPTIONS.map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[styles.chip, gender === g && styles.chipActive]}
                                        onPress={() => setGender(g)}
                                    >
                                        <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.fieldLabel}>Interested in</Text>
                            <View style={styles.chipRow}>
                                {GENDER_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.chip, interestedIn.includes(opt) && styles.chipActive]}
                                        onPress={() => toggleInterestedIn(opt)}
                                    >
                                        <Text style={[styles.chipText, interestedIn.includes(opt) && styles.chipTextActive]}>
                                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                        <Text style={styles.buttonText}>
                            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>
                </BlurView>

                <View style={{ height: 40 }} />
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    inner: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 64,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -3,
    },
    subtitle: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.65)',
        textAlign: 'center',
        marginBottom: 36,
        fontWeight: '400',
        letterSpacing: 0.3,
    },
    card: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        padding: 24,
    },
    toggleRow: {
        flexDirection: 'row',
        marginBottom: 20,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 11,
        alignItems: 'center',
    },
    toggleActive: {
        backgroundColor: 'rgba(255,255,255,0.22)',
    },
    toggleText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
        fontSize: 15,
    },
    toggleTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        padding: 15,
        marginBottom: 12,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    fieldLabel: {
        color: 'rgba(255,255,255,0.65)',
        fontWeight: '600',
        fontSize: 13,
        marginBottom: 8,
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    chipActive: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderColor: 'transparent',
    },
    chipText: {
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        fontSize: 13,
    },
    chipTextActive: {
        color: '#7c3aed',
        fontWeight: '700',
    },
    error: {
        color: 'rgba(255,210,210,1)',
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 7,
        alignItems: 'center',
        marginTop: 6,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    buttonText: {
        color: '#c026d3',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
});
