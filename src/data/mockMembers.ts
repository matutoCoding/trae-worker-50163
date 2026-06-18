import { Member, MemberTransaction } from '@/types';

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

export const mockMemberTransactions: MemberTransaction[] = [
  {
    id: 'TX001',
    memberId: 'member-001',
    type: 'recharge',
    amount: 2000,
    balanceBefore: 580,
    balanceAfter: 2580,
    description: '前台充值 +2000',
    createdAt: new Date('2026-06-15 14:30').getTime()
  },
  {
    id: 'TX002',
    memberId: 'member-001',
    type: 'consume',
    amount: 328,
    balanceBefore: 908,
    balanceAfter: 580,
    description: '消费扣款 (账单B20260614001)',
    relatedBillId: 'bill-001',
    createdAt: new Date('2026-06-14 23:15').getTime()
  },
  {
    id: 'TX003',
    memberId: 'member-001',
    type: 'consume',
    amount: 456,
    balanceBefore: 1364,
    balanceAfter: 908,
    description: '消费扣款 (账单B20260613001)',
    relatedBillId: 'bill-002',
    createdAt: new Date('2026-06-13 22:40').getTime()
  },
  {
    id: 'TX004',
    memberId: 'member-002',
    type: 'recharge',
    amount: 500,
    balanceBefore: 360.5,
    balanceAfter: 860.5,
    description: '前台充值 +500',
    createdAt: new Date('2026-06-16 10:20').getTime()
  },
  {
    id: 'TX005',
    memberId: 'member-002',
    type: 'consume',
    amount: 186,
    balanceBefore: 546.5,
    balanceAfter: 360.5,
    description: '消费扣款 (账单B20260615001)',
    relatedBillId: 'bill-003',
    createdAt: new Date('2026-06-15 21:30').getTime()
  },
  {
    id: 'TX006',
    memberId: 'member-003',
    type: 'consume',
    amount: 128,
    balanceBefore: 448,
    balanceAfter: 320,
    description: '消费扣款 (账单B20260614002)',
    relatedBillId: 'bill-004',
    createdAt: new Date('2026-06-14 20:10').getTime()
  },
  {
    id: 'TX007',
    memberId: 'member-003',
    type: 'recharge',
    amount: 300,
    balanceBefore: 148,
    balanceAfter: 448,
    description: '前台充值 +300',
    createdAt: new Date('2026-06-12 19:00').getTime()
  },
  {
    id: 'TX008',
    memberId: 'member-004',
    type: 'consume',
    amount: 150,
    balanceBefore: 200,
    balanceAfter: 50,
    description: '消费扣款 (账单B20260610001)',
    relatedBillId: 'bill-005',
    createdAt: new Date('2026-06-10 21:45').getTime()
  },
  {
    id: 'TX009',
    memberId: 'member-004',
    type: 'recharge',
    amount: 200,
    balanceBefore: 0,
    balanceAfter: 200,
    description: '前台充值 +200',
    createdAt: new Date('2026-05-25 15:30').getTime()
  },
  {
    id: 'TX010',
    memberId: 'member-001',
    type: 'recharge',
    amount: 1000,
    balanceBefore: 364,
    balanceAfter: 1364,
    description: '前台充值 +1000',
    createdAt: new Date('2026-06-10 16:10').getTime()
  }
];
