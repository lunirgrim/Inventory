import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

import InventoryList from './InventoryList';
import InventoryFilters from './InventoryFilters';
import { isProfitable } from './InventoryUtils';

export default function InventoryScreen() {
  const [items, setItems] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editFieldsById, setEditFieldsById] = useState({});
  const [filterTag, setFilterTag] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [searchText, setSearchText] = useState('');

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

  // Gather all tags from items
  const allTagsSet = new Set();
  items.forEach((item) => {
    (item.tags || []).forEach((tag) => allTagsSet.add(tag));
  });
  const allTags = Array.from(allTagsSet);

  // Filter items by tag and search text
  const filteredItems = useMemo(() => {
    let filtered = filterTag
      ? items.filter((item) => (item.tags || []).includes(filterTag))
      : items;
    if (searchText.trim()) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return filtered;
  }, [items, filterTag, searchText]);

  // Add costPerUnit to filtered items
  const filteredItemsWithCostPerUnit = useMemo(() => {
    return filteredItems.map((item) => {
      const selectedCostKey = item.costSelected || 'costCostco';
      const packageCost = Number(item[selectedCostKey]) || 0;
      const unitsPerPack = Number(item.unitsPerPack) || 1; // avoid division by zero
      const costPerUnit = unitsPerPack > 0 ? packageCost / unitsPerPack : 0;
      return {
        ...item,
        costPerUnit,
      };
    });
  }, [filteredItems]);

  // Add new item to Firestore
  const addItem = async () => {
    if (!newItemName.trim()) {
      alert('Item name is required');
      return;
    }
    try {
      await addDoc(collection(db, 'inventory'), {
        name: newItemName.trim(),
        quantity: 0,
        unitsPerPack: 0,
        costCostco: 0,
        costAmazon: 0,
        costSams: 0,
        costCoke: 0,
        costSelected: 'costCostco',
        sellPrice: 0,
        fullCapacity: null,
        restockAt: null,
        tags: [],
        urls: {
          costco: '',
          sams: '',
          amazon: '',
          coke: '',
        },
      });
      setNewItemName('');
    } catch (e) {
      alert('Failed to add item: ' + e.message);
    }
  };

  // Delete item from Firestore
  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (e) {
      alert('Failed to delete item: ' + e.message);
    }
  };

  // Start editing an item
  const startEditing = (item) => {
    setEditId(item.id);
    setEditFieldsById((prev) => ({
      ...prev,
      [item.id]: {
        name: item.name,
        quantity: item.quantity?.toString() || '0',
        unitsPerPack: item.unitsPerPack?.toString() || '',
        costCostco: item.costCostco?.toString() || '0',
        costAmazon: item.costAmazon?.toString() || '0',
        costSams: item.costSams?.toString() || '0',
        costCoke: item.costCoke?.toString() || '0',
        costSelected: item.costSelected || 'costCostco',
        sellPrice: item.sellPrice?.toString() || '0',
        fullCapacity: item.fullCapacity?.toString() || '',
        restockAt: item.restockAt?.toString() || '',
        tags: (item.tags || []).join(', '),
        urls: {
          costco: item.urls?.costco || '',
          sams: item.urls?.sams || '',
          amazon: item.urls?.amazon || '',
          coke: item.urls?.coke || '',
        },
      },
    }));
  };

  // Save edited item changes to Firestore
  const saveChanges = async (id) => {
    const fields = editFieldsById[id];
    if (!fields.name.trim()) {
      alert('Name cannot be empty');
      return;
    }
    try {
      await updateDoc(doc(db, 'inventory', id), {
        name: fields.name.trim(),
        quantity: Number(fields.quantity) || 0,
        unitsPerPack: Number(fields.unitsPerPack) || 0,
        costCostco: parseFloat(fields.costCostco) || 0,
        costAmazon: parseFloat(fields.costAmazon) || 0,
        costSams: parseFloat(fields.costSams) || 0,
        costCoke: parseFloat(fields.costCoke) || 0,
        costSelected: fields.costSelected,
        sellPrice: parseFloat(fields.sellPrice) || 0,
        fullCapacity: fields.fullCapacity ? Number(fields.fullCapacity) : null,
        restockAt: fields.restockAt ? Number(fields.restockAt) : null,
        tags: fields.tags
          ? fields.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [],
        urls: {
          costco: fields.urls.costco || '',
          sams: fields.urls.sams || '',
          amazon: fields.urls.amazon || '',
          coke: fields.urls.coke || '',
        },
      });
      setEditId(null);
      setEditFieldsById((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (e) {
      alert('Failed to save changes: ' + e.message);
    }
  };

  // Cancel editing an item
  const cancelEditing = (id) => {
    setEditId(null);
    setEditFieldsById((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // URL buttons with green highlight on selected
  const UrlButtons = ({ urls, costSelected }) => {
    const renderUrlDisplay = (url, label, key) => {
      if (!url) return null;
      const isActive = costSelected === key;
      return (
        <TouchableOpacity
          onPress={() => Linking.openURL(url)}
          style={{ marginRight: 12 }}
        >
          <Text
            style={{
              color: isActive ? '#22c55e' : '#94a3b8',
              fontWeight: isActive ? '700' : '600',
              fontSize: 16,
            }}
          >
            {label}
          </Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {renderUrlDisplay(urls.costco, 'Costco', 'costCostco')}
        {renderUrlDisplay(urls.sams, "Sam's", 'costSams')}
        {renderUrlDisplay(urls.amazon, 'Amazon', 'costAmazon')}
        {renderUrlDisplay(urls.coke, 'Coke', 'costCoke')}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
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

      {/* Add New Item Section */}
      <View style={styles.addContainer}>
        <TextInput
          style={[styles.input, styles.nameInput, styles.addInput]}
          placeholder="Item Name"
          placeholderTextColor="#64748b"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TouchableOpacity style={styles.addButtonCompact} onPress={addItem}>
          <Ionicons name="checkmark" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <InventoryFilters allTags={allTags} filterTag={filterTag} setFilterTag={setFilterTag} />

      {/* Inventory List with costPerUnit included */}
      <InventoryList
        items={filteredItemsWithCostPerUnit}
        editId={editId}
        editFieldsById={editFieldsById}
        setEditFieldsById={setEditFieldsById}
        setEditId={setEditId}
        deleteItem={deleteItem}
        saveChanges={saveChanges}
        cancelEditing={cancelEditing}
        startEditing={startEditing}
        isProfitable={isProfitable}
        renderUrlButtons={UrlButtons} // pass UrlButtons component here
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 24,
    backgroundColor: '#181818',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: 'white',
    paddingHorizontal: 8,
  },
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    color: 'white',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  nameInput: {
    flex: 1,
  },
  addInput: {
    borderWidth: 1,
    borderColor: '#334155',
  },
  addButtonCompact: {
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 8,
  },
});

