import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Settings,
  Package,
  Warehouse,
  DollarSign,
  Clock,
  Lightbulb,
  X,
  ArrowRight,
  Loader2,
  ShoppingCart,
  Truck,
  FileSearch
} from 'lucide-react';

import {
  SalesOrderLine,
  SupplierResult,
  PoDraft,
  Supplier,
  SupplierField,
  CatalogProduct,
  OrderHistoryItem
} from './types';

import {
  mockSupplierAvailability,
  initialSuppliers,
  supplierFields as initialSupplierFields,
  catalogProducts as initialCatalogProducts,
  orderHistory as initialOrderHistory
} from './data';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('sales-order');
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [showInsights, setShowInsights] = useState<boolean>(true);
  const [testStatus, setTestStatus] = useState<null | 'loading' | 'success' | 'error'>(null);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [discoveryProgress, setDiscoveryProgress] = useState<number>(0);
  const [discoveryDone, setDiscoveryDone] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [orderSubmitted, setOrderSubmitted] = useState<boolean>(false);
  const [poNumber, setPoNumber] = useState<string | null>(null);
  const [authType, setAuthType] = useState<string>('API Key');

  // Supplier wizard fields
  const [newSupplierName, setNewSupplierName] = useState<string>('Pacific Seafood Direct');
  const [newSupplierUrl, setNewSupplierUrl] = useState<string>('https://api.pacificseafood.com/v2');

  // Active state lists to support live user actions and creation
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(initialSuppliers);
  const [orderHistoryList, setOrderHistoryList] = useState<OrderHistoryItem[]>(initialOrderHistory);
  const [catalogList, setCatalogList] = useState<CatalogProduct[]>(initialCatalogProducts);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [catalogFilter, setCatalogFilter] = useState<string>('All');

  // Sales Order state
  const [salesOrderLines, setSalesOrderLines] = useState<SalesOrderLine[]>([
    { id: 1, itemId: 'ITEM-00612', description: 'Romaine Lettuce Case', qty: 15, available: 200, price: 18.75, status: 'ok' },
    { id: 2, itemId: 'ITEM-00778', description: 'Ground Beef 80/20 40lb', qty: 30, available: 90, price: 112.00, status: 'ok' },
    { id: 3, itemId: 'ITEM-00XXX', description: 'Frozen Fries 30lb', qty: 25, available: 0, price: 22.10, status: 'shortage' }
  ]);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lineId: number } | null>(null);
  const [supplierModalLine, setSupplierModalLine] = useState<SalesOrderLine | null>(null);
  const [supplierCheckStatus, setSupplierCheckStatus] = useState<'loading' | 'done'>('loading');
  const [supplierResults, setSupplierResults] = useState<SupplierResult[]>([]);
  const [poDraft, setPoDraft] = useState<PoDraft | null>(null);
  const [poConfirmed, setPoConfirmed] = useState<boolean>(false);

  // Field mapping state in wizard
  const [mappedFields, setMappedFields] = useState<SupplierField[]>(initialSupplierFields);

  const openContextMenu = (e: React.MouseEvent, lineId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, lineId });
  };

  const startSupplierCheck = (line: SalesOrderLine) => {
    setContextMenu(null);
    setSupplierModalLine(line);
    setSupplierCheckStatus('loading');
    setSupplierResults([]);
    setTimeout(() => {
      setSupplierResults(
        mockSupplierAvailability.map(r => ({
          ...r,
          qtyToOrder: line.qty
        }))
      );
      setSupplierCheckStatus('done');
    }, 1400);
  };

  const handleQtyToOrderChange = (index: number, val: string) => {
    const qty = parseInt(val) || 0;
    setSupplierResults(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, qtyToOrder: qty } : item))
    );
  };

  const beginPlaceOrder = (result: SupplierResult) => {
    if (!supplierModalLine) return;
    setPoDraft({
      poNumber: 'PO-' + Math.floor(20000 + Math.random() * 900),
      supplier: result.supplier,
      itemId: supplierModalLine.itemId,
      description: supplierModalLine.description,
      qty: result.qtyToOrder,
      price: result.price,
      warehouse: result.warehouse,
      lead: result.lead
    });
    setPoConfirmed(false);
    setSupplierModalLine(null);
  };

  const confirmPO = () => {
    if (!poDraft) return;
    setSalesOrderLines(prev =>
      prev.map(l =>
        l.itemId === poDraft.itemId
          ? { ...l, status: 'ordered', poNumber: poDraft.poNumber, poSupplier: poDraft.supplier }
          : l
      )
    );
    setPoConfirmed(true);
  };

  const PMInsight = ({ children }: { children: React.ReactNode }) => {
    if (!showInsights) return null;
    return (
      <div className="bg-[#1E293B] border border-slate-800 rounded-lg p-4 text-white text-xs mt-4 flex gap-3 items-start shadow-sm select-none">
        <Lightbulb size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">PM Decision Insight</div>
          <div className="text-slate-300 leading-relaxed font-sans">{children}</div>
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      Connected: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      Error: 'bg-rose-50 text-rose-700 border border-rose-100',
      'Not Tested': 'bg-slate-100 text-slate-600 border border-slate-200',
      Acknowledged: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      'Partially Fulfilled': 'bg-amber-50 text-amber-700 border border-amber-100',
      Rejected: 'bg-rose-50 text-rose-700 border border-rose-100',
      Pending: 'bg-blue-50 text-blue-700 border border-blue-100',
      'Pending Approval': 'bg-amber-50 text-amber-700 border border-amber-100'
    };
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${map[status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  const Sidebar = () => (
    <div className="w-60 bg-[#0F172A] text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      <div className="p-4 flex items-center gap-3 border-b border-slate-800 h-14 shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold shrink-0">
          <Warehouse size={16} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-white text-xs tracking-tight uppercase leading-none">Surya ERP</span>
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Supplier Control</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Console</div>
        {[
          { id: 'sales-order', label: 'Sales Order (Demo)', icon: ShoppingCart },
          { id: 'suppliers', label: 'Connected Suppliers', icon: Link2 },
          { id: 'new-connection', label: 'New Connection', icon: Plus },
          { id: 'catalog', label: 'Product Catalog', icon: Package },
          { id: 'orders', label: 'Purchase Orders', icon: DollarSign }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id);
              if (item.id === 'new-connection') {
                setWizardStep(1);
                setTestStatus(null);
                setDiscoveryProgress(0);
                setDiscoveryDone(false);
              }
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              currentView === item.id
                ? 'bg-slate-800 text-white font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={14} className={currentView === item.id ? 'text-indigo-400' : 'text-slate-500'} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/50">
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInsights}
            onChange={e => setShowInsights(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 h-3.5 w-3.5"
          />
          <span className="font-medium text-[11px]">Show PM Insights</span>
        </label>
      </div>
    </div>
  );

  const TopBar = ({ crumbs }: { crumbs: (string | React.ReactNode)[] }) => (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-slate-300">/</span>}
            <span className={i === crumbs.length - 1 ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-700'}>
              {c}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> SYSTEM OPERATIONAL
        </div>
        <div className="w-px h-6 bg-slate-200"></div>
        <button className="text-slate-400 hover:text-slate-600 p-1" title="API Status Summary">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );

  const SalesOrderScreen = () => (
    <div className="flex-1 overflow-y-auto" onClick={() => contextMenu && setContextMenu(null)}>
      <TopBar crumbs={['Sales Orders', 'SO-88214']} />
      <div className="p-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-950 uppercase tracking-tight">Sales Order — SO-88214</h1>
            <p className="text-xs text-slate-500 mt-1">
              Customer: <span className="font-semibold text-slate-700">Whole Foods Market — Store #212</span>
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-200">
              Draft / Simulated System
            </span>
            <div className="text-[10px] text-slate-400 mt-1">Jul 23, 2026</div>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-950 mb-4 flex items-start gap-2.5 leading-relaxed">
          <FileSearch size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Interactive Simulation Guide:</span> Right-click the item with{' '}
            <span className="font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-100">Insufficient Stock</span> (Frozen Fries) to initiate a real-time
            supplier inventory check and fulfill the shortage dynamically.
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="py-2 px-4 font-bold">Item ID</th>
                <th className="py-2 px-4 font-bold">Description</th>
                <th className="py-2 px-4 font-bold">Qty Ordered</th>
                <th className="py-2 px-4 font-bold">Available Qty</th>
                <th className="py-2 px-4 font-bold">Unit Price</th>
                <th className="py-2 px-4 font-bold">Line Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesOrderLines.map(line => (
                <tr
                  key={line.id}
                  onContextMenu={e => openContextMenu(e, line.id)}
                  className={`text-xs text-slate-600 hover:bg-slate-50/50 transition-colors select-none ${
                    line.status === 'shortage' ? 'bg-rose-50/20' : line.status === 'ordered' ? 'bg-emerald-50/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-4 font-mono text-slate-900 font-bold">{line.itemId}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900">{line.description}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">{line.qty}</td>
                  <td className="py-2.5 px-4">
                    <span className={line.available < line.qty ? 'text-rose-600 font-bold' : 'text-slate-700 font-medium'}>
                      {line.available}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 font-medium">${line.price.toFixed(2)}</td>
                  <td className="py-2.5 px-4">
                    {line.status === 'shortage' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 flex items-center gap-1 w-fit border border-rose-200">
                        <AlertTriangle size={11} /> Insufficient Stock
                      </span>
                    )}
                    {line.status === 'ok' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 w-fit border border-slate-200">
                        In Stock
                      </span>
                    )}
                    {line.status === 'ordered' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1 w-fit border border-emerald-200 shadow-sm">
                        <Truck size={11} /> PO Created ({line.poNumber})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PMInsight>
          The shortage on Frozen Fries (0 available, 25 ordered) is exactly the moment a rep would previously put the
          customer on hold and email three suppliers by hand. The context-menu check queries only the single item the rep
          right-clicked — not a bulk refresh of the whole order — so the response comes back in under two seconds instead of the
          rep waiting on a full-catalog resync.
        </PMInsight>
      </div>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.08 }}
            className="fixed bg-white border border-slate-200 rounded-md shadow-md py-1 z-50 w-52"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-1 text-[9px] font-bold text-slate-400 tracking-wider uppercase">Item Actions</div>
            <button disabled className="w-full text-left px-3 py-1.5 text-xs text-slate-300 cursor-not-allowed">
              View Item Details
            </button>
            <button
              onClick={() => {
                const line = salesOrderLines.find(l => l.id === contextMenu.lineId);
                if (line) startSupplierCheck(line);
              }}
              className="w-full text-left px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-slate-50 flex items-center gap-2"
            >
              <Link2 size={13} /> Check Supplier Integration
            </button>
            <div className="h-px bg-slate-100 my-1"></div>
            <button disabled className="w-full text-left px-3 py-1.5 text-xs text-slate-300 cursor-not-allowed">
              Delete Line Item
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {supplierModalLine && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-xl overflow-hidden border border-slate-200"
            >
              <div className="p-4 border-b border-slate-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Supplier Availability Lookup</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Querying live integrated suppliers for{' '}
                      <span className="font-mono font-bold bg-slate-100 px-1 py-0.5 rounded text-slate-800">
                        {supplierModalLine.itemId}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSupplierModalLine(null)}
                    className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 mt-3 flex items-center justify-between text-xs font-medium text-slate-600">
                  <div>
                    Required Qty: <span className="font-bold text-slate-900">{supplierModalLine.qty}</span>
                  </div>
                  <div>
                    Item: <span className="font-bold text-slate-800">{supplierModalLine.description}</span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {supplierCheckStatus === 'loading' ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Loader2 size={24} className="text-indigo-600 animate-spin mb-2" />
                    <p className="text-xs font-semibold text-slate-800">Querying Supplier APIs...</p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-2 px-3 font-bold">Supplier</th>
                            <th className="py-2 px-3 font-bold">Price</th>
                            <th className="py-2 px-3 font-bold">Stock</th>
                            <th className="py-2 px-3 font-bold">Lead Time</th>
                            <th className="py-2 px-3 font-bold w-16">Qty</th>
                            <th className="py-2 px-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {supplierResults.map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-bold text-slate-900">{r.supplier}</td>
                              <td className="py-2 px-3 font-medium text-slate-800">${r.price.toFixed(2)}</td>
                              <td className="py-2 px-3 font-semibold text-slate-700">
                                <span className={r.qty === 0 ? 'text-rose-600' : 'text-emerald-700'}>
                                  {r.qty === 0 ? 'Out of Stock' : `${r.qty} units`}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-500">{r.lead}</td>
                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={r.qtyToOrder}
                                  onChange={e => handleQtyToOrderChange(idx, e.target.value)}
                                  disabled={r.qty === 0}
                                  className="w-14 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center font-bold disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  disabled={r.qty === 0}
                                  onClick={() => beginPlaceOrder(r)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                                    r.qty === 0
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
                                  }`}
                                >
                                  Fulfill Shortage
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <PMInsight>
                      Only suppliers with an active integration respond here — Pacific Seafood Direct shows Not Connected
                      for lead time because its connection was never activated, which is a live nudge back to the Suppliers
                      screen rather than a dead end for the rep.
                    </PMInsight>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {poDraft && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-slate-200"
            >
              <div className="p-4 border-b border-slate-150 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-sm">
                  {poConfirmed ? 'PO Sent Successfully' : 'Draft Supplier Purchase Order'}
                </h2>
                <button
                  onClick={() => setPoDraft(null)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-4">
                {!poConfirmed ? (
                  <div className="space-y-3.5 text-xs text-slate-600">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider block mb-1">
                        PO NUMBER (EDITABLE)
                      </label>
                      <input
                        value={poDraft.poNumber}
                        onChange={e => setPoDraft({ ...poDraft, poNumber: e.target.value })}
                        className="w-full border border-slate-300 rounded px-2.5 py-1 font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">Supplier</span>
                        <span className="font-bold text-slate-800">{poDraft.supplier}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">Item ID</span>
                        <span className="font-mono font-bold text-slate-800">{poDraft.itemId}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] font-bold text-slate-400 block tracking-wider uppercase">Description</span>
                        <span className="font-medium text-slate-700">{poDraft.description}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 tracking-wider block mb-1">
                        ORDER QUANTITY (EDITABLE)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={poDraft.qty}
                        onChange={e => setPoDraft({ ...poDraft, qty: parseInt(e.target.value) || 0 })}
                        className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5 font-medium">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Unit Price</span>
                        <span className="font-bold text-slate-800">${poDraft.price.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Cost</span>
                        <span className="font-bold text-indigo-600">${(poDraft.price * poDraft.qty).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Warehouse</span>
                        <span className="font-semibold text-slate-700">{poDraft.warehouse}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Lead Time</span>
                        <span className="font-semibold text-slate-700">{poDraft.lead}</span>
                      </div>
                    </div>

                    <PMInsight>
                      Only PO Number and Qty are editable here on purpose — price, supplier, and warehouse come straight
                      from the live API response. Letting a rep override pricing or warehouse mid-flow is how orders end up
                      mismatched with what the supplier actually confirms.
                    </PMInsight>

                    <button
                      onClick={confirmPO}
                      className="w-full flex items-center justify-center gap-1.5 mt-3 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Confirm &amp; Dispatch PO
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-800 leading-relaxed">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                        <CheckCircle2 size={15} /> PO Dispatched
                      </div>
                      <p>
                        <span className="font-bold">{poDraft.poNumber}</span> has been transmitted to{' '}
                        <span className="font-bold">{poDraft.supplier}</span>. Status: pending automated supplier hook.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setPoDraft(null);
                        setSupplierModalLine(null);
                      }}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors"
                    >
                      Return to Sales Order
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const SuppliersScreen = () => (
    <div className="flex-1 overflow-y-auto">
      <TopBar crumbs={['Suppliers']} />
      <div className="p-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-950 uppercase tracking-tight">Connected Suppliers</h1>
            <p className="text-xs text-slate-500 mt-1">Configure and manage active inventory and ordering API links</p>
          </div>
          <button
            onClick={() => {
              setCurrentView('new-connection');
              setWizardStep(1);
              setTestStatus(null);
              setDiscoveryProgress(0);
              setDiscoveryDone(false);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-sm active:scale-[0.98] transition-all"
          >
            <Plus size={14} /> Add Connection
          </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-4">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-bold">Supplier Name</th>
                <th className="py-2.5 px-4 font-bold">Health Status</th>
                <th className="py-2.5 px-4 font-bold">Auth Protocol</th>
                <th className="py-2.5 px-4 font-bold">Last Synced</th>
                <th className="py-2.5 px-4 font-bold">Mapped SKU count</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliersList.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-bold text-slate-950">{s.name}</td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={s.status} />
                    {s.error && <div className="text-[10px] text-rose-600 mt-1 font-semibold">{s.error}</div>}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-medium">{s.auth}</td>
                  <td className="py-2.5 px-4 text-slate-500 font-semibold">{s.lastSync}</td>
                  <td className="py-2.5 px-4 text-slate-800 font-bold">{s.products.toLocaleString()}</td>
                  <td className="py-2.5 px-4 text-right space-x-2.5">
                    <button
                      onClick={() => {
                        alert(`Connection test triggered for ${s.name}... Status: OK`);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold hover:underline"
                    >
                      Test Link
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('new-connection');
                        setWizardStep(3);
                        setNewSupplierName(s.name);
                        setAuthType(s.auth === 'OAuth 2.0' ? 'OAuth 2.0' : s.auth === 'API Key' ? 'API Key' : 'Basic Auth');
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold hover:underline"
                    >
                      Edit Map
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to disconnect ${s.name}?`)) {
                          setSuppliersList(prev => prev.filter(item => item.id !== s.id));
                        }
                      }}
                      className="text-rose-600 hover:text-rose-800 text-[10px] font-bold hover:underline"
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
          API outages are common, and buyers need to see a stale/broken connection before they try to place an order against
          it, not after it fails silently.
        </PMInsight>
      </div>
    </div>
  );

  const WizardSteps = () => (
    <div className="flex items-center justify-between max-w-lg mx-auto mb-6 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm select-none">
      {['Credentials', 'Discovery', 'Field Mapping', 'Verification'].map((label, idx) => {
        const step = idx + 1;
        const active = wizardStep === step;
        const done = wizardStep > step;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : done
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? <CheckCircle2 size={12} /> : <span>{step}</span>}
              </div>
              <span
                className={`text-[9px] font-bold tracking-tight uppercase transition-colors ${
                  active ? 'text-indigo-600' : done ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
            {idx < 3 && <div className="flex-1 h-0.5 bg-slate-200 mx-3" />}
          </React.Fragment>
        );
      })}
    </div>
  );

  const ConnectStep = () => (
    <div className="max-w-xl mx-auto w-full">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Supplier API Endpoint Settings</h3>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">SUPPLIER LEGAL NAME</label>
            <input
              className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Pacific Seafood Direct"
              value={newSupplierName}
              onChange={e => setNewSupplierName(e.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">API BASE ENDPOINT URL</label>
            <input
              className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="https://api.supplier.com/v2"
              value={newSupplierUrl}
              onChange={e => setNewSupplierUrl(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">AUTH PROTOCOL METHOD</label>
          <select
            value={authType}
            onChange={e => setAuthType(e.target.value)}
            className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option>API Key</option>
            <option>OAuth 2.0</option>
            <option>Basic Auth</option>
            <option>Client Certificate</option>
          </select>
        </div>

        {authType === 'API Key' && (
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">API KEY (X-API-KEY HEADER VALUE)</label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••••••••••••••••••••••••••"
            />
          </div>
        )}
        {authType === 'OAuth 2.0' && (
          <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded border border-slate-200">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-slate-500 block mb-1">CLIENT ID</label>
              <input className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-bold text-slate-500 block mb-1">CLIENT SECRET</label>
              <input type="password" className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-500 block mb-1">TOKEN ISSUER ENDPOINT</label>
              <input
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="https://auth.supplier.com/oauth/token"
              />
            </div>
          </div>
        )}
        {authType === 'Basic Auth' && (
          <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">USERNAME</label>
              <input className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">PASSWORD</label>
              <input type="password" className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100">
          <label className="text-[10px] font-bold text-slate-500 block mb-2">TARGET INTEGRATION ENVIRONMENT</label>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded shadow-sm">
              Sandbox (Isolated Testing)
            </button>
            <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded transition-colors">
              Production Real-time
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium leading-normal">
            * We strongly advise completing schema validation and dry-run tests in a Sandbox container before linking the live Supplier ERP core.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
          <label className="flex items-center gap-1.5 text-[10px] text-rose-700 font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={e => setSimulateFailure(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5"
            />
            <span>Simulate handshake failure</span>
          </label>

          <button
            onClick={() => {
              setTestStatus('loading');
              setTimeout(() => setTestStatus(simulateFailure ? 'error' : 'success'), 1400);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold transition-all shadow-sm"
          >
            {testStatus === 'loading' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Test Endpoint
          </button>
        </div>

        {testStatus === 'success' && (
          <div className="bg-emerald-50 border border-emerald-100 rounded p-3 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-900 text-xs">Connection Handshake Succeeded</div>
              <div className="text-[10px] text-emerald-700 mt-0.5 leading-normal">
                Discovered schema endpoints: <span className="font-mono bg-emerald-100/50 px-1 py-0.5 rounded font-bold">/v2/products</span>,{' '}
                <span className="font-mono bg-emerald-100/50 px-1 py-0.5 rounded font-bold">/v2/inventory</span>, and{' '}
                <span className="font-mono bg-emerald-100/50 px-1 py-0.5 rounded font-bold">/v2/orders</span>. Handshake took 320ms.
              </div>
            </div>
          </div>
        )}
        {testStatus === 'error' && (
          <div className="bg-rose-50 border border-rose-100 rounded p-3 flex items-start gap-2.5 animate-head-shake">
            <XCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-900 text-xs">Connection Handshake Failed: 401 Unauthorized</div>
              <div className="text-[10px] text-rose-700 mt-0.5 leading-normal">
                The supplier API key is expired or rejected by the gateway. Verify header tokens and client parameters with the supplier administrator.
              </div>
            </div>
          </div>
        )}
      </div>

      <PMInsight>
        Sandbox is the default environment, not Production — a small default that prevents a rushed integration from
        accidentally hitting a supplier's live order system during initial setup. Auth type is a dropdown, not a fixed field,
        because supplier auth standards vary widely and forcing one method blocks onboarding for non-conforming suppliers.
      </PMInsight>

      <div className="flex justify-end mt-4">
        <button
          disabled={testStatus !== 'success'}
          onClick={() => {
            setWizardStep(2);
            setDiscoveryProgress(0);
            setDiscoveryDone(false);
          }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold shadow transition-all ${
            testStatus === 'success'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          Next: Schema Discovery <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  const DiscoverStep = () => {
    useEffect(() => {
      if (discoveryProgress < 100) {
        const t = setTimeout(() => setDiscoveryProgress(p => Math.min(p + 20, 100)), 250);
        return () => clearTimeout(t);
      } else {
        setDiscoveryDone(true);
      }
    }, [discoveryProgress]);

    return (
      <div className="max-w-xl mx-auto w-full">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3.5 uppercase tracking-wider">API Mapping Scanner</h3>
          <div className="text-xs font-semibold text-slate-700 mb-2">Analyzing endpoint JSON properties...</div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${discoveryProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            <span>Progress: {discoveryProgress}%</span>
            <span>{discoveryProgress === 100 ? 'Analysis Complete' : 'Reading fields...'}</span>
          </div>

          {discoveryDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 border-t border-slate-100 pt-4 space-y-3.5"
            >
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-950 p-3 rounded text-xs leading-relaxed">
                Our AI-assisted mapping analyzer scanned the supplier JSON response payload and resolved matching properties based on vocabulary vectors. We found matches with varying confidence levels.
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-50 border border-emerald-100 rounded p-2">
                  <div className="text-xl font-bold text-emerald-700">9</div>
                  <div className="text-[9px] font-bold text-emerald-700 mt-0.5 uppercase tracking-wide">High Conf</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded p-2">
                  <div className="text-xl font-bold text-amber-700">1</div>
                  <div className="text-[9px] font-bold text-amber-700 mt-0.5 uppercase tracking-wide">Pending</div>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded p-2">
                  <div className="text-xl font-bold text-rose-600">0</div>
                  <div className="text-[9px] font-bold text-rose-600 mt-0.5 uppercase tracking-wide">Conflict</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <PMInsight>
          Auto-mapping does the first pass, but I never treated confidence scores below ~85% as "done" — this discovery summary
          exists so the buyer's ops team reviews the yellow/red items before activating, rather than discovering a bad mapping only
          after a wrong PO goes out.
        </PMInsight>

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setWizardStep(1)}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft size={14} /> Back
          </button>
          <button
            disabled={!discoveryDone}
            onClick={() => setWizardStep(3)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold shadow transition-all ${
              discoveryDone
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            Next: Field Mapping <ArrowRight size={13} />
          </button>
        </div>
      </div>
    );
  };

  const handleFieldMappingChange = (fieldIndex: number, newErpField: string) => {
    setMappedFields(prev =>
      prev.map((f, idx) => {
        if (idx === fieldIndex) {
          // Adjust confidence when the user overrides manually
          return { ...f, erpField: newErpField, confidence: newErpField === '— Unmapped —' ? 0 : 100 };
        }
        return f;
      })
    );
  };

  const MappingStep = () => (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="p-4 border-b border-slate-150">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Configure Supplier Key Value Bindings</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Confirm or alter how incoming JSON attributes map to Surya ERP's master entity variables
          </p>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2 px-4 font-bold">Supplier Field Name</th>
              <th className="py-2 px-4 font-bold">JSON Value Sample</th>
              <th className="py-2 px-4 font-bold">ERP Target Attribute</th>
              <th className="py-2 px-4 font-bold">Confidence Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mappedFields.map((f, idx) => (
              <tr key={idx} className="hover:bg-slate-50/40">
                <td className="py-2 px-4 font-mono text-[11px] text-slate-800 font-bold">{f.field}</td>
                <td className="py-2 px-4 text-slate-500 font-mono text-[10px]">{f.sample}</td>
                <td className="py-1 px-4">
                  <select
                    value={f.erpField}
                    onChange={e => handleFieldMappingChange(idx, e.target.value)}
                    className="border border-slate-300 rounded px-2 py-0.5 text-xs w-full max-w-[200px] font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <optgroup label="Item Identifiers">
                      <option>Item Code</option>
                      <option>Item Description</option>
                      <option>UPC / GTIN</option>
                      <option>Manufacturer Part Number</option>
                    </optgroup>
                    <optgroup label="Pricing Core">
                      <option>Unit Price</option>
                      <option>Currency</option>
                      <option>UOM (needs conversion)</option>
                      <option>Price Break Quantity</option>
                    </optgroup>
                    <optgroup label="Live Inventory">
                      <option>Available Qty</option>
                      <option>Warehouse / Location Code</option>
                      <option>Lead Time Days</option>
                    </optgroup>
                    <optgroup label="Meta-Data">
                      <option>Supplier SKU</option>
                      <option>Supplier Name</option>
                    </optgroup>
                    <option>— Unmapped —</option>
                  </select>
                </td>
                <td className="py-1 px-4">
                  {f.confidence === 0 ? (
                    <span className="text-slate-400 font-bold">—</span>
                  ) : (
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        f.confidence >= 85
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
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
        "Supplier SKU" are also mapped, not left blank. If a future product from this supplier arrives without a UPC, the matching
        engine falls back to Mfr Part Number → Supplier SKU, rather than failing to match entirely. The "pack_uom" row maps at only
        60% because it needs a unit conversion (Case of 12 → Each) — I never let the system silently assume a 1:1 conversion; the
        buyer must confirm the conversion factor explicitly.
      </PMInsight>

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setWizardStep(2)}
          className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
        <button
          onClick={() => setWizardStep(4)}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all"
        >
          Save Mapping &amp; Verify <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );

  const ReviewStep = () => {
    const handleActivateConnection = () => {
      const activeSupplier: Supplier = {
        id: suppliersList.length + 1,
        name: newSupplierName,
        status: 'Connected',
        auth: authType,
        lastSync: 'Just now',
        products: 48
      };
      setSuppliersList(prev => [...prev, activeSupplier]);
      setCurrentView('suppliers');
    };

    return (
      <div className="max-w-xl mx-auto w-full">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">Compliance &amp; Synchronization</h3>

          <div>
            <div className="text-xs font-bold text-slate-900 mb-1">Mapping Integrity Completed</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              9 automatic field bindings confirmed. 1 field manually overridden (UOM conversion multiplier set to 12 each).
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div>
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-700">Scheduled sync frequency</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5">Automate background inventory check intervals</p>
            </div>
            <select className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option>Real-time (Webhook Triggered)</option>
              <option>Every 15 minutes</option>
              <option>Hourly Recurrence</option>
              <option>Daily Bulk Dump</option>
            </select>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div>
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-700">Require supervisor approval</span>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-0.5">Route high-cost purchase orders through manager approval</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs font-bold">$</span>
              <input
                defaultValue="5000"
                className="border border-slate-300 rounded px-2 py-0.5 text-xs font-bold w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <PMInsight>
          The approval threshold isn't a "nice to have" — it's a compliance control I added after a pilot customer's buyer
          accidentally submitted a 10x-quantity order from a fat-fingered mapping test. Anything above a configurable $ threshold
          routes to a manager for sign-off before it reaches the supplier.
        </PMInsight>

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setWizardStep(3)}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft size={14} /> Back
          </button>
          <button
            onClick={handleActivateConnection}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold active:scale-[0.98]"
          >
            <CheckCircle2 size={13} /> Activate Connection
          </button>
        </div>
      </div>
    );
  };

  const NewConnectionScreen = () => (
    <div className="flex-1 overflow-y-auto">
      <TopBar
        crumbs={[
          'Suppliers',
          newSupplierName,
          ['Credentials Setup', 'Auto-Discovery', 'Property Mapping', 'Verify & Deploy'][wizardStep - 1]
        ]}
      />
      <div className="p-5 max-w-4xl mx-auto w-full">
        <h1 className="text-lg font-bold text-slate-950 uppercase tracking-tight mb-1">Supplier Integration Onboarding</h1>
        <p className="text-xs text-slate-500 mb-5">Link new supply chains into Surya ERP master system</p>
        <WizardSteps />
        {wizardStep === 1 && <ConnectStep />}
        {wizardStep === 2 && <DiscoverStep />}
        {wizardStep === 3 && <MappingStep />}
        {wizardStep === 4 && <ReviewStep />}
      </div>
    </div>
  );

  const CatalogScreen = () => {
    // Filter and search catalog list
    const filteredCatalog = catalogList.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.upc.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSupplier =
        catalogFilter === 'All' ||
        (catalogFilter === 'Sysco Foods' && p.sku.startsWith('SF-')) ||
        (catalogFilter === 'Pacific Seafood Direct' && p.sku.startsWith('PS-'));
      return matchesSearch && matchesSupplier;
    });

    const handleSelectProduct = (index: number) => {
      setSelectedProducts(prev => (prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]));
    };

    const handleLaunchOrder = () => {
      setOrderSubmitted(false);
      setCurrentView('orders');
    };

    return (
      <div className="flex-1 overflow-y-auto">
        <TopBar crumbs={['Integrated Product Catalog']} />
        <div className="p-5 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-slate-950 uppercase tracking-tight">Supplier Catalog Lookup</h1>
              <p className="text-xs text-slate-500 mt-1">
                Unified live view of all products exposed by active supplier integrations
              </p>
            </div>
            {selectedProducts.length > 0 && (
              <button
                onClick={handleLaunchOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow-sm active:scale-[0.98] transition-all"
              >
                <ShoppingCart size={13} /> Create Order ({selectedProducts.length} items)
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              <input
                placeholder="Search by product title, supplier SKU, or UPC..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={catalogFilter}
                onChange={e => setCatalogFilter(e.target.value)}
                className="border border-slate-300 rounded px-2.5 py-1 text-xs font-bold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-40"
              >
                <option value="All">All Suppliers</option>
                <option value="Sysco Foods">Sysco Foods</option>
                <option value="Pacific Seafood Direct">Pacific Seafood</option>
              </select>
              {selectedProducts.length > 0 && (
                <button
                  onClick={() => setSelectedProducts([])}
                  className="px-2.5 py-1 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold transition-colors w-full sm:w-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-4">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === filteredCatalog.length && filteredCatalog.length > 0}
                      onChange={() => {
                        if (selectedProducts.length === filteredCatalog.length) {
                          setSelectedProducts([]);
                        } else {
                          setSelectedProducts(filteredCatalog.map((_, i) => i));
                        }
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                  </th>
                  <th className="py-2 px-3 font-bold">Product Identity</th>
                  <th className="py-2 px-3 font-bold">Universal UPC</th>
                  <th className="py-2 px-3 font-bold">Unit Cost</th>
                  <th className="py-2 px-3 font-bold">Current Stock</th>
                  <th className="py-2 px-3 font-bold">Warehouse</th>
                  <th className="py-2 px-3 font-bold">Lead Days</th>
                  <th className="py-2 px-3 font-bold">Surya ERP Binding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalog.map((p, idx) => {
                  const isSelected = selectedProducts.includes(idx);
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer select-none ${
                        isSelected ? 'bg-indigo-50/10' : ''
                      }`}
                      onClick={() => handleSelectProduct(idx)}
                    >
                      <td className="py-2.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(idx)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-950">
                        <div>{p.name}</div>
                        {p.priceBreak && <div className="text-[10px] text-indigo-600 mt-0.5 font-bold">{p.priceBreak}</div>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{p.upc}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">${p.price.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold ${p.qty === 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                          {p.qty === 0 ? 'Out of Stock' : p.qty}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">{p.wh}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-bold">{p.lead}</td>
                      <td className="py-2.5 px-3">
                        {p.match ? (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Mapped to {p.match}
                          </span>
                        ) : (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Unresolved Match
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PMInsight>
            Zero-quantity items (Frozen Fries, row 6) still display rather than being hidden — buyers told us in discovery
            they wanted to see "out of stock right now" so they could plan ahead, not just get a clean list of only what's
            orderable today.
          </PMInsight>
        </div>
      </div>
    );
  };

  const OrdersScreen = () => {
    const lineItems =
      selectedProducts.length > 0 ? selectedProducts.map(i => catalogList[i]) : [catalogList[1], catalogList[4]];

    const [quantities, setQuantities] = useState<Record<number, number>>(
      lineItems.reduce((acc, _, idx) => ({ ...acc, [idx]: 1 }), {})
    );

    const handleQtyChange = (idx: number, val: string) => {
      const q = parseInt(val) || 0;
      setQuantities(prev => ({ ...prev, [idx]: q }));
    };

    const total = lineItems.reduce((sum, p, idx) => sum + p.price * (quantities[idx] || 1), 0);
    const overThreshold = total >= 5000;

    const handleOrderSubmit = () => {
      const randomPo = 'PO-' + Math.floor(20500 + Math.random() * 500);
      setPoNumber(randomPo);

      // Create new history log entry
      const logEntry: OrderHistoryItem = {
        po: randomPo,
        supplier: 'Sysco Foods',
        date: 'Jul 23, 2026',
        total: `$${total.toFixed(2)}`,
        status: overThreshold ? 'Pending Approval' : 'Acknowledged'
      };

      setOrderHistoryList(prev => [logEntry, ...prev]);
      setOrderSubmitted(true);
      setSelectedProducts([]);
    };

    return (
      <div className="flex-1 overflow-y-auto">
        <TopBar crumbs={['Purchase Orders', 'New Procurement Dispatch']} />
        <div className="p-5 max-w-4xl mx-auto w-full">
          <h1 className="text-lg font-bold text-slate-950 uppercase tracking-tight mb-1">New Procurement PO — Sysco Foods</h1>
          <p className="text-xs text-slate-500 mb-5">Draft purchase order dispatched directly to connected supplier API</p>

          {!orderSubmitted ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2 px-3 font-bold">Procured Product</th>
                      <th className="py-2 px-3 font-bold">Target Warehouse</th>
                      <th className="py-2 px-3 font-bold w-16">Quantity</th>
                      <th className="py-2 px-3 font-bold">Unit Price</th>
                      <th className="py-2 px-3 text-right font-bold">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-950">{p.name}</td>
                        <td className="py-2.5 px-3">
                          <select className="border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold bg-white focus:outline-none">
                            <option>{p.wh}</option>
                            <option>WH-EAST-02</option>
                            <option>WH-WEST-01</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="1"
                            value={quantities[idx] || 1}
                            onChange={e => handleQtyChange(idx, e.target.value)}
                            className="w-14 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-semibold">${p.price.toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          ${(p.price * (quantities[idx] || 1)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                      <td colSpan={4} className="py-3 px-3 text-right text-xs font-semibold text-slate-500">
                        Subtotal Gross Procurement Cost
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-600 text-sm">
                        ${total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {overThreshold && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-950 text-xs">Supervisor Verification Triggered</div>
                    <p className="text-[10px] text-amber-700 mt-0.5 leading-normal">
                      Surya ERP compliance rules dictate that purchase orders exceeding $5,000 require executive override keys before final transmission to the supplier's automated warehousing core.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleOrderSubmit}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
              >
                <CheckCircle2 size={14} /> Submit Order to Supplier Gateway
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded p-4 mb-5 shadow-sm leading-relaxed">
              <div className="flex items-center gap-1.5 text-emerald-950 font-bold text-sm mb-1">
                <CheckCircle2 size={16} className="text-emerald-600" /> Procurement Order Dispatched
              </div>
              <p className="text-[11px] text-emerald-700 mb-3">
                Your purchase order has been generated and pushed into Sysco Foods' incoming API queue. Status updates will synchronize with Surya ERP automatically.
              </p>
              <div className="bg-white rounded border border-emerald-100 p-3 text-xs font-semibold text-slate-700 space-y-1.5">
                <div>
                  PO Reference: <span className="font-mono text-slate-900 font-bold">{poNumber}</span>
                </div>
                <div>Submitted: Jul 23, 2026, 2:14 PM Local Time</div>
                <div className="flex items-center gap-1.5">
                  Status: <StatusBadge status={overThreshold ? 'Pending Approval' : 'Acknowledged'} />
                </div>
              </div>
            </div>
          )}

          <PMInsight>
            Order status doesn't stop at "Submitted" — it flows to Acknowledged / Partially Fulfilled / Rejected based on the
            supplier's response. I pushed back on an early design that treated "order placed" as the finish line; reconciliation of
            what the supplier actually confirms is where most of the real operational value (and risk) lives.
          </PMInsight>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="font-bold text-slate-950 uppercase tracking-wider text-xs mb-3">Historical Procurement Dispatches</h2>
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-bold">PO Code</th>
                    <th className="py-2.5 px-4 font-bold">Target Supplier</th>
                    <th className="py-2.5 px-4 font-bold">Dispatch Date</th>
                    <th className="py-2.5 px-4 font-bold">Gross Procurement Total</th>
                    <th className="py-2.5 px-4 font-bold">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderHistoryList.map((o, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono text-slate-800 font-bold">{o.po}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-950">{o.supplier}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-semibold">{o.date}</td>
                      <td className="py-2.5 px-4 text-indigo-600 font-bold">{o.total}</td>
                      <td className="py-2.5 px-4">
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
    <div className="h-screen flex bg-slate-50 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        {currentView === 'sales-order' && <SalesOrderScreen />}
        {currentView === 'suppliers' && <SuppliersScreen />}
        {currentView === 'new-connection' && <NewConnectionScreen />}
        {currentView === 'catalog' && <CatalogScreen />}
        {currentView === 'orders' && <OrdersScreen />}
      </div>
    </div>
  );
}
