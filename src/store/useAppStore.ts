import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Product, Order, Neighbor, AfterSale, Supplier,
  PickupStatus, PayStatus, AfterSaleType, AfterSaleStatus,
} from '../types';
import { mockProducts, mockOrders, mockNeighbors, mockAfterSales, mockSuppliers } from '../data/mockData';
import { format } from 'date-fns';

interface AppState {
  products: Product[];
  orders: Order[];
  neighbors: Neighbor[];
  afterSales: AfterSale[];
  suppliers: Supplier[];
  currentDate: string;
  sidebarCollapsed: boolean;

  setCurrentDate: (date: string) => void;
  toggleSidebar: () => void;

  addProduct: (product: Omit<Product, 'id' | 'sold'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;

  updateOrderPayStatus: (id: string, status: PayStatus) => void;
  pickupOrder: (id: string) => { success: boolean; message: string };
  pickupOrders: (ids: string[]) => { success: number; failed: number };
  addOrder: (order: Omit<Order, 'id'>) => void;

  addNeighbor: (neighbor: Omit<Neighbor, 'id' | 'createdAt'>) => void;
  updateNeighbor: (id: string, updates: Partial<Neighbor>) => void;
  toggleBlacklist: (id: string, reason?: string) => void;

  addAfterSale: (afterSale: Omit<AfterSale, 'id' | 'createdAt' | 'status'>) => void;
  updateAfterSaleStatus: (id: string, status: AfterSaleStatus) => void;

  getProductsByDate: (date: string) => Product[];
  getActiveProductsByDate: (date: string) => Product[];
  getOrdersByDate: (date: string) => Order[];
  getPendingPickupOrders: (date: string) => Order[];
  getDailySummary: (date: string) => {
    totalReceivable: number;
    totalReceived: number;
    totalRefund: number;
    totalReissue: number;
    totalOutOfStock: number;
    totalDamaged: number;
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pickedOrders: number;
    pendingPickup: number;
  };
  getSupplierSettlement: (date: string) => {
    supplierId: string;
    supplierName: string;
    totalSupply: number;
    totalRefund: number;
    settlementAmount: number;
    deductionDetails: {
      afterSaleId: string;
      type: AfterSaleType;
      amount: number;
      reason: string;
    }[];
  }[];
  getNeighborById: (id: string) => Neighbor | undefined;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: mockProducts,
      orders: mockOrders,
      neighbors: mockNeighbors,
      afterSales: mockAfterSales,
      suppliers: mockSuppliers,
      currentDate: format(new Date(), 'yyyy-MM-dd'),
      sidebarCollapsed: false,

      setCurrentDate: (date) => set({ currentDate: date }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      addProduct: (product) => {
        const newProduct: Product = {
          ...product,
          id: `prod-${Date.now()}`,
          sold: 0,
        };
        set((state) => ({ products: [...state.products, newProduct] }));
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },

      toggleProductActive: (id) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
          ),
        }));
      },

      updateOrderPayStatus: (id, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, payStatus: status } : o
          ),
        }));
      },

      pickupOrder: (id) => {
        const order = get().orders.find((o) => o.id === id);
        if (!order) return { success: false, message: '订单不存在' };
        if (order.pickupStatus === 'picked') return { success: false, message: '订单已核销，请勿重复操作' };
        if (order.payStatus !== 'paid') return { success: false, message: '订单尚未支付' };

        const now = format(new Date(), 'HH:mm');
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, pickupStatus: 'picked' as PickupStatus, pickupTime: now } : o
          ),
        }));
        return { success: true, message: '核销成功' };
      },

      pickupOrders: (ids) => {
        let success = 0;
        let failed = 0;
        const now = format(new Date(), 'HH:mm');

        set((state) => ({
          orders: state.orders.map((o) => {
            if (!ids.includes(o.id)) return o;
            if (o.pickupStatus === 'picked' || o.payStatus !== 'paid') {
              failed++;
              return o;
            }
            success++;
            return { ...o, pickupStatus: 'picked' as PickupStatus, pickupTime: now };
          }),
        }));
        return { success, failed };
      },

      addOrder: (order) => {
        const newOrder: Order = {
          ...order,
          id: `ord-${Date.now()}`,
        };
        set((state) => ({ orders: [...state.orders, newOrder] }));
      },

      addNeighbor: (neighbor) => {
        const newNeighbor: Neighbor = {
          ...neighbor,
          id: `nei-${Date.now()}`,
          createdAt: format(new Date(), 'yyyy-MM-dd'),
          blacklistReason: neighbor.blacklistReason || '',
        };
        set((state) => ({ neighbors: [...state.neighbors, newNeighbor] }));
      },

      updateNeighbor: (id, updates) => {
        set((state) => ({
          neighbors: state.neighbors.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        }));
      },

      toggleBlacklist: (id, reason) => {
        set((state) => ({
          neighbors: state.neighbors.map((n) => {
            if (n.id !== id) return n;
            const newIsBlack = !n.isBlacklisted;
            return {
              ...n,
              isBlacklisted: newIsBlack,
              blacklistReason: newIsBlack ? (reason || '') : '',
            };
          }),
        }));
      },

      addAfterSale: (afterSale) => {
        const newAfterSale: AfterSale = {
          ...afterSale,
          id: `as-${Date.now()}`,
          status: 'pending' as AfterSaleStatus,
          createdAt: new Date().toISOString(),
          affectsSupplier: afterSale.affectsSupplier ?? (afterSale.type !== 'reissue'),
        };
        set((state) => ({ afterSales: [...state.afterSales, newAfterSale] }));
      },

      updateAfterSaleStatus: (id, status) => {
        set((state) => ({
          afterSales: state.afterSales.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        }));
      },

      getProductsByDate: (date) => {
        return get().products.filter((p) => p.date === date);
      },

      getActiveProductsByDate: (date) => {
        return get().products.filter((p) => p.date === date && p.isActive);
      },

      getOrdersByDate: (date) => {
        return get().orders.filter((o) => o.date === date);
      },

      getPendingPickupOrders: (date) => {
        return get().orders.filter(
          (o) => o.date === date && o.pickupStatus === 'pending' && o.payStatus === 'paid'
        );
      },

      getDailySummary: (date) => {
        const orders = get().orders.filter((o) => o.date === date);
        const afterSales = get().afterSales.filter((a) => {
          const saleDate = new Date(a.createdAt).toISOString().split('T')[0];
          return saleDate === date;
        });

        const calcItemsSum = (o: Order) =>
          o.items.reduce((s, it) => s + it.price * it.quantity, 0);

        const totalReceivable = orders.reduce((sum, o) => sum + calcItemsSum(o), 0);
        const totalReceived = orders
          .filter((o) => o.payStatus === 'paid')
          .reduce((sum, o) => sum + calcItemsSum(o), 0);

        const totalRefund = afterSales
          .filter((a) => a.type === 'refund')
          .reduce((sum, a) => sum + a.amount, 0);
        const totalReissue = afterSales
          .filter((a) => a.type === 'reissue')
          .reduce((sum, a) => sum + a.amount, 0);
        const totalOutOfStock = afterSales
          .filter((a) => a.type === 'out_of_stock')
          .reduce((sum, a) => sum + a.amount, 0);
        const totalDamaged = afterSales
          .filter((a) => a.type === 'damaged')
          .reduce((sum, a) => sum + a.amount, 0);

        const dayProducts = get().products.filter((p) => p.date === date);
        const totalProducts = dayProducts.length;
        const activeProducts = dayProducts.filter((p) => p.isActive).length;
        const totalOrders = orders.length;
        const pickedOrders = orders.filter((o) => o.pickupStatus === 'picked').length;
        const pendingPickup = orders.filter(
          (o) => o.pickupStatus === 'pending' && o.payStatus === 'paid'
        ).length;

        return {
          totalReceivable,
          totalReceived,
          totalRefund,
          totalReissue,
          totalOutOfStock,
          totalDamaged,
          totalProducts,
          activeProducts,
          totalOrders,
          pickedOrders,
          pendingPickup,
        };
      },

      getSupplierSettlement: (date) => {
        const { suppliers, products, orders, afterSales } = get();
        const dateOrders = orders.filter((o) => o.date === date);
        const dateAfterSales = afterSales.filter((a) => {
          const saleDate = new Date(a.createdAt).toISOString().split('T')[0];
          return saleDate === date;
        });

        return suppliers.map((supplier) => {
          const supplierProducts = products.filter((p) => p.supplierId === supplier.id);

          let totalSupply = 0;
          dateOrders.forEach((order) => {
            order.items.forEach((item) => {
              const product = supplierProducts.find((p) => p.id === item.productId);
              if (product) {
                totalSupply += product.cost * item.quantity;
              }
            });
          });

          const relevantAfterSales = dateAfterSales.filter(
            (a) => a.supplierId === supplier.id && a.affectsSupplier
          );
          let totalRefund = relevantAfterSales.reduce((sum, a) => sum + a.amount, 0);

          const deductionDetails = relevantAfterSales.map((a) => ({
            afterSaleId: a.id,
            type: a.type,
            amount: a.amount,
            reason: a.reason,
          }));

          return {
            supplierId: supplier.id,
            supplierName: supplier.name,
            totalSupply,
            totalRefund,
            settlementAmount: totalSupply - totalRefund,
            deductionDetails,
          };
        });
      },

      getNeighborById: (id) => {
        return get().neighbors.find((n) => n.id === id);
      },
    }),
    {
      name: 'tuanzhang-storage-v2',
      partialize: (state) => ({
        products: state.products,
        orders: state.orders,
        neighbors: state.neighbors,
        afterSales: state.afterSales,
        suppliers: state.suppliers,
      }),
    }
  )
);
