import React, { useState } from 'react';
import {
  Link2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  ChevronLeft,
  Package,
  Warehouse,
  DollarSign,
  Lightbulb,
  ArrowRight,
  Loader2,
  AlertCircle,
  Trash2,
  Sparkles
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  status: string;
  auth: string;
  lastSync: string;
  products: number;
  error?: string;
}

interface SupplierField {
  field: string;
  sample: string;
  type: string;
  erpField: string;
  confidence: number;
}

interface CatalogProduct {
  name: string;
  upc: string;
  sku: string;
  price: number;
  qty: number;
  wh: string;
  lead: string;
  match: string | null;
  priceBreak?: string;
  supplier: string;
}

interface OrderHistoryItem {
  po: string;
  supplier: string;
  date: string;
  total: string;
  status: string;
}

interface OrderItem {
  id: string;
  name: string;
  upc: string;
  sku: string;
  price: number;
  qty: number;
  wh: string;
  supplier: string;
  isCustom?: boolean;
}

export default function App() {
  const [currentView, setCurrentView] = useState<string>('suppliers');
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [showInsights, setShowInsights] = useState<boolean>(true);
  const [testStatus, setTestStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [discoveryProgress, setDiscoveryProgress] = useState<number>(0);
  const [discoveryDone, setDiscoveryDone] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [orderSubmitted, setOrderSubmitted] = useState<boolean>(false);
  const [poNumber, setPoNumber] = useState<string | null>(null);
  const [authType, setAuthType] = useState<string>('API Key');
  const [approvalThreshold] = useState<number>(5000);

  // Catalog search & filter states
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogSupplierFilter, setCatalogSupplierFilter] = useState<string>('All Suppliers');

  // Off-catalog custom order form state
  const [offCatalogSupplier, setOffCatalogSupplier] = useState<string>('Sysco Foods');
  const [offCatalogItemName, setOffCatalogItemName] = useState<string>('');
  const [offCatalogPrice, setOffCatalogPrice] = useState<number>(24.50);
  const [offCatalogQty, setOffCatalogQty] = useState<number>(10);
  const [offCatalogWh, setOffCatalogWh] = useState<string>('WH-CA-04');

  // Order items state (fully reactive with quantities and line totals)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      id: 'SF-2210',
      name: 'Roma Tomatoes Case',
      upc: '041220991823',
      sku: 'SF-2210',
      price: 24.99,
      qty: 2,
      wh: 'WH-CA-04',
      supplier: 'Sysco Foods'
    },
    {
      id: 'SF-5541',
      name: 'Cheddar Cheese Block 5lb',
      upc: '041229001122',
      sku: 'SF-5541',
      price: 14.20,
      qty: 3,
      wh: 'WH-CA-04',
      supplier: 'Sysco Foods'
    }
  ]);

  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([
    { po: 'PO-20481', supplier: 'Sysco Foods', date: 'Jul 18, 2026', total: '$1,204.50', status: 'Acknowledged' },
    { po: 'PO-20455', supplier: 'Sysco Foods', date: 'Jul 12, 2026', total: '$842.00', status: 'Partially Fulfilled' },
    { po: 'PO-20390', supplier: 'Global Produce Co', date: 'Jul 5, 2026', total: '$310.25', status: 'Rejected' }
  ]);

  const suppliers: Supplier[] = [
    { id: 1, name: 'Sysco Foods', status: 'Connected', auth: 'OAuth 2.0', lastSync: '12 min ago', products: 1240 },
    { id: 2, name: 'Global Produce Co', status: 'Error', auth: 'API Key', lastSync: '3 days ago', products: 0, error: '401 Unauthorized — API key expired' },
    { id: 3, name: 'Pacific Seafood Direct', status: 'Not Tested', auth: 'Basic Auth', lastSync: 'Never', products: 0 }
  ];

  const supplierFields: SupplierField[] = [
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

  const catalogProducts: CatalogProduct[] = [
    { name: 'Whole Milk 1 Gal', upc: '041220576453', sku: 'SF-4471', price: 3.29, qty: 480, wh: 'WH-CA-04', lead: '2 days', match: 'ITEM-00291', supplier: 'Sysco Foods' },
    { name: 'Roma Tomatoes Case', upc: '041220991823', sku: 'SF-2210', price: 24.99, qty: 120, wh: 'WH-CA-04', lead: '2 days', match: 'ITEM-00587', priceBreak: 'Buy 50+, drops to $21.50', supplier: 'Sysco Foods' },
    { name: 'Chicken Breast 40lb', upc: '041229981223', sku: 'SF-9981', price: 89.50, qty: 60, wh: 'WH-AZ-01', lead: '3 days', match: null, supplier: 'Sysco Foods' },
    { name: 'Romaine Lettuce Case', upc: '041220112233', sku: 'SF-3312', price: 18.75, qty: 200, wh: 'WH-CA-04', lead: '1 day', match: 'ITEM-00612', supplier: 'Global Produce Co' },
    { name: 'Cheddar Cheese Block 5lb', upc: '041229001122', sku: 'SF-5541', price: 14.20, qty: 340, wh: 'WH-CA-04', lead: '2 days', match: 'ITEM-00933', supplier: 'Sysco Foods' },
    { name: 'Frozen Fries 30lb', upc: '041220778812', sku: 'SF-7712', price: 22.10, qty: 0, wh: 'WH-AZ-01', lead: '5 days', match: null, supplier: 'Sysco Foods' },
    { name: 'Large Eggs 15dz', upc: '041220334455', sku: 'SF-1290', price: 31.40, qty: 150, wh: 'WH-CA-04', lead: '1 day', match: 'ITEM-00445', supplier: 'Sysco Foods' },
    { name: 'Ground Beef 80/20 40lb', upc: '041229556677', sku: 'SF-8834', price: 112.00, qty: 90, wh: 'WH-AZ-01', lead: '3 days', match: 'ITEM-00778', supplier: 'Sysco Foods' }
  ];

  // Filter catalog products based on search term (name, upc, sku) and supplier
  const filteredCatalogProducts = catalogProducts.filter((p) => {
    const matchesSupplier =
      catalogSupplierFilter === 'All Suppliers' || p.supplier === catalogSupplierFilter;
    if (!matchesSupplier) return false;

    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      p.upc.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const isSearchActive = catalogSearch.trim().length > 0;
  const noCatalogMatchFound = isSearchActive && filteredCatalogProducts.length === 0;

  // Handler to create order from selected items in catalog
  const handleCreateOrderFromSelected = () => {
    const itemsToOrder: OrderItem[] = selectedProducts.map((idx) => {
      const p = catalogProducts[idx];
      return {
        id: `${p.sku}-${Date.now()}-${idx}`,
        name: p.name,
        upc: p.upc,
        sku: p.sku,
        price: p.price,
        qty: 1,
        wh: p.wh,
        supplier: p.supplier
      };
    });
    setOrderItems(itemsToOrder);
    setOrderSubmitted(false);
    setCurrentView('orders');
  };

  // Handler to create an off-catalog order for an unlisted SKU from integrated suppliers
  const handleCreateOffCatalogOrder = () => {
    const requestedSku = catalogSearch.trim().toUpperCase();
    const itemName = offCatalogItemName.trim() || `Special Order Item (${requestedSku})`;
    const newItem: OrderItem = {
      id: `off-catalog-${Date.now()}`,
      name: itemName,
      upc: 'N/A (Off-Catalog)',
      sku: requestedSku,
      price: offCatalogPrice > 0 ? offCatalogPrice : 25.0,
      qty: offCatalogQty > 0 ? offCatalogQty : 1,
      wh: offCatalogWh,
      supplier: offCatalogSupplier,
      isCustom: true
    };

    setOrderItems((prev) => [newItem, ...prev]);
    setOrderSubmitted(false);
    setCurrentView('orders');
  };

  // Update item quantity in the New Order form
  const handleUpdateQty = (id: string, newQty: number) => {
    const clampedQty = isNaN(newQty) ? 0 : Math.max(0, newQty);
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: clampedQty } : item))
    );
  };

  // Update warehouse for a specific order line item
  const handleUpdateWh = (id: string, newWh: string) => {
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, wh: newWh } : item))
    );
  };

  // Remove line item from order
  const handleRemoveOrderItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Compute calculated totals for the order
  const orderTotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const overThreshold = orderTotal >= approvalThreshold;

  const PMInsight = ({ children }: { children: React.ReactNode }) => {
    if (!showInsights) return null;
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-900 mt-3" id="pm-insight">
        <Lightbulb size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div><span className="font-semibold">PM Decision: </span>{children}</div>
      </div>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      'Connected': 'bg-green-100 text-green-700',
      'Error': 'bg-red-100 text-red-700',
      'Not Tested': 'bg-gray-100 text-gray-600',
      'Acknowledged': 'bg-green-100 text-green-700',
      'Partially Fulfilled': 'bg-yellow-100 text-yellow-700',
      'Rejected': 'bg-red-100 text-red-700',
      'Pending': 'bg-blue-100 text-blue-700'
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          map[status] || 'bg-gray-100 text-gray-600'
        }`}
        id={`badge-${status.replace(/\s+/g, '-').toLowerCase()}`}
      >
        {status}
      </span>
    );
  };

  const Sidebar = () => (
    <div className="w-56 bg-gray-900 text-gray-300 flex flex-col flex-shrink-0" id="sidebar">
      <div className="p-4 border-b border-gray-800" id="sidebar-header">
        <div className="font-bold text-white text-lg">Foodsight ERP</div>
        <div className="text-xs text-gray-500">Supplier Integration</div>
      </div>
      <nav className="flex-1 p-2 space-y-1" id="sidebar-nav">
        {[
          { id: 'suppliers', label: 'Suppliers', icon: Link2 },
          { id: 'new-connection', label: 'New Connection', icon: Plus },
          { id: 'catalog', label: 'Product Catalog', icon: Package },
          { id: 'orders', label: 'Orders', icon: DollarSign }
        ].map((item) => (
          <button
            id={`nav-btn-${item.id}`}
            key={item.id}
            onClick={() => {
              setCurrentView(item.id);
              if (item.id === 'new-connection') setWizardStep(1);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              currentView === item.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-800 text-gray-300'
            }`}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-800" id="sidebar-footer">
        <label className="flex items-center gap-2 text-xs cursor-pointer text-gray-400 hover:text-white">
          <input
            type="checkbox"
            checked={showInsights}
            onChange={(e) => setShowInsights(e.target.checked)}
            className="rounded border-gray-700 bg-gray-800 text-blue-600"
            id="insights-toggle"
          />
          <span>Show PM Insights</span>
        </label>
      </div>
    </div>
  );

  const TopBar = ({ crumbs }: { crumbs: string[] }) => (
    <div
      className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-2 text-sm text-gray-500"
      id="topbar"
    >
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={14} className="text-gray-400" />}
          <span
            id={`crumb-${i}`}
            className={i === crumbs.length - 1 ? 'text-gray-900 font-medium' : ''}
          >
            {c}
          </span>
        </React.Fragment>
      ))}
    </div>
  );

  const SuppliersScreen = () => (
    <div className="flex-1 overflow-y-auto bg-gray-50" id="suppliers-screen">
      <TopBar crumbs={['Suppliers']} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900" id="suppliers-heading">
            Connected Suppliers
          </h1>
          <button
            id="add-supplier-btn"
            onClick={() => {
              setCurrentView('new-connection');
              setWizardStep(1);
              setTestStatus(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer shadow-xs"
          >
            <Plus size={16} /> Add New Supplier
          </button>
        </div>

        <div
          className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs"
          id="suppliers-table-container"
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Supplier</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Status</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Auth Type</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Last Synced</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Products Mapped</th>
                <th className="text-right py-2.5 px-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                  id={`supplier-row-${s.id}`}
                >
                  <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={s.status} />
                    {s.error && <div className="text-xs text-red-600 mt-1">{s.error}</div>}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{s.auth}</td>
                  <td className="py-3 px-4 text-gray-600">{s.lastSync}</td>
                  <td className="py-3 px-4 text-gray-600">{s.products.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button
                      className="text-blue-600 hover:underline text-xs font-medium cursor-pointer"
                      id={`action-test-${s.id}`}
                    >
                      Test Connection
                    </button>
                    <button
                      id={`action-map-${s.id}`}
                      onClick={() => {
                        setCurrentView('new-connection');
                        setWizardStep(3);
                      }}
                      className="text-blue-600 hover:underline text-xs font-medium cursor-pointer"
                    >
                      Edit Mapping
                    </button>
                    <button
                      className="text-red-600 hover:underline text-xs font-medium cursor-pointer"
                      id={`action-disconnect-${s.id}`}
                    >
                      Disconnect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PMInsight>
          Surfacing connection health (not just "connected/disconnected") on the main list was a deliberate call — supplier
          API outages are common, and buyers need to see a stale/broken connection before they try to place an order against it,
          not after it fails silently.
        </PMInsight>
      </div>
    </div>
  );

  const WizardSteps = () => (
    <div className="flex items-center gap-2 mb-6" id="wizard-steps-container">
      {['Connect', 'Discover', 'Map Fields', 'Review'].map((label, idx) => {
        const step = idx + 1;
        const active = wizardStep === step;
        const done = wizardStep > step;
        return (
          <React.Fragment key={label}>
            <div
              id={`step-badge-${step}`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : done
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {done ? <CheckCircle2 size={14} /> : <span>{step}</span>}
              {label}
            </div>
            {idx < 3 && <div className="w-6 h-px bg-gray-300" />}
          </React.Fragment>
        );
      })}
    </div>
  );

  const ConnectStep = () => (
    <div className="max-w-2xl" id="connect-step-container">
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 shadow-xs">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Supplier Name</label>
          <input
            id="input-supplier-name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Pacific Seafood Direct"
            defaultValue="Pacific Seafood Direct"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">API Base URL</label>
          <input
            id="input-api-url"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://api.supplier.com/v2"
            defaultValue="https://api.pacificseafood.com/v2"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Auth Type</label>
          <select
            id="select-auth-type"
            value={authType}
            onChange={(e) => setAuthType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option>API Key</option>
            <option>OAuth 2.0</option>
            <option>Basic Auth</option>
            <option>Client Certificate</option>
          </select>
        </div>

        {authType === 'API Key' && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">API Key</label>
            <input
              id="input-api-key"
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••••••"
            />
          </div>
        )}
        {authType === 'OAuth 2.0' && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in" id="oauth-fields">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Client ID</label>
              <input
                id="input-oauth-client-id"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Client Secret</label>
              <input
                id="input-oauth-client-secret"
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Token URL</label>
              <input
                id="input-oauth-token-url"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
        {authType === 'Basic Auth' && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in" id="basic-auth-fields">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Username</label>
              <input
                id="input-basic-username"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <input
                id="input-basic-password"
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Environment</label>
          <div className="flex gap-2" id="env-buttons">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white cursor-pointer shadow-xs"
              id="btn-env-sandbox"
            >
              Sandbox
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
              id="btn-env-production"
            >
              Production
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            We recommend testing in Sandbox before connecting Production.
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer pt-2 border-t border-gray-100">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
            id="simulate-failure-checkbox"
          />
          Demo: simulate a failed connection
        </label>

        <button
          id="btn-test-connection"
          onClick={() => {
            setTestStatus('loading');
            setTimeout(() => setTestStatus(simulateFailure ? 'error' : 'success'), 1400);
          }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer transition-colors"
        >
          {testStatus === 'loading' ? (
            <Loader2 size={16} className="animate-spin text-blue-600" />
          ) : (
            <RefreshCw size={16} />
          )}
          Test Connection
        </button>

        {testStatus === 'success' && (
          <div
            className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2 text-sm animate-fade-in"
            id="test-success-alert"
          >
            <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-green-800">
              <div className="font-medium">Connection successful — API responded in 340ms</div>
              <div className="text-xs mt-0.5">Discovered 3 endpoints: Products, Inventory, Pricing</div>
            </div>
          </div>
        )}
        {testStatus === 'error' && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm animate-fade-in"
            id="test-error-alert"
          >
            <XCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-red-800">
              <div className="font-medium">Connection failed: 401 Unauthorized</div>
              <div className="text-xs mt-0.5">Check credentials and try again.</div>
            </div>
          </div>
        )}
      </div>

      <PMInsight>
        Sandbox is the default environment, not Production — a small default that prevents a rushed integration from
        accidentally hitting a supplier's live order system during initial setup.
      </PMInsight>

      <div className="flex justify-end mt-4">
        <button
          id="btn-next-discover"
          disabled={testStatus !== 'success'}
          onClick={() => {
            setWizardStep(2);
            setDiscoveryProgress(0);
            setDiscoveryDone(false);
          }}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            testStatus === 'success'
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next: Discover Fields <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const DiscoverStep = () => {
    React.useEffect(() => {
      if (discoveryProgress < 100) {
        const t = setTimeout(() => setDiscoveryProgress((p) => Math.min(p + 20, 100)), 300);
        return () => clearTimeout(t);
      } else {
        setDiscoveryDone(true);
      }
    }, [discoveryProgress]);

    return (
      <div className="max-w-2xl" id="discover-step-container">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-xs">
          <div className="text-sm font-medium text-gray-700 mb-2">Scanning supplier API schema...</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${discoveryProgress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">{discoveryProgress}% complete</div>

          {discoveryDone && (
            <div className="mt-6 grid grid-cols-3 gap-3 animate-fade-in" id="discover-results-summary">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">9</div>
                <div className="text-xs text-green-700 mt-1">High Confidence Matches</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-700">3</div>
                <div className="text-xs text-yellow-700 mt-1">Needs Review</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-700">2</div>
                <div className="text-xs text-red-700 mt-1">Unmapped</div>
              </div>
            </div>
          )}
        </div>

        <PMInsight>
          Auto-mapping does the first pass, but I never treated confidence scores below ~85% as "done" — this discovery
          summary exists so the buyer's ops team reviews the yellow/red items before activating, rather than discovering
          a bad mapping only after a wrong PO goes out.
        </PMInsight>

        <div className="flex justify-between mt-4">
          <button
            id="btn-back-connect"
            onClick={() => setWizardStep(1)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button
            id="btn-next-mapping"
            disabled={!discoveryDone}
            onClick={() => setWizardStep(3)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              discoveryDone
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next: Map Fields <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  const MappingStep = () => (
    <div className="max-w-4xl" id="mapping-step-container">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Supplier API Field</th>
              <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Sample Value</th>
              <th className="text-left py-2.5 px-4 font-semibold text-gray-600">ERP Field</th>
              <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {supplierFields.map((f, idx) => (
              <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/30">
                <td className="py-2.5 px-4 font-mono text-xs text-gray-800">{f.field}</td>
                <td className="py-2.5 px-4 text-gray-500 text-xs">{f.sample}</td>
                <td className="py-2.5 px-4">
                  <select
                    id={`select-field-map-${idx}`}
                    defaultValue={f.erpField}
                    className="border border-gray-300 rounded-md px-2 py-1 text-xs w-full max-w-[220px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <optgroup label="Item Master">
                      <option>Item Code</option>
                      <option>Item Description</option>
                      <option>UPC / GTIN</option>
                      <option>Manufacturer Part Number</option>
                    </optgroup>
                    <optgroup label="Pricing">
                      <option>Unit Price</option>
                      <option>Currency</option>
                      <option>UOM (needs conversion)</option>
                      <option>Price Break Quantity</option>
                    </optgroup>
                    <optgroup label="Inventory">
                      <option>Available Qty</option>
                      <option>Warehouse / Location Code</option>
                      <option>Lead Time Days</option>
                    </optgroup>
                    <optgroup label="Supplier Info">
                      <option>Supplier SKU</option>
                      <option>Supplier Name</option>
                    </optgroup>
                    <option>— Unmapped —</option>
                  </select>
                </td>
                <td className="py-2.5 px-4">
                  {f.confidence === 0 ? (
                    <span className="text-xs text-gray-400">—</span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        f.confidence >= 85
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {f.confidence}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PMInsight>
        The UPC/GTIN row maps at 97% because it's the primary key we match on — but note "Manufacturer Part Number" and
        "Supplier SKU" are also mapped, not left blank as fallback options.
      </PMInsight>

      <div className="flex justify-between mt-4">
        <button
          id="btn-back-discover"
          onClick={() => setWizardStep(2)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          id="btn-next-review"
          onClick={() => setWizardStep(4)}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer shadow-xs transition-colors"
        >
          Save Mapping & Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const ReviewStep = () => (
    <div className="max-w-2xl" id="review-step-container">
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5 shadow-xs">
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-2">Mapping Summary</div>
          <div className="text-xs text-gray-600">
            10 fields mapped — 9 automatic, 1 manually adjusted (pack_uom conversion factor: 12)
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Enable scheduled sync</span>
            <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" id="sync-checkbox" />
          </label>
          <select
            id="select-sync-frequency"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option>Real-time (webhook)</option>
            <option>Every 15 minutes</option>
            <option>Hourly</option>
            <option>Daily</option>
          </select>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Require approval for orders above</span>
            <input
              type="checkbox"
              defaultChecked
              className="rounded text-blue-600 focus:ring-blue-500"
              id="approval-checkbox"
            />
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">$</span>
            <input
              id="input-approval-threshold"
              defaultValue="5,000"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <PMInsight>
        The approval threshold isn't a "nice to have" — it's a compliance control I added after a pilot customer's
        buyer accidentally submitted a 10x-quantity order from a fat-fingered mapping test. Anything above $5,000 routes
        to a manager for sign-off.
      </PMInsight>

      <div className="flex justify-between mt-4">
        <button
          id="btn-back-mapping"
          onClick={() => setWizardStep(3)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <button
          id="btn-activate-connection"
          onClick={() => {
            setCurrentView('suppliers');
          }}
          className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer shadow-xs transition-colors"
        >
          <CheckCircle2 size={16} /> Activate Supplier Connection
        </button>
      </div>
    </div>
  );

  const NewConnectionScreen = () => (
    <div className="flex-1 overflow-y-auto bg-gray-50" id="new-connection-screen">
      <TopBar
        crumbs={[
          'Suppliers',
          'Pacific Seafood Direct',
          ['Connect', 'Discover', 'Map Fields', 'Review'][wizardStep - 1]
        ]}
      />
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4" id="new-connection-heading">
          New Supplier Connection
        </h1>
        <WizardSteps />
        {wizardStep === 1 && <ConnectStep />}
        {wizardStep === 2 && <DiscoverStep />}
        {wizardStep === 3 && <MappingStep />}
        {wizardStep === 4 && <ReviewStep />}
      </div>
    </div>
  );

  const CatalogScreen = () => (
    <div className="flex-1 overflow-y-auto bg-gray-50" id="catalog-screen">
      <TopBar crumbs={['Product Catalog']} />
      <div className="p-6">
        {/* Search & Supplier Filter Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4" id="catalog-controls">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                id="catalog-search"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search by product name, UPC, or SKU (e.g. SF-4471, 041220991823)"
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {catalogSearch && (
                <button
                  onClick={() => setCatalogSearch('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            <select
              id="catalog-supplier-filter"
              value={catalogSupplierFilter}
              onChange={(e) => setCatalogSupplierFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="All Suppliers">All Suppliers</option>
              <option value="Sysco Foods">Sysco Foods</option>
              <option value="Global Produce Co">Global Produce Co</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 self-center">
            Showing <span className="font-semibold text-gray-800">{filteredCatalogProducts.length}</span> of {catalogProducts.length} items
          </div>
        </div>

        {/* When SKU or product is NOT found in catalog: Requested Feature */}
        {noCatalogMatchFound && (
          <div
            className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 shadow-xs"
            id="off-catalog-order-card"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-amber-900 text-base">
                    Product is not part of your product catalog
                  </h3>
                  <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded font-mono text-xs font-semibold">
                    SKU / Query: "{catalogSearch.trim()}"
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  We checked your internal master ERP catalog, and no matching SKU, UPC, or product title was found.
                  However, you can generate an ad-hoc purchase order directly from one of your integrated suppliers.
                </p>

                {/* Inline off-catalog order form */}
                <div className="mt-4 p-4 bg-white/90 rounded-lg border border-amber-200 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Integrated Supplier
                    </label>
                    <select
                      id="off-catalog-supplier-select"
                      value={offCatalogSupplier}
                      onChange={(e) => setOffCatalogSupplier(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Sysco Foods">Sysco Foods (Connected - OAuth 2.0)</option>
                      <option value="Pacific Seafood Direct">Pacific Seafood Direct (Basic Auth)</option>
                      <option value="Global Produce Co">Global Produce Co (Connected)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Item Description / Title
                    </label>
                    <input
                      id="off-catalog-item-name"
                      value={offCatalogItemName}
                      onChange={(e) => setOffCatalogItemName(e.target.value)}
                      placeholder={`Custom ${catalogSearch.trim()}`}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Est. Unit Price ($)
                    </label>
                    <input
                      id="off-catalog-price-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={offCatalogPrice}
                      onChange={(e) => setOffCatalogPrice(parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Initial Qty
                    </label>
                    <input
                      id="off-catalog-qty-input"
                      type="number"
                      min="1"
                      value={offCatalogQty}
                      onChange={(e) => setOffCatalogQty(parseInt(e.target.value, 10) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-5 flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>Destination Warehouse:</span>
                      <select
                        id="off-catalog-wh-select"
                        value={offCatalogWh}
                        onChange={(e) => setOffCatalogWh(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs bg-white"
                      >
                        <option value="WH-CA-04">WH-CA-04 (West Coast Hub)</option>
                        <option value="WH-AZ-01">WH-AZ-01 (Southwest Hub)</option>
                      </select>
                    </div>

                    <button
                      id="btn-create-off-catalog-order"
                      onClick={handleCreateOffCatalogOrder}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 cursor-pointer shadow-xs transition-colors"
                    >
                      <Sparkles size={14} /> Create Order with {offCatalogSupplier} &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Catalog Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs" id="catalog-table-container">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-4 w-10">
                  <span className="sr-only">Select</span>
                </th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Product</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600 font-mono">UPC / SKU</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Supplier</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Price</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Available Qty</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Warehouse</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Lead Time</th>
                <th className="text-left py-2.5 px-4 font-semibold text-gray-600">ERP Match</th>
              </tr>
            </thead>
            <tbody>
              {filteredCatalogProducts.length > 0 ? (
                filteredCatalogProducts.map((p, idx) => {
                  const originalIndex = catalogProducts.findIndex((cp) => cp.sku === p.sku);
                  return (
                    <tr
                      key={p.sku}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/40"
                      id={`product-row-${idx}`}
                    >
                      <td className="py-2.5 px-4">
                        <input
                          id={`product-checkbox-${idx}`}
                          type="checkbox"
                          checked={selectedProducts.includes(originalIndex)}
                          onChange={() =>
                            setSelectedProducts((prev) =>
                              prev.includes(originalIndex)
                                ? prev.filter((i) => i !== originalIndex)
                                : [...prev, originalIndex]
                            )
                          }
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        {p.priceBreak && (
                          <div className="text-xs text-blue-600 mt-0.5 font-medium">
                            {p.priceBreak}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-xs text-gray-500">
                        <div>{p.upc}</div>
                        <div className="text-[11px] text-gray-400">SKU: {p.sku}</div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-gray-600 font-medium">{p.supplier}</td>
                      <td className="py-2.5 px-4 text-gray-900 font-semibold">
                        ${p.price.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={
                            p.qty === 0 ? 'text-red-600 font-semibold' : 'text-gray-700'
                          }
                        >
                          {p.qty}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Warehouse size={12} className="text-gray-400" />
                          <span>{p.wh}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">{p.lead}</td>
                      <td className="py-2.5 px-4">
                        {p.match ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {p.match}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              No Match
                            </span>
                            <button
                              className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                              id={`catalog-manual-match-${idx}`}
                            >
                              Map Manually
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-gray-500">
                    No products matched your search "{catalogSearch}". You can use the form above to order it as an off-catalog item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <PMInsight>
          Zero-quantity items (Frozen Fries, row 6) still display rather than being hidden — buyers told us in discovery
          they wanted to see "out of stock right now" so they could plan ahead, not just get a clean list of only what's
          orderable today.
        </PMInsight>
      </div>

      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 right-6 animate-slide-up" id="floating-order-bar">
          <button
            id="floating-create-order-btn"
            onClick={handleCreateOrderFromSelected}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg shadow-lg font-semibold text-sm hover:bg-blue-700 cursor-pointer transition-colors"
          >
            <Plus size={16} /> Create Order from Selected ({selectedProducts.length})
          </button>
        </div>
      )}
    </div>
  );

  const OrdersScreen = () => {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50" id="orders-screen">
        <TopBar crumbs={['Orders', 'New Order']} />
        <div className="p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900" id="orders-heading">
                New Purchase Order — {orderItems[0]?.supplier || 'Sysco Foods'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Review line items, adjust order quantities, and inspect line price calculations before submission.
              </p>
            </div>
            {orderSubmitted && (
              <button
                onClick={() => setOrderSubmitted(false)}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                + New Order
              </button>
            )}
          </div>

          {!orderSubmitted ? (
            <div id="new-order-form">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Item</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Supplier</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-600">Warehouse</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-gray-600 font-mono">Qty</th>
                      <th className="text-right py-2.5 px-4 font-semibold text-gray-600">Unit Price</th>
                      <th className="text-right py-2.5 px-4 font-semibold text-gray-600">Line Total</th>
                      <th className="py-2.5 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.length > 0 ? (
                      orderItems.map((item, idx) => {
                        const lineTotal = item.price * item.qty;
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50/20"
                            id={`order-row-${idx}`}
                          >
                            <td className="py-2.5 px-4">
                              <div className="font-medium text-gray-900 flex items-center gap-1.5">
                                <span>{item.name}</span>
                                {item.isCustom && (
                                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded font-medium">
                                    Off-Catalog
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-mono text-gray-400">SKU: {item.sku}</div>
                            </td>
                            <td className="py-2.5 px-4 text-xs text-gray-600">{item.supplier}</td>
                            <td className="py-2.5 px-4">
                              <select
                                id={`select-order-wh-${idx}`}
                                value={item.wh}
                                onChange={(e) => handleUpdateWh(item.id, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              >
                                <option value="WH-CA-04">WH-CA-04</option>
                                <option value="WH-AZ-01">WH-AZ-01</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-4">
                              <input
                                id={`input-order-qty-${idx}`}
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) =>
                                  handleUpdateQty(item.id, parseInt(e.target.value, 10))
                                }
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-semibold text-gray-900"
                              />
                            </td>
                            <td className="py-2.5 px-4 text-right text-gray-700 font-mono">
                              ${item.price.toFixed(2)}
                            </td>
                            <td
                              className="py-2.5 px-4 text-right font-semibold text-gray-900 font-mono"
                              id={`line-total-${idx}`}
                            >
                              ${lineTotal.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleRemoveOrderItem(item.id)}
                                title="Remove item"
                                className="text-gray-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-gray-400">
                          No items in this order yet. Select items from the{' '}
                          <button
                            onClick={() => setCurrentView('catalog')}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            Product Catalog
                          </button>
                          .
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={5} className="py-3 px-4 text-right font-semibold text-gray-700">
                        Order Total:
                      </td>
                      <td
                        className="py-3 px-4 text-right font-bold text-base text-gray-900 font-mono"
                        id="order-total-sum"
                      >
                        ${orderTotal.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {overThreshold && (
                <div
                  className="bg-yellow-50 border border-yellow-200 rounded-lg p-3.5 flex items-center gap-2.5 text-sm text-yellow-800 mb-4 animate-fade-in"
                  id="approval-needed-alert"
                >
                  <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Compliance Approval Required:</span> This order total (${orderTotal.toFixed(2)}) meets or exceeds the manager threshold of $
                    {approvalThreshold.toLocaleString()}. A manager sign-off notification will be issued upon submission.
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  id="btn-submit-order"
                  disabled={orderItems.length === 0}
                  onClick={() => {
                    const generatedPo = `PO-${Math.floor(20500 + Math.random() * 500)}`;
                    setPoNumber(generatedPo);
                    setOrderSubmitted(true);
                    setOrderHistory((prev) => [
                      {
                        po: generatedPo,
                        supplier: orderItems[0]?.supplier || 'Sysco Foods',
                        date: new Date().toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }),
                        total: `$${orderTotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`,
                        status: 'Pending'
                      },
                      ...prev
                    ]);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium shadow-xs transition-colors ${
                    orderItems.length > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 size={16} /> Submit Order to Supplier (${orderTotal.toFixed(2)})
                </button>

                <button
                  onClick={() => setCurrentView('catalog')}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
                >
                  + Add More Items
                </button>
              </div>
            </div>
          ) : (
            <div
              className="bg-green-50 border border-green-200 rounded-lg p-5 animate-fade-in"
              id="order-submitted-alert"
            >
              <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                <CheckCircle2 size={20} /> Order Submitted Successfully
              </div>
              <div className="text-sm text-green-700 space-y-1.5">
                <div>
                  PO Number:{' '}
                  <span className="font-mono font-semibold text-green-900 bg-green-100/70 px-2 py-0.5 rounded border border-green-300">
                    {poNumber}
                  </span>
                </div>
                <div>Submitted: {new Date().toLocaleTimeString()}</div>
                <div>Order Value: <span className="font-bold font-mono">${orderTotal.toFixed(2)}</span></div>
                <div>
                  Status: <StatusBadge status="Pending" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-green-200 flex gap-3">
                <button
                  onClick={() => {
                    setOrderSubmitted(false);
                    setOrderItems([
                      {
                        id: `SF-item-${Date.now()}`,
                        name: 'Roma Tomatoes Case',
                        upc: '041220991823',
                        sku: 'SF-2210',
                        price: 24.99,
                        qty: 1,
                        wh: 'WH-CA-04',
                        supplier: 'Sysco Foods'
                      }
                    ]);
                  }}
                  className="px-4 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 cursor-pointer"
                >
                  Create Another Order
                </button>
                <button
                  onClick={() => setCurrentView('catalog')}
                  className="px-4 py-1.5 bg-white border border-green-300 text-green-800 rounded text-xs font-semibold hover:bg-green-100/50 cursor-pointer"
                >
                  Return to Catalog
                </button>
              </div>
            </div>
          )}

          <PMInsight>
            Order status doesn't stop at "Submitted" — it flows to Acknowledged / Partially Fulfilled / Rejected based on
            the supplier's response. I pushed back on an early design that treated "order placed" as the finish line;
            reconciliation of what the supplier actually confirms is where most of the real operational value (and risk) lives.
          </PMInsight>

          <div className="mt-8" id="order-history-section">
            <div className="font-semibold text-gray-900 text-sm mb-2">Order History</div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-2 px-4 font-semibold text-gray-600">PO Number</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-600">Supplier</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-600">Date</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-600 font-mono">Total</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderHistory.map((o, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/20"
                      id={`history-row-${idx}`}
                    >
                      <td className="py-2 px-4 font-mono text-xs text-gray-700">{o.po}</td>
                      <td className="py-2 px-4 text-gray-700">{o.supplier}</td>
                      <td className="py-2 px-4 text-gray-500">{o.date}</td>
                      <td className="py-2 px-4 text-gray-900 font-semibold">{o.total}</td>
                      <td className="py-2 px-4">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-gray-50 font-sans" id="app-root-layout">
      <Sidebar />
      {currentView === 'suppliers' && <SuppliersScreen />}
      {currentView === 'new-connection' && <NewConnectionScreen />}
      {currentView === 'catalog' && <CatalogScreen />}
      {currentView === 'orders' && <OrdersScreen />}
    </div>
  );
}
