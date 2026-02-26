import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const MeshGradientStatic = memo(() => {
    return (
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
            <Defs>
                {/* Main Dark Base */}
                <SvgLinearGradient id="bgBase" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#121625" />
                    <Stop offset="1" stopColor="#0B0F19" />
                </SvgLinearGradient>

                {/* Left Hot Pink Bloom */}
                <RadialGradient id="pinkBloom" cx="0%" cy="100%" rx="90%" ry="90%">
                    <Stop offset="0" stopColor="#ff0066" stopOpacity="0.8" />
                    <Stop offset="0.4" stopColor="#ff0066" stopOpacity="0.5" />
                    <Stop offset="1" stopColor="#ff0066" stopOpacity="0" />
                </RadialGradient>

                {/* Right Electric Blue Bloom */}
                <RadialGradient id="blueBloom" cx="100%" cy="100%" rx="90%" ry="90%">
                    <Stop offset="0" stopColor="#0055ff" stopOpacity="0.8" />
                    <Stop offset="0.4" stopColor="#0055ff" stopOpacity="0.4" />
                    <Stop offset="1" stopColor="#0055ff" stopOpacity="0" />
                </RadialGradient>

                {/* Center Lower Violet Bloom to bridge pink and blue */}
                <RadialGradient id="violetBloom" cx="50%" cy="100%" rx="70%" ry="70%">
                    <Stop offset="0" stopColor="#8a2be2" stopOpacity="0.6" />
                    <Stop offset="0.5" stopColor="#8a2be2" stopOpacity="0.3" />
                    <Stop offset="1" stopColor="#8a2be2" stopOpacity="0" />
                </RadialGradient>

            </Defs>

            {/* Render Bottom to Top */}
            <Rect width="100%" height="100%" fill="url(#bgBase)" />
            <Rect width="100%" height="100%" fill="url(#pinkBloom)" />
            <Rect width="100%" height="100%" fill="url(#blueBloom)" />
            <Rect width="100%" height="100%" fill="url(#violetBloom)" />
        </Svg>
    );
});

export default function GradientBackground({ children, style }) {
    return (
        <View style={[styles.root, style]}>
            {/* ── Lovable Mesh Gradient (Static SVG) ── */}
            <MeshGradientStatic />

            {/* Top & bottom darkening vignette — maximises text readability */}
            <LinearGradient
                colors={[
                    'rgba(11,15,25,0.7)',
                    'rgba(11,15,25,0.1)',
                    'rgba(11,15,25,0.1)',
                    'rgba(11,15,25,0.2)',
                ]}
                locations={[0, 0.22, 0.78, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />

            {/* ── Content ── */}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#0B0F19',
    },
});

