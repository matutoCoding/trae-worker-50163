import { QueueWindow, QueueTicket } from '@/types';

const now = Date.now();

export const mockWindows: QueueWindow[] = [
  {
    id: 'window-1',
    name: '前台A',
    windowNo: 'A',
    status: 'active',
    currentServing: 'A003',
    servingCount: 2,
    completedCount: 15,
    averageWaitTime: 180
  },
  {
    id: 'window-2',
    name: '前台B',
    windowNo: 'B',
    status: 'active',
    currentServing: 'B002',
    servingCount: 1,
    completedCount: 8,
    averageWaitTime: 120
  },
  {
    id: 'window-3',
    name: '前台C',
    windowNo: 'C',
    status: 'active',
    servingCount: 0,
    completedCount: 5,
    averageWaitTime: 60
  },
  {
    id: 'window-4',
    name: '前台D',
    windowNo: 'D',
    status: 'paused',
    servingCount: 0,
    completedCount: 3,
    averageWaitTime: 90
  }
];

export const mockTickets: QueueTicket[] = [
  {
    id: 'ticket-1',
    ticketNo: 'A001',
    roomType: 'standard',
    partySize: 4,
    status: 'waiting',
    createdAt: now - 600 * 1000,
    assignedWindowId: 'window-1'
  },
  {
    id: 'ticket-2',
    ticketNo: 'A002',
    roomType: 'standard',
    partySize: 3,
    status: 'waiting',
    createdAt: now - 420 * 1000,
    assignedWindowId: 'window-1'
  },
  {
    id: 'ticket-3',
    ticketNo: 'A003',
    roomType: 'standard',
    partySize: 5,
    customerName: '张先生',
    status: 'serving',
    windowId: 'window-1',
    createdAt: now - 300 * 1000,
    calledAt: now - 60 * 1000,
    assignedWindowId: 'window-1'
  },
  {
    id: 'ticket-4',
    ticketNo: 'B001',
    roomType: 'deluxe',
    partySize: 6,
    status: 'waiting',
    createdAt: now - 540 * 1000,
    assignedWindowId: 'window-2'
  },
  {
    id: 'ticket-5',
    ticketNo: 'B002',
    roomType: 'deluxe',
    partySize: 4,
    customerName: '李女士',
    status: 'serving',
    windowId: 'window-2',
    createdAt: now - 240 * 1000,
    calledAt: now - 30 * 1000,
    assignedWindowId: 'window-2'
  },
  {
    id: 'ticket-6',
    ticketNo: 'V001',
    roomType: 'vip',
    partySize: 8,
    customerName: '王总',
    phone: '138****8888',
    status: 'waiting',
    createdAt: now - 180 * 1000,
    assignedWindowId: 'window-3'
  },
  {
    id: 'ticket-7',
    ticketNo: 'V002',
    roomType: 'vip',
    partySize: 6,
    status: 'calling',
    windowId: 'window-3',
    createdAt: now - 120 * 1000,
    calledAt: now - 10 * 1000,
    assignedWindowId: 'window-3'
  },
  {
    id: 'ticket-8',
    ticketNo: 'A004',
    roomType: 'standard',
    partySize: 4,
    status: 'completed',
    windowId: 'window-1',
    createdAt: now - 1200 * 1000,
    calledAt: now - 900 * 1000,
    assignedWindowId: 'window-1'
  }
];
