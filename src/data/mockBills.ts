import { Bill } from '@/types';

const now = Date.now();

export const mockBills: Bill[] = [
  {
    id: 'bill-001',
    roomId: 'room-102',
    roomName: '标准间 102',
    roomNo: '102',
    roomType: 'standard',
    startTime: now - 45 * 60 * 1000,
    items: [
      {
        id: 'item-1',
        description: '计时费用 (45分钟)',
        amount: 30,
        quantity: 1,
        unitPrice: 30,
        type: 'room'
      }
    ],
    subtotal: 30,
    discount: 0,
    total: 30,
    status: 'open',
    createdAt: now - 45 * 60 * 1000,
    overnightApplied: false,
    startingPriceApplied: true,
    ceilingPriceApplied: false
  },
  {
    id: 'bill-002',
    roomId: 'room-201',
    roomName: '豪华间 201',
    roomNo: '201',
    roomType: 'deluxe',
    startTime: now - 120 * 60 * 1000,
    items: [
      {
        id: 'item-2',
        description: '计时费用 (120分钟)',
        amount: 80,
        quantity: 2,
        unitPrice: 40,
        type: 'room'
      },
      {
        id: 'item-3',
        description: '矿泉水',
        amount: 20,
        quantity: 4,
        unitPrice: 5,
        type: 'product'
      }
    ],
    subtotal: 100,
    discount: 0,
    total: 100,
    status: 'open',
    createdAt: now - 120 * 60 * 1000,
    overnightApplied: false,
    startingPriceApplied: false,
    ceilingPriceApplied: false
  },
  {
    id: 'bill-003',
    roomId: 'room-301',
    roomName: 'VIP包间 301',
    roomNo: '301',
    roomType: 'vip',
    startTime: now - 180 * 60 * 1000,
    items: [
      {
        id: 'item-4',
        description: '包夜套餐',
        amount: 358,
        quantity: 1,
        unitPrice: 358,
        type: 'room'
      },
      {
        id: 'item-5',
        description: '水果拼盘',
        amount: 68,
        quantity: 1,
        unitPrice: 68,
        type: 'product'
      },
      {
        id: 'item-6',
        description: '茶水服务',
        amount: 58,
        quantity: 1,
        unitPrice: 58,
        type: 'service'
      }
    ],
    subtotal: 484,
    discount: 0,
    total: 484,
    status: 'open',
    createdAt: now - 180 * 60 * 1000,
    overnightApplied: true,
    startingPriceApplied: false,
    ceilingPriceApplied: false
  },
  {
    id: 'bill-004',
    roomId: 'room-101',
    roomName: '标准间 101',
    roomNo: '101',
    roomType: 'standard',
    startTime: now - 360 * 60 * 1000,
    endTime: now - 180 * 60 * 1000,
    durationMinutes: 180,
    items: [
      {
        id: 'item-7',
        description: '计时费用 (180分钟)',
        amount: 75,
        quantity: 3,
        unitPrice: 25,
        type: 'room'
      }
    ],
    subtotal: 75,
    discount: 0,
    total: 75,
    status: 'paid',
    paymentMethod: 'wechat',
    createdAt: now - 360 * 60 * 1000,
    closedAt: now - 180 * 60 * 1000,
    overnightApplied: false,
    startingPriceApplied: false,
    ceilingPriceApplied: false
  },
  {
    id: 'bill-005',
    roomId: 'room-202',
    roomName: '豪华间 202',
    roomNo: '202',
    roomType: 'deluxe',
    startTime: now - 600 * 60 * 1000,
    endTime: now - 480 * 60 * 1000,
    durationMinutes: 120,
    items: [
      {
        id: 'item-8',
        description: '计时费用',
        amount: 80,
        quantity: 2,
        unitPrice: 40,
        type: 'room'
      },
      {
        id: 'item-9',
        description: '封顶价减免',
        amount: 0,
        quantity: 1,
        unitPrice: 0,
        type: 'room'
      }
    ],
    subtotal: 80,
    discount: 10,
    total: 70,
    status: 'paid',
    paymentMethod: 'cash',
    createdAt: now - 600 * 60 * 1000,
    closedAt: now - 480 * 60 * 1000,
    overnightApplied: false,
    startingPriceApplied: false,
    ceilingPriceApplied: false
  }
];
