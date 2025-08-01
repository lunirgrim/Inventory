import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Linking,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const pricingChart = [
  { sellingPrice: 1, maxCost: 0.3 },
  { sellingPrice: 3, maxCost: 0.9 },
  { sellingPrice: 4, maxCost: 1.2 },
  { sellingPrice: 6, maxCost: 1.8 },
];

function getSellingPrice(cost) {
  for (let i = 0; i < pricingChart.length; i++) {
    if (cost <= pricingChart[i].maxCost) {
      return pricingChart[i].sellingPrice;
    }
  }
  return null;
}

function isWorthIt(cost) {
  return getSellingPrice(cost) !== null;
}

function calculateOrderQuantity(quantity) {
  const restockThreshold = 10;
  if (quantity < restockThreshold) {
    return restockThreshold - quantity;
  }
  return 0;
}

export default function TotalCostScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [filterTag, setFilterTag] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'inventory'),
      (snapshot) => {
        const inventoryItems = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name ?? 'Unnamed',
            quantity: data.quantity ?? 0,
            cost: data.cost ?? 0,
            tags: data.tags ?? [],
            urls: data.urls ?? {},
          };
        });
        setItems(inventoryItems);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching inventory:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const allTagsSet = new Set();
  items.forEach((item) => {
    (item.tags || []).forEach((tag) => allTagsSet.add(tag));
  });
  const allTags = Array.from(allTagsSet).sort();

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesTag = filterTag ? item.tags.includes(filterTag) : true;
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchText.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [items, filterTag, searchText]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: '#121212' }]}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  const totalRestockCost = filteredItems.reduce((sum, item) => {
    const orderQty = calculateOrderQuantity(item.quantity);
    return sum + orderQty * item.cost;
  }, 0);

  const renderItem = ({ item }) => {
    const sellingPrice = getSellingPrice(item.cost);
    const orderQty = calculateOrderQuantity(item.quantity);
    const worthIt = isWorthIt(item.cost);

    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.row}>
          <Text style={styles.text}>Stock: {item.quantity}</Text>
          <Text style={styles.text}>Cost: ${item.cost.toFixed(2)}</Text>
          <Text style={styles.text}>
            Selling Price:{' '}
            {sellingPrice !== null ? `$${sellingPrice.toFixed(2)}` : 'N/A'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Order Qty: {orderQty}</Text>
          <Text
            style={[
              styles.text,
              { color: worthIt ? '#22c55e' : '#ef4444', fontWeight: 'bold' },
            ]}
          >
            {worthIt ? 'Worth it' : 'Not worth it'}
          </Text>
        </View>
        <View style={styles.urlsRow}>
          {item.urls.costco && (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.urls.costco)}
              style={styles.urlButton}
            >
              <Text style={styles.urlText}>Costco</Text>
            </TouchableOpacity>
          )}
          {item.urls.amazon && (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.urls.amazon)}
              style={styles.urlButton}
            >
              <Text style={styles.urlText}>Amazon</Text>
            </TouchableOpacity>
          )}
          {item.urls.sams && (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.urls.sams)}
              style={styles.urlButton}
            >
              <Text style={styles.urlText}>Sam's</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search items..."
          placeholderTextColor="#94a3b8"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* TAG FILTER */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterTag === null && styles.filterButtonActive,
            ]}
            onPress={() => setFilterTag(null)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filterTag === null && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.filterButton,
                filterTag === tag && styles.filterButtonActive,
              ]}
              onPress={() => setFilterTag(tag)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterTag === tag && styles.filterButtonTextActive,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* TOTAL COST */}
      <Text style={styles.totalCostText}>
        Cost: ${totalRestockCost.toFixed(2)}
      </Text>

      {/* ITEM LIST */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155', // dark border
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b', // dark input bg
  },
  searchInput: {
    fontSize: 16,
    color: 'white',
  },

  filterWrapper: {
    height: 40,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#334155', // dark slate
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb', // bright blue accent
  },
  filterButtonText: {
    color: '#94a3b8', // lighter gray
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: 'white',
  },

  totalCostText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#60a5fa', // bright accent
  },

  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // subtle dark border
    paddingVertical: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: '#cbd5e1', // light gray text
  },
  urlsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  urlButton: {
    marginRight: 12,
    backgroundColor: '#2563eb', // bright blue button
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  urlText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

