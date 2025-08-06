import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const FILTER_OPTIONS = ['All', 'Amazon', 'Costco', "Sam's", 'Coke'];

// Sample inventory data (replace with your actual data source)
const sampleItems = [
  {
    id: '1',
    name: 'Coke Classic',
    prices: {
      Amazon: 1.5,
      Costco: 1.2,
      "Sam's": 1.3,
      Coke: 1.0,
    },
  },
  {
    id: '2',
    name: 'Snacks Pack',
    prices: {
      Amazon: 5.0,
      Costco: 4.8,
      "Sam's": 4.9,
    },
  },
  {
    id: '3',
    name: 'Water Bottle',
    prices: {
      Amazon: 0.9,
      Costco: 0.8,
    },
  },
];

export default function TotalCostScreen() {
  const [selectedFilter, setSelectedFilter] = useState('All');

  // Filter items based on selected store price
  const filteredItems = useMemo(() => {
    if (selectedFilter === 'All') return sampleItems;

    // Only include items that have a price for selectedFilter store
    return sampleItems.filter(item => item.prices[selectedFilter] !== undefined);
  }, [selectedFilter]);

  // Calculate total cost for filtered items
  const totalCost = useMemo(() => {
    return filteredItems.reduce((sum, item) => {
      // If filter is 'All', sum the cheapest price available
      if (selectedFilter === 'All') {
        const prices = Object.values(item.prices);
        return sum + (prices.length ? Math.min(...prices) : 0);
      }
      // Else sum the price for selected filter store only
      return sum + (item.prices[selectedFilter] || 0);
    }, 0);
  }, [filteredItems, selectedFilter]);

  const renderFilterButton = (filter) => (
    <TouchableOpacity
      key={filter}
      onPress={() => setSelectedFilter(filter)}
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonSelected,
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextSelected,
        ]}
      >
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    // Show the price for the selected filter or the lowest if 'All'
    let price;
    if (selectedFilter === 'All') {
      const prices = Object.values(item.prices);
      price = prices.length ? Math.min(...prices) : 0;
    } else {
      price = item.prices[selectedFilter] ?? '-';
    }

    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>
          {price === '-' ? price : `$${price.toFixed(2)}`}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        {FILTER_OPTIONS.map(renderFilterButton)}
      </View>

      {/* Total cost */}
      <View style={styles.totalCostContainer}>
        <Text style={styles.totalCostLabel}>Total Cost:</Text>
        <Text style={styles.totalCostValue}>${totalCost.toFixed(2)}</Text>
      </View>

      {/* Items list */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const BUTTON_WIDTH = (screenWidth - 40) / FILTER_OPTIONS.length;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  filterBar: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  filterButton: {
    width: BUTTON_WIDTH,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#222',
    alignItems: 'center',
  },
  filterButtonSelected: {
    backgroundColor: '#00ccff',
  },
  filterButtonText: {
    color: '#aaa',
    fontWeight: '600',
  },
  filterButtonTextSelected: {
    color: '#121212',
    fontWeight: '700',
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  totalCostLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ccff',
  },
  listContent: {
    paddingBottom: 30,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#222',
    marginVertical: 5,
    borderRadius: 8,
    padding: 15,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
  },
  itemPrice: {
    color: '#00ccff',
    fontSize: 16,
    fontWeight: '600',
  },
});

