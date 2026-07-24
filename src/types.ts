export interface SalesOrderLine {
  id: number;
  itemId: string;
  description: string;
  qty: number;
  available: number;
  price: number;
  status: string;
  poNumber?: string;
  poSupplier?: string;
}

export interface SupplierResult {
  supplier: string;
  price: number;
  qty: number;
  warehouse: string;
  lead: string;
  qtyToOrder: number;
}

export interface PoDraft {
  poNumber: string;
  supplier: string;
  itemId: string;
  description: string;
  qty: number;
  price: number;
  warehouse: string;
  lead: string;
}

export interface Supplier {
  id: number;
  name: string;
  status: string;
  auth: string;
  lastSync: string;
  products: number;
  error?: string;
}

export interface SupplierField {
  field: string;
  sample: string;
  type: string;
  erpField: string;
  confidence: number;
}

export interface CatalogProduct {
  name: string;
  upc: string;
  sku: string;
  price: number;
  qty: number;
  wh: string;
  lead: string;
  match: string | null;
  priceBreak?: string;
}

export interface OrderHistoryItem {
  po: string;
  supplier: string;
  date: string;
  total: string;
  status: string;
}
