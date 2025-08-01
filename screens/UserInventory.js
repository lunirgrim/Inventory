import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';

import { auth, db } from '../firebase'; // adjust path if needed
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

export default function UserInventory() {
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setInventory([]);
      return;
    }

    setLoadingInventory(true);
    const inventoryRef = collection(db, 'users', user.uid, 'inventory');

    const unsubscribeInventory = onSnapshot(inventoryRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInventory(items);
      setLoadingInventory(false);
    });

    return () => unsubscribeInventory();
  }, [user]);

  if (loadingUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ccff" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No user logged in.</Text>
        <Text style={styles.text}>Please sign in to view your inventory.</Text>
      </View>
    );
  }

  if (loadingInventory) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ccff" />
        <Text style={styles.loadingText}>Loading your inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory for User: {user.email}</Text>
      {inventory.length === 0 ? (
        <Text style={styles.text}>Your inventory is empty.</Text>
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemName}>{item.name || 'Unnamed Item'}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ccff',
    marginBottom: 16,
  },
  text: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingText: {
    color: '#00ccff',
    marginTop: 10,
  },
  item: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
  },
});

