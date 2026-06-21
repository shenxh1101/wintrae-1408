import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Product, Order, Neighbor, AfterSale, Supplier,
  PickupStatus, PayStatus, AfterSaleType, AfterSaleStatus,
  AfterSaleItemBreakdown, DateRangeSummary, HandoverReport, PickupHistoryEntry,
} from '../types';
import { mockProducts, mockOrders, mockNeighbors, mockAfterSales, mockSuppliers } from '../data/mockData';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

interface AppState {
  products: Product[];
  orders: Order[];
  neighbors: Neighbor[];
  afterSales: AfterSale[];
  suppliers: Supplier[];
  currentDate: string;
  sidebarCollapsed: boolean;
  operatorName: string;

  setCurrentDate: (date: string) => void;
  toggleSidebar: () => void;

  addProduct: (product: Omit<Product, 'id' | 'sold' | 'stockAvailable' | 'isSoldOut'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  restockProduct: (id: string, addStock: number) => { success: boolean; message: string };

  updateOrderPayStatus: (id: string, status: PayStatus) => void;
  pickupOrder: (id: string) => { success: boolean; message: string };
  pickupOrders: (ids: string[], operator?: string) => { success: number; failed: number };
  addOrder: (order: Omit<Order, 'id' | 'pickupHistory'>) => void;

  addNeighbor: (neighbor: Omit<Neighbor, 'id' | 'createdAt'>) => void;
  updateNeighbor: (id: string, updates: Partial<Neighbor>) => void;
  toggleBlacklist: (id: string, reason?: string) => void;

  addAfterSale: (afterSale: Partial<Omit<AfterSale, 'id' | 'createdAt' | 'status'>> & Pick<AfterSale, 'orderId' | 'neighborId' | 'supplierId' | 'type' | 'reason' | 'amount' | 'affectsSupplier'>) => void;
  addAfterSaleWithBreakdown: (afterSale: {
    orderId: string;
    type: AfterSaleType;
    reason: string;
    itemBreakdown: AfterSaleItemBreakdown[];
    affectsSupplier?: boolean;
  }) => void;
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
    soldOutProducts: number;
    totalOrders: number;
    pickedOrders: number;
    pendingPickup: number;
    leaderIncome: number;
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
  getNeighborDisplayInfo: (id: string) => {
    name: string;
    phone: string;
    building: string;
    room: string;
    avatar: string;
    remark: string;
    isBlacklisted: boolean;
    blacklistReason: string;
  };
  getDateRangeSummary: (startDate: string, endDate: string) => DateRangeSummary[];
  getHandoverReport: (date: string, building: string) => HandoverReport;
  getAllBuildings: () => string[];
  getPickupHistoryByDate: (date: string) => PickupHistoryEntry[];
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
      operatorName: '团长',

      setCurrentDate: (date) => set({ currentDate: date }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      addProduct: (product) => {
        const newProduct: Product = {
          ...product,
          id: `prod-${Date.now()}`,
          sold: 0,
          stockAvailable: product.stock,
          isSoldOut: false,
        };
        set((state) => ({ products: [...state.products, newProduct] }));
      },

      updateProduct: (id, updates) => {
        set((state) => {
          const products = state.products.map((p) => {
            if (p.id !== id) return p;
            const updated = { ...p, ...updates };
            if (updates.stock !== undefined) {
              updated.stockAvailable = updates.stock - p.sold;
            }
            if (updates.stockAvailable !== undefined) {
              updated.isSoldOut = updates.stockAvailable <= 0;
            }
            if (updated.stockAvailable !== undefined && updated.isActive) {
              updated.isSoldOut = updated.stockAvailable <= 0;
            }
            return updated;
          });
          return { products };
        });
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

      restockProduct: (id, addStock) => {
        const product = get().products.find((p) => p.id === id);
        if (!product) return { success: false, message: '商品不存在' };

        const newStock = product.stock + addStock;
        const newAvailable = product.stockAvailable + addStock;
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? { ...p, stock: newStock, stockAvailable: newAvailable, isSoldOut: newAvailable <= 0 }
              : p
          ),
        }));
        return { success: true, message: `补货 ${addStock} 件成功` };
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
        const operator = get().operatorName;
        const historyEntry: PickupHistoryEntry = {
          id: `ph-${Date.now()}`,
          operator,
          time: now,
          action: 'pickup',
          orderIds: [id],
        };

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  pickupStatus: 'picked' as PickupStatus,
                  pickupTime: now,
                  pickupHistory: [...o.pickupHistory, historyEntry],
                }
              : o
          ),
        }));
        return { success: true, message: '核销成功' };
      },

      pickupOrders: (ids, operator) => {
        let success = 0;
        let failed = 0;
        const now = format(new Date(), 'HH:mm');
        const op = operator || get().operatorName;
        const batchId = `ph-${Date.now()}`;

        const successfulIds: string[] = [];

        set((state) => ({
          orders: state.orders.map((o) => {
            if (!ids.includes(o.id)) return o;
            if (o.pickupStatus === 'picked' || o.payStatus !== 'paid') {
              failed++;
              return o;
            }
            success++;
            successfulIds.push(o.id);
            const historyEntry: PickupHistoryEntry = {
              id: batchId,
              operator: op,
              time: now,
              action: 'batch_pickup',
              orderIds: ids,
            };
            return {
              ...o,
              pickupStatus: 'picked' as PickupStatus,
              pickupTime: now,
              pickupHistory: [...o.pickupHistory, historyEntry],
            };
          }),
        }));
        return { success, failed };
      },

      addOrder: (order) => {
        const newOrder: Order = {
          ...order,
          id: `ord-${Date.now()}`,
          pickupHistory: [],
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
          itemBreakdown: afterSale.itemBreakdown || [],
          multiSupplier: afterSale.multiSupplier || false,
          supplierBreakdown: afterSale.supplierBreakdown || [],
        };
        set((state) => ({ afterSales: [...state.afterSales, newAfterSale] }));
      },

      addAfterSaleWithBreakdown: (afterSale) => {
        const { orderId, type, reason, itemBreakdown, affectsSupplier } = afterSale;
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;

        const totalAmount = itemBreakdown.reduce((sum, it) => sum + it.amount, 0);
        const supplierMap = new Map<string, number>();
        itemBreakdown.forEach((it) => {
          const current = supplierMap.get(it.supplierId) || 0;
          supplierMap.set(it.supplierId, current + it.amount);
        });
        const supplierBreakdown = Array.from(supplierMap.entries()).map(([supplierId, amount]) => ({
          supplierId,
          amount,
        }));
        const multiSupplier = supplierBreakdown.length > 1;
        const mainSupplierId = itemBreakdown[0]?.supplierId || 'sup-001';

        const newAfterSale: AfterSale = {
          id: `as-${Date.now()}`,
          orderId,
          neighborId: order.neighborId,
          supplierId: mainSupplierId,
          type,
          reason,
          amount: totalAmount,
          affectsSupplier: affectsSupplier ?? (type !== 'reissue'),
          status: 'pending' as AfterSaleStatus,
          createdAt: new Date().toISOString(),
          itemBreakdown,
          multiSupplier,
          supplierBreakdown,
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
        const soldOutProducts = dayProducts.filter((p) => p.isActive && p.isSoldOut).length;
        const totalOrders = orders.length;
        const pickedOrders = orders.filter((o) => o.pickupStatus === 'picked').length;
        const pendingPickup = orders.filter(
          (o) => o.pickupStatus === 'pending' && o.payStatus === 'paid'
        ).length;

        const { getSupplierSettlement } = get();
        const supplierSettlements = getSupplierSettlement(date);
        const totalSupplierPayable = supplierSettlements.reduce((sum, s) => sum + s.settlementAmount, 0);
        const totalAfterSaleDeduction = afterSales
          .filter((a) => a.affectsSupplier)
          .reduce((sum, a) => sum + a.amount, 0);
        const leaderIncome = totalReceived - totalSupplierPayable - totalRefund - totalAfterSaleDeduction;

        return {
          totalReceivable,
          totalReceived,
          totalRefund,
          totalReissue,
          totalOutOfStock,
          totalDamaged,
          totalProducts,
          activeProducts,
          soldOutProducts,
          totalOrders,
          pickedOrders,
          pendingPickup,
          leaderIncome,
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

          const relevantAfterSales = dateAfterSales.filter((a) => {
            if (a.supplierId !== supplier.id || !a.affectsSupplier) return false;
            const hasBreakdown = a.supplierBreakdown && a.supplierBreakdown.length > 0;
            if (hasBreakdown) {
              return a.supplierBreakdown.some((s) => s.supplierId === supplier.id);
            }
            return true;
          });

          let totalRefund = relevantAfterSales.reduce((sum, a) => {
            const hasBreakdown = a.supplierBreakdown && a.supplierBreakdown.length > 0;
            if (hasBreakdown) {
              const supplierPart = a.supplierBreakdown.find((s) => s.supplierId === supplier.id);
              return sum + (supplierPart?.amount || 0);
            }
            return sum + a.amount;
          }, 0);

          const deductionDetails = relevantAfterSales.flatMap((a) => {
            const hasBreakdown = a.supplierBreakdown && a.supplierBreakdown.length > 0;
            if (hasBreakdown) {
              return a.supplierBreakdown
                .filter((s) => s.supplierId === supplier.id)
                .map((s) => ({
                  afterSaleId: a.id,
                  type: a.type,
                  amount: s.amount,
                  reason: a.reason,
                }));
            }
            return [{
              afterSaleId: a.id,
              type: a.type,
              amount: a.amount,
              reason: a.reason,
            }];
          });

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

      getNeighborDisplayInfo: (id) => {
        const neighbor = get().neighbors.find((n) => n.id === id);
        if (!neighbor) {
          return {
            name: '未知用户',
            phone: '----------',
            building: '',
            room: '',
            avatar: '👤',
            remark: '',
            isBlacklisted: false,
            blacklistReason: '',
          };
        }
        return {
          name: neighbor.name,
          phone: neighbor.phone,
          building: neighbor.building,
          room: neighbor.room,
          avatar: neighbor.avatar,
          remark: neighbor.remark,
          isBlacklisted: neighbor.isBlacklisted,
          blacklistReason: neighbor.blacklistReason,
        };
      },

      getDateRangeSummary: (startDate, endDate) => {
        const days = eachDayOfInterval({
          start: parseISO(startDate),
          end: parseISO(endDate),
        });

        return days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const summary = get().getDailySummary(dateStr);
          const supplierSettle = get().getSupplierSettlement(dateStr);

          const supplierPayable = supplierSettle.reduce((sum, s) => sum + s.settlementAmount, 0);
          const afterSaleDeduction = supplierSettle.reduce((sum, s) => sum + s.totalRefund, 0);
          const pendingRefund = get().afterSales
            .filter((a) => {
              const saleDate = new Date(a.createdAt).toISOString().split('T')[0];
              return saleDate === dateStr && a.status === 'pending' && a.type === 'refund';
            })
            .reduce((sum, a) => sum + a.amount, 0);

          return {
            date: dateStr,
            leaderIncome: summary.leaderIncome,
            supplierPayable,
            afterSaleDeduction,
            pendingRefund,
            totalOrders: summary.totalOrders,
            totalOrderAmount: summary.totalReceivable,
          };
        });
      },

      getHandoverReport: (date, building) => {
        const { getOrdersByDate, getNeighborDisplayInfo } = get();
        const orders = getOrdersByDate(date);

        const filteredOrders = orders.filter((o) => {
          const neighbor = getNeighborDisplayInfo(o.neighborId);
          return neighbor.building === building;
        });

        const pendingList = filteredOrders
          .filter((o) => o.pickupStatus === 'pending' && o.payStatus === 'paid')
          .map((o) => {
            const info = getNeighborDisplayInfo(o.neighborId);
            return {
              orderId: o.id,
              orderNo: o.orderNo,
              neighborName: info.name,
              neighborPhone: info.phone,
              room: info.room,
              items: o.items.map((it) => ({ productName: it.productName, quantity: it.quantity })),
              total: o.items.reduce((s, it) => s + it.price * it.quantity, 0),
            };
          });

        const pickedList = filteredOrders
          .filter((o) => o.pickupStatus === 'picked')
          .map((o) => {
            const info = getNeighborDisplayInfo(o.neighborId);
            return {
              orderId: o.id,
              orderNo: o.orderNo,
              neighborName: info.name,
              room: info.room,
              pickupTime: o.pickupTime || '',
              items: o.items.map((it) => ({ productName: it.productName, quantity: it.quantity })),
            };
          });

        return {
          date,
          building,
          pendingList,
          pickedList,
          pendingTotal: pendingList.reduce((s, o) => s + o.total, 0),
          pickedTotal: pickedList.length,
        };
      },

      getAllBuildings: () => {
        const buildings = new Set<string>();
        get().neighbors.forEach((n) => n.building && buildings.add(n.building));
        return Array.from(buildings).sort();
      },

      getPickupHistoryByDate: (date) => {
        const orders = get().getOrdersByDate(date);
        const historyMap = new Map<string, PickupHistoryEntry>();
        orders.forEach((o) => {
          o.pickupHistory.forEach((h) => {
            if (!historyMap.has(h.id)) {
              historyMap.set(h.id, h);
            }
          });
        });
        return Array.from(historyMap.values()).sort((a, b) => a.time.localeCompare(b.time));
      },
    }),
    {
      name: 'tuanzhang-storage-v3',
      partialize: (state) => ({
        products: state.products,
        orders: state.orders,
        neighbors: state.neighbors,
        afterSales: state.afterSales,
        suppliers: state.suppliers,
        operatorName: state.operatorName,
      }),
    }
  )
);
