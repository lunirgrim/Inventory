// screens/InventoryScreen/InventoryFilters.js
import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function InventoryFilters({ allTags, filterTag, setFilterTag }) {
  return (
    <View style={styles.filterWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        <TouchableOpacity
          style={[styles.filterButton, filterTag === null && styles.filterButtonActive]}
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
  );
}

const styles = StyleSheet.create({
  filterWrapper: {
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: '#2d2d2d',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    color: '#64748b',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: 'white',
  },
});

