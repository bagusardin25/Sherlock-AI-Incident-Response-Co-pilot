/**
 * Checkout service - INTENTIONALLY BUGGY for Sherlock demo
 * Bug: Race condition - missing await on async inventory fetch
 */

import { getInventory, updateInventory } from '../inventory/service';

interface CheckoutRequest {
  productId: string;
  quantity: number;
  userId: string;
}

interface CheckoutResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

/**
 * Process checkout for a product
 * BUG: This function has a race condition
 */
export async function processCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
  try {
    // Validate request
    if (!request.productId || !request.quantity || request.quantity <= 0) {
      return { success: false, error: 'Invalid request' };
    }

    // Decrement inventory (BUG HERE - will cause race condition)
    await decrementInventory(request.productId, request.quantity);

    // Create order
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      orderId
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Decrement inventory for a product
 * BUG: Missing 'await' on line 42 causes race condition
 */
async function decrementInventory(productId: string, quantity: number) {
  // BUG: Missing 'await' here! This is the root cause.
  // Should be: const inventory = await getInventory(productId);
  const inventory = getInventory(productId);
  
  // This will fail with "Cannot read property 'quantity' of undefined"
  // when inventory Promise hasn't resolved yet
  if (!inventory) {
    throw new Error(`Product ${productId} not found`);
  }
  
  // BUG: Accessing .quantity on unresolved Promise
  if (inventory.quantity < quantity) {
    throw new Error(`Insufficient stock for ${productId}`);
  }
  
  // Update inventory
  const newQuantity = inventory.quantity - quantity;
  await updateInventory(productId, newQuantity);
}

/**
 * Get checkout summary
 */
export async function getCheckoutSummary(productId: string, quantity: number) {
  const inventory = await getInventory(productId);
  
  if (!inventory) {
    return null;
  }
  
  return {
    productId,
    requestedQuantity: quantity,
    availableQuantity: inventory.quantity,
    canCheckout: inventory.quantity >= quantity
  };
}
