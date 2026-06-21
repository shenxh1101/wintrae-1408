import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const menuItems = [
  { path: '/products', label: '商品看板', icon: LayoutDashboard },
  { path: '/orders', label: '订单管理', icon: ShoppingCart },
  { path: '/pickup', label: '取货核销', icon: Package },
  { path: '/neighbors', label: '邻居名单', icon: Users },
  { path: '/aftersale', label: '售后管理', icon: Headphones },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white shadow-card-lg z-40 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="h-16 flex items-center justify-center border-b border-warm-100">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥬</span>
            <span className="font-bold text-lg text-primary-600">团长助手</span>
          </div>
        ) : (
          <span className="text-2xl">🥬</span>
        )}
      </div>

      <nav className="py-4 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200 btn-press ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-warm-600 hover:bg-warm-50 hover:text-primary-600'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
            >
              <Icon size={20} strokeWidth={2} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-warm-400 hover:text-primary-500 transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
