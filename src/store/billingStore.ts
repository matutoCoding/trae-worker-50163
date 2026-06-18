import { create } from 'zustand';
import { Bill, BillItem, RoomType, BillingRule } from '@/types';
import { mockBills } from '@/data/mockBills';
import { calculateBilling } from '@/utils/billingCalculator';
import { useRoomStore } from './roomStore';

interface BillingStore {
  bills: Bill[];
  getBillById: (id: string) => Bill | undefined;
  getOpenBills: () => Bill[];
  getClosedBills: () => Bill[];
  getBillsByRoom: (roomId: string) => Bill[];
  getBillingRule: (type: RoomType) => BillingRule | undefined;
  createBill: (params: {
    billId: string;
    roomId: string;
    roomName: string;
    roomNo: string;
    roomType: RoomType;
    overnight?: boolean;
  }) => void;
  addBillItem: (billId: string, item: Omit<BillItem, 'id'>) => void;
  updateBillItem: (billId: string, itemId: string, updates: Partial<BillItem>) => void;
  removeBillItem: (billId: string, itemId: string) => void;
  applyDiscount: (billId: string, discount: number) => void;
  closeBill: (billId: string, paymentMethod: 'cash' | 'wechat' | 'alipay' | 'card') => Bill | null;
  recalculateBill: (billId: string, endTime?: number) => void;
  getTodayRevenue: () => number;
  getTodayBillCount: () => number;
}

const getBillingRulesFromRoomStore = () => useRoomStore.getState().billingRules;

