export type RoomStatus = 'idle' | 'using' | 'overnight' | 'reserved' | 'maintenance';

export type RoomType = 'standard' | 'deluxe' | 'vip' | 'presidential';

export type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond';

export type TransactionType = 'recharge' | 'consume' | 'refund' | 'adjust';

export interface MemberTransaction {
  id: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  relatedBillId?: string;
  createdAt: number;
}

export interface Member {
  id: string;
  memberNo: string;
  name: string;
  phone: string;
  level: MemberLevel;
  balance: number;
  totalConsumption: number;
  visitCount: number;
  avatar?: string;
  createdAt: number;
  lastVisitAt?: number;
}

export interface BillingRule {
  id: string;
  roomType: RoomType;
  startingPrice: number;
  startingMinutes: number;
  hourlyRate: number;
  ceilingPrice: number;
  overnightEnabled: boolean;
  overnightPrice: number;
  overnightStartTime: string;
  overnightEndTime: string;
}

export interface Room {
  id: string;
  name: string;
  roomNo: string;
  roomType: RoomType;
  status: RoomStatus;
  capacity: number;
  equipment: string[];
  currentBillId?: string;
  startTime?: number;
  overnightMode?: boolean;
}

export interface BillItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  type: 'room' | 'service' | 'product';
}

export interface Bill {
  id: string;
  roomId: string;
  roomName: string;
  roomNo: string;
  roomType: RoomType;
  startTime: number;
  endTime?: number;
  durationMinutes?: number;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'open' | 'closed' | 'paid';
  paymentMethod?: 'cash' | 'wechat' | 'alipay' | 'card' | 'member';
  memberId?: string;
  memberName?: string;
  memberNo?: string;
  createdAt: number;
  closedAt?: number;
  overnightApplied: boolean;
  startingPriceApplied: boolean;
  ceilingPriceApplied: boolean;
}

export interface QueueWindow {
  id: string;
  name: string;
  windowNo: string;
  status: 'active' | 'inactive' | 'paused';
  currentServing?: string;
  servingCount: number;
  completedCount: number;
  averageWaitTime: number;
}

export interface QueueTicket {
  id: string;
  ticketNo: string;
  roomType: RoomType;
  partySize: number;
  customerName?: string;
  phone?: string;
  status: 'waiting' | 'calling' | 'serving' | 'completed' | 'cancelled';
  windowId?: string;
  createdAt: number;
  calledAt?: number;
  assignedWindowId?: string;
}

export interface LoadBalanceStats {
  totalWaiting: number;
  totalWindows: number;
  activeWindows: number;
  averageWaitTime: number;
  recommendedWindowId?: string;
  windowLoads: Array<{
    windowId: string;
    windowName: string;
    load: number;
    waitingCount: number;
    status: string;
  }>;
}
