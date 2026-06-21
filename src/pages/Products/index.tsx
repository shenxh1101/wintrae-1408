import { useState, useMemo } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  Package,
  ShoppingCart,
  DollarSign,
  X,
  Check,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Users,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Product } from '../../types';

export default function ProductsPage() {
  const {
    currentDate,
    setCurrentDate,
    getProductsByDate,
    getDailySummary,
    getActiveProductsByDate,
    getOrdersByDate,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    restockProduct,
    suppliers,
  } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    image: '🍎',
    price: 0,
    cost: 0,
    limitPerPerson: 1,
    stock: 0,
    category: '水果',
    cutoffTime: '18:00',
    pickupPoint: '小区东门自提点',
    supplierId: 'sup-001',
    isActive: true,
  });

  const allProducts = getProductsByDate(currentDate);
  const activeProducts = getActiveProductsByDate(currentDate);
  const summary = getDailySummary(currentDate);
  const dayOrders = getOrdersByDate(currentDate);

  const pickupPoints = useMemo(() => {
    const points = new Set(allProducts.map((p) => p.pickupPoint));
    return Array.from(points);
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchPickup = selectedPickupPoint === 'all' || product.pickupPoint === selectedPickupPoint;
      const matchSupplier = selectedSupplier === 'all' || product.supplierId === selectedSupplier;
      return matchPickup && matchSupplier;
    });
  }, [allProducts, selectedPickupPoint, selectedSupplier]);

  const totalSoldPieces = useMemo(() => {
    return activeProducts.reduce((sum, p) => sum + (p.stock - p.stockAvailable), 0);
  }, [activeProducts]);

  const activeReceivable = useMemo(() => {
    const activeProductIds = new Set(activeProducts.map((p) => p.id));
    return dayOrders.reduce((sum, order) => {
      const orderActiveAmount = order.items.reduce((orderSum, item) => {
        if (activeProductIds.has(item.productId)) {
          return orderSum + item.price * item.quantity;
        }
        return orderSum;
      }, 0);
      return sum + orderActiveAmount;
    }, 0);
  }, [dayOrders, activeProducts]);

  const goPrevDay = () => setCurrentDate(format(subDays(new Date(currentDate), 1), 'yyyy-MM-dd'));
  const goNextDay = () => setCurrentDate(format(addDays(new Date(currentDate), 1), 'yyyy-MM-dd'));
  const goToday = () => setCurrentDate(format(new Date(), 'yyyy-MM-dd'));

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      image: '🍎',
      price: 0,
      cost: 0,
      limitPerPerson: 1,
      stock: 0,
      category: '水果',
      cutoffTime: '18:00',
      pickupPoint: '小区东门自提点',
      supplierId: 'sup-001',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      image: product.image,
      price: product.price,
      cost: product.cost,
      limitPerPerson: product.limitPerPerson,
      stock: product.stock,
      category: product.category,
      cutoffTime: product.cutoffTime,
      pickupPoint: product.pickupPoint,
      supplierId: product.supplierId,
      isActive: product.isActive,
    });
    setShowModal(true);
  };

  const openRestockModal = (product: Product) => {
    setRestockingProduct(product);
    setRestockQuantity(1);
    setShowRestockModal(true);
  };

  const handleRestock = () => {
    if (!restockingProduct || restockQuantity <= 0) return;
    const result = restockProduct(restockingProduct.id, restockQuantity);
    if (result.success) {
      setShowRestockModal(false);
      setRestockingProduct(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, { ...formData, date: currentDate });
    } else {
      addProduct({ ...formData, date: currentDate });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个商品吗？')) {
      deleteProduct(id);
    }
  };

  const dateDisplay = format(new Date(currentDate), 'M月d日 EEEE', { locale: zhCN });
  const isTodayDate = isToday(new Date(currentDate));

  const getSupplierName = (id: string) => {
    return suppliers.find((s) => s.id === id)?.name || id;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-card p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={goPrevDay}
            className="w-9 h-9 rounded-full bg-warm-50 hover:bg-warm-100 flex items-center justify-center text-warm-600 transition-colors btn-press"
          >
            <ChevronLeft size={18} />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-warm-800">{dateDisplay}</span>
            {isTodayDate && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-medium rounded-full">
                今天
              </span>
            )}
          </div>
          
          <button
            onClick={goNextDay}
            className="w-9 h-9 rounded-full bg-warm-50 hover:bg-warm-100 flex items-center justify-center text-warm-600 transition-colors btn-press"
          >
            <ChevronRight size={18} />
          </button>
          
          {!isTodayDate && (
            <button
              onClick={goToday}
              className="ml-2 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors btn-press"
            >
              回到今天
            </button>
          )}
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:from-primary-600 hover:to-primary-700 transition-all btn-press"
        >
          <Plus size={18} />
          <span>新增商品</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-warm-500" />
          <span className="text-sm font-medium text-warm-700">筛选条件</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-warm-400" />
            <select
              value={selectedPickupPoint}
              onChange={(e) => setSelectedPickupPoint(e.target.value)}
              className="h-9 px-3 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
            >
              <option value="all">全部取货点</option>
              {pickupPoints.map((point) => (
                <option key={point} value={point}>
                  {point}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-warm-400" />
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="h-9 px-3 border border-warm-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
            >
              <option value="all">全部供应商</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Package className="text-primary-500" />}
          label="总商品数"
          value={summary.totalProducts}
          unit="件"
          bgColor="bg-primary-50"
        />
        <StatCard
          icon={<Check className="text-success-500" />}
          label="在售中"
          value={summary.activeProducts}
          unit="件"
          bgColor="bg-success-50"
        />
        <StatCard
          icon={<XCircle className="text-danger-500" />}
          label="售罄商品"
          value={summary.soldOutProducts}
          unit="件"
          bgColor="bg-danger-50"
        />
        <StatCard
          icon={<BarChart3 className="text-secondary-500" />}
          label="已售总件数"
          value={totalSoldPieces}
          unit="件"
          bgColor="bg-secondary-50"
        />
        <StatCard
          icon={<ShoppingCart className="text-warning-500" />}
          label="今日订单"
          value={summary.totalOrders}
          unit="单"
          bgColor="bg-warning-50"
        />
        <StatCard
          icon={<DollarSign className="text-success-600" />}
          label="销售金额"
          value={activeReceivable.toFixed(2)}
          unit="元"
          bgColor="bg-success-50"
        />
      </div>

      {filteredProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3 flex-wrap">
          <MapPin size={20} className="text-primary-500" />
          <span className="text-sm text-warm-600">取货点：</span>
          <span className="text-sm font-medium text-warm-800">{filteredProducts[0]?.pickupPoint}</span>
          <span className="text-sm text-warm-600 ml-4">截单时间：</span>
          <span className="text-sm font-medium text-warm-800">{filteredProducts[0]?.cutoffTime}</span>
          {selectedSupplier !== 'all' && (
            <>
              <span className="text-sm text-warm-600 ml-4">供应商：</span>
              <span className="text-sm font-medium text-warm-800">{getSupplierName(selectedSupplier)}</span>
            </>
          )}
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onEdit={() => openEditModal(product)}
              onDelete={() => handleDelete(product.id)}
              onToggleActive={() => toggleProductActive(product.id)}
              onRestock={() => openRestockModal(product)}
              supplierName={getSupplierName(product.supplierId)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-warm-500 mb-4">
            {allProducts.length === 0 ? '当天还没有上架商品' : '没有符合筛选条件的商品'}
          </p>
          {allProducts.length === 0 && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors btn-press"
            >
              立即上架
            </button>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-md animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-warm-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-warm-800">
                {editingProduct ? '编辑商品' : '新增商品'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full hover:bg-warm-50 flex items-center justify-center text-warm-400 hover:text-warm-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    商品图标
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-center text-2xl"
                    placeholder="🍎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    商品分类
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
                  >
                    <option value="水果">水果</option>
                    <option value="蔬菜">蔬菜</option>
                    <option value="海鲜">海鲜</option>
                    <option value="烘焙">烘焙</option>
                    <option value="蛋类">蛋类</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  商品名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  placeholder="请输入商品名称"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    售价 (元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    成本 (元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    库存数量
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    每人限购
                  </label>
                  <input
                    type="number"
                    value={formData.limitPerPerson}
                    onChange={(e) => setFormData({ ...formData, limitPerPerson: Number(e.target.value) })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    截单时间
                  </label>
                  <input
                    type="time"
                    value={formData.cutoffTime}
                    onChange={(e) => setFormData({ ...formData, cutoffTime: e.target.value })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    取货点
                  </label>
                  <input
                    type="text"
                    value={formData.pickupPoint}
                    onChange={(e) => setFormData({ ...formData, pickupPoint: e.target.value })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  供应商
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 bg-white"
                >
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-300"
                  />
                  <span className="text-sm text-warm-700">立即上架</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-11 rounded-xl border border-warm-200 text-warm-600 font-medium hover:bg-warm-50 transition-colors btn-press"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 transition-all btn-press"
                >
                  {editingProduct ? '保存修改' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRestockModal && restockingProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-warm-100">
              <h2 className="text-lg font-bold text-warm-800">补货</h2>
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockingProduct(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-warm-50 flex items-center justify-center text-warm-400 hover:text-warm-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                <span className="text-3xl">{restockingProduct.image}</span>
                <div>
                  <p className="font-medium text-warm-800">{restockingProduct.name}</p>
                  <p className="text-sm text-warm-500">当前库存：{restockingProduct.stock} 件</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  补货数量
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  placeholder="请输入补货数量"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRestockModal(false);
                    setRestockingProduct(null);
                  }}
                  className="flex-1 h-11 rounded-xl border border-warm-200 text-warm-600 font-medium hover:bg-warm-50 transition-colors btn-press"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleRestock}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium hover:from-primary-600 hover:to-primary-700 transition-all btn-press flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  确认补货
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 card-transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-warm-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-warm-800 tabular-nums">{value}</span>
            <span className="text-sm text-warm-500">{unit}</span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  index,
  onEdit,
  onDelete,
  onToggleActive,
  onRestock,
  supplierName,
}: {
  product: Product;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onRestock: () => void;
  supplierName: string;
}) {
  const isSoldOut = product.isActive && product.stockAvailable <= 0;
  const progress = product.isActive && product.stock > 0 
    ? isSoldOut 
      ? 100 
      : (product.sold / product.stock) * 100 
    : 0;

  return (
    <div
      className={`bg-white rounded-2xl shadow-card overflow-hidden card-transition animate-slide-up relative ${
        !product.isActive ? 'opacity-70' : ''
      } ${isSoldOut ? 'ring-2 ring-danger-400' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {!product.isActive && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute inset-0 bg-warm-900/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-20deg]">
            <span className="px-6 py-2 bg-danger-500/90 text-white text-lg font-bold rounded-xl shadow-lg border-2 border-danger-400">
              已下架
            </span>
          </div>
        </div>
      )}

      {isSoldOut && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
            <div className="absolute top-6 right-[-28px] rotate-[45deg] bg-danger-500 text-white text-xs font-bold px-8 py-1 shadow-lg">
              已售罄
            </div>
          </div>
        </div>
      )}

      <div className={`relative h-32 flex items-center justify-center ${
        isSoldOut 
          ? 'bg-gradient-to-br from-danger-50 to-danger-100' 
          : 'bg-gradient-to-br from-warm-50 to-warm-100'
      }`}>
        <span className="text-6xl">{product.image}</span>
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-white/80 backdrop-blur-sm text-xs font-medium text-warm-600 rounded-lg">
            {product.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          {isSoldOut ? (
            <button
              onClick={onRestock}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md bg-primary-500 text-white hover:bg-primary-600 hover:scale-105"
              title="点击补货"
            >
              <RefreshCw size={20} />
            </button>
          ) : (
            <button
              onClick={onToggleActive}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
                product.isActive
                  ? 'bg-danger-500 text-white hover:bg-danger-600 hover:scale-105'
                  : 'bg-success-500 text-white hover:bg-success-600 hover:scale-105'
              }`}
              title={product.isActive ? '点击下架' : '点击上架'}
            >
              {product.isActive ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
            </button>
          )}
        </div>
        <div className="absolute bottom-3 right-3">
          <span className={`px-2 py-1 text-white text-xs font-bold rounded-lg ${
            isSoldOut ? 'bg-danger-500' : 'bg-primary-500'
          }`}>
            限购{product.limitPerPerson}份
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-warm-800 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-warm-400 mb-2 flex items-center gap-1">
          <Users size={12} />
          {supplierName}
        </p>
        
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-xs text-warm-400">¥</span>
          <span className="text-xl font-bold text-primary-500 tabular-nums">{product.price}</span>
          <span className="text-xs text-warm-400 ml-2">成本¥{product.cost}</span>
        </div>

        {product.isActive && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-warm-500 mb-1">
              <span>
                {isSoldOut ? '已售罄' : `已售 ${product.sold} / 库存 ${product.stock}`}
              </span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${
              isSoldOut ? 'bg-danger-100' : 'bg-warm-100'
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isSoldOut 
                    ? 'bg-gradient-to-r from-danger-400 to-danger-500' 
                    : 'bg-gradient-to-r from-primary-400 to-primary-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {!product.isActive && (
          <div className="mb-3 py-2 px-3 bg-danger-50 rounded-lg flex items-center gap-2">
            <XCircle size={14} className="text-danger-500" />
            <span className="text-xs text-danger-600 font-medium">商品已下架，点击右上角按钮重新上架</span>
          </div>
        )}

        {isSoldOut && (
          <div className="mb-3 py-2 px-3 bg-danger-50 rounded-lg flex items-center gap-2">
            <RefreshCw size={14} className="text-danger-500" />
            <span className="text-xs text-danger-600 font-medium">商品已售罄，点击右上角按钮补货</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 h-9 rounded-lg bg-warm-50 text-warm-600 text-sm font-medium hover:bg-warm-100 flex items-center justify-center gap-1 transition-colors btn-press"
          >
            <Edit2 size={14} />
            编辑
          </button>
          <button
            onClick={onDelete}
            className="w-9 h-9 rounded-lg bg-danger-50 text-danger-500 hover:bg-danger-100 flex items-center justify-center transition-colors btn-press"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
