// screens/InventoryScreen/InventorySearchBar.js
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function InventorySearchBar({ searchText, setSearchText }) {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#64748b" />
      <TextInput
        style={styles.searchInput}
        placeholder="Search items..."
        placeholderTextColor="#64748b"
        value={searchText}
        onChangeText={setSearchText}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={() => setSearchText('')}>
          <Ionicons name="close-circle" size={20} color="#64748b" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#e0e0e0',
    paddingVertical: 8,
    fontSize: 16,
    marginLeft: 8,
  },
});

