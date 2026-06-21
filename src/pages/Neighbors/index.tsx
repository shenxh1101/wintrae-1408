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
  Save,
  FileText,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Neighbor } from '../../types';

const AVATAR_OPTIONS = [
  '👤', '👩', '👨', '👵', '👴', '👧', '👦',
  '👩‍🦰', '👨‍🦰', '👩‍🦱', '👨‍🦱', '👩‍💼', '👨‍💼',
  '🧑', '👱', '👸', '🤴', '🧓', '👪',
];

const ALL_CATEGORIES = ['水果', '蔬菜', '海鲜', '烘焙', '蛋类', '其他'];

const BUILDINGS = ['1号楼', '2号楼', '3号楼', '4号楼', '5号楼'];

type EditState = Omit<Neighbor, 'id' | 'createdAt' | 'isBlacklisted' | 'blacklistReason'>;

function initEditState(neighbor: Neighbor): EditState {
  return {
    name: neighbor.name,
    phone: neighbor.phone,
    building: neighbor.building,
    room: neighbor.room,
    avatar: neighbor.avatar,
    frequentCategories: [...neighbor.frequentCategories],
    remark: neighbor.remark,
  };
}

export default function NeighborsPage() {
  const { neighbors, addNeighbor, updateNeighbor, toggleBlacklist } = useAppStore();

  const [searchValue, setSearchValue] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'normal' | 'blacklist'>('all');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedNeighbor, setSelectedNeighbor] = useState<Neighbor | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<'add' | 'drawer' | null>(null);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [blacklistError, setBlacklistError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    building: '1号楼',
    room: '',
    avatar: '👤',
    frequentCategories: [] as string[],
    remark: '',
  });

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

  const stats = useMemo(() => ({
    total: neighbors.length,
    normal: neighbors.filter((n) => !n.isBlacklisted).length,
    blacklisted: neighbors.filter((n) => n.isBlacklisted).length,
  }), [neighbors]);

  const openDrawer = (neighbor: Neighbor) => {
    setSelectedNeighbor(neighbor);
    setEditState(initEditState(neighbor));
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setSelectedNeighbor(null);
    setEditState(null);
  };

  const hasChanges = useMemo(() => {
    if (!selectedNeighbor || !editState) return false;
    return (
      editState.name !== selectedNeighbor.name ||
      editState.phone !== selectedNeighbor.phone ||
      editState.building !== selectedNeighbor.building ||
      editState.room !== selectedNeighbor.room ||
      editState.avatar !== selectedNeighbor.avatar ||
      JSON.stringify(editState.frequentCategories) !== JSON.stringify(selectedNeighbor.frequentCategories) ||
      editState.remark !== selectedNeighbor.remark
    );
  }, [selectedNeighbor, editState]);

  const handleSaveChanges = () => {
    if (!selectedNeighbor || !editState) return;
    updateNeighbor(selectedNeighbor.id, editState);
    setSelectedNeighbor({ ...selectedNeighbor, ...editState });
  };

  const openBlacklistModal = () => {
    if (!selectedNeighbor) return;
    setBlacklistReason(selectedNeighbor.isBlacklisted ? '' : '');
    setBlacklistError('');
    setShowBlacklistModal(true);
  };

  const handleToggleBlacklist = () => {
    if (!selectedNeighbor) return;

    if (!selectedNeighbor.isBlacklisted && !blacklistReason.trim()) {
      setBlacklistError('请填写黑名单原因');
      return;
    }

    toggleBlacklist(selectedNeighbor.id, blacklistReason.trim() || undefined);
    setShowBlacklistModal(false);
    setBlacklistReason('');
    setBlacklistError('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addNeighbor({
      ...formData,
      isBlacklisted: false,
      blacklistReason: '',
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

  const toggleCategoryInDrawer = (cat: string) => {
    if (!editState) return;
    setEditState({
      ...editState,
      frequentCategories: editState.frequentCategories.includes(cat)
        ? editState.frequentCategories.filter((c) => c !== cat)
        : [...editState.frequentCategories, cat],
    });
  };

  const toggleCategoryInAdd = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      frequentCategories: prev.frequentCategories.includes(cat)
        ? prev.frequentCategories.filter((c) => c !== cat)
        : [...prev.frequentCategories, cat],
    }));
  };

  const selectAvatar = (avatar: string) => {
    if (showAvatarPicker === 'add') {
      setFormData({ ...formData, avatar });
    } else if (showAvatarPicker === 'drawer' && editState) {
      setEditState({ ...editState, avatar });
    }
    setShowAvatarPicker(null);
  };

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
            onToggleBlacklist={openBlacklistModal}
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
      {showDrawer && selectedNeighbor && editState && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
            onClick={closeDrawer}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-card-lg z-50 animate-slide-right overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-warm-100 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-warm-800">邻居详情</h2>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <button
                    onClick={handleSaveChanges}
                    className="flex items-center gap-1.5 px-3 h-8 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-sm font-medium hover:from-primary-600 hover:to-primary-700 transition-all btn-press"
                  >
                    <Save size={14} />
                    保存修改
                  </button>
                )}
                <button
                  onClick={closeDrawer}
                  className="w-8 h-8 rounded-full hover:bg-warm-50 flex items-center justify-center text-warm-400 hover:text-warm-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* 头像和姓名 */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-3xl cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowAvatarPicker('drawer')}
                  >
                    {editState.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center text-warm-500">
                    <Edit2 size={12} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={editState.name}
                      onChange={(e) => setEditState({ ...editState, name: e.target.value })}
                      className="flex-1 text-lg font-bold text-warm-800 bg-warm-50 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      placeholder="姓名"
                    />
                    {selectedNeighbor.isBlacklisted && (
                      <span className="px-2 py-0.5 bg-danger-100 text-danger-600 text-xs font-medium rounded-full flex-shrink-0">
                        黑名单
                      </span>
                    )}
                  </div>
                  {selectedNeighbor.isBlacklisted && selectedNeighbor.blacklistReason && (
                    <p className="text-xs text-danger-500">原因：{selectedNeighbor.blacklistReason}</p>
                  )}
                </div>
              </div>

              {/* 头像选择器 */}
              {showAvatarPicker === 'drawer' && (
                <div className="bg-warm-50 rounded-xl p-3 animate-fade-in">
                  <p className="text-xs text-warm-500 mb-2">选择头像</p>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => selectAvatar(av)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                          editState.avatar === av
                            ? 'bg-primary-100 ring-2 ring-primary-400'
                            : 'bg-white hover:bg-primary-50'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 联系信息 - 可编辑 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                  <Phone size={18} className="text-primary-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-warm-500 mb-0.5">手机号</p>
                    <input
                      type="tel"
                      value={editState.phone}
                      onChange={(e) => setEditState({ ...editState, phone: e.target.value })}
                      className="w-full text-sm font-medium text-warm-800 bg-transparent focus:outline-none"
                      placeholder="手机号"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-warm-50 rounded-xl">
                    <Building2 size={16} className="text-secondary-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-warm-500 mb-0.5">楼栋</p>
                      <select
                        value={editState.building}
                        onChange={(e) => setEditState({ ...editState, building: e.target.value })}
                        className="w-full text-sm font-medium text-warm-800 bg-transparent focus:outline-none"
                      >
                        {BUILDINGS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-warm-50 rounded-xl">
                    <Building2 size={16} className="text-secondary-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-warm-500 mb-0.5">房号</p>
                      <input
                        type="text"
                        value={editState.room}
                        onChange={(e) => setEditState({ ...editState, room: e.target.value })}
                        className="w-full text-sm font-medium text-warm-800 bg-transparent focus:outline-none"
                        placeholder="如: 1502"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 常购品类 - 可多选编辑 */}
              <div>
                <h4 className="text-sm font-medium text-warm-700 mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-primary-500" />
                  常购品类
                  <span className="text-xs text-warm-400 font-normal">（点击选择/取消）</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const isSelected = editState.frequentCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategoryInDrawer(cat)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                          isSelected
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 备注 - 可编辑 textarea */}
              <div>
                <h4 className="text-sm font-medium text-warm-700 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-primary-500" />
                  备注
                </h4>
                <textarea
                  value={editState.remark}
                  onChange={(e) => setEditState({ ...editState, remark: e.target.value })}
                  className="w-full h-24 px-3 py-2 border border-warm-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 resize-none text-sm text-warm-700"
                  placeholder="添加备注..."
                />
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={openBlacklistModal}
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
                {hasChanges && (
                  <button
                    onClick={handleSaveChanges}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium flex items-center justify-center gap-2 hover:from-primary-600 hover:to-primary-700 transition-all btn-press"
                  >
                    <Save size={18} />
                    保存修改
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 黑名单原因弹窗 */}
      {showBlacklistModal && selectedNeighbor && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-sm animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-warm-100">
              <h2 className="text-lg font-bold text-warm-800">
                {selectedNeighbor.isBlacklisted ? '移出黑名单' : '加入黑名单'}
              </h2>
              <button
                onClick={() => {
                  setShowBlacklistModal(false);
                  setBlacklistReason('');
                  setBlacklistError('');
                }}
                className="w-8 h-8 rounded-full hover:bg-warm-50 flex items-center justify-center text-warm-400 hover:text-warm-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-warm-600 mb-4">
                {selectedNeighbor.isBlacklisted
                  ? `确定要将「${selectedNeighbor.name}」移出黑名单吗？`
                  : `请填写将「${selectedNeighbor.name}」加入黑名单的原因：`}
              </p>

              {!selectedNeighbor.isBlacklisted && (
                <>
                  <textarea
                    value={blacklistReason}
                    onChange={(e) => {
                      setBlacklistReason(e.target.value);
                      if (e.target.value.trim()) setBlacklistError('');
                    }}
                    className={`w-full h-24 px-3 py-2 border rounded-xl focus:outline-none resize-none text-sm ${
                      blacklistError
                        ? 'border-danger-400 focus:border-danger-500 focus:ring-2 focus:ring-danger-50'
                        : 'border-warm-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-50'
                    }`}
                    placeholder="请输入黑名单原因..."
                    autoFocus
                  />
                  {blacklistError && (
                    <p className="text-xs text-danger-500 mt-1.5">{blacklistError}</p>
                  )}
                </>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowBlacklistModal(false);
                    setBlacklistReason('');
                    setBlacklistError('');
                  }}
                  className="flex-1 h-11 rounded-xl border border-warm-200 text-warm-600 font-medium hover:bg-warm-50 transition-colors btn-press"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleToggleBlacklist}
                  className={`flex-1 h-11 rounded-xl font-medium transition-all btn-press ${
                    selectedNeighbor.isBlacklisted
                      ? 'bg-success-500 text-white hover:bg-success-600'
                      : 'bg-danger-500 text-white hover:bg-danger-600'
                  }`}
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加邻居模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-warm-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-warm-800">添加邻居</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-warm-50 flex items-center justify-center text-warm-400 hover:text-warm-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {/* 头像选择 */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  选择头像
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-2xl cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setShowAvatarPicker('add')}
                  >
                    {formData.avatar}
                  </div>
                  <p className="text-xs text-warm-400">点击头像可更换</p>
                </div>
                {showAvatarPicker === 'add' && (
                  <div className="mt-3 bg-warm-50 rounded-xl p-3 animate-fade-in">
                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_OPTIONS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => selectAvatar(av)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                            formData.avatar === av
                              ? 'bg-primary-100 ring-2 ring-primary-400'
                              : 'bg-white hover:bg-primary-50'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    姓名 <span className="text-danger-500">*</span>
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
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    手机号 <span className="text-danger-500">*</span>
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
                    {BUILDINGS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    房号 <span className="text-danger-500">*</span>
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

              {/* 常购品类 */}
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  常购品类
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const isSelected = formData.frequentCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategoryInAdd(cat)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                          isSelected
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 备注 */}
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
}: {
  neighbor: Neighbor;
  index: number;
  onClick: () => void;
  onToggleBlacklist: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card overflow-hidden card-transition cursor-pointer animate-slide-up relative ${
        neighbor.isBlacklisted ? 'ring-2 ring-danger-200' : ''
      }`}
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onClick}
    >
      {/* 黑名单标识 - 明显 */}
      {neighbor.isBlacklisted && (
        <div className="absolute top-0 right-0">
          <div className="bg-danger-500 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
            <Ban size={10} />
            黑名单
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            neighbor.isBlacklisted
              ? 'bg-danger-100'
              : 'bg-gradient-to-br from-primary-100 to-primary-200'
          }`}>
            {neighbor.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-warm-800 truncate">{neighbor.name}</h3>
              {neighbor.isBlacklisted && (
                <span className="w-2.5 h-2.5 bg-danger-500 rounded-full flex-shrink-0 animate-pulse" title="黑名单" />
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
              className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full font-medium"
            >
              {cat}
            </span>
          ))}
          {neighbor.frequentCategories.length > 3 && (
            <span className="px-2 py-0.5 bg-warm-100 text-warm-500 text-xs rounded-full font-medium">
              +{neighbor.frequentCategories.length - 3}
            </span>
          )}
          {neighbor.frequentCategories.length === 0 && (
            <span className="px-2 py-0.5 bg-warm-50 text-warm-300 text-xs rounded-full">
              暂无
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="flex-1 h-8 rounded-lg text-xs font-medium bg-warm-50 text-warm-500 hover:bg-primary-50 hover:text-primary-500 flex items-center justify-center gap-1 transition-colors"
          >
            <Edit2 size={12} />
            查看详情
          </button>
        </div>
      </div>
    </div>
  );
}
