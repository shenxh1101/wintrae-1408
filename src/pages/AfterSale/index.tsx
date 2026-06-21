import { useState, useMemo } from 'react';
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
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  ShoppingCart,
  ArrowRight,
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
  });

  const summary = getDailySummary(currentDate);
  const supplierSettlement = getSupplierSettlement(currentDate);
  
  const dateDisplay = format(new Date(currentDate), 'M月d日 EEEE', { locale: zhCN });

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
    });
  };

  const afterSaleTypes: { value: AfterSaleType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'out_of_stock', label: '缺货', icon: <PackageX size={18} />, color: 'bg-warning-50 text-warning-600 border-warning-200' },
    { value: 'damaged', label: '破损', icon: <AlertTriangle size={18} />, color: 'bg-danger-50 text-danger-600 border-danger-200' },
    { value: 'refund', label: '退款', icon: <RotateCcw size={18} />, color: 'bg-primary-50 text-primary-600 border-primary-200' },
    { value: 'reissue', label: '补发', icon: <Truck size={18} />, color: 'bg-secondary-50 text-secondary-600 border-secondary-200' },
  ];

  const statusConfig: Record<AfterSaleStatus, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-warning-50 text-warning-600' },
    processed: { label: '已处理', color: 'bg-success-50 text-success-600' },
    closed: { label: '已关闭', color: 'bg-warm-100 text-warm-500' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 日期 */}
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

      {/* 数据汇总卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="text-warning-500" />}
          label="当日应收"
          value={summary.totalReceivable.toFixed(2)}
          unit="元"
          bgColor="bg-warning-50"
          trend="up"
          trendText="订单总额"
        />
        <SummaryCard
          icon={<TrendingUp className="text-success-500" />}
          label="当日已收"
          value={summary.totalReceived.toFixed(2)}
          unit="元"
          bgColor="bg-success-50"
          trend="up"
          trendText="已支付订单"
        />
        <SummaryCard
          icon={<TrendingDown className="text-danger-500" />}
          label="待退金额"
          value={summary.totalRefund.toFixed(2)}
          unit="元"
          bgColor="bg-danger-50"
          trend="down"
          trendText="需退款金额"
        />
        <SummaryCard
          icon={<FileText className="text-secondary-500" />}
          label="供应商对账"
          value={supplierSettlement.reduce((sum, s) => sum + s.settlementAmount, 0).toFixed(2)}
          unit="元"
          bgColor="bg-secondary-50"
          trend="neutral"
          trendText="应结算总额"
        />
      </div>

      {/* Tab 切换 */}
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
          {/* 售后列表 */}
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
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-warm-800">{typeCfg?.label}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                            <span className="text-xs text-warm-400">{time}</span>
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
                              className="mt-2 px-3 h-7 text-xs font-medium text-success-600 bg-success-50 rounded-lg hover:bg-success-100 transition-colors"
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

          {/* 供应商对账 */}
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
                    
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-warm-200/50">
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
                  </div>
                ))}
              </div>

              {/* 汇总 */}
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

      {/* 添加售后模态框 */}
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
              {/* 售后类型选择 */}
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

              {/* 关联订单 */}
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

              {/* 供应商 */}
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

              {/* 金额 */}
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

              {/* 原因 */}
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
          trend === 'up' ? 'text-success-500' : trend === 'down' ? 'text-danger-500' : 'text-warm-400'
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
