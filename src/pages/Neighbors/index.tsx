import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Building2,
  Phone,
  Tag,
  Edit2,
  Ban,
  CheckCircle,
  X,
  User,
  FileText,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Neighbor } from '../../types';

export default function NeighborsPage() {
  const { neighbors, addNeighbor, updateNeighbor, toggleBlacklist } = useAppStore();
  
  const [searchValue, setSearchValue] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'normal' | 'blacklist'>('all');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedNeighbor, setSelectedNeighbor] = useState<Neighbor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    building: '1号楼',
    room: '',
    avatar: '👤',
    frequentCategories: [] as string[],
    remark: '',
  });

  const allCategories = ['水果', '蔬菜', '海鲜', '烘焙', '蛋类', '其他'];

  const filteredNeighbors = useMemo(() => {
    let result = neighbors;

    if (searchValue) {
      const lower = searchValue.toLowerCase();
      result = result.filter(
        (n) =>
          n.name.toLowerCase().includes(lower) ||
          n.phone.includes(searchValue)
      );
    }

    if (filterType === 'normal') {
      result = result.filter((n) => !n.isBlacklisted);
    } else if (filterType === 'blacklist') {
      result = result.filter((n) => n.isBlacklisted);
    }

    return result;
  }, [neighbors, searchValue, filterType]);

  const openDrawer = (neighbor: Neighbor) => {
    setSelectedNeighbor(neighbor);
    setShowDrawer(true);
  };

  const handleToggleBlacklist = (id: string) => {
    toggleBlacklist(id);
    if (selectedNeighbor?.id === id) {
      setSelectedNeighbor({ ...selectedNeighbor, isBlacklisted: !selectedNeighbor.isBlacklisted });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addNeighbor({
      ...formData,
      isBlacklisted: false,
    });
    setShowAddModal(false);
    setFormData({
      name: '',
      phone: '',
      building: '1号楼',
      room: '',
      avatar: '👤',
      frequentCategories: [],
      remark: '',
    });
  };

  const toggleCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      frequentCategories: prev.frequentCategories.includes(cat)
        ? prev.frequentCategories.filter((c) => c !== cat)
        : [...prev.frequentCategories, cat],
    }));
  };

  const stats = useMemo(() => ({
    total: neighbors.length,
    normal: neighbors.filter((n) => !n.isBlacklisted).length,
    blacklisted: neighbors.filter((n) => n.isBlacklisted).length,
  }), [neighbors]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-sm text-warm-500 mb-1">总邻居数</p>
          <p className="text-2xl font-bold text-warm-800 tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-sm text-warm-500 mb-1">正常客户</p>
          <p className="text-2xl font-bold text-success-600 tabular-nums">{stats.normal}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-sm text-warm-500 mb-1">黑名单</p>
          <p className="text-2xl font-bold text-danger-600 tabular-nums">{stats.blacklisted}</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索姓名或手机号..."
              className="w-full h-10 pl-10 pr-4 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
            />
          </div>

          <div className="flex rounded-xl overflow-hidden border border-warm-200">
            {[
              { value: 'all', label: '全部' },
              { value: 'normal', label: '正常' },
              { value: 'blacklist', label: '黑名单' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilterType(item.value as typeof filterType)}
                className={`px-4 h-10 text-sm font-medium transition-colors ${
                  filterType === item.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-warm-600 hover:bg-warm-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 h-10 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all btn-press"
          >
            <Plus size={18} />
            <span>添加邻居</span>
          </button>
        </div>
      </div>

      {/* 邻居列表 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredNeighbors.map((neighbor, index) => (
          <NeighborCard
            key={neighbor.id}
            neighbor={neighbor}
            index={index}
            onClick={() => openDrawer(neighbor)}
            onToggleBlacklist={() => handleToggleBlacklist(neighbor.id)}
          />
        ))}
      </div>

      {filteredNeighbors.length === 0 && (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-warm-500">没有找到符合条件的邻居</p>
        </div>
      )}

      {/* 详情抽屉 */}
      {showDrawer && selectedNeighbor && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
            onClick={() => setShowDrawer(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-card-lg z-50 animate-slide-right overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-warm-100 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-warm-800">邻居详情</h2>
              <button
                onClick={() => setShowDrawer(false)}
                className="w-8 h-8 rounded-full hover:bg-warm-50 flex items-center justify-center text-warm-400 hover:text-warm-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* 头像和基本信息 */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-3xl">
                  {selectedNeighbor.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-warm-800">{selectedNeighbor.name}</h3>
                    {selectedNeighbor.isBlacklisted && (
                      <span className="px-2 py-0.5 bg-danger-100 text-danger-600 text-xs font-medium rounded-full">
                        黑名单
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-warm-500 mt-1">
                    {selectedNeighbor.building} {selectedNeighbor.room}
                  </p>
                </div>
              </div>

              {/* 联系信息 */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                  <Phone size={18} className="text-primary-500" />
                  <div>
                    <p className="text-xs text-warm-500">手机号</p>
                    <p className="text-sm font-medium text-warm-800">{selectedNeighbor.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                  <Building2 size={18} className="text-secondary-500" />
                  <div>
                    <p className="text-xs text-warm-500">住址</p>
                    <p className="text-sm font-medium text-warm-800">
                      {selectedNeighbor.building} {selectedNeighbor.room}
                    </p>
                  </div>
                </div>
              </div>

              {/* 常购品类 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-warm-700 mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-primary-500" />
                  常购品类
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedNeighbor.frequentCategories.length > 0 ? (
                    selectedNeighbor.frequentCategories.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1.5 bg-primary-50 text-primary-600 text-sm rounded-full"
                      >
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-warm-400">暂无记录</span>
                  )}
                </div>
              </div>

              {/* 备注 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-warm-700 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-primary-500" />
                  备注
                </h4>
                <div className="p-3 bg-warm-50 rounded-xl min-h-[60px]">
                  <p className="text-sm text-warm-600">
                    {selectedNeighbor.remark || '暂无备注'}
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={() => handleToggleBlacklist(selectedNeighbor.id)}
                  className={`w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 transition-all btn-press ${
                    selectedNeighbor.isBlacklisted
                      ? 'bg-success-50 text-success-600 hover:bg-success-100'
                      : 'bg-danger-50 text-danger-600 hover:bg-danger-100'
                  }`}
                >
                  {selectedNeighbor.isBlacklisted ? (
                    <>
                      <CheckCircle size={18} />
                      移出黑名单
                    </>
                  ) : (
                    <>
                      <Ban size={18} />
                      加入黑名单
                    </>
                  )}
                </button>
                <button className="w-full h-12 rounded-xl border border-warm-200 text-warm-600 font-medium flex items-center justify-center gap-2 hover:bg-warm-50 transition-colors btn-press">
                  <Edit2 size={18} />
                  编辑信息
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 添加邻居模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-warm-100">
              <h2 className="text-lg font-bold text-warm-800">添加邻居</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-warm-50 flex items-center justify-center text-warm-400 hover:text-warm-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    头像
                  </label>
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 text-center text-xl"
                    placeholder="👤"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
                    placeholder="请输入姓名"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  手机号
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
                  placeholder="请输入手机号"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    楼栋
                  </label>
                  <select
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 bg-white"
                  >
                    {['1号楼', '2号楼', '3号楼', '4号楼', '5号楼'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    房号
                  </label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full h-10 px-3 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50"
                    placeholder="如: 1502"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  常购品类
                </label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        formData.frequentCategories.includes(cat)
                          ? 'bg-primary-500 text-white'
                          : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  备注
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="w-full h-20 px-3 py-2 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 resize-none"
                  placeholder="添加备注..."
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
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NeighborCard({
  neighbor,
  index,
  onClick,
  onToggleBlacklist,
}: {
  neighbor: Neighbor;
  index: number;
  onClick: () => void;
  onToggleBlacklist: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card overflow-hidden card-transition cursor-pointer animate-slide-up ${
        neighbor.isBlacklisted ? 'opacity-70' : ''
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-2xl">
            {neighbor.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-warm-800 truncate">{neighbor.name}</h3>
              {neighbor.isBlacklisted && (
                <span className="w-2 h-2 bg-danger-500 rounded-full flex-shrink-0" title="黑名单" />
              )}
            </div>
            <p className="text-xs text-warm-500 truncate">
              {neighbor.building} {neighbor.room}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-warm-500 mb-3">
          <Phone size={12} />
          <span>{neighbor.phone.slice(0, 3)}****{neighbor.phone.slice(-4)}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {neighbor.frequentCategories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 bg-warm-100 text-warm-600 text-xs rounded-full"
            >
              {cat}
            </span>
          ))}
          {neighbor.frequentCategories.length > 3 && (
            <span className="px-2 py-0.5 bg-warm-100 text-warm-400 text-xs rounded-full">
              +{neighbor.frequentCategories.length - 3}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBlacklist();
            }}
            className={`flex-1 h-8 rounded-lg text-xs font-medium transition-colors ${
              neighbor.isBlacklisted
                ? 'bg-success-50 text-success-600 hover:bg-success-100'
                : 'bg-warm-50 text-warm-500 hover:bg-warning-50 hover:text-warning-600'
            }`}
          >
            {neighbor.isBlacklisted ? '移出黑名' : '加入黑名'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-8 h-8 rounded-lg bg-warm-50 text-warm-500 hover:bg-primary-50 hover:text-primary-500 flex items-center justify-center transition-colors"
          >
            <Edit2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
