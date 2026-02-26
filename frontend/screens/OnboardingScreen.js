import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Animated, Easing, Dimensions, Image, ScrollView,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { setToken } from '../utils/auth';
import GradientBackground from '../components/GradientBackground';
import {
    UserIcon, HeartIcon, CakeIcon, PhotoIcon,
    LockClosedIcon, ArrowRightIcon, ArrowLeftIcon,
    PlusCircleIcon, XMarkIcon, SparklesIcon, UsersIcon,
} from 'react-native-heroicons/outline';
import { CheckCircleIcon } from 'react-native-heroicons/solid';

const API_URL = 'http://localhost:3001/api';
const { width: W } = Dimensions.get('window');

// ── Dark Aurora design tokens ─────────────────────────────────────
const C = {
    blue:   '#00E1FF',
    pink:   '#FF007A',
    purple: '#590FB7',
    violet: '#8B60FF',
    text:   '#FFFFFF',
    sub:    '#A0AEC0',
    dim:    'rgba(255,255,255,0.12)',
    glass:  'rgba(0,0,0,0.42)',
    border: 'rgba(255,255,255,0.13)',
};

const GENDERS = [
    { value: 'female', label: 'Kadın',  Icon: UserIcon },
    { value: 'male',   label: 'Erkek',  Icon: UserIcon },
    { value: 'other',  label: 'Diğer',  Icon: SparklesIcon },
];
const INTERESTS = [
    { value: 'female', label: 'Kadınlar', Icon: UserIcon },
    { value: 'male',   label: 'Erkekler', Icon: UserIcon },
    { value: 'other',  label: 'Hepsi',    Icon: UsersIcon },
];

const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const STEP_ICONS  = [UserIcon, HeartIcon, CakeIcon, PhotoIcon, LockClosedIcon];
const TOTAL_STEPS = 5;

// ── Dark glass card ───────────────────────────────────────────────
function GlassCard({ children, style }) {
    return (
        <BlurView intensity={28} tint="dark" style={[styles.glassCard, style]}>
            {children}
        </BlurView>
    );
}

