import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { authHeader, clearToken } from '../utils/auth';
import GradientBackground from '../components/GradientBackground';
import {
    MapPinIcon, AdjustmentsHorizontalIcon,
    SnowflakeIcon, TrashIcon, ChevronLeftIcon,
} from 'react-native-heroicons/outline';

// SnowflakeIcon might not exist — fall back to a text icon if needed
const API_URL = 'http://localhost:3001/api';

export default function SettingsScreen({ route, navigation }) {
    const { user } = route.params || {};
    const [minAge, setMinAge] = useState(String(user?.ageRange?.min ?? 18));
    const [maxAge, setMaxAge] = useState(String(user?.ageRange?.max ?? 60));
    const [maxDistance, setMaxDistance] = useState(String(user?.maxDistance ?? 100));
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [freezing, setFreezing] = useState(false);

    const saveSettings = async () => {
        const min = parseInt(minAge);
        const max = parseInt(maxAge);
        const dist = parseInt(maxDistance);
        if (isNaN(min) || isNaN(max) || min < 18 || max > 100 || min > max) {
            Alert.alert('Geçersiz yaş', 'Yaş aralığı 18-100 arasında olmalı.');
            return;
        }
        if (isNaN(dist) || dist < 1 || dist > 500) {
            Alert.alert('Geçersiz mesafe', 'Mesafe 1-500 km arasında olmalı.');
            return;
        }
        setSaving(true);
        try {
            await axios.put(`${API_URL}/users/${user._id}`, {
                ageRange: { min, max },
                maxDistance: dist,
            }, { headers: authHeader() });
            Alert.alert('Kaydedildi', 'Ayarlar güncellendi.');
        } catch {
            Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
        } finally {
            setSaving(false);
        }
    };

    const handleFreeze = () => {
        Alert.alert(
            'Hesabı Dondur',
            'Hesabın dondurulduğunda keşif listesinde görünmezsin. İstediğin zaman geri açabilirsin.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Dondur', onPress: async () => {
                        setFreezing(true);
                        try {
                            await axios.put(`${API_URL}/users/${user._id}/freeze`, {}, { headers: authHeader() });
                            Alert.alert('Donduruldu', 'Hesabın donduruldu. Tekrar giriş yaparak aktifleştirebilirsin.');
                            clearToken();
                            navigation.replace('Login');
                        } catch {
                            Alert.alert('Hata', 'İşlem başarısız.');
                        } finally {
                            setFreezing(false);
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            'Hesabı Sil',
            'Bu işlem geri alınamaz. Tüm eşleşmelerin ve mesajların silinecek.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Kalıcı Olarak Sil', style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await axios.delete(`${API_URL}/users/${user._id}`, { headers: authHeader() });
                            clearToken();
                            navigation.replace('Login');
                        } catch {
                            Alert.alert('Hata', 'Hesap silinemedi.');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ChevronLeftIcon size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Ayarlar</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Distance */}
                <BlurView intensity={15} tint="light" style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MapPinIcon size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.sectionTitle}>Maksimum Mesafe</Text>
                    </View>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.numberInput}
                            value={maxDistance}
                            onChangeText={setMaxDistance}
                            keyboardType="numeric"
                            placeholderTextColor="rgba(255,255,255,0.4)"
                        />
                        <Text style={styles.unit}>km</Text>
                    </View>
                    <Text style={styles.hint}>Konumun ayarlanmadıysa bu filtre aktif olmaz.</Text>
                </BlurView>

                {/* Age range */}
                <BlurView intensity={15} tint="light" style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <AdjustmentsHorizontalIcon size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.sectionTitle}>Yaş Aralığı</Text>
                    </View>
                    <View style={styles.rangeRow}>
                        <View style={styles.rangeField}>
                            <Text style={styles.rangeLabel}>Min</Text>
                            <TextInput
                                style={styles.numberInput}
                                value={minAge}
                                onChangeText={setMinAge}
                                keyboardType="numeric"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                            />
                        </View>
                        <Text style={styles.rangeDash}>–</Text>
                        <View style={styles.rangeField}>
                            <Text style={styles.rangeLabel}>Max</Text>
                            <TextInput
                                style={styles.numberInput}
                                value={maxAge}
                                onChangeText={setMaxAge}
                                keyboardType="numeric"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                            />
                        </View>
                        <Text style={styles.unit}>yaş</Text>
                    </View>
                </BlurView>

                {/* Save button */}
                <TouchableOpacity style={styles.saveBtn} onPress={saveSettings} disabled={saving}>
                    {saving
                        ? <ActivityIndicator color="#7c3aed" />
                        : <Text style={styles.saveBtnText}>Kaydet</Text>
                    }
                </TouchableOpacity>

                {/* Danger zone */}
                <Text style={styles.dangerLabel}>Tehlikeli Alan</Text>

                <TouchableOpacity style={styles.dangerBtn} onPress={handleFreeze} disabled={freezing}>
                    {freezing
                        ? <ActivityIndicator color="#f59e0b" />
                        : <Text style={[styles.dangerBtnText, { color: '#f59e0b' }]}>Hesabı Dondur</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity style={[styles.dangerBtn, styles.deleteBtn]} onPress={handleDelete} disabled={deleting}>
                    {deleting
                        ? <ActivityIndicator color="#f87171" />
                        : (
                            <View style={styles.dangerBtnInner}>
                                <TrashIcon size={16} color="#f87171" />
                                <Text style={[styles.dangerBtnText, { color: '#f87171' }]}>Hesabı Kalıcı Sil</Text>
                            </View>
                        )
                    }
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 16, paddingTop: 52 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backBtn: {
        width: 36, height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
    section: {
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        padding: 16,
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rangeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rangeField: { alignItems: 'center', gap: 4 },
    rangeLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
    rangeDash: { color: 'rgba(255,255,255,0.4)', fontSize: 20, marginTop: 14 },
    numberInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 17,
        color: '#fff',
        fontWeight: '700',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        minWidth: 70,
        textAlign: 'center',
    },
    unit: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        fontWeight: '600',
        marginTop: 2,
    },
    hint: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
        marginTop: 8,
    },
    saveBtn: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 7,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    saveBtnText: { color: '#7c3aed', fontSize: 16, fontWeight: '800' },
    dangerLabel: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    dangerBtn: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: 15,
        borderRadius: 7,
        alignItems: 'center',
        marginBottom: 10,
    },
    deleteBtn: {
        borderColor: 'rgba(248,113,113,0.25)',
        backgroundColor: 'rgba(248,113,113,0.07)',
    },
    dangerBtnInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dangerBtnText: { fontSize: 15, fontWeight: '700' },
});
