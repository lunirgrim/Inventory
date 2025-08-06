import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  Dimensions,
  Linking,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const screenWidth = Dimensions.get('window').width;

const numColumns = screenWidth > 800 ? 5 : screenWidth > 600 ? 4 : screenWidth > 400 ? 3 : 2;

const boxSpacing = 6;
const boxSize = (screenWidth - (numColumns + 1) * boxSpacing) / numColumns;

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

function calculateOrderQuantity(item) {
  const restockAt = item.restockAt ?? 10;
  const unitsPerPack = item.unitsPerPack ?? 1;
  if (item.quantity < restockAt) {
    const neededUnits = restockAt - item.quantity;
    return {
      packsToOrder: Math.ceil(neededUnits / unitsPerPack),
      unitsToOrder: neededUnits,
    };
  }
  return { packsToOrder: 0, unitsToOrder: 0 };
}

const STORE_FILTERS = ['All', 'Costco', 'Amazon', "Sam's", 'Coke'];

export default function TotalCostScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedStore, setSelectedStore] = useState('All');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const inventoryItems = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name ?? 'Unnamed',
          quantity: data.quantity ?? 0,
          costCostco: Number(data.costCostco) || 0,
          costAmazon: Number(data.costAmazon) || 0,
          costSams: Number(data.costSams) || 0,
          costSelected: data.costSelected ?? 'costCostco',
          restockAt: data.restockAt ?? 10,
          unitsPerPack: data.unitsPerPack > 0 ? data.unitsPerPack : 1,
          urls: data.urls ?? {},
        };
      });
      setItems(inventoryItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const storeToCostKey = {
    Costco: 'costCostco',
    Amazon: 'costAmazon',
    "Sam's": 'costSams',
    Coke: 'coke',
  };

  const filteredItems = useMemo(() => {
    const costKey = storeToCostKey[selectedStore];

    return items.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(searchText.toLowerCase());
      if (!nameMatch) return false;

      if (selectedStore === 'All') return true;

      if (selectedStore === 'Coke') {
        return !!item.urls?.coke;
      }

      return item.costSelected === costKey && (item[costKey] || 0) > 0;
    });
  }, [items, searchText, selectedStore]);

  const totalRestockCost = useMemo(() => {
    let total = 0;
    filteredItems.forEach((item) => {
      let cost = 0;

      switch (selectedStore) {
        case 'Costco':
          cost = Number(item.costCostco) || 0;
          break;
        case 'Amazon':
          cost = Number(item.costAmazon) || 0;
          break;
        case "Sam's":
          cost = Number(item.costSams) || 0;
          break;
        case 'Coke':
          cost = 0;
          break;
        case 'All':
        default:
          cost = Number(item.costSelected && item[item.costSelected]) || 0;
          break;
      }

      const unitsPerPack = item.unitsPerPack > 0 ? item.unitsPerPack : 1;
      const { packsToOrder } = calculateOrderQuantity(item);
      if (packsToOrder > 0) {
        total += packsToOrder * (cost * unitsPerPack);
      }
    });
    return total;
  }, [filteredItems, selectedStore]);

  const storeColors = {
    Costco: '#fbbf24',  // gold
    Amazon: '#fb923c',  // orange
    "Sam's": '#14b8a6', // teal
    Coke: '#ef4444',    // red
    Unknown: '#94a3b8', // gray
  };

  const renderItem = ({ item }) => {
    let cost = 0;
    let costSourceKey = '';

    switch (selectedStore) {
      case 'Costco':
        cost = Number(item.costCostco) || 0;
        costSourceKey = 'costCostco';
        break;
      case 'Amazon':
        cost = Number(item.costAmazon) || 0;
        costSourceKey = 'costAmazon';
        break;
      case "Sam's":
        cost = Number(item.costSams) || 0;
        costSourceKey = 'costSams';
        break;
      case 'Coke':
        cost = 0;
        costSourceKey = null;
        break;
      case 'All':
      default:
        costSourceKey = item.costSelected;
        cost = Number(costSourceKey && item[costSourceKey]) || 0;
        break;
    }

    const unitsPerPack = item.unitsPerPack > 0 ? item.unitsPerPack : 1;

    const storeNameMap = {
      costCostco: 'Costco',
      costAmazon: 'Amazon',
      costSams: "Sam's",
    };

    const urlMap = {
      costCostco: item.urls?.costco,
      costAmazon: item.urls?.amazon,
      costSams: item.urls?.sams,
      coke: item.urls?.coke,
    };

    const costSourceLabel = costSourceKey ? storeNameMap[costSourceKey] || 'Unknown' : '';
    const priceUrl = selectedStore === 'Coke' ? urlMap.coke : costSourceKey ? urlMap[costSourceKey] : null;

    const sellingPrice = getSellingPrice(cost) ?? 0;
    const worthIt = isWorthIt(cost);
    const { packsToOrder, unitsToOrder } = calculateOrderQuantity(item);
    const needsRestock = packsToOrder > 0;
    const totalRestockCostItem = packsToOrder * (cost * unitsPerPack);

    // Determine color for store name label
    const storeColor = storeColors[costSourceLabel] || storeColors.Unknown;

    return (
      <View
        style={[
          styles.iconBox,
          { backgroundColor: needsRestock ? '#334155' : '#1e293b' },
        ]}
      >
        <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>

        {selectedStore === 'Coke' ? (
          priceUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(priceUrl)}>
              <Text style={styles.linkText}>View Link ↗</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.costText, { fontStyle: 'italic', color: '#94a3b8' }]}>
              No URL
            </Text>
          )
        ) : (
          <>
            <Text style={styles.restockText}>Restock @ {item.restockAt}</Text>

            {priceUrl ? (
              <TouchableOpacity onPress={() => Linking.openURL(priceUrl)}>
                <Text style={[styles.storeLinkText, { color: storeColor }]}>
                  From: {costSourceLabel} ↗
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.storeName, { color: storeColor }]}>
                From: {costSourceLabel}
              </Text>
            )}

            <Text style={styles.costText}>Cost: ${cost.toFixed(2)}</Text>

            <Text style={styles.sellText}>Sell: ${sellingPrice.toFixed(2)}</Text>

            <Text
              style={[styles.worthText, { color: worthIt ? '#22c55e' : '#ef4444' }]}
            >
              {worthIt ? '✔ Worth It' : '✘ Not Worth It'}
            </Text>

            <Text style={styles.quantityText}>
              Qty: {item.quantity} | Units/Pack: {unitsPerPack}
            </Text>

            {needsRestock ? (
              <View style={styles.orderContainer}>
                <View style={styles.orderRow}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeLabel}>Packs</Text>
                    <Text style={styles.orderBadgeValue}>{packsToOrder}</Text>
                  </View>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeLabel}>Units</Text>
                    <Text style={styles.orderBadgeValue}>{unitsToOrder}</Text>
                  </View>
                </View>
                <Text style={styles.totalCostText}>
                  Total: ${totalRestockCostItem.toFixed(2)}
                </Text>
              </View>
            ) : (
              <Text style={styles.stockSufficientText}>Stock sufficient</Text>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
              style={{ marginBottom: 6 }}
            >
              {STORE_FILTERS.map((store) => (
                <TouchableOpacity
                  key={store}
                  style={[
                    styles.filterButton,
                    selectedStore === store && styles.filterButtonActive,
                  ]}
                  onPress={() => setSelectedStore(store)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedStore === store && styles.filterTextActive,
                    ]}
                  >
                    {store}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.totalCostBar}>
              <Text style={styles.totalCostLabel}>Total Restock Cost:</Text>
              <Text style={styles.totalCostValue}>${totalRestockCost.toFixed(2)}</Text>
            </View>

            <TextInput
              style={styles.searchBar}
              placeholder="Search items..."
              placeholderTextColor="#94a3b8"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {loading ? (
              <ActivityIndicator size="large" color="#60a5fa" />
            ) : filteredItems.length === 0 ? (
              <Text style={styles.noResultsText}>No items found.</Text>
            ) : null}
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 40,
    paddingHorizontal: 12,
  },
  filterContainer: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  filterButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#475569',
    minWidth: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  filterTextActive: {
    color: 'white',
  },
  totalCostBar: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCostLabel: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  totalCostValue: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '700',
  },
  searchBar: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 12,
    color: 'white',
    fontSize: Platform.OS === 'web' ? 14 : 16,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 6,
  },
  noResultsText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: boxSpacing / 2,
  },
  iconBox: {
    width: boxSize,
    height: boxSize * 1.25,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#475569',
    borderWidth: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  restockText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
    textAlign: 'center',
  },
  costText: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  storeLinkText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  linkText: {
    color: '#60a5fa',
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  sellText: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  worthText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  quantityText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
    textAlign: 'center',
  },
  orderContainer: {
    marginTop: 6,
    alignItems: 'center',
    width: '100%',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  orderBadge: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 2,
    minWidth: 60,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBadgeLabel: {
    color: '#dbeafe',
    fontWeight: '600',
    marginRight: 6,
    fontSize: 12,
  },
  orderBadgeValue: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  totalCostText: {
    color: '#93c5fd',
    fontWeight: '700',
    fontSize: 14,
    marginTop: 4,
  },
  stockSufficientText: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
});

