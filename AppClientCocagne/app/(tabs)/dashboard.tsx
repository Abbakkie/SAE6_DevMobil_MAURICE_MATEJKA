import { useAuth } from '@/context/AuthContext';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, useColorScheme } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { getBasketDetails } from '@/services/api';

// L'interface représente maintenant une "Livraison" enrichie
interface LastDelivery {
  id: string;
  created_at: string;
  productName: string;
  composition: string[]; 
}

export default function DashboardScreen() {
  const [lastDelivery, setLastDelivery] = useState<LastDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (user) {
      const fetchBasket = async () => {
        try {
          const data = await getBasketDetails(user.id);
          setLastDelivery(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      fetchBasket();
    }
  }, [user]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
    },
    contentContainer: {
      alignItems: 'center',
      width: '100%',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
    },
    subtitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
    },
    separator: {
      marginVertical: 30,
      height: 1,
      width: '80%',
    },
    buttonContainer: {
      width: '100%',
      paddingBottom: 20,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tableau de bord</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {loading ? (
        <Text>Chargement des informations...</Text>
      ) : lastDelivery ? (
        <View style={styles.contentContainer}>
          <Text style={styles.subtitle}>Votre dernière livraison :</Text>
          <Text>Type de panier : {lastDelivery.productName}</Text>
          <Text>Date de livraison : {new Date(lastDelivery.created_at).toLocaleDateString()}</Text>
          <Text style={styles.subtitle}>Composition :</Text>
          {lastDelivery.composition.map((item, index) => (
            <Text key={index}>- {item}</Text>
          ))}
        </View>
      ) : (
        <Text>Aucune information de livraison disponible.</Text>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Déconnexion" onPress={signOut} color={Colors[colorScheme ?? 'light'].tint} />
      </View>
    </View>
  );
}
