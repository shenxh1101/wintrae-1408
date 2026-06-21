import { useState, useMemo, useRef, useEffect } from 'react';
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
  User,
  Users,
  Sparkles,
  Clipboard,
  Download,
  History,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Order, PickupHistoryEntry } from '../../types';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

type TabType = 'scan' | 'manual' | 'pending' | 'handover';
type HandoverListType = 'pending' | 'picked';

export default function PickupPage() {
  const {
    currentDate,
    getPendingPickupOrders,
    getOrdersByDate,
    pickupOrder,
    getNeighborDisplayInfo,
    getAllBuildings,
    getHandoverReport,
    getPickupHistoryByDate,
    getAllPickupPoints,
    assignOrderOperator,
    batchAssignByBuilding,
    batchAssignByPickupPoint,
    getAssignedOperator,
    setOperatorName,
    operatorName,
    products,
  } = useAppStore();

  const [scanInput, setScanInput] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('scan');
  const [searchValue, setSearchValue] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [expandedBuilding, setExpandedBuilding] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [handoverListType, setHandoverListType] = useState<HandoverListType>('pending');

  const [handoverSubTab, setHandoverSubTab] = useState<'building' | 'volunteer'>('building');
  const [assignBuilding, setAssignBuilding] = useState<string>('');
  const [assignPickupPoint, setAssignPickupPoint] = useState<string>('');
  const [volunteerName, setVolunteerName] = useState('');
  const [assignMode, setAssignMode] = useState<'building' | 'pickupPoint'>('building');
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyOperatorFilter, setHistoryOperatorFilter] = useState<string>('');

  const scanInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastIdRef = useRef(0);

  const pendingOrders = getPendingPickupOrders(currentDate);
  const allOrders = getOrdersByDate(currentDate);
  const pickedOrders = allOrders.filter((o) => o.pickupStatus === 'picked');
  const buildings = getAllBuildings();
  const pickupPoints = getAllPickupPoints();
  const pickupHistory = getPickupHistoryByDate(currentDate);

  const handoverReport = useMemo(() => {
    if (!selectedBuilding) return null;
    return getHandoverReport(currentDate, selectedBuilding);
  }, [currentDate, selectedBuilding, getHandoverReport, refreshKey]);

  const allOperators = useMemo(() => {
    const set = new Set<string>();
    allOrders.forEach((o) => {
      const op = getAssignedOperator(o.id);
      if (op) set.add(op);
      o.pickupHistory.forEach((h) => h.operator && set.add(h.operator));
    });
    if (operatorName) set.add(operatorName);
    return Array.from(set);
  }, [allOrders, getAssignedOperator, operatorName, refreshKey]);

  const historyOperators = useMemo(() => {
    const set = new Set<string>();
    pickupHistory.forEach((h) => h.operator && set.add(h.operator));
    return Array.from(set);
  }, [pickupHistory]);

  const filteredPickupHistory = useMemo(() => {
    if (!historyOperatorFilter) return pickupHistory;
    return pickupHistory.filter((h) => h.operator === historyOperatorFilter);
  }, [pickupHistory, historyOperatorFilter]);

  const pendingByBuilding = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    pendingOrders.forEach((order) => {
      const info = getNeighborDisplayInfo(order.neighborId);
      if (!groups[info.building]) {
        groups[info.building] = [];
      }
      groups[info.building].push(order);
    });
    return groups;
  }, [pendingOrders, getNeighborDisplayInfo]);

  useEffect(() => {
    if (buildings.length > 0) {
      if (!selectedBuilding) setSelectedBuilding(buildings[0]);
      if (!assignBuilding) setAssignBuilding(buildings[0]);
    }
    if (pickupPoints.length > 0 && !assignPickupPoint) {
      setAssignPickupPoint(pickupPoints[0]);
    }
  }, [buildings, pickupPoints, selectedBuilding, assignBuilding, assignPickupPoint]);

  const showToast = (type: ToastType, message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const searchOrder = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const order = allOrders.find(
      (o) => {
        const info = getNeighborDisplayInfo(o.neighborId);
        return (
          o.orderNo.toLowerCase() === trimmed.toLowerCase() ||
          info.phone.includes(trimmed) ||
          info.phone.endsWith(trimmed)
        );
      }
    );

    if (order) {
      if (order.pickupStatus === 'picked') {
        showToast('error', '该订单已核销');
        return;
      }
      if (order.payStatus !== 'paid') {
        showToast('error', '该订单尚未支付');
        return;
      }
      setFoundOrder(order);
    } else {
      setFoundOrder(null);
      showToast('error', '未找到对应的订单');
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    searchOrder(scanInput);
    setScanInput('');
    setTimeout(() => scanInputRef.current?.focus(), 50);
  };

  const handleManualSearch = () => {
    searchOrder(searchValue);
  };

  const confirmPickup = (orderId: string, isScanMode = false) => {
    const effectiveOp = getAssignedOperator(orderId) || operatorName;
    const result = pickupOrder(orderId, effectiveOp);
    if (result.success) {
      showToast('success', result.message);
      setFoundOrder(null);
      if (isScanMode || activeTab === 'scan') {
        setScanInput('');
        setTimeout(() => scanInputRef.current?.focus(), 50);
      }
    } else {
      showToast('error', result.message);
    }
  };

  const handleBatchPickup = (building: string) => {
    const orders = pendingByBuilding[building] || [];
    if (orders.length === 0) {
      showToast('info', '没有可核销的订单');
      return;
    }
    let successCount = 0;
    let failCount = 0;
    orders.forEach((o) => {
      const effectiveOp = getAssignedOperator(o.id) || operatorName;
      const result = pickupOrder(o.id, effectiveOp);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    });
    if (failCount === 0) {
      showToast('success', `${building} 已全部核销（${successCount}单）`);
    } else {
      showToast('info', `${building} 核销完成：成功 ${successCount} 单，失败 ${failCount} 单`);
    }
  };

  const handleBatchAssignByBuilding = () => {
    if (!assignBuilding) {
      showToast('error', '请选择楼栋');
      return;
    }
    if (!volunteerName.trim()) {
      showToast('error', '请输入志愿者姓名');
      return;
    }
    const count = batchAssignByBuilding(assignBuilding, volunteerName.trim(), currentDate);
    showToast('success', `已为 ${assignBuilding} 分配 ${count} 单给「${volunteerName.trim()}」`);
    setRefreshKey((k) => k + 1);
  };

  const handleBatchAssignByPickupPoint = () => {
    if (!assignPickupPoint) {
      showToast('error', '请选择取货点');
      return;
    }
    if (!volunteerName.trim()) {
      showToast('error', '请输入志愿者姓名');
      return;
    }
    const count = batchAssignByPickupPoint(assignPickupPoint, volunteerName.trim(), currentDate);
    showToast('success', `已为取货点「${assignPickupPoint}」分配 ${count} 单给「${volunteerName.trim()}」`);
    setRefreshKey((k) => k + 1);
  };

  const handleAssignOperator = (orderId: string, operator: string) => {
    assignOrderOperator(orderId, operator);
    setRefreshKey((k) => k + 1);
    if (operator) {
      showToast('success', '已更新分配');
    }
  };

  const toggleBuilding = (building: string) => {
    setExpandedBuilding(expandedBuilding === building ? null : building);
  };

  const generateHandoverText = () => {
    if (!handoverReport) return '';

    const { date, building, pendingList, pickedList, pendingTotal, pickedTotal } = handoverReport;

    let text = `【${building} 交接清单 - ${date}】\n\n`;

    text += `未取（${pendingList.length}户）：\n`;
    pendingList.forEach((item, index) => {
      const itemsStr = item.items.map((i) => `${i.productName}×${i.quantity}`).join(', ');
      const phone = item.neighborPhone;
      const maskedPhone = phone.slice(0, 3) + '****' + phone.slice(-4);
      const volStr = item.assignedOperator ? ` [志愿者：${item.assignedOperator}]` : '';
      text += `${index + 1}. ${item.neighborName} ${item.room}室 ${maskedPhone}${volStr} - ${itemsStr} - ¥${item.total.toFixed(2)}\n`;
    });
    text += `\n未取总金额：¥${pendingTotal.toFixed(2)}\n\n`;

    text += `已取（${pickedTotal}户）：\n`;
    pickedList.forEach((item, index) => {
      const itemsStr = item.items.map((i) => `${i.productName}×${i.quantity}`).join(', ');
      const opStr = item.operator ? ` [处理人：${item.operator}]` : '';
      text += `${index + 1}. ${item.neighborName} ${item.room}室${opStr} - ${itemsStr} - ${item.pickupTime}\n`;
    });

    return text;
  };

  const handleCopyToClipboard = async () => {
    const text = generateHandoverText();
    if (!text) {
      showToast('error', '请先选择楼栋');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', '已复制到剪贴板');
    } catch {
      showToast('error', '复制失败，请手动复制');
    }
  };

  const handleExport = () => {
    const text = generateHandoverText();
    if (!text) {
      showToast('error', '请先选择楼栋');
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${handoverReport?.building}_交接清单_${handoverReport?.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', '导出成功');
  };

  const getActionTypeLabel = (action: PickupHistoryEntry['action']) => {
    switch (action) {
      case 'pickup':
        return '单笔';
      case 'batch_pickup':
        return '批量';
      case 'cancel':
        return '取消';
      default:
        return action;
    }
  };

  useEffect(() => {
    if (activeTab === 'scan') {
      setTimeout(() => scanInputRef.current?.focus(), 100);
    }
  }, [activeTab]);

  const renderNeighborCard = (order: Order) => {
    const info = getNeighborDisplayInfo(order.neighborId);
    return (
      <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-xl">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl">
            {info.avatar || '👤'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-warm-800">{info.name || '邻居'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-warm-500 mt-0.5">
            <Phone size={12} />
            <span>{info.phone.slice(0, 3)}****{info.phone.slice(-4)}</span>
          </div>
          {info.remark && (
            <p className="text-xs text-warm-400 mt-1 truncate">
              <span className="text-warm-400">备注：</span>{info.remark}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderOrderDetail = (order: Order, showConfirmButton = true, isScanMode = false) => {
    const info = getNeighborDisplayInfo(order.neighborId);
    return (
      <div className="max-w-md mx-auto mt-6 p-5 bg-warm-50 rounded-2xl text-left animate-fade-in">
        {renderNeighborCard(order)}
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-warm-800">{order.orderNo}</span>
          <span className="px-2 py-0.5 bg-warning-100 text-warning-600 text-xs font-medium rounded-full">
            待取货
          </span>
        </div>
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2 text-warm-600">
            <Building2 size={14} />
            <span>{info.building} {info.room}</span>
          </div>
        </div>
        <div className="border-t border-warm-200 pt-3 mb-4">
          <p className="text-xs text-warm-500 mb-2">商品清单</p>
          <div className="space-y-1">
            {order.items.map((item) => (
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
            ¥{order.totalAmount.toFixed(2)}
          </span>
        </div>
        {showConfirmButton && (
          <button
            onClick={() => confirmPickup(order.id, isScanMode)}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white font-medium flex items-center justify-center gap-2 hover:from-success-600 hover:to-success-700 transition-all btn-press"
          >
            <Check size={18} />
            确认核销
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast 提示 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg animate-slide-in-right ${
              toast.type === 'success'
                ? 'bg-success-500 text-white'
                : toast.type === 'error'
                ? 'bg-danger-500 text-white'
                : 'bg-warm-700 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Sparkles size={18} />}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

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
            { key: 'handover', label: '交接模式', icon: Clipboard },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as TabType);
                  setFoundOrder(null);
                }}
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
              <p className="text-sm text-warm-500 mb-6">使用扫码枪扫描订单二维码，支持连续核销</p>

              <form onSubmit={handleScan}>
                <div className="relative max-w-md mx-auto">
                  <input
                    ref={scanInputRef}
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

              {foundOrder && renderOrderDetail(foundOrder, true, true)}
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
                      ref={searchInputRef}
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

                {foundOrder && renderOrderDetail(foundOrder, true, false)}
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
                          <button
                            onClick={() => handleBatchPickup(building)}
                            className="w-full h-10 mb-2 rounded-lg bg-gradient-to-r from-success-500 to-success-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:from-success-600 hover:to-success-700 transition-all btn-press"
                          >
                            <Sparkles size={16} />
                            本楼栋一键核销全部（{orders.length}单）
                          </button>
                          {orders.map((order) => {
                            const info = getNeighborDisplayInfo(order.neighborId);
                            return (
                              <div
                                key={order.id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-warm-50 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-xl">
                                    {info.avatar || '👤'}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-warm-800 text-sm">
                                      {info.name || '邻居'} · {info.room}室
                                    </p>
                                    <p className="text-xs text-warm-500 mt-0.5 truncate">
                                      {order.items.map((i) => i.productName).join('、')}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => confirmPickup(order.id, false)}
                                  className="ml-3 px-3 h-8 rounded-lg bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors btn-press flex-shrink-0"
                                >
                                  核销
                                </button>
                              </div>
                            );
                          })}
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

          {/* 交接模式 */}
          {activeTab === 'handover' && (
            <div>
              <div className="max-w-4xl mx-auto">
                <h3 className="text-lg font-bold text-warm-800 mb-2 text-center">交接模式</h3>
                <p className="text-sm text-warm-500 mb-6 text-center">按楼栋生成交接清单，便于与物业或志愿者交接</p>

                {/* 处理人设置 */}
                <div className="mb-6 bg-primary-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-warm-700 mb-2 flex items-center gap-2">
                    <User size={16} className="text-primary-500" />
                    处理人设置（当前核销操作人）
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="请输入处理人姓名"
                    className="w-full h-12 px-4 border border-warm-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
                  />
                </div>

                {/* 子Tab 切换 */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setHandoverSubTab('building')}
                    className={`flex-1 h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                      handoverSubTab === 'building'
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                    }`}
                  >
                    <Building2 size={18} />
                    楼栋清单
                  </button>
                  <button
                    onClick={() => setHandoverSubTab('volunteer')}
                    className={`flex-1 h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                      handoverSubTab === 'volunteer'
                        ? 'bg-primary-500 text-white shadow-sm'
                        : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                    }`}
                  >
                    <Users size={18} />
                    志愿者分工
                  </button>
                </div>

                {/* 楼栋清单子Tab */}
                {handoverSubTab === 'building' && (
                  <>
                    {/* 楼栋选择 */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-warm-700 mb-2">选择楼栋</label>
                      <div className="relative">
                        <select
                          value={selectedBuilding}
                          onChange={(e) => setSelectedBuilding(e.target.value)}
                          className="w-full h-12 px-4 pr-10 border border-warm-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 appearance-none cursor-pointer"
                        >
                          {buildings.map((building) => (
                            <option key={building} value={building}>
                              {building}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
                      </div>
                    </div>

                    {handoverReport && (
                      <>
                        {/* 统计信息 */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-warning-50 rounded-xl p-4 text-center">
                            <p className="text-sm text-warm-500 mb-1">未取户数</p>
                            <p className="text-2xl font-bold text-warning-600">{handoverReport.pendingList.length} 户</p>
                            <p className="text-sm text-warm-500 mt-1">¥{handoverReport.pendingTotal.toFixed(2)}</p>
                          </div>
                          <div className="bg-success-50 rounded-xl p-4 text-center">
                            <p className="text-sm text-warm-500 mb-1">已取户数</p>
                            <p className="text-2xl font-bold text-success-600">{handoverReport.pickedTotal} 户</p>
                          </div>
                        </div>

                        {/* 清单切换 */}
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setHandoverListType('pending')}
                            className={`flex-1 h-10 rounded-lg font-medium transition-colors ${
                              handoverListType === 'pending'
                                ? 'bg-warning-500 text-white'
                                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                            }`}
                          >
                            未取清单
                          </button>
                          <button
                            onClick={() => setHandoverListType('picked')}
                            className={`flex-1 h-10 rounded-lg font-medium transition-colors ${
                              handoverListType === 'picked'
                                ? 'bg-success-500 text-white'
                                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                            }`}
                          >
                            已取清单
                          </button>
                        </div>

                        {/* 导出和复制按钮 */}
                        <div className="flex gap-3 mb-4">
                          <button
                            onClick={handleExport}
                            className="flex-1 h-10 rounded-lg bg-primary-50 text-primary-600 font-medium flex items-center justify-center gap-2 hover:bg-primary-100 transition-colors btn-press"
                          >
                            <Download size={16} />
                            导出
                          </button>
                          <button
                            onClick={handleCopyToClipboard}
                            className="flex-1 h-10 rounded-lg bg-primary-500 text-white font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors btn-press"
                          >
                            <Clipboard size={16} />
                            复制
                          </button>
                        </div>

                        {/* 未取清单 */}
                        {handoverListType === 'pending' && (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {handoverReport.pendingList.length > 0 ? (
                              handoverReport.pendingList.map((item, index) => (
                                <div key={item.orderId} className="bg-white border border-warm-100 rounded-xl p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-warning-100 text-warning-600 text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                      </span>
                                      <span className="font-semibold text-warm-800">{item.neighborName}</span>
                                      <span className="text-sm text-warm-500">{item.room}室</span>
                                    </div>
                                    <span className="font-bold text-primary-500">¥{item.total.toFixed(2)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-warm-500 mb-2">
                                    <Phone size={12} />
                                    <span>{item.neighborPhone.slice(0, 3)}****{item.neighborPhone.slice(-4)}</span>
                                  </div>
                                  <div className="text-sm text-warm-600 mb-2">
                                    {item.items.map((i) => `${i.productName}×${i.quantity}`).join('、')}
                                  </div>
                                  {item.assignedOperator && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-warm-100">
                                      <User size={12} className="text-primary-500" />
                                      <span className="text-xs text-warm-500">分配志愿者：</span>
                                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                        {item.assignedOperator}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <div className="text-4xl mb-3">✅</div>
                                <p className="text-warm-500">该楼栋已全部取货</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 已取清单 */}
                        {handoverListType === 'picked' && (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {handoverReport.pickedList.length > 0 ? (
                              handoverReport.pickedList.map((item, index) => (
                                <div key={item.orderId} className="bg-white border border-warm-100 rounded-xl p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-success-100 text-success-600 text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                      </span>
                                      <span className="font-semibold text-warm-800">{item.neighborName}</span>
                                      <span className="text-sm text-warm-500">{item.room}室</span>
                                    </div>
                                    <span className="text-sm text-warm-500">{item.pickupTime}</span>
                                  </div>
                                  <div className="text-sm text-warm-600 mb-2">
                                    {item.items.map((i) => `${i.productName}×${i.quantity}`).join('、')}
                                  </div>
                                  {item.operator && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-warm-100">
                                      <User size={12} className="text-success-500" />
                                      <span className="text-xs text-warm-500">处理人：</span>
                                      <span className="text-xs font-medium text-success-600 bg-success-50 px-2 py-0.5 rounded-full">
                                        {item.operator}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8">
                                <div className="text-4xl mb-3">📦</div>
                                <p className="text-warm-500">该楼栋暂无已取订单</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* 志愿者分工子Tab */}
                {handoverSubTab === 'volunteer' && (
                  <div className="space-y-6">
                    {/* 分配模式切换 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAssignMode('building')}
                        className={`flex-1 h-10 rounded-lg font-medium text-sm transition-colors ${
                          assignMode === 'building'
                            ? 'bg-warm-700 text-white'
                            : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                        }`}
                      >
                        按楼栋分配
                      </button>
                      <button
                        onClick={() => setAssignMode('pickupPoint')}
                        className={`flex-1 h-10 rounded-lg font-medium text-sm transition-colors ${
                          assignMode === 'pickupPoint'
                            ? 'bg-warm-700 text-white'
                            : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                        }`}
                      >
                        按取货点分配
                      </button>
                    </div>

                    {/* 选择楼栋 */}
                    {assignMode === 'building' && (
                      <div>
                        <label className="block text-sm font-medium text-warm-700 mb-2">选择楼栋</label>
                        <div className="relative">
                          <select
                            value={assignBuilding}
                            onChange={(e) => setAssignBuilding(e.target.value)}
                            className="w-full h-12 px-4 pr-10 border border-warm-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 appearance-none cursor-pointer"
                          >
                            {buildings.map((building) => (
                              <option key={building} value={building}>
                                {building}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {/* 选择取货点 */}
                    {assignMode === 'pickupPoint' && (
                      <div>
                        <label className="block text-sm font-medium text-warm-700 mb-2">选择取货点</label>
                        <div className="relative">
                          <select
                            value={assignPickupPoint}
                            onChange={(e) => setAssignPickupPoint(e.target.value)}
                            className="w-full h-12 px-4 pr-10 border border-warm-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 appearance-none cursor-pointer"
                          >
                            {pickupPoints.length > 0 ? (
                              pickupPoints.map((point) => (
                                <option key={point} value={point}>
                                  {point}
                                </option>
                              ))
                            ) : (
                              <option value="">暂无取货点</option>
                            )}
                          </select>
                          <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {/* 志愿者姓名 */}
                    <div>
                      <label className="block text-sm font-medium text-warm-700 mb-2">志愿者姓名</label>
                      <input
                        type="text"
                        value={volunteerName}
                        onChange={(e) => setVolunteerName(e.target.value)}
                        placeholder="请输入志愿者姓名"
                        className="w-full h-12 px-4 border border-warm-200 rounded-xl bg-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
                      />
                    </div>

                    {/* 批量分配按钮 */}
                    <div>
                      {assignMode === 'building' ? (
                        <button
                          onClick={handleBatchAssignByBuilding}
                          className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium flex items-center justify-center gap-2 hover:from-primary-600 hover:to-primary-700 transition-all btn-press"
                        >
                          <Sparkles size={18} />
                          按楼栋批量分配
                        </button>
                      ) : (
                        <button
                          onClick={handleBatchAssignByPickupPoint}
                          className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium flex items-center justify-center gap-2 hover:from-primary-600 hover:to-primary-700 transition-all btn-press"
                        >
                          <Sparkles size={18} />
                          按取货点分配
                        </button>
                      )}
                    </div>

                    {/* 分配清单 */}
                    <div className="pt-4 border-t border-warm-100">
                      <h4 className="font-bold text-warm-800 mb-4 flex items-center gap-2">
                        <Clipboard size={16} className="text-primary-500" />
                        分配清单（今日待取订单）
                      </h4>

                      {pendingOrders.length > 0 ? (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {pendingOrders.map((order) => {
                            const info = getNeighborDisplayInfo(order.neighborId);
                            const assignedOp = getAssignedOperator(order.id);
                            const orderPickupPoints = Array.from(new Set(
                              order.items
                                .map((i) => products.find((p) => p.id === i.productId)?.pickupPoint)
                                .filter(Boolean) as string[]
                            ));
                            return (
                              <div
                                key={order.id}
                                className="bg-white border border-warm-100 rounded-xl p-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-mono text-warm-400">{order.orderNo}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-warm-800">{info.name || '邻居'}</span>
                                      <span className="text-sm text-warm-500">{info.room}室</span>
                                      <span className="text-xs text-warm-400">· {info.building}</span>
                                    </div>
                                    <div className="text-xs text-warm-500 truncate">
                                      {order.items.map((i) => `${i.productName}×${i.quantity}`).join('、')}
                                    </div>
                                    {orderPickupPoints.length > 0 && (
                                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <Package size={11} className="text-primary-400 flex-shrink-0" />
                                        {orderPickupPoints.map((pp) => (
                                          <span key={pp} className="text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                                            {pp}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0 w-32">
                                    <label className="block text-xs text-warm-400 mb-1">分配志愿者</label>
                                    <div className="relative">
                                      <select
                                        value={assignedOp || ''}
                                        onChange={(e) => handleAssignOperator(order.id, e.target.value)}
                                        className="w-full h-9 px-2 pr-8 text-xs border border-warm-200 rounded-lg bg-white focus:outline-none focus:border-primary-400 appearance-none cursor-pointer"
                                      >
                                        <option value="">未分配</option>
                                        {allOperators.map((op) => (
                                          <option key={op} value={op}>{op}</option>
                                        ))}
                                        {volunteerName.trim() && !allOperators.includes(volunteerName.trim()) && (
                                          <option value={volunteerName.trim()}>{volunteerName.trim()}</option>
                                        )}
                                      </select>
                                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-3">🎉</div>
                          <p className="text-warm-500">暂无待取订单需要分配</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
            {pickedOrders.slice(0, 5).map((order) => {
              const info = getNeighborDisplayInfo(order.neighborId);
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-warm-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center overflow-hidden flex-shrink-0 text-lg">
                      {info.avatar || <Check size={14} className="text-success-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-warm-800">
                        {info.name || order.orderNo}
                      </p>
                      <p className="text-xs text-warm-500">
                        {info.building} {info.room}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-warm-700">¥{order.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-warm-400">{order.pickupTime}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 核销操作记录 */}
      {pickupHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-warm-800 flex items-center gap-2">
              <History size={18} className="text-primary-500" />
              核销操作记录
            </h3>
            {historyOperators.length > 1 && (
              <div className="relative">
                <select
                  value={historyOperatorFilter}
                  onChange={(e) => setHistoryOperatorFilter(e.target.value)}
                  className="h-9 pl-3 pr-8 text-sm border border-warm-200 rounded-lg bg-white focus:outline-none focus:border-primary-400 appearance-none cursor-pointer"
                >
                  <option value="">全部处理人</option>
                  {historyOperators.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            {filteredPickupHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 border-b border-warm-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.action === 'pickup' ? 'bg-primary-50' :
                    entry.action === 'batch_pickup' ? 'bg-success-50' : 'bg-danger-50'
                  }`}>
                    <History size={14} className={`${
                      entry.action === 'pickup' ? 'text-primary-500' :
                      entry.action === 'batch_pickup' ? 'text-success-500' : 'text-danger-500'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warm-800">
                      {entry.operator}
                      <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                        entry.action === 'pickup' ? 'bg-primary-100 text-primary-600' :
                        entry.action === 'batch_pickup' ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600'
                      }`}>
                        {getActionTypeLabel(entry.action)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-warm-700">
                    {entry.orderIds?.length || 1} 单
                  </p>
                  <p className="text-xs text-warm-400">{entry.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