export const useBillingStore = create<BillingStore>((set, get) => ({
  bills: mockBills,

  getBillById: (id) => get().bills.find((b) => b.id === id),

  getOpenBills: () => get().bills.filter((b) => b.status === 'open'),

  getClosedBills: () => get().bills.filter((b) => b.status !== 'open'),

  getBillsByRoom: (roomId) => get().bills.filter((b) => b.roomId === roomId),

  getBillingRule: (type) => getBillingRulesFromRoomStore().find((r) => r.roomType === type),

  createBill: ({ billId, roomId, roomName, roomNo, roomType, overnight = false }) => {
    const rule = getBillingRulesFromRoomStore().find((r) => r.roomType === roomType);
    if (!rule) {
      console.error(`[BillingStore] 未找到包间类型 ${roomType} 的计费规则`);
      return;
    }

    const now = Date.now();
    const result = calculateBilling(rule, now);

    const newBill: Bill = {
      id: billId,
      roomId,
      roomName,
      roomNo,
      roomType,
      startTime: now,
      items: result.items,
      subtotal: result.roomFee,
      discount: 0,
      total: result.roomFee,
      status: 'open',
      createdAt: now,
      overnightApplied: overnight || result.overnightApplied,
      startingPriceApplied: result.startingPriceApplied,
      ceilingPriceApplied: result.ceilingPriceApplied
    };

    set((state) => ({ bills: [...state.bills, newBill] }));
    console.log(`[BillingStore] 创建账单 ${billId}`);
  },

  addBillItem: (billId, item) => {
    const newItem: BillItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    set((state) => ({
      bills: state.bills.map((b) => {
        if (b.id !== billId) return b;
        const newSubtotal = b.subtotal + newItem.amount;
        return {
          ...b,
          items: [...b.items, newItem],
          subtotal: newSubtotal,
          total: newSubtotal - b.discount
        };
      })
    }));
    console.log(`[BillingStore] 账单 ${billId} 添加项目 ${newItem.description}`);
  },

  updateBillItem: (billId, itemId, updates) => {
    set((state) => ({
      bills: state.bills.map((b) => {
        if (b.id !== billId) return b;
        const newItems = b.items.map((item) => {
          if (item.id !== itemId) return item;
          const updated = { ...item, ...updates };
          updated.amount = updated.unitPrice * updated.quantity;
          return updated;
        });
        const newSubtotal = newItems.reduce((sum, i) => sum + i.amount, 0);
        return {
          ...b,
          items: newItems,
          subtotal: newSubtotal,
          total: newSubtotal - b.discount
        };
      })
    }));
  },

  removeBillItem: (billId, itemId) => {
    set((state) => ({
      bills: state.bills.map((b) => {
        if (b.id !== billId) return b;
        const newItems = b.items.filter((i) => i.id !== itemId);
        const newSubtotal = newItems.reduce((sum, i) => sum + i.amount, 0);
        return {
          ...b,
          items: newItems,
          subtotal: newSubtotal,
          total: newSubtotal - b.discount
        };
      })
    }));
  },

  applyDiscount: (billId, discount) => {
    set((state) => ({
      bills: state.bills.map((b) => {
        if (b.id !== billId) return b;
        return {
          ...b,
          discount,
          total: Math.max(0, b.subtotal - discount)
        };
      })
    }));
    console.log(`[BillingStore] 账单 ${billId} 应用折扣 ${discount}`);
  },

  closeBill: (billId, paymentMethod) => {
    const bill = get().getBillById(billId);
    if (!bill) {
      console.error(`[BillingStore] 未找到账单 ${billId}`);
      return null;
    }

    const now = Date.now();
    const rule = getBillingRulesFromRoomStore().find((r) => r.roomType === bill.roomType);
    if (!rule) {
      console.error(`[BillingStore] 未找到计费规则`);
      return null;
    }

    const result = calculateBilling(rule, bill.startTime, now);
    const otherItems = bill.items.filter((i) => i.type !== 'room');
    const otherSubtotal = otherItems.reduce((sum, i) => sum + i.amount, 0);
    const finalSubtotal = result.roomFee + otherSubtotal;
    const finalTotal = Math.max(0, finalSubtotal - bill.discount);
    const finalDuration = Math.floor((now - bill.startTime) / 60000);

    const closedBill: Bill = {
      ...bill,
      endTime: now,
      durationMinutes: finalDuration,
      items: [...result.items, ...otherItems],
      subtotal: finalSubtotal,
      total: finalTotal,
      status: 'paid',
      paymentMethod,
      closedAt: now,
      overnightApplied: result.overnightApplied,
      startingPriceApplied: result.startingPriceApplied,
      ceilingPriceApplied: result.ceilingPriceApplied
    };

    set((state) => ({
      bills: state.bills.map((b) => (b.id === billId ? closedBill : b))
    }));

    const closeRoom = useRoomStore.getState().closeRoom;
    closeRoom(bill.roomId);

    console.log(
      `[BillingStore] 结账 ${billId}, 时长: ${finalDuration}分钟, 金额: ${finalTotal}, 支付方式: ${paymentMethod}`
    );
    return closedBill;
  },

  recalculateBill: (billId, endTime) => {
    const bill = get().getBillById(billId);
    if (!bill || bill.status !== 'open') return;

    const rule = getBillingRulesFromRoomStore().find((r) => r.roomType === bill.roomType);
    if (!rule) return;

    const actualEndTime = endTime || Date.now();
    const result = calculateBilling(rule, bill.startTime, actualEndTime);
    const otherItems = bill.items.filter((i) => i.type !== 'room');
    const roomSubtotal = result.roomFee;
    const otherSubtotal = otherItems.reduce((sum, i) => sum + i.amount, 0);
    const newSubtotal = roomSubtotal + otherSubtotal;

    set((state) => ({
      bills: state.bills.map((b) => {
        if (b.id !== billId) return b;
        return {
          ...b,
          items: [...result.items, ...otherItems],
          subtotal: newSubtotal,
          total: newSubtotal - b.discount,
          overnightApplied: result.overnightApplied,
          startingPriceApplied: result.startingPriceApplied,
          ceilingPriceApplied: result.ceilingPriceApplied
        };
      })
    }));
  },

  getTodayRevenue: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    return get()
      .bills.filter((b) => b.status === 'paid' && (b.closedAt || 0) >= todayStart)
      .reduce((sum, b) => sum + b.total, 0);
  },

  getTodayBillCount: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    return get().bills.filter(
      (b) => b.status === 'paid' && (b.closedAt || 0) >= todayStart
    ).length;
  }
}));
