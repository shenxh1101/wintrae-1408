import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Phone,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Search,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Order, PayStatus } from '../../types';

export default function OrdersPage() {
  const { orders, currentDate, updateOrderPayStatus, getNeighborById } = useAppStore();

  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [phoneSuffix, setPhoneSuffix] = useState('');
  const [payStatusFilter, setPayStatusFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const buildings = useMemo(() => {
    const set = new Set(orders.map((o) => o.building));
    return Array.from(set);
  }, [orders]);

  const calcOrderItemsSum = (order: Order) =>
    order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => o.date === currentDate);

    if (buildingFilter !== 'all') {
      result = result.filter((o) => o.building === buildingFilter);
    }

    if (phoneSuffix) {
      result = result.filter((o) => o.phone.endsWith(phoneSuffix));
    }

    if (payStatusFilter !== 'all') {
      result = result.filter((o) => o.payStatus === payStatusFilter);
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, currentDate, buildingFilter, phoneSuffix, payStatusFilter]);

  const dateDisplay = format(new Date(currentDate), 'M月d日 EEEE', { locale: zhCN });

  const stats = useMemo(() => {
    const dayOrders = orders.filter((o) => o.date === currentDate);
    const totalAmount = dayOrders.reduce((sum, o) => sum + calcOrderItemsSum(o), 0);
    return {
      total: dayOrders.length,
      paid: dayOrders.filter((o) => o.payStatus === 'paid').length,
      unpaid: dayOrders.filter((o) => o.payStatus === 'unpaid').length,
      refunded: dayOrders.filter((o) => o.payStatus === 'refunded').length,
      totalAmount,
    };
  }, [orders, currentDate]);

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-warm-600">
            <Calendar size={18} />
            <span className="font-medium text-warm-800">{dateDisplay}</span>
          </div>

          <div className="h-6 w-px bg-warm-200 hidden sm:block" />

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter size={16} className="text-warm-400" />

            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="h-9 px-3 text-sm border border-warm-200 rounded-lg focus:outline-none focus:border-primary-400 bg-white"
            >
              <option value="all">全部楼栋</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <div className="relative">
              <Phone size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                type="text"
                value={phoneSuffix}
                onChange={(e) => setPhoneSuffix(e.target.value.replace(/\D/g, ''))}
                placeholder="手机尾号"
                maxLength={4}
                className="h-9 pl-8 pr-3 w-24 text-sm border border-warm-200 rounded-lg focus:outline-none focus:border-primary-400"
              />
            </div>

            <div className="flex rounded-lg overflow-hidden border border-warm-200">
              {[
                { value: 'all', label: '全部' },
                { value: 'paid', label: '已支付' },
                { value: 'unpaid', label: '待支付' },
                { value: 'refunded', label: '已退款' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setPayStatusFilter(item.value)}
                  className={`px-3 h-9 text-sm font-medium transition-colors ${
                    payStatusFilter === item.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-warm-600 hover:bg-warm-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatItem label="订单总数" value={stats.total} unit="单" color="text-warm-800" />
        <StatItem label="已支付" value={stats.paid} unit="单" color="text-success-600" />
        <StatItem label="待支付" value={stats.unpaid} unit="单" color="text-warning-600" />
        <StatItem label="已退款" value={stats.refunded} unit="单" color="text-danger-600" />
        <StatItem label="总金额" value={stats.totalAmount.toFixed(2)} unit="元" color="text-primary-600" />
      </div>

      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              index={index}
              expanded={expandedOrder === order.id}
              onToggle={() => toggleExpand(order.id)}
              onUpdatePayStatus={(status) => updateOrderPayStatus(order.id, status)}
              neighbor={getNeighborById(order.neighborId)}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-warm-500">暂无符合条件的订单</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number | string;
  unit: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-card p-4 text-center">
      <p className="text-xs text-warm-500 mb-1">{label}</p>
      <div className="flex items-baseline justify-center gap-1">
        <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
        <span className="text-xs text-warm-400">{unit}</span>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  index,
  expanded,
  onToggle,
  onUpdatePayStatus,
  neighbor,
}: {
  order: Order;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdatePayStatus: (status: PayStatus) => void;
  neighbor?: ReturnType<typeof useAppStore.getState>['getNeighborById'] extends (id: string) => infer R ? R : never;
}) {
  const payStatusConfig = {
    paid: { label: '已支付', color: 'bg-success-50 text-success-600', icon: CheckCircle },
    unpaid: { label: '待支付', color: 'bg-warning-50 text-warning-600', icon: Clock },
    refunded: { label: '已退款', color: 'bg-danger-50 text-danger-600', icon: XCircle },
  };

  const pickupStatusConfig = {
    pending: { label: '待取货', color: 'bg-warning-50 text-warning-600' },
    picked: { label: '已取货', color: 'bg-success-50 text-success-600' },
    partial: { label: '部分取货', color: 'bg-primary-50 text-primary-600' },
  };

  const payCfg = payStatusConfig[order.payStatus];
  const pickupCfg = pickupStatusConfig[order.pickupStatus];
  const PayIcon = payCfg.icon;

  const itemsSum = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const amountMatch = Math.abs(itemsSum - order.totalAmount) < 0.01;

  return (
    <div
      className="bg-white rounded-2xl shadow-card overflow-hidden animate-slide-up card-transition"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl flex-shrink-0">
              {neighbor?.avatar || '🛒'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-warm-800">{order.orderNo}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${payCfg.color}`}>
                  <PayIcon size={12} className="inline mr-1" />
                  {payCfg.label}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${pickupCfg.color}`}>
                  <Package size={12} className="inline mr-1" />
                  {pickupCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-warm-500 flex-wrap">
                {neighbor && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-warm-700">{neighbor.name}</span>
                    {neighbor.remark && (
                      <span className="text-warm-400">（{neighbor.remark}）</span>
                    )}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  {order.building} {order.room}
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={14} />
                  {order.phone.slice(0, 3)}****{order.phone.slice(-4)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-xs text-warm-500 mb-1">订单金额</p>
            <p className="text-xl font-bold text-primary-500 tabular-nums">¥{order.totalAmount.toFixed(2)}</p>
            <div className="mt-2">
              {expanded ? (
                <ChevronUp size={18} className="text-warm-400 mx-auto" />
              ) : (
                <ChevronDown size={18} className="text-warm-400 mx-auto" />
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-warm-100 p-4 bg-warm-50/50 animate-fade-in">
          <div className="mb-3">
            <p className="text-sm font-medium text-warm-700 mb-2">商品明细</p>
            <div className="bg-white rounded-xl border border-warm-100 overflow-hidden">
              {order.items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between px-3 py-2.5 text-sm ${
                    idx !== order.items.length - 1 ? 'border-b border-warm-100' : ''
                  }`}
                >
                  <div className="flex items-baseline gap-2 min-w-0 flex-1">
                    <span className="text-warm-700 truncate">{item.productName}</span>
                    <span className="text-warm-400 text-xs flex-shrink-0">
                      单价¥{item.price.toFixed(2)} × {item.quantity}
                    </span>
                  </div>
                  <span className="font-medium text-warm-800 tabular-nums flex-shrink-0 ml-3">
                    ¥{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-3 bg-warm-50 border-t border-warm-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-warm-600">商品合计</span>
                  {amountMatch ? (
                    <span className="flex items-center gap-1 text-xs text-success-600">
                      <CheckCircle2 size={14} />
                      与订单金额一致
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-danger-600">
                      <AlertCircle size={14} />
                      与订单金额不一致
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-lg font-bold tabular-nums ${
                      amountMatch ? 'text-success-600' : 'text-danger-600'
                    }`}
                  >
                    ¥{itemsSum.toFixed(2)}
                  </span>
                  {!amountMatch && (
                    <span className="text-xs text-warm-400 line-through">
                      订单¥{order.totalAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {order.remark && (
            <div className="mb-3">
              <p className="text-sm font-medium text-warm-700 mb-1">备注</p>
              <p className="text-sm text-warm-500 bg-warm-100/50 rounded-lg px-3 py-2">{order.remark}</p>
            </div>
          )}

          {order.pickupTime && (
            <div className="mb-3">
              <p className="text-sm font-medium text-warm-700 mb-1">取货时间</p>
              <p className="text-sm text-warm-500">{order.pickupTime}</p>
            </div>
          )}

          {order.payStatus === 'unpaid' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdatePayStatus('paid');
                }}
                className="flex-1 h-9 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors btn-press"
              >
                标记已支付
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
