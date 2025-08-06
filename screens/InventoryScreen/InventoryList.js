import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Button for showing URLs that open in browser
const renderUrlDisplay = (url, label, isSelected) => {
  if (!url) return null;
  return (
    <TouchableOpacity
      style={[styles.urlButton, isSelected && styles.urlButtonSelected]}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
    >
      <Text style={styles.urlButtonText}>{label}</Text>
    </TouchableOpacity>
  );
};

// Input for editing URLs when in edit mode
const renderUrlInput = (id, label, key, fields, setEditFieldsById) => {
  if (!fields) return null;
  return (
    <View style={styles.urlInputWrapper}>
      <Text style={styles.urlLabel}>{label} URL</Text>
      <TextInput
        style={styles.urlInput}
        placeholder={`Enter ${label} URL`}
        placeholderTextColor="#94a3b8"
        value={fields.urls?.[key] ?? ''}
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

export default function InventoryList({
  items,
  editId,
  editFieldsById,
  setEditFieldsById,
  setEditId,
  deleteItem,
  saveChanges,
  cancelEditing,
  startEditing,
  isProfitable,
}) {
  const renderItem = ({ item }) => {
    const costMap = {
      costCostco: Number(item.costCostco) || 0,
      costAmazon: Number(item.costAmazon) || 0,
      costSams: Number(item.costSams) || 0,
      costCoke: Number(item.costCoke) || 0,
    };
    const selectedCost = costMap[item.costSelected] || 0;
    const profitable = isProfitable(selectedCost, Number(item.sellPrice) || 0);
    const restockNeeded = Number(item.quantity) < (Number(item.restockAt) || 0);
    const isEditing = editId === item.id;
    const fields = editFieldsById[item.id] || {};

    return (
      <View
        style={[
          styles.itemContainer,
          restockNeeded && styles.restockHighlight,
        ]}
      >
        {/* Header: Name + Action Buttons */}
        <View style={styles.itemHeader}>
          {isEditing ? (
            <TextInput
              style={[styles.input, styles.nameInput]}
              value={fields.name}
              placeholder="Item Name"
              placeholderTextColor="#94a3b8"
              onChangeText={(text) =>
                setEditFieldsById((prev) => ({
                  ...prev,
                  [item.id]: { ...prev[item.id], name: text },
                }))
              }
              autoFocus
              maxLength={30}
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
                  style={[styles.actionButton, styles.saveButton]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => cancelEditing(item.id)}
                  style={[styles.actionButton, styles.cancelButton]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => startEditing(item)}
                  style={[styles.actionButton, styles.editButton]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteItem(item.id)}
                  style={[styles.actionButton, styles.deleteButton]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Editing Mode UI */}
        {isEditing ? (
          <>
            {/* URL Inputs Row */}
            <View style={styles.urlsRow}>
              {renderUrlInput(item.id, 'Costco', 'costco', fields, setEditFieldsById)}
              {renderUrlInput(item.id, "Sam's", 'sams', fields, setEditFieldsById)}
              {renderUrlInput(item.id, 'Amazon', 'amazon', fields, setEditFieldsById)}
              {renderUrlInput(item.id, 'Coke', 'coke', fields, setEditFieldsById)}
            </View>

            {/* Quantity, Units per Pack & Cost Inputs */}
            <View style={styles.row}>
              {[
                { key: 'quantity', label: 'Qty' },
                { key: 'unitsPerPack', label: 'Units/Pack' }, // Added unitsPerPack field
                { key: 'costCostco', label: 'Cost Costco' },
                { key: 'costAmazon', label: 'Cost Amazon' },
                { key: 'costSams', label: "Cost Sam's" },
                { key: 'costCoke', label: 'Cost Coke' },
              ].map(({ key, label }) => (
                <View style={styles.compactField} key={key}>
                  <Text style={styles.compactLabel}>{label}</Text>
                  <TextInput
                    style={styles.compactInput}
                    keyboardType="numeric"
                    value={fields[key] ?? ''}
                    placeholderTextColor="#94a3b8"
                    onChangeText={(text) =>
                      setEditFieldsById((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], [key]: text },
                      }))
                    }
                  />
                </View>
              ))}
            </View>

            {/* Cost Source Radio Buttons */}
            <View style={[styles.row, { marginTop: 8 }]}>
              {['costCostco', 'costAmazon', 'costSams', 'costCoke'].map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.radioOption}
                  onPress={() =>
                    setEditFieldsById((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], costSelected: key },
                    }))
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      fields.costSelected === key && styles.radioCircleSelected,
                    ]}
                  >
                    {fields.costSelected === key && (
                      <View style={styles.radioInnerCircle} />
                    )}
                  </View>
                  <Text style={styles.radioLabel}>
                    {key === 'costCostco'
                      ? 'Use Costco Cost'
                      : key === 'costAmazon'
                      ? 'Use Amazon Cost'
                      : key === 'costSams'
                      ? "Use Sam's Cost"
                      : 'Use Coke Cost'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sell Price, Capacity, Restock */}
            <View style={styles.row}>
              {[
                { key: 'sellPrice', label: 'Sell $' },
                { key: 'fullCapacity', label: 'Capacity' },
                { key: 'restockAt', label: 'Restock @' },
              ].map(({ key, label }) => (
                <View style={styles.compactField} key={key}>
                  <Text style={styles.compactLabel}>{label}</Text>
                  <TextInput
                    style={styles.compactInput}
                    keyboardType="numeric"
                    value={fields[key] ?? ''}
                    placeholderTextColor="#94a3b8"
                    onChangeText={(text) =>
                      setEditFieldsById((prev) => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], [key]: text },
                      }))
                    }
                  />
                </View>
              ))}
            </View>

            {/* Tags input */}
            <TextInput
              style={[styles.input, styles.tagsInput]}
              value={fields.tags ?? ''}
              placeholder="Tags (comma separated)"
              placeholderTextColor="#94a3b8"
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
            {/* Display Mode: Basic info row */}
            <View style={styles.row}>
              <Text style={styles.infoText} numberOfLines={1}>
                Qty: {item.quantity} | Cost: ${selectedCost.toFixed(2)} | Sell: $
                {(item.sellPrice ?? 0).toFixed(2)}{' '}
                {profitable ? (
                  <Text style={styles.profitTextGreen}>(Profitable)</Text>
                ) : (
                  <Text style={styles.profitTextRed}>(No Profit)</Text>
                )}
              </Text>
            </View>

            {/* Display Units per Pack */}
            <Text style={styles.infoText}>
              Units/Pack: {item.unitsPerPack ?? '-'}
            </Text>

            {/* Capacity & Restock row */}
            <View style={styles.row}>
              <Text style={styles.infoText} numberOfLines={1}>
                Capacity: {item.fullCapacity ?? '-'} | Restock @: {item.restockAt ?? '-'}{' '}
                {restockNeeded && (
                  <Text style={styles.profitTextRed}>- Restock Needed!</Text>
                )}
              </Text>
            </View>

            {/* Tags display */}
            <Text style={styles.tagsText} numberOfLines={1}>
              Tags: {(item.tags || []).join ? item.tags.join(', ') : item.tags || '-'}
            </Text>

            {/* URL Buttons */}
            <View style={[styles.row, { marginTop: 6 }]}>
              {renderUrlDisplay(item.urls?.costco, 'Costco', item.costSelected === 'costCostco')}
              {renderUrlDisplay(item.urls?.sams, "Sam's", item.costSelected === 'costSams')}
              {renderUrlDisplay(item.urls?.amazon, 'Amazon', item.costSelected === 'costAmazon')}
              {renderUrlDisplay(item.urls?.coke, 'Coke', item.costSelected === 'costCoke')}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 12 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  restockHighlight: {
    borderWidth: 1.5,
    borderColor: '#ef4444',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e7ff',
    flex: 1,
    marginRight: 8,
  },
  input: {
    backgroundColor: '#334155',
    color: 'white',
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 32,
    fontSize: 13,
  },
  nameInput: {
    flex: 1,
  },
  itemHeaderButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    padding: 4,
    borderRadius: 6,
    minWidth: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#22c55e',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  editButton: {
    backgroundColor: '#2563eb',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  urlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 6,
  },
  urlInputWrapper: {
    flex: 1,
  },
  urlLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 2,
  },
  urlInput: {
    backgroundColor: '#334155',
    color: 'white',
    borderRadius: 6,
    paddingHorizontal: 6,
    height: 28,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  compactField: {
    flex: 1,
    minWidth: 70,
  },
  compactLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 2,
  },
  compactInput: {
    backgroundColor: '#334155',
    color: 'white',
    borderRadius: 6,
    paddingHorizontal: 6,
    height: 28,
    fontSize: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 3,
  },
  radioCircle: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  radioCircleSelected: {
    borderColor: '#2563eb',
  },
  radioInnerCircle: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2563eb',
  },
  radioLabel: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  tagsInput: {
    marginTop: 3,
  },
  infoText: {
    color: '#e0e7ff',
    fontSize: 12,
    flexShrink: 1,
  },
  profitTextGreen: {
    color: '#22c55e',
    fontWeight: '700',
  },
  profitTextRed: {
    color: '#ef4444',
    fontWeight: '700',
  },
  tagsText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  urlButton: {
    backgroundColor: '#2563eb', // blue by default
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    marginRight: 6,
  },
  urlButtonSelected: {
    backgroundColor: '#22c55e', // green when selected
  },
  urlButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
  },
});

