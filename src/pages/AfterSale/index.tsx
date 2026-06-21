import { useState, useMemo, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PackageX,
  AlertTriangle,
  RotateCcw,
  Truck,
  Plus,
  X,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  ShoppingCart,
  ArrowRight,
  MinusCircle,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { AfterSaleType, AfterSaleStatus, AfterSaleItemBreakdown, OrderItem } from '../../types';

interface SelectedItem {
  itemId: string;
  productId: string;
  productName: string;
  supplierId: string;
  quantity: number;
  price: number;
  cost: number;
  deductibleAmount: number;
  selected: boolean;
  amount: number;
}

export default function AfterSalePage() {
  const {
    currentDate,
    operatorName,
    getDailySummary,
    getSupplierSettlement,
    getDateRangeSummary,
    afterSales,
    orders,
    neighbors,
    suppliers,
    addAfterSale,
    addAfterSaleWithBreakdown,
    updateAfterSaleStatus,
    getNeighborDisplayInfo,
    setCurrentDate,
    getOrdersByDate,
  } = useAppStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'settlement' | 'summary'>('list');
  const [formData, setFormData] = useState({
    type: 'out_of_stock' as AfterSaleType,
    orderId: '',
    neighborId: '',
    supplierId: '',
    reason: '',
    amount: 0,
    affectsSupplier: true,
  });

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: currentDate,
    endDate: currentDate,
  });
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

  const summary = getDailySummary(currentDate);
  const supplierSettlement = getSupplierSettlement(currentDate);
  const dateRangeSummary = useMemo(() => {
    if (activeTab === 'summary') {
      return getDateRangeSummary(dateRange.startDate, dateRange.endDate);
    }
    return { list: [], total: {} as any, swapped: false };
  }, [activeTab, dateRange.startDate, dateRange.endDate, getDateRangeSummary]);

  const toggleSupplierExpand = (supplierId: string) => {
    setExpandedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const dateDisplay = format(new Date(currentDate), 'M月d日 EEEE', { locale: zhCN });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      affectsSupplier: prev.type !== 'reissue',
    }));
  }, [formData.type]);

  const todayAfterSales = useMemo(() => {
    return afterSales
      .filter((a) => {
        const saleDate = new Date(a.createdAt).toISOString().split('T')[0];
        return saleDate === currentDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [afterSales, currentDate]);

  const getOrderById = (id: string) => orders.find((o) => o.id === id);
  const getNeighborById = (id: string) => neighbors.find((n) => n.id === id);
  const getSupplierById = (id: string) => suppliers.find((s) => s.id === id);

  const handleOrderChange = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const items: SelectedItem[] = order.items.map((item) => ({
        itemId: item.id,
        productId: item.productId,
        productName: item.productName,
        supplierId: item.supplierId,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        deductibleAmount: item.price * item.quantity,
        selected: false,
        amount: item.price * item.quantity,
      }));
      setSelectedItems(items);
      setFormData({
        ...formData,
        orderId,
        neighborId: order.neighborId,
        amount: 0,
      });
    } else {
      setSelectedItems([]);
      setFormData({
        ...formData,
        orderId: '',
        neighborId: '',
        amount: 0,
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? { ...item, selected: !item.selected, amount: item.selected ? 0 : item.deductibleAmount }
          : item
      )
    );
  };

  const updateItemAmount = (itemId: string, amount: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, amount } : item))
    );
  };

  const totalAmount = useMemo(() => {
    return selectedItems
      .filter((item) => item.selected)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [selectedItems]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, SelectedItem[]>();
    selectedItems.forEach((item) => {
      const existing = groups.get(item.supplierId) || [];
      groups.set(item.supplierId, [...existing, item]);
    });
    return groups;
  }, [selectedItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itemBreakdown: AfterSaleItemBreakdown[] = selectedItems
      .filter((item) => item.selected)
      .map((item) => ({
        itemId: item.itemId,
        productId: item.productId,
        productName: item.productName,
        supplierId: item.supplierId,
        quantity: item.quantity,
        amount: item.amount,
        cost: item.cost,
      }));

    if (itemBreakdown.length > 0) {
      addAfterSaleWithBreakdown({
        orderId: formData.orderId,
        type: formData.type,
        reason: formData.reason,
        itemBreakdown,
        affectsSupplier: formData.affectsSupplier,
      });
    } else {
      addAfterSale(formData);
    }

    setShowAddModal(false);
    setFormData({
      type: 'out_of_stock',
      orderId: '',
      neighborId: '',
      supplierId: '',
      reason: '',
      amount: 0,
      affectsSupplier: true,
    });
    setSelectedItems([]);
  };

  const afterSaleTypes: { value: AfterSaleType; label: string; icon: React.ReactNode; color: string; badgeColor: string }[] = [
    { value: 'out_of_stock', label: '缺货', icon: <PackageX size={18} />, color: 'bg-orange-50 text-orange-600 border-orange-200', badgeColor: 'bg-orange-100 text-orange-700' },
    { value: 'damaged', label: '破损', icon: <AlertTriangle size={18} />, color: 'bg-red-50 text-red-600 border-red-200', badgeColor: 'bg-red-100 text-red-700' },
    { value: 'refund', label: '退款', icon: <RotateCcw size={18} />, color: 'bg-teal-50 text-teal-600 border-teal-200', badgeColor: 'bg-teal-100 text-teal-700' },
    { value: 'reissue', label: '补发', icon: <Truck size={18} />, color: 'bg-green-50 text-green-600 border-green-200', badgeColor: 'bg-green-100 text-green-700' },
  ];

  const statusConfig: Record<AfterSaleStatus, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-orange-50 text-orange-600' },
    processed: { label: '已处理', color: 'bg-green-50 text-green-600' },
    closed: { label: '已关闭', color: 'bg-warm-100 text-warm-500' },
  };

  const summaryCards = [
    {
      icon: <DollarSign className="text-orange-500" />,
      label: '当日应收',
      value: summary.totalReceivable.toFixed(2),
      unit: '元',
      bgColor: 'bg-orange-50',
      trend: 'up' as const,
      trendText: '订单总额',
    },
    {
      icon: <TrendingUp className="text-green-500" />,
      label: '当日已收',
      value: summary.totalReceived.toFixed(2),
      unit: '元',
      bgColor: 'bg-green-50',
      trend: 'up' as const,
      trendText: '已支付订单',
    },
    {
      icon: <RotateCcw className="text-teal-500" />,
      label: '退款金额',
      value: summary.totalRefund.toFixed(2),
      unit: '元',
      bgColor: 'bg-teal-50',
      trend: 'down' as const,
      trendText: 'type=refund',
    },
    {
      icon: <PackageX className="text-orange-600" />,
      label: '缺货金额',
      value: summary.totalOutOfStock.toFixed(2),
      unit: '元',
      bgColor: 'bg-orange-100',
      trend: 'down' as const,
      trendText: '缺货扣除',
    },
    {
      icon: <AlertTriangle className="text-red-500" />,
      label: '破损金额',
      value: summary.totalDamaged.toFixed(2),
      unit: '元',
      bgColor: 'bg-red-50',
      trend: 'down' as const,
      trendText: '破损扣除',
    },
    {
      icon: <Truck className="text-green-600" />,
      label: '补发金额',
      value: summary.totalReissue.toFixed(2),
      unit: '元',
      bgColor: 'bg-green-100',
      trend: 'neutral' as const,
      trendText: '补发成本',
    },
  ];

  const dateRangeTotals = useMemo(() => {
    return dateRangeSummary.total || {
      leaderIncome: 0,
      supplierPayable: 0,
      afterSaleDeduction: 0,
      pendingRefund: 0,
      totalOrders: 0,
      totalOrderAmount: 0,
    };
  }, [dateRangeSummary]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-warm-800">{dateDisplay}</span>
          <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-medium rounded-full">
            今天
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:from-primary-600 hover:to-primary-700 transition-all btn-press"
        >
          <Plus size={18} />
          <span>登记售后</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <SummaryCard key={index} {...card} />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="flex border-b border-warm-100">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 h-14 flex items-center justify-center gap-2 font-medium transition-colors relative ${
              activeTab === 'list'
                ? 'text-primary-600'
                : 'text-warm-500 hover:text-warm-700'
            }`}
          >
            <AlertTriangle size={18} />
            <span>售后记录</span>
            {todayAfterSales.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-danger-100 text-danger-600">
                {todayAfterSales.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex-1 h-14 flex items-center justify-center gap-2 font-medium transition-colors relative ${
              activeTab === 'settlement'
                ? 'text-primary-600'
                : 'text-warm-500 hover:text-warm-700'
            }`}
          >
            <Users size={18} />
            <span>供应商对账</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 h-14 flex items-center justify-center gap-2 font-medium transition-colors relative ${
              activeTab === 'summary'
                ? 'text-primary-600'
                : 'text-warm-500 hover:text-warm-700'
            }`}
          >
            <FileText size={18} />
            <span>对账汇总</span>
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'list' && (
            <div>
              {todayAfterSales.length > 0 ? (
                <div className="space-y-3">
                  {todayAfterSales.map((item, index) => {
                    const typeCfg = afterSaleTypes.find((t) => t.value === item.type);
                    const statusCfg = statusConfig[item.status];
                    const order = getOrderById(item.orderId);
                    const neighbor = getNeighborById(item.neighborId);
                    const supplier = getSupplierById(item.supplierId);
                    const time = format(new Date(item.createdAt), 'HH:mm');

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 p-4 bg-warm-50/50 rounded-xl hover:bg-warm-50 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${typeCfg?.color}`}>
                          {typeCfg?.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeCfg?.badgeColor}`}>
                              {typeCfg?.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                            <span className="text-xs text-warm-400">{time}</span>
                            {item.affectsSupplier && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-warm-100 text-warm-600">
                                影响供应商扣款
                              </span>
                            )}
                            {item.multiSupplier && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary-100 text-secondary-600">
                                多供应商分摊
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-warm-600 mb-2 line-clamp-1">{item.reason}</p>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-warm-500">
                            {neighbor && (
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {neighbor.name}
                              </span>
                            )}
                            {order && (
                              <span className="flex items-center gap-1">
                                <ShoppingCart size={12} />
                                {order.orderNo}
                              </span>
                            )}
                            {supplier && (
                              <span className="flex items-center gap-1">
                                <Truck size={12} />
                                {supplier.name}
                              </span>
                            )}
                          </div>

                          {item.itemBreakdown && item.itemBreakdown.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-warm-200/50">
                              <p className="text-xs font-medium text-warm-600 mb-2">售后商品明细</p>
                              <div className="space-y-1">
                                {item.itemBreakdown.map((bd) => {
                                  const sup = getSupplierById(bd.supplierId);
                                  return (
                                    <div key={bd.itemId} className="flex items-center justify-between text-xs bg-white px-2 py-1.5 rounded-lg">
                                      <span className="text-warm-600">
                                        {bd.productName} × {bd.quantity}
                                        {sup && <span className="text-warm-400 ml-2">({sup.name})</span>}
                                      </span>
                                      <span className="font-medium text-danger-500">-¥{bd.amount.toFixed(2)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-danger-500 tabular-nums">
                            -¥{item.amount.toFixed(2)}
                          </p>
                          {item.status === 'pending' && (
                            <button
                              onClick={() => updateAfterSaleStatus(item.id, 'processed')}
                              className="mt-2 px-3 h-7 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              标记处理
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">✨</div>
                  <p className="text-warm-500">今天还没有售后记录</p>
                  <p className="text-sm text-warm-400 mt-1">点击右上角按钮登记售后</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settlement' && (
            <div>
              <div className="space-y-3">
                {supplierSettlement.map((item, index) => {
                  const isExpanded = expandedSuppliers.has(item.supplierId);
                  const calcSettlement = (item.totalSupply - item.totalRefund).toFixed(2);
                  const actualSettlement = item.settlementAmount.toFixed(2);
                  const isValid = calcSettlement === actualSettlement;
                  return (
                    <div
                      key={item.supplierId}
                      className="bg-warm-50/50 rounded-xl animate-slide-up overflow-hidden"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <button
                        onClick={() => toggleSupplierExpand(item.supplierId)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-warm-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                            <Truck size={20} className="text-secondary-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-warm-800">{item.supplierName}</h4>
                              {item.deductionDetails.length > 0 && (
                                <span className="px-1.5 py-0.5 text-xs rounded-full bg-danger-100 text-danger-600">
                                  {item.deductionDetails.length}笔扣款
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-warm-500">今日供货结算</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-warm-500">应结算</p>
                            <p className="text-lg font-bold text-secondary-600 tabular-nums">
                              ¥{actualSettlement}
                            </p>
                          </div>
                          <ChevronDown
                            size={20}
                            className={`text-warm-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </button>

                      <div className={`px-4 pb-4 ${!isExpanded ? 'hidden' : ''}`}>
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-warm-200/50 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-warm-500">供货金额</span>
                            <span className="text-sm font-medium text-warm-700 tabular-nums">
                              ¥{item.totalSupply.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-warm-500">售后扣除</span>
                            <span className="text-sm font-medium text-danger-500 tabular-nums">
                              -¥{item.totalRefund.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                          isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {isValid ? (
                            <CheckCircle size={16} />
                          ) : (
                            <XCircle size={16} />
                          )}
                          <span className="font-mono text-xs">
                            {isValid ? '校验通过: ' : '校验异常: '}
                            ¥{item.totalSupply.toFixed(2)} - ¥{item.totalRefund.toFixed(2)} = ¥{calcSettlement}
                          </span>
                        </div>

                        {item.deductionDetails.length > 0 ? (
                          <div className="overflow-x-auto rounded-lg border border-warm-200">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-warm-100 border-b border-warm-200">
                              <MinusCircle size={14} className="text-danger-500" />
                              <span className="text-sm font-medium text-warm-700">商品级扣款明细</span>
                            </div>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-white border-b border-warm-200">
                                  <th className="px-3 py-2 text-left font-medium text-warm-600">订单号</th>
                                  <th className="px-3 py-2 text-left font-medium text-warm-600">商品</th>
                                  <th className="px-3 py-2 text-right font-medium text-warm-600">数量</th>
                                  <th className="px-3 py-2 text-right font-medium text-warm-600">金额</th>
                                  <th className="px-3 py-2 text-center font-medium text-warm-600">类型</th>
                                  <th className="px-3 py-2 text-left font-medium text-warm-600">原因</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.deductionDetails.map((detail, dIdx) => {
                                  const detailTypeCfg = afterSaleTypes.find((t) => t.value === detail.type);
                                  return (
                                    <tr
                                      key={`${detail.afterSaleId}-${dIdx}`}
                                      className="border-b border-warm-100 last:border-b-0 hover:bg-warm-50/50 transition-colors"
                                    >
                                      <td className="px-3 py-2.5 text-warm-600 font-mono text-xs whitespace-nowrap">
                                        {detail.orderNo || '-'}
                                      </td>
                                      <td className="px-3 py-2.5 text-warm-800 whitespace-nowrap">
                                        {detail.productName || '-'}
                                      </td>
                                      <td className="px-3 py-2.5 text-right text-warm-700 tabular-nums">
                                        {detail.quantity || 0}
                                      </td>
                                      <td className="px-3 py-2.5 text-right font-medium text-danger-500 tabular-nums whitespace-nowrap">
                                        -¥{detail.amount.toFixed(2)}
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${detailTypeCfg?.badgeColor || 'bg-warm-100 text-warm-600'}`}>
                                          {detailTypeCfg?.label || detail.type}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 text-warm-500 text-xs max-w-[200px] truncate" title={detail.reason}>
                                        {detail.reason || '-'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="bg-warm-50 font-medium">
                                  <td colSpan={3} className="px-3 py-2.5 text-right text-warm-700">扣款合计</td>
                                  <td className="px-3 py-2.5 text-right text-danger-600 tabular-nums font-bold whitespace-nowrap">
                                    -¥{item.totalRefund.toFixed(2)}
                                  </td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ) : (
                          <div className="p-6 bg-white rounded-lg border border-dashed border-warm-200 text-center">
                            <p className="text-warm-400 text-sm">今日无售后扣款记录</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 p-4 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80 mb-1">今日供应商应结算总额</p>
                    <p className="text-2xl font-bold tabular-nums">
                      ¥{supplierSettlement.reduce((sum, s) => sum + s.settlementAmount, 0).toFixed(2)}
                    </p>
                  </div>
                  <button className="px-4 h-10 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors flex items-center gap-2">
                    <ArrowRight size={16} />
                    导出对账单
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-warm-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-primary-500" />
                  <span className="text-sm font-medium text-warm-700">开始日期</span>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="h-10 px-3 border border-warm-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 bg-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-primary-500" />
                  <span className="text-sm font-medium text-warm-700">结束日期</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="h-10 px-3 border border-warm-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 bg-white text-sm"
                  />
                </div>
              </div>

              {dateRangeSummary.swapped && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700 text-sm animate-fade-in">
                  <AlertTriangle size={16} />
                  <span>日期已自动纠正</span>
                </div>
              )}

              {dateRangeSummary.list && dateRangeSummary.list.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-warm-50 border-b border-warm-200">
                        <th className="px-4 py-3 text-left font-medium text-warm-600">日期</th>
                        <th className="px-4 py-3 text-right font-medium text-warm-600">团长收入</th>
                        <th className="px-4 py-3 text-right font-medium text-warm-600">供应商应结</th>
                        <th className="px-4 py-3 text-right font-medium text-warm-600">售后扣款</th>
                        <th className="px-4 py-3 text-right font-medium text-warm-600">待退金额</th>
                        <th className="px-4 py-3 text-right font-medium text-warm-600">订单数</th>
                        <th className="px-4 py-3 text-right font-medium text-warm-600">订单金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateRangeSummary.list.map((item, index) => (
                        <tr
                          key={item.date}
                          className="border-b border-warm-100 hover:bg-warm-50/50 transition-colors animate-slide-up"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="px-4 py-3 text-warm-800">
                            {format(parseISO(item.date), 'M月d日 EEEE', { locale: zhCN })}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-green-600 tabular-nums">
                            ¥{item.leaderIncome.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-secondary-600 tabular-nums">
                            ¥{item.supplierPayable.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-danger-500 tabular-nums">
                            -¥{item.afterSaleDeduction.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-500 tabular-nums">
                            ¥{item.pendingRefund.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-warm-700 tabular-nums">
                            {item.totalOrders}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-warm-800 tabular-nums">
                            ¥{item.totalOrderAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary-50 font-medium">
                        <td className="px-4 py-3 text-warm-800 font-bold">合计</td>
                        <td className="px-4 py-3 text-right text-green-600 tabular-nums font-bold">
                          ¥{(dateRangeTotals.leaderIncome || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-secondary-600 tabular-nums font-bold">
                          ¥{(dateRangeTotals.supplierPayable || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-danger-500 tabular-nums font-bold">
                          -¥{(dateRangeTotals.afterSaleDeduction || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-500 tabular-nums font-bold">
                          ¥{(dateRangeTotals.pendingRefund || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-warm-700 tabular-nums font-bold">
                          {dateRangeTotals.totalOrders || 0}
                        </td>
                        <td className="px-4 py-3 text-right text-warm-800 tabular-nums font-bold">
                          ¥{(dateRangeTotals.totalOrderAmount || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-warm-300 mb-3" />
                  <p className="text-warm-500">暂无对账数据</p>
                  <p className="text-sm text-warm-400 mt-1">请选择日期范围查看</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-warm-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-warm-800">登记售后</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-warm-50 flex items-center justify-center text-warm-400 hover:text-warm-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  售后类型
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {afterSaleTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        formData.type === type.value
                          ? type.color + ' border-current'
                          : 'border-warm-100 text-warm-500 hover:border-warm-200'
                      }`}
                    >
                      {type.icon}
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  关联订单
                </label>
                <select
                  value={formData.orderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 bg-white"
                >
                  <option value="">请选择订单</option>
                  {orders
                    .filter((o) => o.date === currentDate)
                    .map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNo} - ¥{order.totalAmount.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              {selectedItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-warm-700">选择售后商品</label>
                    <span className="text-xs text-warm-500">勾选需要登记售后的商品</span>
                  </div>

                  {Array.from(groupedItems.entries()).map(([supplierId, items], groupIndex) => {
                    const supplier = getSupplierById(supplierId);
                    const groupTotal = items
                      .filter((i) => i.selected)
                      .reduce((sum, i) => sum + i.amount, 0);

                    return (
                      <div
                        key={supplierId}
                        className="border border-warm-200 rounded-xl overflow-hidden animate-slide-up"
                        style={{ animationDelay: `${groupIndex * 50}ms` }}
                      >
                        <div className="bg-secondary-50 px-4 py-2.5 flex items-center justify-between border-b border-warm-200">
                          <div className="flex items-center gap-2">
                            <Truck size={16} className="text-secondary-500" />
                            <span className="font-medium text-warm-800">{supplier?.name || '未知供应商'}</span>
                            {items.length > 1 && (
                              <span className="text-xs text-warm-500">共 {items.length} 件商品</span>
                            )}
                          </div>
                          {groupTotal > 0 && (
                            <span className="text-sm font-medium text-danger-500">-¥{groupTotal.toFixed(2)}</span>
                          )}
                        </div>

                        <div className="divide-y divide-warm-100">
                          {items.map((item) => (
                            <div
                              key={item.itemId}
                              className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                                item.selected ? 'bg-primary-50/50' : 'hover:bg-warm-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => toggleItemSelection(item.itemId)}
                                className="w-5 h-5 rounded border-warm-300 text-primary-500 focus:ring-primary-400 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-warm-800 truncate">{item.productName}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-warm-500">
                                  <span>单价: ¥{item.price.toFixed(2)}</span>
                                  <span>数量: ×{item.quantity}</span>
                                  <span>可扣: ¥{item.deductibleAmount.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-warm-500">售后金额</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={item.deductibleAmount}
                                  value={item.amount}
                                  onChange={(e) => updateItemAmount(item.itemId, Number(e.target.value))}
                                  disabled={!item.selected}
                                  className="w-24 h-8 px-2 text-right text-sm border border-warm-200 rounded-lg focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-50 disabled:bg-warm-100 disabled:text-warm-400 tabular-nums"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-warm-50 to-orange-50 rounded-xl border border-orange-200">
                    <div>
                      <p className="text-sm text-warm-600">已选商品售后总金额</p>
                      <p className="text-xs text-warm-500 mt-0.5">
                        {selectedItems.filter((i) => i.selected).length} 件商品
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-danger-500 tabular-nums">
                      -¥{totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {selectedItems.length === 0 && formData.orderId && (
                <div className="p-4 bg-warm-50 rounded-xl text-center text-warm-500 text-sm">
                  该订单暂无商品信息
                </div>
              )}

              {selectedItems.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    涉及供应商
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 bg-white"
                  >
                    <option value="">请选择供应商</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedItems.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    售后金额 (元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  售后原因
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full h-20 px-3 py-2 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 resize-none"
                  placeholder="请描述售后原因..."
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-warm-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-warm-700">是否影响供应商扣款</p>
                  <p className="text-xs text-warm-500 mt-0.5">
                    {formData.type === 'reissue' ? '补发默认不扣款' : '退款/缺货/破损默认扣款'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, affectsSupplier: !formData.affectsSupplier })}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    formData.affectsSupplier ? 'bg-primary-500' : 'bg-warm-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      formData.affectsSupplier ? 'translate-x-5.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedItems([]);
                  }}
                  className="flex-1 h-11 rounded-xl border border-warm-200 text-warm-600 font-medium hover:bg-warm-50 transition-colors btn-press"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={selectedItems.length > 0 && totalAmount <= 0}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 transition-all btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认登记
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  unit,
  bgColor,
  trend,
  trendText,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  bgColor: string;
  trend: 'up' | 'down' | 'neutral';
  trendText: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 card-transition">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs ${
          trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-danger-500' : 'text-warm-400'
        }`}>
          {trend === 'up' && <TrendingUp size={14} />}
          {trend === 'down' && <TrendingDown size={14} />}
          <span>{trendText}</span>
        </div>
      </div>
      <p className="text-sm text-warm-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-warm-800 tabular-nums">{value}</span>
        <span className="text-sm text-warm-400">{unit}</span>
      </div>
    </div>
  );
}
