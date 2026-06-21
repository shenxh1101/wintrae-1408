import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProductsPage from './pages/Products';
import OrdersPage from './pages/Orders';
import PickupPage from './pages/Pickup';
import NeighborsPage from './pages/Neighbors';
import AfterSalePage from './pages/AfterSale';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="pickup" element={<PickupPage />} />
          <Route path="neighbors" element={<NeighborsPage />} />
          <Route path="aftersale" element={<AfterSalePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
