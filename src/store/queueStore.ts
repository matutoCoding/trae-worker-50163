import { create } from 'zustand';
import { QueueWindow, QueueTicket, RoomType } from '@/types';
import { mockWindows, mockTickets } from '@/data/mockQueues';
import {
  findLeastLoadedWindow,
  getLoadBalanceStats,
  redistributeTickets,
  getLoadLevel,
  calculateWindowLoad
} from '@/utils/loadBalancer';
import { generateTicketNo } from '@/utils/format';

interface QueueStore {
  windows: QueueWindow[];
  tickets: QueueTicket[];
  ticketCounters: Record<RoomType, number>;
  getWindowById: (id: string) => QueueWindow | undefined;
  getActiveWindows: () => QueueWindow[];
  getTicketsByStatus: (status: QueueTicket['status']) => QueueTicket[];
  getTicketsByWindow: (windowId: string) => QueueTicket[];
  getLoadBalanceStats: () => ReturnType<typeof getLoadBalanceStats>;
  getRecommendedWindow: () => QueueWindow | undefined;
  getWindowLoadLevel: (windowId: string) => 'low' | 'medium' | 'high' | 'critical';
  createTicket: (params: {
    roomType: RoomType;
    partySize: number;
    customerName?: string;
    phone?: string;
  }) => QueueTicket;
  assignTicketToWindow: (ticketId: string, windowId?: string) => void;
  callNextTicket: (windowId: string) => QueueTicket | undefined;
  confirmTicket: (ticketId: string) => void;
  cancelTicket: (ticketId: string) => void;
  completeTicket: (ticketId: string) => void;
  toggleWindowStatus: (windowId: string) => void;
  performRedistribution: () => void;
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  windows: mockWindows,
  tickets: mockTickets,
  ticketCounters: {
    standard: 5,
    deluxe: 3,
    vip: 3,
    presidential: 0
  },

  getWindowById: (id) => get().windows.find((w) => w.id === id),

  getActiveWindows: () => get().windows.filter((w) => w.status === 'active'),

  getTicketsByStatus: (status) => get().tickets.filter((t) => t.status === status),

  getTicketsByWindow: (windowId) =>
    get().tickets.filter((t) => t.assignedWindowId === windowId),

  getLoadBalanceStats: () => getLoadBalanceStats(get().windows, get().tickets),

  getRecommendedWindow: () => findLeastLoadedWindow(get().windows, get().tickets),

  getWindowLoadLevel: (windowId) => {
    const window = get().getWindowById(windowId);
    if (!window) return 'low';
    const load = calculateWindowLoad(window, get().tickets);
    return getLoadLevel(load);
  },

  createTicket: ({ roomType, partySize, customerName, phone }) => {
    const counters = get().ticketCounters;
    const newSeq = (counters[roomType] || 0) + 1;
    const ticketNo = generateTicketNo(roomType, newSeq);

    const newTicket: QueueTicket = {
      id: `ticket-${Date.now()}`,
      ticketNo,
      roomType,
      partySize,
      customerName,
      phone,
      status: 'waiting',
      createdAt: Date.now()
    };

    const recommendedWindow = get().getRecommendedWindow();
    if (recommendedWindow) {
      newTicket.assignedWindowId = recommendedWindow.id;
    }

    set((state) => ({
      tickets: [...state.tickets, newTicket],
      ticketCounters: {
        ...state.ticketCounters,
        [roomType]: newSeq
      }
    }));

    console.log(
      `[QueueStore] 生成号码 ${ticketNo}, 推荐窗口: ${recommendedWindow?.windowNo || '无'}`
    );
    return newTicket;
  },

  assignTicketToWindow: (ticketId, windowId) => {
    let targetWindowId = windowId;
    if (!targetWindowId) {
      const recommended = get().getRecommendedWindow();
      targetWindowId = recommended?.id;
    }

    if (!targetWindowId) return;

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, assignedWindowId: targetWindowId } : t
      )
    }));
    console.log(`[QueueStore] 分配 ${ticketId} 到窗口 ${targetWindowId}`);
  },

  callNextTicket: (windowId) => {
    const window = get().getWindowById(windowId);
    if (!window || window.status !== 'active') {
      console.warn(`[QueueStore] 窗口 ${windowId} 不可用`);
      return undefined;
    }

    const waitingTickets = get()
      .getTicketsByWindow(windowId)
      .filter((t) => t.status === 'waiting')
      .sort((a, b) => a.createdAt - b.createdAt);

    if (waitingTickets.length === 0) {
      console.log(`[QueueStore] 窗口 ${windowId} 无等待号码`);
      return undefined;
    }

    const nextTicket = waitingTickets[0];
    const now = Date.now();

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === nextTicket.id
          ? { ...t, status: 'calling', windowId, calledAt: now }
          : t
      ),
      windows: state.windows.map((w) =>
        w.id === windowId
          ? { ...w, currentServing: nextTicket.ticketNo, servingCount: w.servingCount + 1 }
          : w
      )
    }));

    console.log(`[QueueStore] 窗口 ${windowId} 叫号 ${nextTicket.ticketNo}`);
    return nextTicket;
  },

  confirmTicket: (ticketId) => {
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, status: 'serving' } : t
      )
    }));
    console.log(`[QueueStore] 确认 ${ticketId} 已就位`);
  },

  cancelTicket: (ticketId) => {
    const ticket = get().tickets.find((t) => t.id === ticketId);
    const wasCallingOrServing = ticket && (ticket.status === 'calling' || ticket.status === 'serving');
    const windowId = ticket?.windowId || ticket?.assignedWindowId;

    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, status: 'cancelled' } : t
      ),
      windows: wasCallingOrServing && windowId
        ? state.windows.map((w) =>
            w.id === windowId
              ? {
                  ...w,
                  currentServing: w.currentServing === ticket?.ticketNo ? undefined : w.currentServing,
                  servingCount: Math.max(0, w.servingCount - 1)
                }
              : w
          )
        : state.windows
    }));
    console.log(
      `[QueueStore] 取消 ${ticketId}, 恢复窗口状态: ${wasCallingOrServing ? '是' : '否'}`
    );
  },

  completeTicket: (ticketId) => {
    const ticket = get().tickets.find((t) => t.id === ticketId);
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, status: 'completed' } : t
      ),
      windows: state.windows.map((w) =>
        w.id === ticket?.windowId
          ? {
              ...w,
              currentServing: undefined,
              servingCount: Math.max(0, w.servingCount - 1),
              completedCount: w.completedCount + 1
            }
          : w
      )
    }));
    console.log(`[QueueStore] 完成 ${ticketId}`);
  },

  toggleWindowStatus: (windowId) => {
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== windowId) return w;
        const newStatus =
          w.status === 'active' ? 'paused' : w.status === 'paused' ? 'active' : w.status;
        console.log(`[QueueStore] 窗口 ${w.windowNo} 状态变更: ${w.status} -> ${newStatus}`);
        return { ...w, status: newStatus };
      })
    }));
  },

  performRedistribution: () => {
    const redistributions = redistributeTickets(get().windows, get().tickets);
    if (redistributions.size === 0) {
      console.log('[QueueStore] 无需跨窗口调剂');
      return;
    }

    set((state) => ({
      tickets: state.tickets.map((t) => {
        const newWindowId = redistributions.get(t.id);
        if (newWindowId) {
          console.log(`[QueueStore] 调剂 ${t.ticketNo} -> 窗口 ${newWindowId}`);
          return { ...t, assignedWindowId: newWindowId };
        }
        return t;
      })
    }));
  }
}));
