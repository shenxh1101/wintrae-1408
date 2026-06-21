import { useState, useMemo } from 'react';
import {
  ScanLine,
  Search,
  Check,
  Package,
  Building2,
  Phone,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Order } from '../../types';

export default function PickupPage() {
  const { currentDate, getPendingPickupOrders, getOrdersByDate, pickupOrder } = useAppStore();
  
  const [scanInput, setScanInput] = useState('');
  const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'pending'>('scan');
  const [searchValue, setSearchValue] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);

  const pendingOrders = getPendingPickupOrders(currentDate);
  const allOrders = getOrdersByDate(currentDate);
  const pickedOrders = allOrders.filter((o) => o.pickupStatus === 'picked');

  const pendingByBuilding = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    pendingOrders.forEach((order) => {
      if (!groups[order.building]) {
        groups[order.building] = [];
      }
      groups[order.building].push(order);
    });
    return groups;
  }, [pendingOrders]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    searchOrder(scanInput);
    setScanInput('');
  };

  const handleManualSearch = () => {
    searchOrder(searchValue);
  };

  const searchOrder = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const order = allOrders.find(
      (o) =>
        o.orderNo.toLowerCase() === trimmed.toLowerCase() ||
        o.phone.includes(trimmed) ||
        o.phone.endsWith(trimmed)
    );

    if (order) {
      if (order.pickupStatus === 'picked') {
        alert('该订单已取货');
        return;
      }
      if (order.payStatus !== 'paid') {
        alert('该订单尚未支付');
        return;
      }
      setFoundOrder(order);
    } else {
      setFoundOrder(null);
      alert('未找到对应的订单');
    }
  };

  const confirmPickup = (orderId: string) => {
    pickupOrder(orderId);
    setFoundOrder(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const toggleBuilding = (building: string) => {
    setExpandedBuilding(expandedBuilding === building ? null : building);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 成功提示 */}
      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-subtle">
          <div className="bg-success-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2">
            <CheckCircle size={20} />
            <span className="font-medium">核销成功！</span>
          </div>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center">
              <Clock size={24} className="text-warning-500" />
            </div>
            <div>
              <p className="text-sm text-warm-500">待取货</p>
              <p className="text-2xl font-bold text-warm-800 tabular-nums">{pendingOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
              <CheckCircle size={24} className="text-success-500" />
            </div>
            <div>
              <p className="text-sm text-warm-500">已取货</p>
              <p className="text-2xl font-bold text-warm-800 tabular-nums">{pickedOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Package size={24} className="text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-warm-500">今日总单</p>
              <p className="text-2xl font-bold text-warm-800 tabular-nums">{allOrders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="flex border-b border-warm-100">
          {[
            { key: 'scan', label: '扫码核销', icon: ScanLine },
            { key: 'manual', label: '手动核销', icon: Search },
            { key: 'pending', label: '未取名单', icon: AlertCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex-1 h-14 flex items-center justify-center gap-2 font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-primary-600'
                    : 'text-warm-500 hover:text-warm-700'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* 扫码核销 */}
          {activeTab === 'scan' && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-primary-50 flex items-center justify-center">
                <ScanLine size={40} className="text-primary-500 animate-pulse-soft" />
              </div>
              <h3 className="text-lg font-bold text-warm-800 mb-2">扫码核销</h3>
              <p className="text-sm text-warm-500 mb-6">使用扫码枪扫描订单二维码</p>
              
              <form onSubmit={handleScan}>
                <div className="relative max-w-md mx-auto">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="扫描或输入订单号..."
                    className="w-full h-14 px-5 pr-14 text-lg border-2 border-warm-200 rounded-2xl focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 transition-all"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors btn-press"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </form>

              {foundOrder && (
                <div className="max-w-md mx-auto mt-6 p-5 bg-warm-50 rounded-2xl text-left animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-warm-800">{foundOrder.orderNo}</span>
                    <span className="px-2 py-0.5 bg-warning-100 text-warning-600 text-xs font-medium rounded-full">
                      待取货
                    </span>
                  </div>
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-warm-600">
                      <Building2 size={14} />
                      <span>{foundOrder.building} {foundOrder.room}</span>
                    </div>
                    <div className="flex items-center gap-2 text-warm-600">
                      <Phone size={14} />
                      <span>{foundOrder.phone.slice(0, 3)}****{foundOrder.phone.slice(-4)}</span>
                    </div>
                  </div>
                  <div className="border-t border-warm-200 pt-3 mb-4">
                    <p className="text-xs text-warm-500 mb-2">商品清单</p>
                    <div className="space-y-1">
                      {foundOrder.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-warm-600">{item.productName} × {item.quantity}</span>
                          <span className="text-warm-700">¥{item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-warm-500">订单金额</span>
                    <span className="text-xl font-bold text-primary-500">
                      ¥{foundOrder.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => confirmPickup(foundOrder.id)}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white font-medium flex items-center justify-center gap-2 hover:from-success-600 hover:to-success-700 transition-all btn-press"
                  >
                    <Check size={18} />
                    确认核销
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 手动核销 */}
          {activeTab === 'manual' && (
            <div>
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-bold text-warm-800 mb-2 text-center">手动核销</h3>
                <p className="text-sm text-warm-500 mb-6 text-center">输入订单号或手机号查询</p>
                
                <div className="flex gap-2 mb-6">
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                      placeholder="订单号 / 手机号"
                      className="w-full h-12 pl-10 pr-4 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
                    />
                  </div>
                  <button
                    onClick={handleManualSearch}
                    className="px-6 h-12 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors btn-press"
                  >
                    查询
                  </button>
                </div>

                {foundOrder && (
                  <div className="p-5 bg-warm-50 rounded-2xl animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-warm-800">{foundOrder.orderNo}</span>
                      <span className="px-2 py-0.5 bg-warning-100 text-warning-600 text-xs font-medium rounded-full">
                        待取货
                      </span>
                    </div>
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-warm-600">
                        <Building2 size={14} />
                        <span>{foundOrder.building} {foundOrder.room}</span>
                      </div>
                      <div className="flex items-center gap-2 text-warm-600">
                        <Phone size={14} />
                        <span>{foundOrder.phone}</span>
                      </div>
                    </div>
                    <div className="border-t border-warm-200 pt-3 mb-4">
                      <p className="text-xs text-warm-500 mb-2">商品清单</p>
                      <div className="space-y-1">
                        {foundOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-warm-600">{item.productName} × {item.quantity}</span>
                            <span className="text-warm-700">¥{item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => confirmPickup(foundOrder.id)}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white font-medium flex items-center justify-center gap-2 hover:from-success-600 hover:to-success-700 transition-all btn-press"
                    >
                      <Check size={18} />
                      确认核销
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 未取名单 */}
          {activeTab === 'pending' && (
            <div>
              {pendingOrders.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(pendingByBuilding).map(([building, orders]) => (
                    <div key={building} className="border border-warm-100 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleBuilding(building)}
                        className="w-full px-4 h-12 flex items-center justify-between bg-warm-50 hover:bg-warm-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 size={18} className="text-primary-500" />
                          <span className="font-medium text-warm-800">{building}</span>
                          <span className="px-2 py-0.5 bg-danger-100 text-danger-600 text-xs font-medium rounded-full">
                            {orders.length} 户未取
                          </span>
                        </div>
                        {expandedBuilding === building ? (
                          <ChevronUp size={18} className="text-warm-400" />
                        ) : (
                          <ChevronDown size={18} className="text-warm-400" />
                        )}
                      </button>
                      
                      {expandedBuilding === building && (
                        <div className="p-3 space-y-2 animate-fade-in">
                          {orders.map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-warm-50 transition-colors"
                            >
                              <div>
                                <p className="font-medium text-warm-800 text-sm">
                                  {order.room}室 - {order.phone.slice(0, 3)}****{order.phone.slice(-4)}
                                </p>
                                <p className="text-xs text-warm-500 mt-0.5">
                                  {order.items.map((i) => i.productName).join('、')}
                                </p>
                              </div>
                              <button
                                onClick={() => confirmPickup(order.id)}
                                className="px-3 h-8 rounded-lg bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors btn-press"
                              >
                                核销
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="text-warm-500">太棒了！所有订单都已取货</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 今日核销记录 */}
      {pickedOrders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-bold text-warm-800 mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-success-500" />
            今日核销记录
          </h3>
          <div className="space-y-2">
            {pickedOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-2 border-b border-warm-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center">
                    <Check size={14} className="text-success-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-800">{order.orderNo}</p>
                    <p className="text-xs text-warm-500">
                      {order.building} {order.room}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-warm-700">¥{order.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-warm-400">{order.pickupTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
