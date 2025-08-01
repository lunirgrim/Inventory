// src/firebase/inventoryService.js
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Load inventory for a specific user
export async function loadUserInventory(userId) {
  if (!userId) return [];
  const inventoryRef = collection(db, 'users', userId, 'inventory');
  const snapshot = await getDocs(inventoryRef);
  const items = [];
  snapshot.forEach(docSnap => {
    items.push({ id: docSnap.id, ...docSnap.data() });
  });
  return items;
}

// Add or update an inventory item for a user
export async function addOrUpdateInventoryItem(userId, item) {
  if (!userId || !item?.id) throw new Error('Invalid user or item');
  const itemRef = doc(db, 'users', userId, 'inventory', item.id);
  await setDoc(itemRef, item);
}

// Delete an inventory item for a user
export async function deleteInventoryItem(userId, itemId) {
  if (!userId || !itemId) throw new Error('Invalid user or itemId');
  const itemRef = doc(db, 'users', userId, 'inventory', itemId);
  await deleteDoc(itemRef);
}

