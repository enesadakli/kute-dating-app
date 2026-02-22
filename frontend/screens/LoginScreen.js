import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

// Ensure to use your local IP address instead of localhost if testing on physical device
// e.g., 'http://192.168.1.100:5000/api'
const API_URL = 'http://localhost:5000/api';

export default function LoginScreen({ navigation }) {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');

    const handleRegisterOrLogin = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        try {
            // In a real app we'd have proper auth, here we mock it by creating a new user
            const response = await axios.post(`${API_URL}/users/register`, {
                name,
                bio,
                interests: ['coding', 'coffee'] // Mock interests
            });

            const user = response.data;

            // Navigate to Home with user data
            navigation.replace('Main', { user });
        } catch (error) {
            console.error(error);
            Alert.alert('Login Error', 'Failed to connect to the server.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Kute</Text>
            <Text style={styles.subtitle}>Find your match.</Text>

            <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={name}
                onChangeText={setName}
            />

            <TextInput
                style={styles.input}
                placeholder="A short bio"
                value={bio}
                onChangeText={setBio}
            />

            <TouchableOpacity style={styles.button} onPress={handleRegisterOrLogin}>
                <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ff4b4b',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#ff4b4b',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
