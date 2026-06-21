import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Product, Order, Neighbor, AfterSale, Supplier,
  PickupStatus, PayStatus, AfterSaleType, AfterSaleStatus,
  AfterSaleItemBreakdown, DateRangeSummary, HandoverReport, PickupHistoryEntry,
  StockMovement, StockMovementType, NeighborDetailView, OperatorAssignment,
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
  operatorAssignments: OperatorAssignment[];

  setCurrentDate: (date: string) => void;
  toggleSidebar: () => void;
  setOperatorName: (name: string) => void;

  addProduct: (product: Omit<Product, 'id' | 'sold' | 'stockAvailable' | 'isSoldOut' | 'stockMovements'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  restockProduct: (id: string, addStock: number, operator?: string) => { success: boolean; message: string };
  addStockMovement: (productId: string, movement: Omit<StockMovement, 'id' | 'timestamp'>) => void;
  getStockMovements: (productId: string) => StockMovement[];

  updateOrderPayStatus: (id: string, status: PayStatus) => void;
  pickupOrder: (id: string, operator?: string) => { success: boolean; message: string };
  pickupOrders: (ids: string[], operator?: string) => { success: number; failed: number };
  addOrder: (order: Omit<Order, 'id' | 'pickupHistory'>) => void;
  assignOrderOperator: (orderId: string, operator: string) => void;
  batchAssignByBuilding: (building: string, operator: string, date: string) => number;
  batchAssignByPickupPoint: (pickupPoint: string, operator: string, date: string) => number;
  getAssignedOperator: (orderId: string) => string | undefined;

  addNeighbor: (neighbor: Omit<Neighbor, 'id' | 'createdAt'>) => void;
  updateNeighbor: (id: string, updates: Partial<Neighbor>) => void;
  toggleBlacklist: (id: string, reason?: string) => void;
  getNeighborDetailView: (id: string) => NeighborDetailView | null;

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
  validateAndFixDateRange: (startDate: string, endDate: string) => { startDate: string; endDate: string; swapped: boolean };
  getDateRangeSummary: (startDate: string, endDate: string) => { list: DateRangeSummary[]; total: DateRangeSummary; swapped: boolean };
  getHandoverReport: (date: string, building: string) => HandoverReport;
  getAllBuildings: () => string[];
  getAllPickupPoints: () => string[];
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
      operatorAssignments: [],

      setCurrentDate: (date) => set({ currentDate: date }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setOperatorName: (name) => set({ operatorName: name }),

      addProduct: (product) => {
        const operator = get().operatorName;
        const movements: StockMovement[] = [{
          id: `sm-${Date.now()}`,
          productId: '',
          type: 'restock' as StockMovementType,
          quantity: product.stock,
          stockBefore: 0,
          stockAfter: product.stock,
          operator,
          timestamp: new Date().toISOString(),
          remark: '新商品上架',
        }];
        const newProduct: Product = {
          ...product,
          id: `prod-${Date.now()}`,
          sold: 0,
          stockAvailable: product.stock,
          isSoldOut: false,
          stockMovements: movements.map((m) => ({ ...m, productId: `prod-${Date.now()}` })),
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
        const operator = get().operatorName;
        set((state) => {
          const products = state.products.map((p) => {
            if (p.id !== id) return p;
            const newActive = !p.isActive;
            const movementType = newActive ? ('online' as StockMovementType) : ('offline' as StockMovementType);
            const movement: StockMovement = {
              id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              productId: p.id,
              type: movementType,
              quantity: 0,
              stockBefore: p.stockAvailable,
              stockAfter: p.stockAvailable,
              operator,
              timestamp: new Date().toISOString(),
              remark: newActive ? '重新上架' : '临时下架',
            };
            return {
              ...p,
              isActive: newActive,
              stockMovements: [...p.stockMovements, movement],
            };
          });
          return { products };
        });
      },

      restockProduct: (id, addStock, operator) => {
        const product = get().products.find((p) => p.id === id);
        if (!product) return { success: false, message: '商品不存在' };
        if (addStock <= 0) return { success: false, message: '补货数量必须大于0' };

        const op = operator || get().operatorName;
        const newStock = product.stock + addStock;
        const newAvailable = product.stockAvailable + addStock;
        const movement: StockMovement = {
          id: `sm-${Date.now()}`,
          productId: id,
          type: 'restock' as StockMovementType,
          quantity: addStock,
          stockBefore: product.stockAvailable,
          stockAfter: newAvailable,
          operator: op,
          timestamp: new Date().toISOString(),
          remark: `补货${addStock}件`,
        };

        set((state) => ({
          products: state.products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  stock: newStock,
                  stockAvailable: newAvailable,
                  isSoldOut: newAvailable <= 0,
                  stockMovements: [...p.stockMovements, movement],
                }
              : p
          ),
        }));
        return { success: true, message: `补货 ${addStock} 件成功` };
      },

      addStockMovement: (productId, movement) => {
        const fullMovement: StockMovement = {
          ...movement,
          id: `sm-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, stockMovements: [...p.stockMovements, fullMovement] }
              : p
          ),
        }));
      },

      getStockMovements: (productId) => {
        const product = get().products.find((p) => p.id === productId);
        return product?.stockMovements || [];
      },

      updateOrderPayStatus: (id, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, payStatus: status } : o
          ),
        }));
      },

      pickupOrder: (id, operator) => {
        const order = get().orders.find((o) => o.id === id);
        if (!order) return { success: false, message: '订单不存在' };
        if (order.pickupStatus === 'picked') return { success: false, message: '订单已核销，请勿重复操作' };
        if (order.payStatus !== 'paid') return { success: false, message: '订单尚未支付' };

        const now = format(new Date(), 'HH:mm');
        const op = operator || get().operatorName;
        const historyEntry: PickupHistoryEntry = {
          id: `ph-${Date.now()}`,
          operator: op,
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

      assignOrderOperator: (orderId, operator) => {
        set((state) => {
          const existing = state.operatorAssignments.find((a) => a.orderId === orderId);
          let assignments;
          if (existing) {
            assignments = state.operatorAssignments.map((a) =>
              a.orderId === orderId
                ? { ...a, operator, assignedAt: new Date().toISOString() }
                : a
            );
          } else {
            assignments = [...state.operatorAssignments, {
              orderId,
              operator,
              assignedAt: new Date().toISOString(),
            }];
          }
          return { operatorAssignments: assignments };
        });
      },

      batchAssignByBuilding: (building, operator, date) => {
        const { getNeighborDisplayInfo, getPendingPickupOrders } = get();
        const orders = getPendingPickupOrders(date).filter((o) => {
          const info = getNeighborDisplayInfo(o.neighborId);
          return info.building === building;
        });
        orders.forEach((o) => get().assignOrderOperator(o.id, operator));
        return orders.length;
      },

      batchAssignByPickupPoint: (pickupPoint, operator, date) => {
        const pendingOrders = get().getPendingPickupOrders(date);
        const assigned = pendingOrders.filter((o) => {
          const firstItem = o.items[0];
          if (!firstItem) return false;
          const product = get().products.find((p) => p.id === firstItem.productId);
          return product?.pickupPoint === pickupPoint;
        });
        assigned.forEach((o) => get().assignOrderOperator(o.id, operator));
        return assigned.length;
      },

      getAssignedOperator: (orderId) => {
        const assignment = get().operatorAssignments.find((a) => a.orderId === orderId);
        return assignment?.operator;
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

      getNeighborDetailView: (id) => {
        const { getNeighborById, orders, afterSales, getNeighborDisplayInfo } = get();
        const neighbor = getNeighborById(id);
        if (!neighbor) return null;

        const neighborOrders = orders
          .filter((o) => o.neighborId === id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const recentOrders = neighborOrders.slice(0, 10).map((o) => ({
          order: o,
          items: o.items.map((it) => ({
            productName: it.productName,
            quantity: it.quantity,
            subtotal: it.subtotal,
          })),
        }));

        const neighborAfterSales = afterSales
          .filter((a) => a.neighborId === id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const recentAfterSales = neighborAfterSales.slice(0, 10).map((a) => {
          const order = orders.find((o) => o.id === a.orderId);
          return {
            afterSale: a,
            orderNo: order?.orderNo || '',
            items: a.itemBreakdown.map((it) => ({
              productName: it.productName,
              quantity: it.quantity,
              amount: it.amount,
            })),
          };
        });

        const recentPickups = neighborOrders
          .filter((o) => o.pickupStatus === 'picked')
          .slice(0, 10)
          .map((o) => {
            const lastHistory = o.pickupHistory[o.pickupHistory.length - 1];
            return {
              orderId: o.id,
              orderNo: o.orderNo,
              pickupTime: o.pickupTime || '',
              operator: lastHistory?.operator || '未知',
              items: o.items.map((it) => ({
                productName: it.productName,
                quantity: it.quantity,
              })),
            };
          });

        const totalOrders = neighborOrders.length;
        const totalSpent = neighborOrders
          .filter((o) => o.payStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        const lastOrderDate = neighborOrders[0]?.date || '-';

        return {
          neighbor: { ...neighbor, ...getNeighborDisplayInfo(id) },
          recentOrders,
          recentAfterSales,
          recentPickups,
          orderStats: {
            totalOrders,
            totalSpent,
            avgOrderAmount: totalOrders > 0 ? totalSpent / totalOrders : 0,
            lastOrderDate,
          },
        };
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
          let totalCost = 0;
          dateOrders.forEach((order) => {
            order.items.forEach((item) => {
              const product = supplierProducts.find((p) => p.id === item.productId);
              if (product) {
                totalSupply += product.cost * item.quantity;
                totalCost += product.cost * item.quantity;
              }
            });
          });

          const relevantAfterSales = dateAfterSales.filter((a) => {
            if (!a.affectsSupplier) return false;
            const hasBreakdown = a.supplierBreakdown && a.supplierBreakdown.length > 0;
            if (hasBreakdown) {
              return a.supplierBreakdown.some((s) => s.supplierId === supplier.id);
            }
            return a.supplierId === supplier.id;
          });

          let totalRefund = 0;
          const deductionDetails = relevantAfterSales.flatMap((a) => {
            const order = orders.find((o) => o.id === a.orderId);
            const hasBreakdown = a.supplierBreakdown && a.supplierBreakdown.length > 0;

            if (hasBreakdown && a.itemBreakdown.length > 0) {
              const supplierItems = a.itemBreakdown.filter((it) => it.supplierId === supplier.id);
              const supplierAmount = supplierItems.reduce((sum, it) => sum + it.amount, 0);
              totalRefund += supplierAmount;

              if (supplierItems.length > 0) {
                return supplierItems.map((it) => ({
                  afterSaleId: a.id,
                  orderId: a.orderId,
                  orderNo: order?.orderNo || '',
                  type: a.type,
                  productName: it.productName,
                  quantity: it.quantity,
                  amount: it.amount,
                  reason: a.reason,
                }));
              }
              return [{
                afterSaleId: a.id,
                orderId: a.orderId,
                orderNo: order?.orderNo || '',
                type: a.type,
                productName: '-',
                quantity: 0,
                amount: supplierAmount,
                reason: a.reason,
              }];
            }

            totalRefund += a.amount;
            const firstItem = a.itemBreakdown[0];
            return [{
              afterSaleId: a.id,
              orderId: a.orderId,
              orderNo: order?.orderNo || '',
              type: a.type,
              productName: firstItem?.productName || '-',
              quantity: firstItem?.quantity || 0,
              amount: a.amount,
              reason: a.reason,
            }];
          });

          return {
            supplierId: supplier.id,
            supplierName: supplier.name,
            totalSupply,
            totalCost,
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

      validateAndFixDateRange: (startDate, endDate) => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        if (start.getTime() > end.getTime()) {
          return { startDate: endDate, endDate: startDate, swapped: true };
        }
        return { startDate, endDate, swapped: false };
      },

      getDateRangeSummary: (startDate, endDate) => {
        const { startDate: fixedStart, endDate: fixedEnd, swapped } = get().validateAndFixDateRange(startDate, endDate);
        const days = eachDayOfInterval({
          start: parseISO(fixedStart),
          end: parseISO(fixedEnd),
        });

        const list = days.map((day) => {
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

        const total: DateRangeSummary = {
          date: '合计',
          leaderIncome: list.reduce((sum, d) => sum + d.leaderIncome, 0),
          supplierPayable: list.reduce((sum, d) => sum + d.supplierPayable, 0),
          afterSaleDeduction: list.reduce((sum, d) => sum + d.afterSaleDeduction, 0),
          pendingRefund: list.reduce((sum, d) => sum + d.pendingRefund, 0),
          totalOrders: list.reduce((sum, d) => sum + d.totalOrders, 0),
          totalOrderAmount: list.reduce((sum, d) => sum + d.totalOrderAmount, 0),
        };

        return { list, total, swapped };
      },

      getHandoverReport: (date, building) => {
        const { getOrdersByDate, getNeighborDisplayInfo, getAssignedOperator } = get();
        const orders = getOrdersByDate(date);

        const filteredOrders = orders.filter((o) => {
          const neighbor = getNeighborDisplayInfo(o.neighborId);
          return neighbor.building === building;
        });

        const pendingList = filteredOrders
          .filter((o) => o.pickupStatus === 'pending' && o.payStatus === 'paid')
          .map((o) => {
            const info = getNeighborDisplayInfo(o.neighborId);
            const assignedOperator = getAssignedOperator(o.id);
            return {
              orderId: o.id,
              orderNo: o.orderNo,
              neighborName: info.name,
              neighborPhone: info.phone,
              room: info.room,
              items: o.items.map((it) => ({ productName: it.productName, quantity: it.quantity })),
              total: o.items.reduce((s, it) => s + it.price * it.quantity, 0),
              assignedOperator,
            };
          });

        const pickedList = filteredOrders
          .filter((o) => o.pickupStatus === 'picked')
          .map((o) => {
            const info = getNeighborDisplayInfo(o.neighborId);
            const lastHistory = o.pickupHistory[o.pickupHistory.length - 1];
            return {
              orderId: o.id,
              orderNo: o.orderNo,
              neighborName: info.name,
              room: info.room,
              pickupTime: o.pickupTime || '',
              items: o.items.map((it) => ({ productName: it.productName, quantity: it.quantity })),
              operator: lastHistory?.operator,
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

      getAllPickupPoints: () => {
        const points = new Set<string>();
        get().products.forEach((p) => p.pickupPoint && points.add(p.pickupPoint));
        return Array.from(points).sort();
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
      name: 'tuanzhang-storage-v4',
      partialize: (state) => ({
        products: state.products,
        orders: state.orders,
        neighbors: state.neighbors,
        afterSales: state.afterSales,
        suppliers: state.suppliers,
        operatorName: state.operatorName,
        operatorAssignments: state.operatorAssignments,
      }),
    }
  )
);
