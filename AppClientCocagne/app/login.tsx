import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez saisir votre adresse e-mail.');
      return;
    }
    try {
      await signIn(email);
      // La redirection est gérée dans le layout principal
    } catch (error) {
      Alert.alert('Erreur de connexion', 'Adresse e-mail incorrecte.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        style={styles.input}
        placeholder="Adresse e-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="gray"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff', // Fond blanc forcé
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000', // Texte noir forcé
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
    borderRadius: 5,
    color: '#000',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: Colors.light.tint, // Utilise directement la teinte du thème clair
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
