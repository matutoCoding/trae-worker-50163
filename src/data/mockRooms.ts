import { Room, BillingRule } from '@/types';

export const mockBillingRules: BillingRule[] = [
  {
    id: 'rule-standard',
    roomType: 'standard',
    startingPrice: 30,
    startingMinutes: 60,
    hourlyRate: 25,
    ceilingPrice: 180,
    overnightEnabled: true,
    overnightPrice: 128,
    overnightStartTime: '22:00',
    overnightEndTime: '08:00'
  },
  {
    id: 'rule-deluxe',
    roomType: 'deluxe',
    startingPrice: 50,
    startingMinutes: 60,
    hourlyRate: 40,
    ceilingPrice: 280,
    overnightEnabled: true,
    overnightPrice: 198,
    overnightStartTime: '22:00',
    overnightEndTime: '08:00'
  },
  {
    id: 'rule-vip',
    roomType: 'vip',
    startingPrice: 88,
    startingMinutes: 60,
    hourlyRate: 68,
    ceilingPrice: 480,
    overnightEnabled: true,
    overnightPrice: 358,
    overnightStartTime: '22:00',
    overnightEndTime: '08:00'
  },
  {
    id: 'rule-presidential',
    roomType: 'presidential',
    startingPrice: 168,
    startingMinutes: 60,
    hourlyRate: 128,
    ceilingPrice: 888,
    overnightEnabled: true,
    overnightPrice: 688,
    overnightStartTime: '22:00',
    overnightEndTime: '08:00'
  }
];

const now = Date.now();

export const mockRooms: Room[] = [
  {
    id: 'room-101',
    name: '标准间 101',
    roomNo: '101',
    roomType: 'standard',
    status: 'idle',
    capacity: 4,
    equipment: ['自动麻将机', '空调', '饮水机']
  },
  {
    id: 'room-102',
    name: '标准间 102',
    roomNo: '102',
    roomType: 'standard',
    status: 'using',
    capacity: 4,
    equipment: ['自动麻将机', '空调', '饮水机'],
    startTime: now - 45 * 60 * 1000,
    currentBillId: 'bill-001'
  },
  {
    id: 'room-103',
    name: '标准间 103',
    roomNo: '103',
    roomType: 'standard',
    status: 'idle',
    capacity: 4,
    equipment: ['自动麻将机', '空调', '饮水机']
  },
  {
    id: 'room-201',
    name: '豪华间 201',
    roomNo: '201',
    roomType: 'deluxe',
    status: 'using',
    capacity: 6,
    equipment: ['自动麻将机', '空调', '沙发', '电视', '饮水机'],
    startTime: now - 120 * 60 * 1000,
    currentBillId: 'bill-002'
  },
  {
    id: 'room-202',
    name: '豪华间 202',
    roomNo: '202',
    roomType: 'deluxe',
    status: 'idle',
    capacity: 6,
    equipment: ['自动麻将机', '空调', '沙发', '电视', '饮水机']
  },
  {
    id: 'room-301',
    name: 'VIP包间 301',
    roomNo: '301',
    roomType: 'vip',
    status: 'overnight',
    capacity: 8,
    equipment: ['自动麻将机', '空调', '独立卫浴', '沙发', '电视', '茶台'],
    startTime: now - 180 * 60 * 1000,
    currentBillId: 'bill-003',
    overnightMode: true
  },
  {
    id: 'room-302',
    name: 'VIP包间 302',
    roomNo: '302',
    roomType: 'vip',
    status: 'idle',
    capacity: 8,
    equipment: ['自动麻将机', '空调', '独立卫浴', '沙发', '电视', '茶台']
  },
  {
    id: 'room-401',
    name: '总统套房 401',
    roomNo: '401',
    roomType: 'presidential',
    status: 'maintenance',
    capacity: 12,
    equipment: ['两台自动麻将机', '空调', '独立卫浴', 'KTV系统', '沙发', '电视', '茶台', '卧室']
  }
];
