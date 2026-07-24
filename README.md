Overview

Supplier Integration (SI) is a standalone module designed to sit inside a Manufacturing/Supply Chain ERP system. It lets a business connect directly to its suppliers' APIs, pull live product data (price, availability, warehouse location), map that data onto internal ERP item records, and place purchase orders without ever leaving the ERP — including in the middle of taking a customer's sales order.

This repo is a clickable product prototype (React + Tailwind) built to demonstrate the end-to-end workflow and the product decisions behind it, based on a real Supplier Integration feature I designed and shipped as a Product Manager in an enterprise ERP setting.

The Problem

In most ERP systems, checking supplier stock and placing a reorder is a manual, offline process: a rep calls or emails the supplier, waits for a reply, then re-enters the order details by hand. This is slow, error-prone, and breaks the flow the moment a customer is on the phone waiting for an answer.

Supplier Integration solves this by turning supplier connectivity into a first-class, in-ERP capability — both for proactive catalog syncing (bulk connect a supplier, map their fields, browse their live catalog) and reactive, in-the-moment lookups (a rep hits a stock shortage while entering an order and checks supplier availability instantly, without leaving the screen).

What's in This Prototype
1. Supplier Connection Management
Add a new supplier connection with support for multiple auth types (API Key, OAuth 2.0, Basic Auth, Client Certificate)
Sandbox vs. Production environment toggle, with a live Test Connection check before activating
A dashboard view of all connected suppliers with connection health status
2. Auto-Discovery & Field Mapping
Simulated schema discovery that reads a supplier's API fields and suggests ERP field mappings with confidence scores
A fallback matching hierarchy for product identification (UPC/GTIN → Manufacturer Part Number → Supplier SKU) for suppliers that don't provide standardized identifiers
Inline unit-of-measure and currency conversion handling (e.g., supplier sends "Case of 12," ERP tracks "Each")
Configurable sync frequency and dollar-value approval thresholds before go-live
3. Product Catalog
A live-style view of supplier product data (price, available quantity, warehouse/location, lead time)
Clear ERP item-match status per product, with a manual mapping path for unmatched items
Multi-select to generate a purchase order directly from catalog data
4. Real-Time Supplier Lookup from the Sales Order Screen
While entering a customer's sales order, a rep can right-click any line item showing insufficient stock and run a live, single-item supplier availability check
Results come back from every connected supplier for that specific item — price, quantity, warehouse, lead time — without a full catalog resync
A lightweight purchase order wireframe lets the rep confirm quantity and PO number, while pricing, supplier, and warehouse fields stay locked to what the supplier's API actually returned (protecting order accuracy)
The sales order line updates automatically to reflect the newly created supplier PO, so the rep can get back to the customer without switching screens
Why This Matters in an ERP Context
Reduces order cycle time — supplier stock checks that used to take hours (phone/email) happen in seconds, in the same screen the rep is already using
Reduces data entry errors — pulling price, UOM, and item identifiers directly from the supplier's API (rather than manual re-entry) removes a common source of order mismatches
Scales onboarding across suppliers with inconsistent APIs — the fallback identifier matching and flexible auth support mean the module doesn't assume every supplier exposes clean, standardized data
Keeps control with the business, not the supplier — approval thresholds and locked pricing/warehouse fields in the PO flow prevent live supplier data from silently overriding negotiated terms or introducing costly mistakes
Tech Stack
React (functional components, hooks)
Tailwind CSS
lucide-react (icons)
All data in this prototype is mocked/in-memory — this repo demonstrates UX and workflow, not a production backend integration
Status

This is a UX/workflow prototype built for stakeholder walkthroughs and portfolio purposes — it is not connected to real supplier APIs or a live ERP database. Production implementation would additionally require encrypted credential storage, a sync job scheduler, webhook support for suppliers offering push notifications, and an order-reconciliation service for supplier acknowledgment handling.

Background

This prototype reflects product decisions from a real Supplier Integration feature built during my time as a Product Manager in enterprise Manufacturing ERP/Supply Chain software — including the UPC fallback matching hierarchy, approval-threshold controls, and the real-time in-order supplier lookup flow.
