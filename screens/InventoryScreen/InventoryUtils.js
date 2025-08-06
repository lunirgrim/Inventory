// screens/InventoryScreen/InventoryUtils.js

export function isProfitable(cost, sellPrice) {
  return parseFloat(sellPrice) > parseFloat(cost);
}

