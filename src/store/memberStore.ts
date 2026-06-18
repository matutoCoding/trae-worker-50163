import { create } from 'zustand';
import { Member, MemberLevel } from '@/types';
import { mockMembers } from '@/data/mockMembers';

interface MemberStore {
  members: Member[];
  getMemberById: (id: string) => Member | undefined;
  getMemberByPhone: (phone: string) => Member | undefined;
  getMemberByNo: (memberNo: string) => Member | undefined;
  searchMembers: (keyword: string) => Member[];
  deductBalance: (memberId: string, amount: number) => boolean;
  addConsumption: (memberId: string, amount: number) => void;
  recharge: (memberId: string, amount: number) => void;
  getMemberLevelText: (level: MemberLevel) => string;
  getMemberLevelColor: (level: MemberLevel) => string;
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

export const useMemberStore = create<MemberStore>((set, get) => ({
  members: mockMembers,

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

  deductBalance: (memberId, amount) => {
    const member = get().getMemberById(memberId);
    if (!member) {
      console.error(`[MemberStore] 会员不存在: ${memberId}`);
      return false;
    }
    if (member.balance < amount) {
      console.warn(`[MemberStore] 余额不足: ${member.balance} < ${amount}`);
      return false;
    }

    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              balance: Math.round((m.balance - amount) * 100) / 100,
              totalConsumption: Math.round((m.totalConsumption + amount) * 100) / 100,
              visitCount: m.visitCount + 1,
              lastVisitAt: Date.now()
            }
          : m
      )
    }));
    console.log(`[MemberStore] 会员 ${member.memberNo} 消费扣减 ${amount}, 余额: ${member.balance - amount}`);
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
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId
          ? { ...m, balance: Math.round((m.balance + amount) * 100) / 100 }
          : m
      )
    }));
    console.log(`[MemberStore] 会员 ${memberId} 充值 ${amount}`);
  },

  getMemberLevelText: (level) => levelTextMap[level],

  getMemberLevelColor: (level) => levelColorMap[level]
}));
