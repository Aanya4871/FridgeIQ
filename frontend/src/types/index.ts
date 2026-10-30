export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  user_id: number;
  food_item_id: number;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  purchase_date: string;
  expiry_date: string;
  source: string;
  days_to_expiry: number;
  expiry_status: 'fresh' | 'warning' | 'critical' | 'expired';
}

export interface FoodItemCatalog {
  id: number;
  name: string;
  category: string;
  default_shelf_life_days: number;
}

export interface BarcodeScanResult {
  found: boolean;
  barcode: string;
  product_name: string;
  category: string;
  suggested_shelf_life_days: number;
  brand?: string;
  image_url?: string;
}

export interface ReceiptLineItem {
  raw_text: string;
  matched_food_name: string;
  matched_food_id?: number;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  confidence: number;
}

export interface ReceiptScanResponse {
  success: boolean;
  items: ReceiptLineItem[];
}

export interface Recipe {
  id: number;
  name: string;
  cuisine: string;
  cooking_time: number;
  ingredients: Array<{ name: string; quantity: string }>;
  instructions: string;
  dietary_tags: string[];
  match_percentage: number;
  missing_ingredients: string[];
}

export interface ShoppingItem {
  id: number;
  user_id: number;
  product: string;
  quantity: string;
  status: 'pending' | 'purchased';
}

export interface NotificationItem {
  id: number;
  message: string;
  type: string;
  status: 'unread' | 'read';
  created_at: string;
}

export interface DashboardData {
  total_inventory_items: number;
  expiring_soon_count: number;
  expired_count: number;
  food_wasted_kg: number;
  money_saved_dollars: number;
  top_categories: Array<{ category: string; count: number }>;
  recent_activity: Array<{ action: string; product: string; date: string }>;
}