// ── Chip button ───────────────────────────────────────────────────
function Chip({ label, Icon, active, onPress, accent = C.blue }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.chip, active && { borderColor: accent, borderWidth: 1.5 }]}
            activeOpacity={0.75}
        >
            {active && (
                <LinearGradient
                    colors={[`${accent}22`, `${accent}10`]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            )}
            {Icon && <Icon size={15} color={active ? accent : C.sub} />}
            <Text style={[styles.chipLabel, active && { color: accent, fontWeight: '700' }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

// ── Main component ────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }) {
    const [name, setName]                 = useState('');
    const [bio, setBio]                   = useState('');
    const [gender, setGender]             = useState('');
    const [interestedIn, setInterestedIn] = useState([]);
    const [birthDay, setBirthDay]         = useState('');
    const [birthMonth, setBirthMonth]     = useState('');
    const [birthYear, setBirthYear]       = useState('');
    const [photos, setPhotos]             = useState([]);
    const [password, setPassword]         = useState('');
    const [error, setError]               = useState('');
    const [loading, setLoading]           = useState(false);

    const slideX  = useRef(new Animated.Value(0)).current;
    const [step, setStep] = useState(0);

    const goTo = (next) => {
        setError('');
        Animated.timing(slideX, {
            toValue: -next * W,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start(() => setStep(next));
    };

    const validate = () => {
        if (step === 0 && !name.trim())               { setError('İsim gerekli.'); return false; }
        if (step === 1 && !gender)                    { setError('Cinsiyetini seç.'); return false; }
        if (step === 1 && interestedIn.length === 0)  { setError('En az bir tercih seç.'); return false; }
        if (step === 2) {
            const d = parseInt(birthDay), m = parseInt(birthMonth), y = parseInt(birthYear);
            if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) {
                setError('Geçerli bir doğum tarihi gir.'); return false;
            }
            if (new Date().getFullYear() - y < 18) { setError('18 yaşından büyük olmalısın.'); return false; }
        }
        if (step === 3 && photos.length === 0)        { setError('En az 1 fotoğraf ekle.'); return false; }
        if (step === 4 && password.length < 6)        { setError('Şifre en az 6 karakter.'); return false; }
        return true;
    };

    const handleNext = () => {
        if (!validate()) return;
        if (step < TOTAL_STEPS - 1) goTo(step + 1);
        else handleSubmit();
    };

    const toggleInterest = (val) => {
        setInterestedIn(prev =>
            prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
        );
    };

    const pickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { setError('Fotoğraflara erişim izni gerekli.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.82,
        });
        if (!result.canceled && result.assets?.[0]) {
            const a = result.assets[0];
            setPhotos(prev => [...prev, { uri: a.uri, type: a.mimeType || 'image/jpeg', name: `photo_${Date.now()}.jpg` }]);
        }
    };

    const handleSubmit = async () => {
        setLoading(true); setError('');
        try {
            const birthDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay));
            const { data } = await axios.post(`${API_URL}/users/register`, {
                name: name.trim(), password, bio: bio.trim(),
                gender, interestedIn, interests: [], birthDate,
            });
            setToken(data.token);
            for (const photo of photos) {
                const form = new FormData();
                form.append('photo', { uri: photo.uri, type: photo.type, name: photo.name });
                await axios.post(`${API_URL}/users/${data.user._id}/photos`, form, {
                    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${data.token}` },
                });
            }
            navigation.replace('Main', { user: data.user });
        } catch (err) {
            setError(err.response?.data?.message || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────
    return (
        <GradientBackground>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                {/* ── Step progress ── */}
                <View style={styles.progressRow}>
                    {STEP_ICONS.map((Icon, i) => (
                        <View key={i} style={styles.progressItem}>
                            <View style={[
                                styles.progressDot,
                                i < step  && styles.progressDone,
                                i === step && styles.progressActive,
                            ]}>
                                {i < step
                                    ? <CheckCircleIcon size={15} color="#fff" />
                                    : <Icon size={13} color={i === step ? '#fff' : C.sub} />
                                }
                            </View>
                            {i < TOTAL_STEPS - 1 && (
                                <View style={[styles.progressLine, i < step && styles.progressLineDone]} />
                            )}
                        </View>
                    ))}
                </View>

                {/* ── Sliding pages ── */}
                <View style={styles.slideWindow}>
                    <Animated.View style={[styles.slideContainer, { transform: [{ translateX: slideX }] }]}>

                        {/* Step 1 — Name + Bio */}
                        <View style={styles.page}>
                            <ScrollView contentContainerStyle={styles.pageInner} keyboardShouldPersistTaps="handled">
                                <View style={styles.stepIconWrap}><SparklesIcon size={40} color={C.blue} /></View>
                                <Text style={styles.stepTitle}>Merhaba!</Text>
                                <Text style={styles.stepSub}>Seni nasıl çağıralım?</Text>
                                <GlassCard>
                                    <UserIcon size={18} color={C.blue} style={{ marginBottom: 10 }} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Adın"
                                        placeholderTextColor={C.sub}
                                        value={name}
                                        onChangeText={setName}
                                        autoFocus
                                    />
                                    <TextInput
                                        style={[styles.input, styles.bioInput]}
                                        placeholder="Kısa bir bio (opsiyonel)"
                                        placeholderTextColor={C.sub}
                                        value={bio}
                                        onChangeText={setBio}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </GlassCard>
                            </ScrollView>
                        </View>

                        {/* Step 2 — Gender + Interests */}
                        <View style={styles.page}>
                            <ScrollView contentContainerStyle={styles.pageInner} keyboardShouldPersistTaps="handled">
                                <View style={styles.stepIconWrap}><HeartIcon size={40} color={C.pink} /></View>
                                <Text style={styles.stepTitle}>Biraz hakkında</Text>
                                <Text style={styles.stepSub}>Kim olduğunu ve kimi aradığını söyle.</Text>
                                <GlassCard>
                                    <Text style={styles.fieldLabel}>Ben</Text>
                                    <View style={styles.chipRow}>
                                        {GENDERS.map(g => (
                                            <Chip key={g.value} {...g} active={gender === g.value}
                                                onPress={() => setGender(g.value)} accent={C.blue} />
                                        ))}
                                    </View>
                                    <Text style={[styles.fieldLabel, { marginTop: 18 }]}>İlgilendiğim</Text>
                                    <View style={styles.chipRow}>
                                        {INTERESTS.map(opt => (
                                            <Chip key={opt.value} {...opt} active={interestedIn.includes(opt.value)}
                                                onPress={() => toggleInterest(opt.value)} accent={C.pink} />
                                        ))}
                                    </View>
                                </GlassCard>
                            </ScrollView>
                        </View>

                        {/* Step 3 — Birthday */}
                        <View style={styles.page}>
                            <ScrollView contentContainerStyle={styles.pageInner} keyboardShouldPersistTaps="handled">
                                <View style={styles.stepIconWrap}><CakeIcon size={40} color={C.violet} /></View>
                                <Text style={styles.stepTitle}>Doğum tarihin</Text>
                                <Text style={styles.stepSub}>18 yaşından büyük olmalısın.</Text>
                                <GlassCard>
                                    <CakeIcon size={18} color={C.violet} style={{ marginBottom: 10 }} />
                                    <View style={styles.dateRow}>
                                        <TextInput
                                            style={[styles.input, styles.dateInput]}
                                            placeholder="GG" placeholderTextColor={C.sub}
                                            value={birthDay}
                                            onChangeText={t => setBirthDay(t.replace(/\D/g, '').slice(0, 2))}
                                            keyboardType="numeric" maxLength={2}
                                        />
                                        <TextInput
                                            style={[styles.input, styles.dateInput]}
                                            placeholder="AA" placeholderTextColor={C.sub}
                                            value={birthMonth}
                                            onChangeText={t => setBirthMonth(t.replace(/\D/g, '').slice(0, 2))}
                                            keyboardType="numeric" maxLength={2}
                                        />
                                        <TextInput
                                            style={[styles.input, styles.dateInputYear]}
                                            placeholder="YYYY" placeholderTextColor={C.sub}
                                            value={birthYear}
                                            onChangeText={t => setBirthYear(t.replace(/\D/g, '').slice(0, 4))}
                                            keyboardType="numeric" maxLength={4}
                                        />
                                    </View>
                                    {birthMonth && birthYear?.length === 4 && parseInt(birthMonth) >= 1 && parseInt(birthMonth) <= 12 && (
                                        <Text style={styles.ageHint}>
                                            {MONTHS[parseInt(birthMonth) - 1]} {birthYear}
                                            {' · '}{new Date().getFullYear() - parseInt(birthYear)} yaşında
                                        </Text>
                                    )}
                                </GlassCard>
                            </ScrollView>
                        </View>

                        {/* Step 4 — Photos */}
                        <View style={styles.page}>
                            <ScrollView contentContainerStyle={styles.pageInner} keyboardShouldPersistTaps="handled">
                                <View style={styles.stepIconWrap}><PhotoIcon size={40} color={C.blue} /></View>
                                <Text style={styles.stepTitle}>Fotoğrafların</Text>
                                <Text style={styles.stepSub}>En az 1 fotoğraf ekle.</Text>
                                <GlassCard>
                                    <View style={styles.photoGrid}>
                                        {photos.map((p, i) => (
                                            <View key={i} style={styles.photoThumb}>
                                                <Image source={{ uri: p.uri }} style={styles.thumbImg} />
                                                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotos(prev => prev.filter((_,j) => j !== i))}>
                                                    <XMarkIcon size={11} color="#fff" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                        {photos.length < 6 && (
                                            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickPhoto}>
                                                <PlusCircleIcon size={30} color={C.blue} />
                                                <Text style={styles.addPhotoText}>Ekle</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </GlassCard>
                            </ScrollView>
                        </View>

                        {/* Step 5 — Password */}
                        <View style={styles.page}>
                            <ScrollView contentContainerStyle={styles.pageInner} keyboardShouldPersistTaps="handled">
                                <View style={styles.stepIconWrap}><LockClosedIcon size={40} color={C.pink} /></View>
                                <Text style={styles.stepTitle}>Son adım!</Text>
                                <Text style={styles.stepSub}>Hesabını güvende tut.</Text>
                                <GlassCard>
                                    <LockClosedIcon size={18} color={C.pink} style={{ marginBottom: 10 }} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Şifre (min 6 karakter)"
                                        placeholderTextColor={C.sub}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </GlassCard>
                            </ScrollView>
                        </View>

                    </Animated.View>
                </View>

                {/* ── Error ── */}
                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* ── Navigation ── */}
                <View style={styles.navRow}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => step > 0 ? goTo(step - 1) : navigation.goBack()}
                    >
                        <ArrowLeftIcon size={20} color={C.sub} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nextBtn} onPress={handleNext} disabled={loading} activeOpacity={0.82}>
                        <LinearGradient
                            colors={[C.blue, C.purple, C.pink]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.nextBtnGrad}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" size="small" />
                                : step < TOTAL_STEPS - 1
                                    ? <><Text style={styles.nextBtnText}>İleri</Text><ArrowRightIcon size={18} color="#fff" /></>
                                    : <Text style={styles.nextBtnText}>Hesap Oluştur</Text>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    // Progress
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingTop: 56,
        paddingBottom: 12,
    },
    progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    progressDot: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    progressActive: { backgroundColor: 'rgba(89,15,183,0.75)', borderColor: C.blue },
    progressDone:   { backgroundColor: 'rgba(0,225,255,0.30)', borderColor: C.blue },
    progressLine:     { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 2 },
    progressLineDone: { backgroundColor: C.blue },

    // Slide
    slideWindow:    { flex: 1, overflow: 'hidden' },
    slideContainer: { flexDirection: 'row', width: W * TOTAL_STEPS },
    page:           { width: W },
    pageInner:      { padding: 24, paddingTop: 8, flexGrow: 1 },

    // Step header
    stepIconWrap: { alignItems: 'center', marginBottom: 12 },
    stepTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 6, letterSpacing: -0.5 },
    stepSub:   { fontSize: 15, color: C.sub, textAlign: 'center', marginBottom: 24 },

    // Glass card
    glassCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,0,0,0.42)',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.13)',
        padding: 20,
    },

    // Inputs
    input: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        fontSize: 16,
        color: '#fff',
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    bioInput: { minHeight: 80, textAlignVertical: 'top' },

    // Date
    dateRow:       { flexDirection: 'row', gap: 10 },
    dateInput:     { flex: 1, textAlign: 'center', marginBottom: 0 },
    dateInputYear: { flex: 1.6, textAlign: 'center', marginBottom: 0 },
    ageHint:       { color: C.blue, fontWeight: '600', fontSize: 13, textAlign: 'center', marginTop: 10 },

    // Field label
    fieldLabel: {
        fontSize: 11, fontWeight: '700', color: C.sub,
        textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 10,
    },

    // Chips
    chipRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
    },
    chipLabel: { color: C.sub, fontWeight: '600', fontSize: 14 },

    // Photos
    photoGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    photoThumb:  { width: 90, height: 112, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.07)' },
    thumbImg:    { width: '100%', height: '100%' },
    removePhoto: {
        position: 'absolute', top: 4, right: 4,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center', justifyContent: 'center',
    },
    addPhotoBtn: {
        width: 90, height: 112, borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(0,225,255,0.35)',
        borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    addPhotoText: { color: C.blue, fontSize: 11, fontWeight: '600' },

    // Error
    errorBox: {
        marginHorizontal: 24, marginBottom: 8,
        backgroundColor: 'rgba(255,0,122,0.12)',
        borderRadius: 10, padding: 11,
        borderWidth: 0.5, borderColor: 'rgba(255,0,122,0.35)',
    },
    errorText: { color: '#FF6090', textAlign: 'center', fontSize: 13, fontWeight: '600' },

    // Nav
    navRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 12, gap: 12,
    },
    backBtn: {
        width: 48, height: 52, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    nextBtn:     { flex: 1, borderRadius: 50, overflow: 'hidden' },
    nextBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
});
