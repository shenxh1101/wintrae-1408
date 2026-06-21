import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAppStore } from '../../store/useAppStore';

const pageTitles: Record<string, string> = {
  '/products': '商品看板',
  '/orders': '订单管理',
  '/pickup': '取货核销',
  '/neighbors': '邻居名单',
  '/aftersale': '售后管理',
};

export default function Layout() {
  const location = useLocation();
  const { sidebarCollapsed } = useAppStore();
  
  const title = pageTitles[location.pathname] || '团长助手';

  return (
    <div className="min-h-screen bg-warm-50">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-56'
        }`}
      >
        <Topbar title={title} />
        <main className="p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
