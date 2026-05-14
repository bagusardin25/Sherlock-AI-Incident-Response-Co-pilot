/**
 * Inventory service - Mock implementation for demo
 */

interface Inventory {
  productId: string;
  quantity: number;
  lastUpdated: Date;
}

// Mock inventory database
const inventoryDB: Map<string, Inventory> = new Map([
  ['prod-123', { productId: 'prod-123', quantity: 100, lastUpdated: new Date() }],
  ['prod-456', { productId: 'prod-456', quantity: 50, lastUpdated: new Date() }],
  ['prod-789', { productId: 'prod-789', quantity: 25, lastUpdated: new Date() }],
]);

/**
 * Get inventory for a product (async to simulate DB call)
 */
export async function getInventory(productId: string): Promise<Inventory | null> {
  // Simulate async DB call
  await new Promise(resolve => setTimeout(resolve, 10));
  
  return inventoryDB.get(productId) || null;
}

/**
 * Update inventory quantity
 */
export async function updateInventory(productId: string, newQuantity: number): Promise<void> {
  // Simulate async DB call
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const inventory = inventoryDB.get(productId);
  if (inventory) {
    inventory.quantity = newQuantity;
    inventory.lastUpdated = new Date();
  }
}

/**
 * Reset inventory to initial state (for testing)
 */
export function resetInventory(): void {
  inventoryDB.clear();
  inventoryDB.set('prod-123', { productId: 'prod-123', quantity: 100, lastUpdated: new Date() });
  inventoryDB.set('prod-456', { productId: 'prod-456', quantity: 50, lastUpdated: new Date() });
  inventoryDB.set('prod-789', { productId: 'prod-789', quantity: 25, lastUpdated: new Date() });
}
