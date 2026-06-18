import { Member } from '@/types';

export const mockMembers: Member[] = [
  {
    id: 'member-001',
    memberNo: 'VIP8888',
    name: '张先生',
    phone: '138****8888',
    level: 'diamond',
    balance: 2580.00,
    totalConsumption: 15680.00,
    visitCount: 42,
    createdAt: new Date('2025-03-15').getTime(),
    lastVisitAt: new Date('2026-06-17').getTime()
  },
  {
    id: 'member-002',
    memberNo: 'VIP6666',
    name: '李女士',
    phone: '139****6666',
    level: 'gold',
    balance: 860.50,
    totalConsumption: 8920.00,
    visitCount: 28,
    createdAt: new Date('2025-06-20').getTime(),
    lastVisitAt: new Date('2026-06-16').getTime()
  },
  {
    id: 'member-003',
    memberNo: 'VIP3333',
    name: '王先生',
    phone: '137****3333',
    level: 'silver',
    balance: 320.00,
    totalConsumption: 3680.00,
    visitCount: 12,
    createdAt: new Date('2025-10-08').getTime(),
    lastVisitAt: new Date('2026-06-15').getTime()
  },
  {
    id: 'member-004',
    memberNo: 'VIP1111',
    name: '赵先生',
    phone: '136****1111',
    level: 'normal',
    balance: 50.00,
    totalConsumption: 680.00,
    visitCount: 3,
    createdAt: new Date('2026-05-20').getTime(),
    lastVisitAt: new Date('2026-06-10').getTime()
  }
];
