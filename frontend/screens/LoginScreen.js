import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { setToken } from '../utils/auth';
import GradientBackground from '../components/GradientBackground';

const API_URL = 'http://localhost:3001/api';

export default function LoginScreen({ navigation }) {
    const [isLogin, setIsLogin] = useState(false);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
                : { name, password, bio, interests: ['coding', 'coffee'] };
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
            <View style={styles.inner}>
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
                            placeholder="A short bio"
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

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                        <Text style={styles.buttonText}>
                            {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>
                </BlurView>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    inner: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
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
        borderRadius: 26,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        padding: 24,
    },
    toggleRow: {
        flexDirection: 'row',
        marginBottom: 20,
        borderRadius: 10,
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
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
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
        borderRadius: 14,
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
