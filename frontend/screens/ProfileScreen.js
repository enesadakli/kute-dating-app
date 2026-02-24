import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { authHeader, clearToken } from '../utils/auth';
import GradientBackground from '../components/GradientBackground';
import { CameraIcon, PencilIcon, ArrowRightOnRectangleIcon, CheckIcon, TrashIcon, Cog6ToothIcon } from 'react-native-heroicons/outline';

const API_URL = 'http://localhost:3001/api';
const BASE_URL = 'http://localhost:3001';

export default function ProfileScreen({ route, navigation }) {
    const { user } = route.params || {};
    const [bio, setBio] = useState(user?.bio || '');
    const [photos, setPhotos] = useState(user?.photos || []);
    const [gender, setGender] = useState(user?.gender || 'other');
    const [interestedIn, setInterestedIn] = useState(user?.interestedIn || []);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const genderOptions = ['male', 'female', 'other'];
    const interestOptions = ['male', 'female', 'other'];

    const toggleInterestedIn = (val) => {
        setInterestedIn(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const pickAndUploadPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo access.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.7,
        });

        if (result.canceled) return;

        setUploading(true);
        try {
            const uri = result.assets[0].uri;
            const formData = new FormData();

            // Web: fetch blob from URI and append
            const response = await fetch(uri);
            const blob = await response.blob();
            const ext = blob.type.split('/')[1] || 'jpg';
            formData.append('photo', blob, `photo.${ext}`);

            const res = await axios.post(
                `${API_URL}/users/${user._id}/photos`,
                formData,
                {
                    headers: {
                        ...authHeader(),
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            setPhotos(res.data.photos || []);
        } catch (err) {
            Alert.alert('Upload failed', err.response?.data?.message || 'Try again.');
        } finally {
            setUploading(false);
        }
    };

    const deletePhoto = async (index) => {
        try {
            const res = await axios.delete(
                `${API_URL}/users/${user._id}/photos/${index}`,
                { headers: authHeader() }
            );
            setPhotos(res.data.photos || []);
        } catch (err) {
            Alert.alert('Error', 'Could not delete photo.');
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            await axios.put(
                `${API_URL}/users/${user._id}`,
                { bio, gender, interestedIn },
                { headers: authHeader() }
            );
            Alert.alert('Saved', 'Profile updated successfully.');
        } catch (err) {
            Alert.alert('Error', 'Could not save profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        clearToken();
        navigation.replace('Login');
    };

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <Text style={styles.title}>My Profile</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings', { user })}>
                            <Cog6ToothIcon size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <ArrowRightOnRectangleIcon size={20} color="#fff" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Photos section */}
                <BlurView intensity={18} tint="light" style={styles.section}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                    <View style={styles.photoGrid}>
                        {photos.map((photo, i) => (
                            <View key={i} style={styles.photoWrapper}>
                                <Image
                                    source={{ uri: `${BASE_URL}${photo}` }}
                                    style={styles.photo}
                                />
                                <TouchableOpacity
                                    style={styles.deletePhotoBtn}
                                    onPress={() => deletePhoto(i)}
                                >
                                    <TrashIcon size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.addPhotoBtn}
                            onPress={pickAndUploadPhoto}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="rgba(255,255,255,0.7)" />
                            ) : (
                                <>
                                    <CameraIcon size={28} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.addPhotoText}>Add Photo</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </BlurView>

                {/* Bio section */}
                <BlurView intensity={18} tint="light" style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <PencilIcon size={16} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.sectionTitle}>Bio</Text>
                    </View>
                    <TextInput
                        style={styles.bioInput}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Write something about yourself..."
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        multiline
                        numberOfLines={3}
                    />
                </BlurView>

                {/* Gender section */}
                <BlurView intensity={18} tint="light" style={styles.section}>
                    <Text style={styles.sectionTitle}>I am</Text>
                    <View style={styles.chipRow}>
                        {genderOptions.map(g => (
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
                </BlurView>

                {/* Interested In section */}
                <BlurView intensity={18} tint="light" style={styles.section}>
                    <Text style={styles.sectionTitle}>Interested in</Text>
                    <View style={styles.chipRow}>
                        {interestOptions.map(opt => (
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
                </BlurView>

                {/* Save button */}
                <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                    {saving ? (
                        <ActivityIndicator color="#c026d3" />
                    ) : (
                        <>
                            <CheckIcon size={18} color="#c026d3" />
                            <Text style={styles.saveBtnText}>Save Profile</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    scroll: {
        padding: 16,
        paddingTop: 56,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconBtn: {
        width: 38, height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    logoutText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    section: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        padding: 16,
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.75)',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    photoWrapper: {
        position: 'relative',
        width: 90,
        height: 112,
        borderRadius: 14,
        overflow: 'hidden',
    },
    photo: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    deletePhotoBtn: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 10,
        padding: 4,
    },
    addPhotoBtn: {
        width: 90,
        height: 112,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.25)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    addPhotoText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    bioInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    chipRow: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
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
        fontSize: 14,
    },
    chipTextActive: {
        color: '#7c3aed',
        fontWeight: '700',
    },
    saveBtn: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    saveBtnText: {
        color: '#c026d3',
        fontSize: 17,
        fontWeight: '800',
    },
});
