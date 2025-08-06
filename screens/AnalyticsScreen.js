import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  BarChart,
  PieChart,
  LineChart,
} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const newItems = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(newItems);
    });
    return () => unsubscribe();
  }, []);

  // Summary Metrics
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const totalValue = items.reduce(
    (sum, i) => sum + (i.quantity || 0) * (i.cost || 0),
    0
  );
  const restockCount = items.filter(
    (i) => (i.restockAt !== null && i.quantity < i.restockAt)
  ).length;
  const totalCapacity = items.reduce(
    (sum, i) => sum + (i.fullCapacity || 0),
    0
  );

  // Packs Needed Calculation
  const packsNeededData = items
    .filter((i) => i.fullCapacity && i.unitsPerPack && i.unitsPerPack > 0)
    .map((i) => ({
      name: i.name,
      packsNeeded: Math.ceil((i.fullCapacity - (i.quantity || 0)) / i.unitsPerPack),
    }))
    .filter((i) => i.packsNeeded > 0);

  const packsNeededLabels = packsNeededData.map(i => i.name.slice(0, 5));
  const packsNeededValues = packsNeededData.map(i => i.packsNeeded);

  // Quantity by Tag (Bar Chart)
  const tagQuantityMap = {};
  items.forEach((item) => {
    const tags = item.tags || ['Untagged'];
    tags.forEach((tag) => {
      tagQuantityMap[tag] = (tagQuantityMap[tag] || 0) + (item.quantity || 0);
    });
  });
  const tags = Object.keys(tagQuantityMap);
  const quantitiesByTag = tags.map((tag) => tagQuantityMap[tag]);

  // Inventory Value by Item (Line Chart)
  const sortedItems = [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const lineLabels = sortedItems.map((i) => i.name.slice(0, 5));
  const lineValues = sortedItems.map((i) => (i.quantity || 0) * (i.cost || 0));

  // Profitability (Pie Chart)
  let profitableCount = 0;
  let nonProfitableCount = 0;
  items.forEach((i) => {
    if ((i.sellPrice || 0) > (i.cost || 0)) profitableCount++;
    else nonProfitableCount++;
  });

  // Chart Theme (Dark)
  const chartConfig = {
    backgroundGradientFrom: '#121212',
    backgroundGradientTo: '#121212',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(203, 213, 225, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#60a5fa',
    },
  };

  return (
    <ScrollView style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalItems}</Text>
          <Text style={styles.summaryLabel}>Total Items</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalQuantity}</Text>
          <Text style={styles.summaryLabel}>Total Quantity</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>${totalValue.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Inventory Value</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{restockCount}</Text>
          <Text style={styles.summaryLabel}>Need Restock</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalCapacity}</Text>
          <Text style={styles.summaryLabel}>Total Capacity</Text>
        </View>
      </View>

      {/* Bar Chart: Quantity by Tag */}
      <Text style={styles.chartTitle}>Quantity by Tag</Text>
      {tags.length > 0 ? (
        <BarChart
          data={{
            labels: tags,
            datasets: [{ data: quantitiesByTag }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={45}
          fromZero
          showValuesOnTopOfBars
          style={styles.chart}
        />
      ) : (
        <Text style={styles.emptyText}>No tags available</Text>
      )}

      {/* Line Chart: Inventory Value per Item */}
      <Text style={styles.chartTitle}>Inventory Value by Item</Text>
      {sortedItems.length > 0 ? (
        <LineChart
          data={{
            labels: lineLabels,
            datasets: [{ data: lineValues }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          fromZero
        />
      ) : (
        <Text style={styles.emptyText}>No items available</Text>
      )}

      {/* Pie Chart: Profitability */}
      <Text style={styles.chartTitle}>Profitability Ratio</Text>
      {totalItems > 0 ? (
        <PieChart
          data={[
            {
              name: 'Profitable',
              population: profitableCount,
              color: '#22c55e',
              legendFontColor: '#22c55e',
              legendFontSize: 14,
            },
            {
              name: 'Not Profitable',
              population: nonProfitableCount,
              color: '#ef4444',
              legendFontColor: '#ef4444',
              legendFontSize: 14,
            },
          ]}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          style={styles.chart}
        />
      ) : (
        <Text style={styles.emptyText}>No data available</Text>
      )}

      {/* Packs Needed Chart */}
      <Text style={styles.chartTitle}>Packs Needed to Reach Capacity</Text>
      {packsNeededLabels.length > 0 ? (
        <BarChart
          data={{
            labels: packsNeededLabels,
            datasets: [{ data: packsNeededValues }],
          }}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={45}
          fromZero
          showValuesOnTopOfBars
          style={styles.chart}
        />
      ) : (
        <Text style={styles.emptyText}>No items with valid unit/pack/capacity</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    width: '47%',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    paddingVertical: 16,
    marginVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#60a5fa',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e0e0e0',
    marginBottom: 12,
    marginLeft: 6,
    marginTop: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
  },
});

