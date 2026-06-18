import { create } from 'zustand';
import { Room, RoomStatus, RoomType, BillingRule } from '@/types';
import { mockRooms, mockBillingRules } from '@/data/mockRooms';
import { calculateBilling } from '@/utils/billingCalculator';

interface RoomStore {
  rooms: Room[];
  billingRules: BillingRule[];
  getRoomById: (id: string) => Room | undefined;
  getRoomsByStatus: (status: RoomStatus) => Room[];
  getRoomsByType: (type: RoomType) => Room[];
  getBillingRule: (type: RoomType) => BillingRule | undefined;
  getBillingRuleById: (id: string) => BillingRule | undefined;
  updateBillingRule: (id: string, updates: Partial<BillingRule>) => void;
  updateRoomStatus: (id: string, status: RoomStatus) => void;
  openRoom: (roomId: string, overnight?: boolean) => string;
  closeRoom: (roomId: string) => void;
  getRoomStats: () => {
    total: number;
    idle: number;
    using: number;
    overnight: number;
    maintenance: number;
  };
  calculateRoomFee: (roomId: string, endTime?: number) => {
    fee: number;
    duration: number;
    items: any[];
    overnightApplied: boolean;
    startingPriceApplied: boolean;
    ceilingPriceApplied: boolean;
  } | null;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  rooms: mockRooms,
  billingRules: mockBillingRules,

  getRoomById: (id) => get().rooms.find((r) => r.id === id),

  getRoomsByStatus: (status) => get().rooms.filter((r) => r.status === status),

  getRoomsByType: (type) => get().rooms.filter((r) => r.roomType === type),

  getBillingRule: (type) => get().billingRules.find((r) => r.roomType === type),

  getBillingRuleById: (id) => get().billingRules.find((r) => r.id === id),

  updateBillingRule: (id, updates) => {
    set((state) => ({
      billingRules: state.billingRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
    console.log(`[RoomStore] 更新计费规则 ${id}`, updates);
  },

  updateRoomStatus: (id, status) => {
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, status } : r))
    }));
    console.log(`[RoomStore] 更新包间 ${id} 状态为 ${status}`);
  },

  openRoom: (roomId, overnight = false) => {
    const billId = `bill-${Date.now()}`;
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status: overnight ? 'overnight' : 'using',
              startTime: Date.now(),
              currentBillId: billId,
              overnightMode: overnight
            }
          : r
      )
    }));
    console.log(`[RoomStore] 开台 ${roomId}, 账单号: ${billId}, 包夜: ${overnight}`);
    return billId;
  },

  closeRoom: (roomId) => {
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status: 'idle',
              startTime: undefined,
              currentBillId: undefined,
              overnightMode: undefined
            }
          : r
      )
    }));
    console.log(`[RoomStore] 结账 ${roomId}`);
  },

  getRoomStats: () => {
    const { rooms } = get();
    return {
      total: rooms.length,
      idle: rooms.filter((r) => r.status === 'idle').length,
      using: rooms.filter((r) => r.status === 'using').length,
      overnight: rooms.filter((r) => r.status === 'overnight').length,
      maintenance: rooms.filter((r) => r.status === 'maintenance').length
    };
  },

  calculateRoomFee: (roomId, endTime) => {
    const room = get().getRoomById(roomId);
    if (!room || !room.startTime) return null;

    const rule = get().getBillingRule(room.roomType);
    if (!rule) return null;

    const result = calculateBilling(rule, room.startTime, endTime);
    return {
      fee: result.roomFee,
      duration: result.durationMinutes,
      items: result.items,
      overnightApplied: result.overnightApplied,
      startingPriceApplied: result.startingPriceApplied,
      ceilingPriceApplied: result.ceilingPriceApplied
    };
  }
}));
