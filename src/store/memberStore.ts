import { create } from 'zustand';
import { Member, MemberLevel, MemberTransaction, TransactionType } from '@/types';
import { mockMembers, mockMemberTransactions } from '@/data/mockMembers';

export interface LevelUpgradeRule {
  level: MemberLevel;
  minConsumption: number;
  minVisits: number;
}

export const LEVEL_UPGRADE_RULES: LevelUpgradeRule[] = [
  { level: 'silver', minConsumption: 500, minVisits: 3 },
  { level: 'gold', minConsumption: 2000, minVisits: 10 },
  { level: 'diamond', minConsumption: 5000, minVisits: 25 }
];

export const LEVEL_ORDER: MemberLevel[] = ['normal', 'silver', 'gold', 'diamond'];

interface MemberStore {
  members: Member[];
  transactions: MemberTransaction[];
  getMemberById: (id: string) => Member | undefined;
  getMemberByPhone: (phone: string) => Member | undefined;
  getMemberByNo: (memberNo: string) => Member | undefined;
  searchMembers: (keyword: string) => Member[];
  deductBalance: (memberId: string, amount: number, relatedBillId?: string) => boolean;
  addConsumption: (memberId: string, amount: number) => void;
  recharge: (memberId: string, amount: number) => void;
  getMemberLevelText: (level: MemberLevel) => string;
  getMemberLevelColor: (level: MemberLevel) => string;
  getTransactionsByMember: (memberId: string) => MemberTransaction[];
  getLatestTransaction: (memberId: string) => MemberTransaction | undefined;
  getNextLevel: (level: MemberLevel) => MemberLevel | undefined;
  getLevelUpgradeRule: (level: MemberLevel) => LevelUpgradeRule | undefined;
  canUpgrade: (member: Member) => MemberLevel | null;
  getUpgradeProgress: (member: Member) => { level: MemberLevel; consumptionProgress: number; visitProgress: number } | null;
  addTransaction: (tx: Omit<MemberTransaction, 'id' | 'createdAt'>) => void;
}

const levelTextMap: Record<MemberLevel, string> = {
  normal: '普通会员',
  silver: '银卡会员',
  gold: '金卡会员',
  diamond: '钻石会员'
};

const levelColorMap: Record<MemberLevel, string> = {
  normal: '#86909C',
  silver: '#C0C4CC',
  gold: '#E6A23C',
  diamond: '#722ED1'
};

const generateTxId = () => `TX${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

export const useMemberStore = create<MemberStore>((set, get) => ({
  members: mockMembers,
  transactions: mockMemberTransactions,

  getMemberById: (id) => get().members.find((m) => m.id === id),

  getMemberByPhone: (phone) => get().members.find((m) => m.phone === phone),

  getMemberByNo: (memberNo) => get().members.find((m) => m.memberNo === memberNo),

  searchMembers: (keyword) => {
    if (!keyword) return get().members;
    const lower = keyword.toLowerCase();
    return get().members.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.phone.includes(keyword) ||
        m.memberNo.toLowerCase().includes(lower)
    );
  },

  addTransaction: (tx) => {
    const newTx: MemberTransaction = {
      ...tx,
      id: generateTxId(),
      createdAt: Date.now()
    };
    set((state) => ({ transactions: [newTx, ...state.transactions] }));
  },

  deductBalance: (memberId, amount, relatedBillId) => {
    const member = get().getMemberById(memberId);
    if (!member) {
      console.error(`[MemberStore] 会员不存在: ${memberId}`);
      return false;
    }
    if (member.balance < amount) {
      console.warn(`[MemberStore] 余额不足: ${member.balance} < ${amount}`);
      return false;
    }

    const balanceBefore = member.balance;
    const balanceAfter = Math.round((member.balance - amount) * 100) / 100;

    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              balance: balanceAfter,
              totalConsumption: Math.round((m.totalConsumption + amount) * 100) / 100,
              visitCount: m.visitCount + 1,
              lastVisitAt: Date.now()
            }
          : m
      )
    }));

    get().addTransaction({
      memberId,
      type: 'consume',
      amount,
      balanceBefore,
      balanceAfter,
      description: `消费扣款${relatedBillId ? ` (订单${relatedBillId})` : ''}`,
      relatedBillId
    });

    console.log(`[MemberStore] 会员 ${member.memberNo} 消费扣减 ${amount}, 余额: ${balanceAfter}`);
    return true;
  },

  addConsumption: (memberId, amount) => {
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              totalConsumption: Math.round((m.totalConsumption + amount) * 100) / 100,
              visitCount: m.visitCount + 1,
              lastVisitAt: Date.now()
            }
          : m
      )
    }));
  },

  recharge: (memberId, amount) => {
    const member = get().getMemberById(memberId);
    if (!member) return;

    const balanceBefore = member.balance;
    const balanceAfter = Math.round((member.balance + amount) * 100) / 100;

    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, balance: balanceAfter } : m
      )
    }));

    get().addTransaction({
      memberId,
      type: 'recharge',
      amount,
      balanceBefore,
      balanceAfter,
      description: `前台充值 +${amount}`
    });

    console.log(`[MemberStore] 会员 ${memberId} 充值 ${amount}, 新余额: ${balanceAfter}`);
  },

  getMemberLevelText: (level) => levelTextMap[level],

  getMemberLevelColor: (level) => levelColorMap[level],

  getTransactionsByMember: (memberId) => {
    return get()
      .transactions.filter((t) => t.memberId === memberId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getLatestTransaction: (memberId) => {
    const txs = get().getTransactionsByMember(memberId);
    return txs.length > 0 ? txs[0] : undefined;
  },

  getNextLevel: (level) => {
    const idx = LEVEL_ORDER.indexOf(level);
    if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return undefined;
    return LEVEL_ORDER[idx + 1];
  },

  getLevelUpgradeRule: (level) => LEVEL_UPGRADE_RULES.find((r) => r.level === level),

  canUpgrade: (member) => {
    const nextLevel = get().getNextLevel(member.level);
    if (!nextLevel) return null;
    const rule = get().getLevelUpgradeRule(nextLevel);
    if (!rule) return null;
    if (member.totalConsumption >= rule.minConsumption && member.visitCount >= rule.minVisits) {
      return nextLevel;
    }
    return null;
  },

  getUpgradeProgress: (member) => {
    const nextLevel = get().getNextLevel(member.level);
    if (!nextLevel) return null;
    const rule = get().getLevelUpgradeRule(nextLevel);
    if (!rule) return null;
    return {
      level: nextLevel,
      consumptionProgress: Math.min(100, Math.round((member.totalConsumption / rule.minConsumption) * 100)),
      visitProgress: Math.min(100, Math.round((member.visitCount / rule.minVisits) * 100))
    };
  }
}));
