// screens/SignInScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // On success, auth state listener in App will detect this
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Sign In" onPress={handleSignIn} />

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  title: { fontSize: 28, marginBottom: 20, color: '#e0e0e0', fontWeight: '700', textAlign: 'center' },
  input: {
    backgroundColor: '#2d2d2d',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#e0e0e0',
    marginBottom: 15,
  },
  error: { color: '#ef4444', marginBottom: 15, textAlign: 'center' },
  link: { color: '#3b82f6', marginTop: 15, textAlign: 'center' },
});

