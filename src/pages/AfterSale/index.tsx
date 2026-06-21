import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
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
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { AfterSaleType, AfterSaleStatus } from '../../types';

export default function AfterSalePage() {
  const {
    currentDate,
    getDailySummary,
    getSupplierSettlement,
    afterSales,
    orders,
    suppliers,
    addAfterSale,
    updateAfterSaleStatus,
    neighbors,
  } = useAppStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'settlement'>('list');
  const [formData, setFormData] = useState({
    type: 'out_of_stock' as AfterSaleType,
    orderId: '',
    neighborId: '',
    supplierId: '',
    reason: '',
    amount: 0,
    affectsSupplier: true,
  });

  const summary = getDailySummary(currentDate);
  const supplierSettlement = getSupplierSettlement(currentDate);
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAfterSale(formData);
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
                {supplierSettlement.map((item, index) => (
                  <div
                    key={item.supplierId}
                    className="p-4 bg-warm-50/50 rounded-xl animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
                          <Truck size={20} className="text-secondary-500" />
                        </div>
                        <div>
                          <h4 className="font-medium text-warm-800">{item.supplierName}</h4>
                          <p className="text-xs text-warm-500">今日供货结算</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-warm-500">应结算</p>
                        <p className="text-lg font-bold text-secondary-600 tabular-nums">
                          ¥{item.settlementAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-warm-200/50 mb-3">
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

                    {item.deductionDetails.length > 0 && (
                      <div className="pt-3 border-t border-warm-200/50">
                        <div className="flex items-center gap-2 mb-2">
                          <MinusCircle size={14} className="text-danger-500" />
                          <span className="text-sm font-medium text-warm-700">扣款明细</span>
                          <span className="text-xs text-warm-400">共 {item.deductionDetails.length} 笔</span>
                        </div>
                        <div className="space-y-2">
                          {item.deductionDetails.map((detail) => {
                            const detailTypeCfg = afterSaleTypes.find((t) => t.value === detail.type);
                            return (
                              <div
                                key={detail.afterSaleId}
                                className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-warm-100"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${detailTypeCfg?.badgeColor}`}>
                                    {detailTypeCfg?.label}
                                  </span>
                                  <span className="text-xs text-warm-500 truncate">{detail.reason}</span>
                                </div>
                                <span className="text-sm font-medium text-danger-500 tabular-nums shrink-0 ml-2">
                                  -¥{detail.amount.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
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
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-warm-100">
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
                  onChange={(e) => {
                    const order = orders.find((o) => o.id === e.target.value);
                    setFormData({
                      ...formData,
                      orderId: e.target.value,
                      neighborId: order?.neighborId || '',
                      amount: order ? order.totalAmount : 0,
                    });
                  }}
                  className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 bg-white"
                >
                  <option value="">请选择订单</option>
                  {orders
                    .filter((o) => o.date === currentDate)
                    .map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNo} - ¥{order.totalAmount}
                      </option>
                    ))}
                </select>
              </div>

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
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 rounded-xl border border-warm-200 text-warm-600 font-medium hover:bg-warm-50 transition-colors btn-press"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 transition-all btn-press"
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
