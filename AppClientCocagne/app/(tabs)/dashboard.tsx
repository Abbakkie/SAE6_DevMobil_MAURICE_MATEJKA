import { useAuth } from '@/context/AuthContext';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { getDashboardStats } from '@/services/api';

interface DashboardStats {
  totalDeliveries: number;
  lastProductName: string | null;
  lastDeliveryDate: string | null;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchStats = async () => {
        try {
          const data = await getDashboardStats(user.id);
          setStats(data);
        } catch (error) {
          console.error("Erreur lors de la récupération des statistiques:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tableau de bord</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {loading ? (
        <Text>Chargement de vos statistiques...</Text>
      ) : stats && stats.totalDeliveries > 0 ? (
        <View style={styles.contentContainer}>
          <Text style={styles.statText}>
            Nombre total de livraisons : <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
          </Text>
          {stats.lastProductName && (
            <Text style={styles.statText}>
              Dernier type de panier : <Text style={styles.statValue}>{stats.lastProductName}</Text>
            </Text>
          )}
          {stats.lastDeliveryDate && (
            <Text style={styles.statText}>
              Date de la dernière livraison : <Text style={styles.statValue}>{new Date(stats.lastDeliveryDate).toLocaleDateString()}</Text>
            </Text>
          )}
        </View>
      ) : (
        <Text>Aucune livraison trouvée pour le moment.</Text>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Déconnexion" onPress={signOut} color={Colors.light.tint} />
      </View>
    </View>
  );
}

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
    fontSize: 24,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  statText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
  },
  statValue: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 20,
  },
});
