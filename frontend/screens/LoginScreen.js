import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { setToken } from '../utils/auth';
import GradientBackground from '../components/GradientBackground';
import { LockClosedIcon, UserIcon } from 'react-native-heroicons/outline';

const API_URL = 'http://localhost:3001/api';

export default function LoginScreen({ navigation }) {
    const [name, setName]         = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    const handleLogin = async () => {
        if (!name.trim() || !password.trim()) { setError('Kullanıcı adı ve şifre gerekli.'); return; }
        setError(''); setLoading(true);
        try {
            const { data } = await axios.post(`${API_URL}/users/login`, { name, password });
            setToken(data.token);
            navigation.replace('Main', { user: data.user });
        } catch (err) {
            setError(err.response?.data?.message || 'Giriş başarısız.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientBackground>
            <KeyboardAvoidingView
                style={{ flex: 1, justifyContent: 'center', padding: 28 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Logo */}
                <Text style={styles.logo}>kute</Text>
                <Text style={styles.tagline}>Eşleşmeni bul.</Text>

                {/* Dark glass card */}
                <BlurView intensity={28} tint="dark" style={styles.card}>
                    <View style={styles.inputRow}>
                        <UserIcon size={17} color="rgba(255,255,255,0.35)" style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.input}
                            placeholder="Kullanıcı adı"
                            placeholderTextColor="rgba(255,255,255,0.30)"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.inputRow}>
                        <LockClosedIcon size={17} color="rgba(255,255,255,0.35)" style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.input}
                            placeholder="Şifre"
                            placeholderTextColor="rgba(255,255,255,0.30)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.82}>
                        <LinearGradient
                            colors={['#00E1FF', '#590FB7', '#FF007A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loginBtn}
                        >
                            <Text style={styles.loginBtnText}>
                                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </BlurView>

                {/* Register link */}
                <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Onboarding')}>
                    <Text style={styles.registerLinkText}>
                        Hesabın yok mu?{' '}
                        <Text style={{ color: '#00E1FF', fontWeight: '700' }}>Kayıt ol →</Text>
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    logo: {
        fontSize: 64,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: -3,
        marginBottom: 6,
    },
    tagline: {
        fontSize: 16,
        color: '#A0AEC0',
        textAlign: 'center',
        marginBottom: 36,
        fontWeight: '500',
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.42)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.13)',
        padding: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.15)',
        marginBottom: 12,
        paddingHorizontal: 14,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#fff',
    },
    error: {
        color: '#FF6090',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    loginBtn: {
        borderRadius: 50,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 4,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    registerLink: { marginTop: 24, alignItems: 'center' },
    registerLinkText: { color: '#A0AEC0', fontSize: 15, fontWeight: '500' },
});
