export type PayStatus = 'unpaid' | 'paid' | 'refunded';
export type PickupStatus = 'pending' | 'picked' | 'partial';
export type AfterSaleType = 'out_of_stock' | 'damaged' | 'refund' | 'reissue';
export type AfterSaleStatus = 'pending' | 'processed' | 'closed';

export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  cost: number;
  limitPerPerson: number;
  stock: number;
  sold: number;
  category: string;
  date: string;
  cutoffTime: string;
  pickupPoint: string;
  supplierId: string;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  neighborId: string;
  orderNo: string;
  date: string;
  building: string;
  room: string;
  phone: string;
  totalAmount: number;
  payStatus: PayStatus;
  pickupStatus: PickupStatus;
  pickupTime?: string;
  items: OrderItem[];
  remark?: string;
  createdAt: string;
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
  createdAt: string;
}

export interface AfterSale {
  id: string;
  orderId: string;
  neighborId: string;
  supplierId: string;
  type: AfterSaleType;
  reason: string;
  amount: number;
  status: AfterSaleStatus;
  createdAt: string;
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
  totalRefund: number;
  settlementAmount: number;
}
