import type { Product, Order, Neighbor, AfterSale, Supplier } from '../types';
import { format, addDays } from 'date-fns';

const today = format(new Date(), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');

export const mockSuppliers: Supplier[] = [
  { id: 'sup-001', name: '鲜果园', contact: '张经理', phone: '13800138001' },
  { id: 'sup-002', name: '农家蔬菜基地', contact: '李老板', phone: '13800138002' },
  { id: 'sup-003', name: '海鲜直供', contact: '王姐', phone: '13800138003' },
  { id: 'sup-004', name: '烘焙工坊', contact: '陈师傅', phone: '13800138004' },
];

export const mockProducts: Product[] = [
  {
    id: 'prod-001', name: '烟台红富士苹果', image: '🍎', price: 29.9, cost: 18,
    limitPerPerson: 5, stock: 100, sold: 68, category: '水果',
    date: today, cutoffTime: '18:00', pickupPoint: '小区东门自提点',
    supplierId: 'sup-001', isActive: true,
  },
  {
    id: 'prod-002', name: '有机蔬菜套餐', image: '🥬', price: 39.9, cost: 25,
    limitPerPerson: 2, stock: 50, sold: 42, category: '蔬菜',
    date: today, cutoffTime: '18:00', pickupPoint: '小区东门自提点',
    supplierId: 'sup-002', isActive: true,
  },
  {
    id: 'prod-003', name: '东海带鱼段', image: '🐟', price: 45, cost: 32,
    limitPerPerson: 3, stock: 30, sold: 25, category: '海鲜',
    date: today, cutoffTime: '16:00', pickupPoint: '小区东门自提点',
    supplierId: 'sup-003', isActive: true,
  },
  {
    id: 'prod-004', name: '手工吐司面包', image: '🍞', price: 18.8, cost: 10,
    limitPerPerson: 2, stock: 40, sold: 35, category: '烘焙',
    date: today, cutoffTime: '20:00', pickupPoint: '小区便利店',
    supplierId: 'sup-004', isActive: true,
  },
  {
    id: 'prod-005', name: '海南香蕉', image: '🍌', price: 15.9, cost: 8,
    limitPerPerson: 3, stock: 80, sold: 55, category: '水果',
    date: today, cutoffTime: '18:00', pickupPoint: '小区东门自提点',
    supplierId: 'sup-001', isActive: true,
  },
  {
    id: 'prod-006', name: '土鸡蛋(30枚)', image: '🥚', price: 35, cost: 22,
    limitPerPerson: 2, stock: 60, sold: 48, category: '蛋类',
    date: today, cutoffTime: '18:00', pickupPoint: '小区东门自提点',
    supplierId: 'sup-002', isActive: true,
  },
  {
    id: 'prod-007', name: '智利车厘子', image: '🍒', price: 89.9, cost: 65,
    limitPerPerson: 1, stock: 20, sold: 0, category: '水果',
    date: tomorrow, cutoffTime: '12:00', pickupPoint: '小区东门自提点',
    supplierId: 'sup-001', isActive: true,
  },
  {
    id: 'prod-008', name: '鲜虾', image: '🦐', price: 58, cost: 42,
    limitPerPerson: 2, stock: 25, sold: 0, category: '海鲜',
    date: tomorrow, cutoffTime: '16:00', pickupPoint: '小区东门自提点',
    supplierId: 'sup-003', isActive: true,
  },
];

export const mockNeighbors: Neighbor[] = [
  {
    id: 'nei-001', name: '王阿姨', phone: '13812345678', building: '1号楼', room: '1502',
    avatar: '👩', frequentCategories: ['水果', '蔬菜'],
    remark: '老顾客，每次都很准时取货', isBlacklisted: false, blacklistReason: '',
    createdAt: '2024-01-15',
  },
  {
    id: 'nei-002', name: '李大哥', phone: '13987654321', building: '2号楼', room: '803',
    avatar: '👨', frequentCategories: ['海鲜', '水果'],
    remark: '喜欢买海鲜多', isBlacklisted: false, blacklistReason: '',
    createdAt: '2024-02-20',
  },
  {
    id: 'nei-003', name: '张奶奶', phone: '13611112222', building: '1号楼', room: '501',
    avatar: '👵', frequentCategories: ['蔬菜', '蛋类'],
    remark: '腿脚不便，需送货上门', isBlacklisted: false, blacklistReason: '',
    createdAt: '2024-01-08',
  },
  {
    id: 'nei-004', name: '陈小姐', phone: '13733334444', building: '3号楼', room: '1205',
    avatar: '👩‍🦰', frequentCategories: ['烘焙', '水果'],
    remark: '甜品爱好者', isBlacklisted: false, blacklistReason: '',
    createdAt: '2024-03-01',
  },
  {
    id: 'nei-005', name: '刘先生', phone: '13855556666', building: '2号楼', room: '2201',
    avatar: '👨‍💼', frequentCategories: ['海鲜', '蔬菜'],
    remark: '经常晚取货', isBlacklisted: false, blacklistReason: '',
    createdAt: '2024-02-10',
  },
  {
    id: 'nei-006', name: '赵女士', phone: '13977778888', building: '4号楼', room: '702',
    avatar: '👩‍🦱', frequentCategories: ['水果', '烘焙'],
    remark: '', isBlacklisted: false, blacklistReason: '',
    createdAt: '2024-04-05',
  },
  {
    id: 'nei-007', name: '孙大叔', phone: '13699990000', building: '5号楼', room: '304',
    avatar: '👴', frequentCategories: ['蔬菜', '蛋类'],
    remark: '爱讲价', isBlacklisted: true, blacklistReason: '多次恶意退货，态度恶劣',
    createdAt: '2024-01-20',
  },
  {
    id: 'nei-008', name: '周小妹', phone: '13722223333', building: '3号楼', room: '1806',
    avatar: '👧', frequentCategories: ['水果', '海鲜'],
    remark: '新顾客', isBlacklisted: false, blacklistReason: '',
    createdAt: '2024-05-12',
  },
];

function calcTotal(items: { price: number; quantity: number }[]) {
  return items.reduce((sum, it) => sum + it.price * it.quantity, 0);
}

export const mockOrders: Order[] = [
  {
    id: 'ord-001', neighborId: 'nei-001', orderNo: 'TG20240622001',
    date: today, building: '1号楼', room: '1502', phone: '13812345678',
    totalAmount: calcTotal([
      { price: 29.9, quantity: 2 },
      { price: 39.9, quantity: 1 },
    ]),
    payStatus: 'paid', pickupStatus: 'picked', pickupTime: '09:30',
    items: [
      { id: 'item-001', productId: 'prod-001', productName: '烟台红富士苹果', price: 29.9, quantity: 2, subtotal: 29.9 * 2 },
      { id: 'item-002', productId: 'prod-002', productName: '有机蔬菜套餐', price: 39.9, quantity: 1, subtotal: 39.9 * 1 },
    ],
    remark: '放门口即可', createdAt: yesterday + 'T08:00:00',
  },
  {
    id: 'ord-002', neighborId: 'nei-002', orderNo: 'TG20240622002',
    date: today, building: '2号楼', room: '803', phone: '13987654321',
    totalAmount: calcTotal([
      { price: 45, quantity: 1 },
      { price: 29.9, quantity: 1 },
    ]),
    payStatus: 'paid', pickupStatus: 'pending',
    items: [
      { id: 'item-003', productId: 'prod-003', productName: '东海带鱼段', price: 45, quantity: 1, subtotal: 45 * 1 },
      { id: 'item-004', productId: 'prod-001', productName: '烟台红富士苹果', price: 29.9, quantity: 1, subtotal: 29.9 * 1 },
    ],
    createdAt: yesterday + 'T09:15:00',
  },
  {
    id: 'ord-003', neighborId: 'nei-003', orderNo: 'TG20240622003',
    date: today, building: '1号楼', room: '501', phone: '13611112222',
    totalAmount: calcTotal([
      { price: 39.9, quantity: 1 },
      { price: 35, quantity: 1 },
    ]),
    payStatus: 'paid', pickupStatus: 'pending',
    items: [
      { id: 'item-005', productId: 'prod-002', productName: '有机蔬菜套餐', price: 39.9, quantity: 1, subtotal: 39.9 * 1 },
      { id: 'item-006', productId: 'prod-006', productName: '土鸡蛋(30枚)', price: 35, quantity: 1, subtotal: 35 * 1 },
    ],
    remark: '麻烦送到501，老人在家', createdAt: yesterday + 'T10:30:00',
  },
  {
    id: 'ord-004', neighborId: 'nei-004', orderNo: 'TG20240622004',
    date: today, building: '3号楼', room: '1205', phone: '13733334444',
    totalAmount: calcTotal([{ price: 18.8, quantity: 2 }]),
    payStatus: 'paid', pickupStatus: 'picked', pickupTime: '10:00',
    items: [
      { id: 'item-007', productId: 'prod-004', productName: '手工吐司面包', price: 18.8, quantity: 2, subtotal: 18.8 * 2 },
    ],
    createdAt: yesterday + 'T11:00:00',
  },
  {
    id: 'ord-005', neighborId: 'nei-005', orderNo: 'TG20240622005',
    date: today, building: '2号楼', room: '2201', phone: '13855556666',
    totalAmount: calcTotal([
      { price: 45, quantity: 1 },
      { price: 39.9, quantity: 1 },
      { price: 15.9, quantity: 1 },
    ]),
    payStatus: 'unpaid', pickupStatus: 'pending',
    items: [
      { id: 'item-008', productId: 'prod-003', productName: '东海带鱼段', price: 45, quantity: 1, subtotal: 45 * 1 },
      { id: 'item-009', productId: 'prod-002', productName: '有机蔬菜套餐', price: 39.9, quantity: 1, subtotal: 39.9 * 1 },
      { id: 'item-010', productId: 'prod-005', productName: '海南香蕉', price: 15.9, quantity: 1, subtotal: 15.9 * 1 },
    ],
    createdAt: yesterday + 'T14:20:00',
  },
  {
    id: 'ord-006', neighborId: 'nei-006', orderNo: 'TG20240622006',
    date: today, building: '4号楼', room: '702', phone: '13977778888',
    totalAmount: calcTotal([
      { price: 15.9, quantity: 1 },
      { price: 18.8, quantity: 1 },
      { price: 29.9, quantity: 1 },
    ]),
    payStatus: 'paid', pickupStatus: 'pending',
    items: [
      { id: 'item-011', productId: 'prod-005', productName: '海南香蕉', price: 15.9, quantity: 1, subtotal: 15.9 * 1 },
      { id: 'item-012', productId: 'prod-004', productName: '手工吐司面包', price: 18.8, quantity: 1, subtotal: 18.8 * 1 },
      { id: 'item-013', productId: 'prod-001', productName: '烟台红富士苹果', price: 29.9, quantity: 1, subtotal: 29.9 * 1 },
    ],
    createdAt: yesterday + 'T16:45:00',
  },
  {
    id: 'ord-007', neighborId: 'nei-008', orderNo: 'TG20240622007',
    date: today, building: '3号楼', room: '1806', phone: '13722223333',
    totalAmount: calcTotal([
      { price: 29.9, quantity: 1 },
      { price: 45, quantity: 1 },
    ]),
    payStatus: 'paid', pickupStatus: 'pending',
    items: [
      { id: 'item-014', productId: 'prod-001', productName: '烟台红富士苹果', price: 29.9, quantity: 1, subtotal: 29.9 * 1 },
      { id: 'item-015', productId: 'prod-003', productName: '东海带鱼段', price: 45, quantity: 1, subtotal: 45 * 1 },
    ],
    remark: '下午六点左右取货', createdAt: yesterday + 'T17:30:00',
  },
];

export const mockAfterSales: AfterSale[] = [
  {
    id: 'as-001', orderId: 'ord-001', neighborId: 'nei-001', supplierId: 'sup-001',
    type: 'damaged', reason: '苹果有两个碰伤', amount: 10, affectsSupplier: true,
    status: 'processed', createdAt: today + 'T09:45:00',
  },
  {
    id: 'as-002', orderId: 'ord-002', neighborId: 'nei-002', supplierId: 'sup-003',
    type: 'out_of_stock', reason: '带鱼段缺货，下次补发', amount: 45, affectsSupplier: true,
    status: 'pending', createdAt: today + 'T10:20:00',
  },
  {
    id: 'as-003', orderId: 'ord-004', neighborId: 'nei-004', supplierId: 'sup-004',
    type: 'refund', reason: '面包口感不好，退款处理', amount: 18.8, affectsSupplier: true,
    status: 'processed', createdAt: today + 'T11:00:00',
  },
];
