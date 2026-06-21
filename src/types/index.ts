export type PayStatus = 'unpaid' | 'paid' | 'refunded';
export type PickupStatus = 'pending' | 'picked' | 'partial';
export type AfterSaleType = 'out_of_stock' | 'damaged' | 'refund' | 'reissue';
export type AfterSaleStatus = 'pending' | 'processed' | 'closed';
export type StockMovementType = 'restock' | 'sold' | 'offline' | 'online' | 'adjust';

export interface PickupHistoryEntry {
  id: string;
  operator: string;
  time: string;
  action: 'pickup' | 'batch_pickup' | 'cancel';
  orderIds?: string[];
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  operator: string;
  timestamp: string;
  remark?: string;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  cost: number;
  limitPerPerson: number;
  stock: number;
  stockAvailable: number;
  sold: number;
  category: string;
  date: string;
  cutoffTime: string;
  pickupPoint: string;
  supplierId: string;
  isActive: boolean;
  isSoldOut: boolean;
  stockMovements: StockMovement[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  cost: number;
  quantity: number;
  subtotal: number;
  supplierId: string;
}

export interface Order {
  id: string;
  neighborId: string;
  orderNo: string;
  date: string;
  totalAmount: number;
  payStatus: PayStatus;
  pickupStatus: PickupStatus;
  pickupTime?: string;
  items: OrderItem[];
  remark?: string;
  createdAt: string;
  pickupHistory: PickupHistoryEntry[];
}

export interface Neighbor {
  id: string;
  name: string;
  phone: string;
  building: string;
  room: string;
  avatar: string;
  frequentCategories: string[];
  remark: string;
  isBlacklisted: boolean;
  blacklistReason: string;
  createdAt: string;
}

export interface AfterSaleItemBreakdown {
  itemId: string;
  productId: string;
  productName: string;
  supplierId: string;
  quantity: number;
  amount: number;
  cost: number;
}

export interface AfterSale {
  id: string;
  orderId: string;
  neighborId: string;
  supplierId: string;
  type: AfterSaleType;
  reason: string;
  amount: number;
  affectsSupplier: boolean;
  status: AfterSaleStatus;
  createdAt: string;
  itemBreakdown: AfterSaleItemBreakdown[];
  multiSupplier: boolean;
  supplierBreakdown: { supplierId: string; amount: number }[];
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

export interface DailySummary {
  totalReceivable: number;
  totalReceived: number;
  totalRefund: number;
  supplierSettlement: SupplierSettlement[];
}

export interface SupplierSettlement {
  supplierId: string;
  supplierName: string;
  totalSupply: number;
  totalCost: number;
  totalRefund: number;
  settlementAmount: number;
  deductionDetails: {
    afterSaleId: string;
    orderId: string;
    orderNo: string;
    type: AfterSaleType;
    productName: string;
    quantity: number;
    amount: number;
    reason: string;
  }[];
}

export interface DateRangeSummary {
  date: string;
  leaderIncome: number;
  supplierPayable: number;
  afterSaleDeduction: number;
  pendingRefund: number;
  totalOrders: number;
  totalOrderAmount: number;
}

export interface HandoverReport {
  date: string;
  building: string;
  pendingList: {
    orderId: string;
    orderNo: string;
    neighborName: string;
    neighborPhone: string;
    room: string;
    items: { productName: string; quantity: number }[];
    total: number;
    assignedOperator?: string;
  }[];
  pickedList: {
    orderId: string;
    orderNo: string;
    neighborName: string;
    room: string;
    pickupTime: string;
    items: { productName: string; quantity: number }[];
    operator?: string;
  }[];
  pendingTotal: number;
  pickedTotal: number;
}

export interface NeighborDetailView {
  neighbor: Neighbor;
  recentOrders: {
    order: Order;
    neighborPhone: string;
    neighborBuilding: string;
    neighborRoom: string;
    items: { productName: string; quantity: number; subtotal: number }[];
  }[];
  recentAfterSales: {
    afterSale: AfterSale;
    orderNo: string;
    items: { productName: string; quantity: number; amount: number }[];
  }[];
  recentPickups: {
    orderId: string;
    orderNo: string;
    pickupTime: string;
    operator: string;
    neighborPhone: string;
    neighborBuilding: string;
    neighborRoom: string;
    items: { productName: string; quantity: number }[];
  }[];
  orderStats: {
    totalOrders: number;
    totalSpent: number;
    avgOrderAmount: number;
    lastOrderDate: string;
  };
}

export interface OperatorAssignment {
  orderId: string;
  operator: string;
  assignedAt: string;
}

export interface AnomalyOrder {
  orderId: string;
  orderNo: string;
  neighborName: string;
  date: string;
  orderAmount: number;
  supplierDeduction: number;
  pendingRefund: number;
  leaderIncome: number;
  issue: string;
  details: {
    orderItems: { productName: string; quantity: number; price: number; supplierId: string; cost: number }[];
    afterSales: { id: string; type: AfterSaleType; amount: number; reason: string; supplierId: string; productName: string }[];
    supplierBreakdown: { supplierId: string; supplierName: string; supplyCost: number; deduction: number; settlement: number }[];
  };
}
