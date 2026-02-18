import { useAuth } from '@/context/AuthContext';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { getDeliveryHistory } from '@/services/api';

// L'interface représente maintenant une "Livraison" enrichie
interface Delivery {
  id: string;
  created_at: string;
  productName: string;
  livre: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        try {
          const data = await getDeliveryHistory(user.id);
          setHistory(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      fetchHistory();
    }
  }, [user]);

  const renderItem = ({ item }: { item: Delivery }) => (
    <View style={styles.itemContainer}>
      <Text>Date : {new Date(item.created_at).toLocaleDateString()}</Text>
      <Text>Status : {item.livre}</Text>
      <Text>Panier : {item.productName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historique des livraisons</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {loading ? (
        <Text>Chargement de l'historique...</Text>
      ) : history.length > 0 ? (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          style={styles.list}
        />
      ) : (
        <Text>Aucun historique de livraison trouvé.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
  },
  list: {
    width: '100%',
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '90%',
    alignSelf: 'center',
  }
});
