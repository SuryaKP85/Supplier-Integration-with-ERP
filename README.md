# Foodsight ERP — Supplier Integration App

A complete supplier onboarding, API schema discovery, field mapping, catalog reconciliation, and purchase order workflow system with built-in compliance thresholds and PM architecture decisions.

---

## 🚀 How to Launch / Demo This App

You have three easy ways to launch and demo the app:

### 1. Instant Single-Click Demo (`demo.html`)
If you cloned or downloaded the project from GitHub and want to demo it immediately **without installing Node.js or running any commands**:
* Simply double-click **`demo.html`** in your file manager (or right-click &rarr; *Open With* &rarr; Google Chrome / Safari / Edge / Firefox).
* It is a self-contained, zero-dependency demo containing the complete interactive supplier flow, onboarding wizard, schema scanner, mapping table, catalog, and purchase order flow.

### 2. Full React + Vite Application (`index.html`)
The main application entry point is **`index.html`**, which is powered by modern React 19, TypeScript, and Tailwind CSS.
Because modern web frameworks use modules and TypeScript compilation, run the standard development command:

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev
```

* Once started, open **`http://localhost:3000`** in your browser.
* To produce a production build:
  ```bash
  npm run build
  npm run preview
  ```

### 3. Live Web App URLs
If you are viewing or sharing the hosted app directly:
* **Development / Live App**: Accessible via your deployed environment URL.

---

## 📁 Key File Overview

| File | Purpose | How to Use |
| :--- | :--- | :--- |
| **`demo.html`** | Standalone single-file HTML demo | **Double-click to launch in any browser immediately** (no terminal/Node.js required). |
| **`index.html`** | React + Vite HTML root entry point | Launched automatically when running `npm run dev` or `npm run preview`. |
| **`src/App.tsx`** | Main React application source code | Contains the complete component logic, state machines, PM insights, and views. |
| **`metadata.json`** | Application metadata and descriptors | Defines the app name, permissions, and capabilities. |
| **`package.json`** | Node.js dependencies & scripts | Run scripts (`dev`, `build`, `lint`). |

---

## 💡 Key Features & PM Insights

1. **Suppliers Overview & Health Monitoring**:
   - Connection health surfaced directly on the main table (active, error, not tested).
   - Prevents placing orders against stale or broken API credentials.
2. **4-Step Onboarding Wizard**:
   - **Step 1: Connect**: Auth credential testing (API Key, OAuth 2.0, Basic Auth) with Sandbox default protection.
   - **Step 2: Discover**: Schema discovery with confidence thresholds (<85% flagged for ops review).
   - **Step 3: Map Fields**: Intelligent primary key matching (UPC &rarr; Mfr Part # &rarr; Supplier SKU fallback) and explicit UOM conversion confirmation.
   - **Step 4: Review**: Scheduled synchronization settings and mandatory manager approval limits.
3. **Product Catalog & Stock Awareness**:
   - Zero-inventory items stay visible with out-of-stock indicators for proactive supply planning.
4. **Order Management & Compliance**:
   - Automated total calculation with manager approval alerts when orders cross compliance thresholds (e.g., >$5,000).
   - Post-order lifecycle tracking (Pending &rarr; Acknowledged &rarr; Partially Fulfilled &rarr; Rejected).
