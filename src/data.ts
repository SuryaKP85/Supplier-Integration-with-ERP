import { SupplierResult, Supplier, SupplierField, CatalogProduct, OrderHistoryItem } from './types';

export const mockSupplierAvailability: Omit<SupplierResult, 'qtyToOrder'>[] = [
  { supplier: 'Sysco Foods', price: 21.40, qty: 340, warehouse: 'WH-CA-04', lead: '2 days' },
  { supplier: 'Global Produce Co', price: 22.75, qty: 120, warehouse: 'WH-AZ-02', lead: '4 days' },
  { supplier: 'Pacific Seafood Direct', price: 23.10, qty: 0, warehouse: 'WH-OR-01', lead: 'Not Connected' }
];

export const initialSuppliers: Supplier[] = [
  { id: 1, name: 'Sysco Foods', status: 'Connected', auth: 'OAuth 2.0', lastSync: '12 min ago', products: 1240 },
  { id: 2, name: 'Global Produce Co', status: 'Error', auth: 'API Key', lastSync: '3 days ago', products: 0, error: '401 Unauthorized — API key expired' },
  { id: 3, name: 'Pacific Seafood Direct', status: 'Not Tested', auth: 'Basic Auth', lastSync: 'Never', products: 0 }
];

export const supplierFields: SupplierField[] = [
  { field: 'upc_code', sample: '041220576453', type: 'String', erpField: 'UPC / GTIN', confidence: 97 },
  { field: 'unit_price', sample: '24.99', type: 'Number', erpField: 'Unit Price', confidence: 95 },
  { field: 'currency', sample: 'USD', type: 'String', erpField: 'Currency', confidence: 99 },
  { field: 'qty_available', sample: '480', type: 'Number', erpField: 'Available Qty', confidence: 92 },
  { field: 'warehouse_id', sample: 'WH-CA-04', type: 'String', erpField: 'Warehouse / Location Code', confidence: 88 },
  { field: 'pack_uom', sample: 'CASE-12', type: 'String', erpField: 'UOM (needs conversion)', confidence: 60 },
  { field: 'lead_time', sample: '2', type: 'Number', erpField: 'Lead Time Days', confidence: 90 },
  { field: 'mfr_part_no', sample: 'SYS-88213', type: 'String', erpField: 'Manufacturer Part Number', confidence: 55 },
  { field: 'sup_sku', sample: 'SF-4471', type: 'String', erpField: 'Supplier SKU', confidence: 96 },
  { field: 'promo_flag', sample: 'true', type: 'Boolean', erpField: '— Unmapped —', confidence: 0 }
];

export const catalogProducts: CatalogProduct[] = [
  { name: 'Whole Milk 1 Gal', upc: '041220576453', sku: 'SF-4471', price: 3.29, qty: 480, wh: 'WH-CA-04', lead: '2 days', match: 'ITEM-00291' },
  { name: 'Roma Tomatoes Case', upc: '041220991823', sku: 'SF-2210', price: 24.99, qty: 120, wh: 'WH-CA-04', lead: '2 days', match: 'ITEM-00587', priceBreak: 'Buy 50+, drops to $21.50' },
  { name: 'Chicken Breast 40lb', upc: '041229981223', sku: 'SF-9981', price: 89.50, qty: 60, wh: 'WH-AZ-01', lead: '3 days', match: null },
  { name: 'Romaine Lettuce Case', upc: '041220112233', sku: 'SF-3312', price: 18.75, qty: 200, wh: 'WH-CA-04', lead: '1 day', match: 'ITEM-00612' },
  { name: 'Cheddar Cheese Block 5lb', upc: '041229001122', sku: 'SF-5541', price: 14.20, qty: 340, wh: 'WH-CA-04', lead: '2 days', match: 'ITEM-00933' },
  { name: 'Frozen Fries 30lb', upc: '041220778812', sku: 'SF-7712', price: 22.10, qty: 0, wh: 'WH-AZ-01', lead: '5 days', match: null },
  { name: 'Large Eggs 15dz', upc: '041220334455', sku: 'SF-1290', price: 31.40, qty: 150, wh: 'WH-CA-04', lead: '1 day', match: 'ITEM-00445' },
  { name: 'Ground Beef 80/20 40lb', upc: '041229556677', sku: 'SF-8834', price: 112.00, qty: 90, wh: 'WH-AZ-01', lead: '3 days', match: 'ITEM-00778' }
];

export const orderHistory: OrderHistoryItem[] = [
  { po: 'PO-20481', supplier: 'Sysco Foods', date: 'Jul 18, 2026', total: '$1,204.50', status: 'Acknowledged' },
  { po: 'PO-20455', supplier: 'Sysco Foods', date: 'Jul 12, 2026', total: '$842.00', status: 'Partially Fulfilled' },
  { po: 'PO-20390', supplier: 'Global Produce Co', date: 'Jul 5, 2026', total: '$310.25', status: 'Rejected' }
];
