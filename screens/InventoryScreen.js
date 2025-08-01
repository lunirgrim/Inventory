
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';

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

  const isProfitable = (cost, sellPrice) => {
    return parseFloat(sellPrice) > parseFloat(cost);
  };

  const startEditing = (item) => {
    setEditId(item.id);
    setEditFieldsById((prev) => ({
      ...prev,
      [item.id]: {
        name: item.name,
        quantity: item.quantity?.toString() || '0',
        costCostco: item.costCostco?.toString() || '0',
        costAmazon: item.costAmazon?.toString() || '0',
        costSams: item.costSams?.toString() || '0',
        costSelected: item.costSelected || 'costCostco', // default to costCostco if undefined
        sellPrice: item.sellPrice?.toString() || '0',
        fullCapacity: item.fullCapacity?.toString() || '',
        restockAt: item.restockAt?.toString() || '',
        tags: (item.tags || []).join(', '),
        urls: {
          costco: item.urls?.costco || '',
          sams: item.urls?.sams || '',
          amazon: item.urls?.amazon || '',
        },
      },
    }));
  };

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
        costCostco: parseFloat(fields.costCostco) || 0,
        costAmazon: parseFloat(fields.costAmazon) || 0,
        costSams: parseFloat(fields.costSams) || 0,
        costSelected: fields.costSelected,
        sellPrice: parseFloat(fields.sellPrice) || 0,
        fullCapacity: fields.fullCapacity ? Number(fields.fullCapacity) : null,
        restockAt: fields.restockAt ? Number(fields.restockAt) : null,
        tags: fields.tags
          ? fields.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [],
        urls: {
          costco: fields.urls.costco,
          sams: fields.urls.sams,
          amazon: fields.urls.amazon,
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

  const cancelEditing = (id) => {
    setEditId(null);
    setEditFieldsById((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (e) {
      alert('Failed to delete item: ' + e.message);
    }
  };

  const addItem = async () => {
    if (!newItemName.trim()) {
      alert('Item name is required');
      return;
    }
    try {
      await addDoc(collection(db, 'inventory'), {
        name: newItemName.trim(),
        quantity: 0,
        costCostco: 0,
        costAmazon: 0,
        costSams: 0,
        costSelected: 'costCostco',
        sellPrice: 0,
        fullCapacity: null,
        restockAt: null,
        tags: [],
        urls: {},
      });
      setNewItemName('');
    } catch (e) {
      alert('Failed to add item: ' + e.message);
    }
  };

  const renderUrlDisplay = (url, label) => {
    if (!url) return null;
    return (
      <TouchableOpacity
        style={styles.urlButton}
        onPress={() => Linking.openURL(url)}
      >
        <Text style={styles.urlButtonText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderUrlInput = (id, label, key) => {
    const fields = editFieldsById[id];
    if (!fields) return null;
    return (
      <View style={styles.urlInputWrapper}>
        <Text style={styles.urlLabel}>{label} URL</Text>
        <TextInput
          style={styles.urlInput}
          placeholder={`Enter ${label} URL`}
          placeholderTextColor="#64748b"
          value={fields.urls[key]}
          onChangeText={(text) =>
            setEditFieldsById((prev) => ({
              ...prev,
              [id]: {
                ...prev[id],
                urls: { ...prev[id].urls, [key]: text },
              },
            }))
          }
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="done"
          clearButtonMode="while-editing"
        />
      </View>
    );
  };

  const allTagsSet = new Set();
  items.forEach((item) => {
    (item.tags || []).forEach((tag) => allTagsSet.add(tag));
  });
  const allTags = Array.from(allTagsSet);

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

  const renderItem = ({ item }) => {
    const costMap = {
      costCostco: item.costCostco ?? 0,
      costAmazon: item.costAmazon ?? 0,
      costSams: item.costSams ?? 0,
    };
    const selectedCost = costMap[item.costSelected] ?? 0;
    const profitable = isProfitable(selectedCost, item.sellPrice ?? 0);
    const restockNeeded = item.quantity < (item.restockAt || 0);
    const isEditing = editId === item.id;
    const fields = editFieldsById[item.id] || {};

    return (
      <View
        style={[
          styles.itemContainer,
          restockNeeded && styles.restockHighlight,
        ]}
      >
        <View style={styles.itemHeader}>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={fields.name}
              placeholderTextColor="#64748b"
              onChangeText={(text) =>
                setEditFieldsById((prev) => ({
                  ...prev,
                  [item.id]: { ...prev[item.id], name: text },
                }))
              }
              placeholder="Item Name"
            />
          ) : (
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
          )}

          <View style={styles.itemHeaderButtons}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={() => saveChanges(item.id)}
                  style={styles.saveButton}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => cancelEditing(item.id)}
                  style={styles.cancelButton}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => startEditing(item)}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteItem(item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {isEditing ? (
          <>
            <View style={styles.urlsRow}>
              {renderUrlInput(item.id, 'Costco', 'costco')}
              {renderUrlInput(item.id, "Sam's", 'sams')}
              {renderUrlInput(item.id, 'Amazon', 'amazon')}
            </View>

            <View style={styles.row}>
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Qty</Text>
                <TextInput
                  style={styles.compactInput}
                  keyboardType="numeric"
                  value={fields.quantity}
                  placeholderTextColor="#64748b"
                  onChangeText={(text) =>
                    setEditFieldsById((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], quantity: text },
                    }))
                  }
                />
              </View>
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Cost Costco</Text>
                <TextInput
                  style={styles.compactInput}
                  keyboardType="numeric"
                  value={fields.costCostco}
                  placeholderTextColor="#64748b"
                  onChangeText={(text) =>
                    setEditFieldsById((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], costCostco: text },
                    }))
                  }
                />
              </View>
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Cost Amazon</Text>
                <TextInput
                  style={styles.compactInput}
                  keyboardType="numeric"
                  value={fields.costAmazon}
                  placeholderTextColor="#64748b"
                  onChangeText={(text) =>
                    setEditFieldsById((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], costAmazon: text },
                    }))
                  }
                />
              </View>
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Cost Sam's</Text>
                <TextInput
                  style={styles.compactInput}
                  keyboardType="numeric"
                  value={fields.costSams}
                  placeholderTextColor="#64748b"
                  onChangeText={(text) =>
                    setEditFieldsById((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], costSams: text },
                    }))
                  }
                />
              </View>
            </View>

            <View style={[styles.row, { marginTop: 8 }]}>
              {['costCostco', 'costAmazon', 'costSams'].map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.radioOption}
                  onPress={() =>
                    setEditFieldsById((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], costSelected: key },
                    }))
                  }
                >
                  <View
                    style={[
                      styles.radioCircle,
                      fields.costSelected === key && styles.radioCircleSelected,
                    ]}
                  >
                    {fields.costSelected === key && (
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#2563eb',
                        }}
                      />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>
                    {key === 'costCostco'
                      ? 'Use Costco Cost'
                      : key === 'costAmazon'
                      ? 'Use Amazon Cost'
                      : "Use Sam's Cost"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Sell $</Text>
                <TextInput
                  style={styles.compactInput}
                  keyboardType="numeric"
                  value={fields.sellPrice}
                  placeholderTextColor="#64748b"
                  onChangeText={(text) =>
                    setEditFieldsById((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], sellPrice: text },
                    }))
                  }
                />
              </View>
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Capacity</Text>
                <TextInput
                  style={styles.compactInput}
                  keyboardType="numeric"
                  value={fields.fullCapacity}
                  placeholderTextColor="#64748b"
                  onChangeText={(text) =>
                    setEditFieldsById((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], fullCapacity: text },
                    }))
                  }
                />
              </View>
              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Restock @</Text>
                <TextInput
                  style={styles.compactInput}
                  keyboardType="numeric"
                  value={fields.restockAt}
                  placeholderTextColor="#64748b"
                  onChangeText={(text) =>
                    setEditFieldsById((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], restockAt: text },
                    }))
                  }
                />
              </View>
            </View>

            <TextInput
              style={[styles.input, styles.tagsInput]}
              value={fields.tags}
              placeholder="Tags (comma separated)"
              placeholderTextColor="#64748b"
              onChangeText={(text) =>
                setEditFieldsById((prev) => ({
                  ...prev,
                  [item.id]: { ...prev[item.id], tags: text },
                }))
              }
            />
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.infoText} numberOfLines={1}>
                Qty: {item.quantity} | Cost: ${selectedCost.toFixed(2)} | Sell: $
                {(item.sellPrice ?? 0).toFixed(2)}{' '}
                {profitable ? (
                  <Text style={{ color: '#22c55e', fontWeight: '700' }}>
                    (Profitable)
                  </Text>
                ) : (
                  <Text style={{ color: '#ef4444', fontWeight: '700' }}>
                    (No Profit)
                  </Text>
                )}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.infoText} numberOfLines={1}>
                Capacity: {item.fullCapacity ?? '-'} | Restock @:{' '}
                {item.restockAt ?? '-'}{' '}
                {restockNeeded ? (
                  <Text style={{ color: '#ef4444', fontWeight: '700' }}>
                    - Restock Needed!
                  </Text>
                ) : null}
              </Text>
            </View>
            <Text style={styles.tagsText} numberOfLines={1}>
              Tags: {(item.tags || []).join(', ') || '-'}
            </Text>
            <View style={[styles.row, { marginTop: 10 }]}>
              {renderUrlDisplay(item.urls?.costco, 'Costco')}
              {renderUrlDisplay(item.urls?.sams, "Sam's")}
              {renderUrlDisplay(item.urls?.amazon, 'Amazon')}
            </View>
          </>
        )}
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

      {/* Filter Bar */}
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

      {/* Items List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 60 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  itemContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  restockHighlight: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  itemHeaderButtons: {
    flexDirection: 'row',
  },
  editButton: {
    marginHorizontal: 6,
  },
  deleteButton: {
    marginHorizontal: 6,
  },
  saveButton: {
    marginHorizontal: 6,
  },
  cancelButton: {
    marginHorizontal: 6,
  },
  input: {
    backgroundColor: '#2d2d2d',
    color: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    flex: 1,
  },
  nameInput: {
    fontWeight: '700',
  },
  tagsInput: {
    marginTop: 8,
  },
  infoText: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  tagsText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  urlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  urlButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  urlButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  urlInputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  urlLabel: {
    color: '#64748b',
    marginBottom: 2,
    fontSize: 12,
  },
  urlInput: {
    backgroundColor: '#2d2d2d',
    color: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  compactField: {
    flex: 1,
    marginRight: 8,
  },
  compactLabel: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 2,
  },
  compactInput: {
    backgroundColor: '#2d2d2d',
    color: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginTop: 8,
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  radioCircleSelected: {
    borderColor: '#2563eb',
  },
  radioLabel: {
    color: '#e0e0e0',
  },
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
  addContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addInput: {
    marginRight: 8,
  },
  addButtonCompact: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
  },
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


