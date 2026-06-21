import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, Order, Neighbor, AfterSale, Supplier, PickupStatus, PayStatus, AfterSaleType, AfterSaleStatus } from '../types';
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
  pickupOrder: (id: string) => void;
  addOrder: (order: Omit<Order, 'id'>) => void;
  
  addNeighbor: (neighbor: Omit<Neighbor, 'id' | 'createdAt'>) => void;
  updateNeighbor: (id: string, updates: Partial<Neighbor>) => void;
  toggleBlacklist: (id: string) => void;
  
  addAfterSale: (afterSale: Omit<AfterSale, 'id' | 'createdAt' | 'status'>) => void;
  updateAfterSaleStatus: (id: string, status: AfterSaleStatus) => void;
  
  getProductsByDate: (date: string) => Product[];
  getOrdersByDate: (date: string) => Order[];
  getPendingPickupOrders: (date: string) => Order[];
  getDailySummary: (date: string) => {
    totalReceivable: number;
    totalReceived: number;
    totalRefund: number;
    totalProducts: number;
    totalOrders: number;
    pickedOrders: number;
    pendingPickup: number;
  };
  getSupplierSettlement: (date: string) => { supplierId: string; supplierName: string; totalSupply: number; totalRefund: number; settlementAmount: number }[];
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
        const now = format(new Date(), 'HH:mm');
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, pickupStatus: 'picked' as PickupStatus, pickupTime: now } : o
          ),
        }));
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

      toggleBlacklist: (id) => {
        set((state) => ({
          neighbors: state.neighbors.map((n) =>
            n.id === id ? { ...n, isBlacklisted: !n.isBlacklisted } : n
          ),
        }));
      },

      addAfterSale: (afterSale) => {
        const newAfterSale: AfterSale = {
          ...afterSale,
          id: `as-${Date.now()}`,
          status: 'pending' as AfterSaleStatus,
          createdAt: new Date().toISOString(),
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

        const totalReceivable = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalReceived = orders
          .filter((o) => o.payStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        const totalRefund = afterSales
          .filter((a) => a.type === 'refund' || a.type === 'damaged')
          .reduce((sum, a) => sum + a.amount, 0);
        const totalProducts = get().products.filter((p) => p.date === date).length;
        const totalOrders = orders.length;
        const pickedOrders = orders.filter((o) => o.pickupStatus === 'picked').length;
        const pendingPickup = orders.filter((o) => o.pickupStatus === 'pending' && o.payStatus === 'paid').length;

        return {
          totalReceivable,
          totalReceived,
          totalRefund,
          totalProducts,
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

          let totalRefund = 0;
          dateAfterSales
            .filter((a) => a.supplierId === supplier.id)
            .forEach((a) => {
              totalRefund += a.amount;
            });

          return {
            supplierId: supplier.id,
            supplierName: supplier.name,
            totalSupply,
            totalRefund,
            settlementAmount: totalSupply - totalRefund,
          };
        });
      },
    }),
    {
      name: 'tuanzhang-storage',
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
