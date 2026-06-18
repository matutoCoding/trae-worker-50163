import dayjs from 'dayjs';
import { RoomStatus, RoomType } from '@/types';

export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card';
export type BillStatus = 'open' | 'paid' | 'cancelled' | 'refunded';

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分钟`;
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatDateTime(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm');
}

export function formatTime(timestamp: number): string {
  return dayjs(timestamp).format('HH:mm');
}

export function formatDate(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD');
}

export function getRoomStatusText(status: RoomStatus): string {
  const map: Record<RoomStatus, string> = {
    idle: '空闲',
    using: '使用中',
    overnight: '包夜中',
    reserved: '已预订',
    maintenance: '维护中'
  };
  return map[status];
}

export function getRoomTypeText(type: RoomType): string {
  const map: Record<RoomType, string> = {
    standard: '标准间',
    deluxe: '豪华间',
    vip: 'VIP包间',
    presidential: '总统套房'
  };
  return map[type];
}

export function getRoomStatusColor(status: RoomStatus): string {
  const map: Record<RoomStatus, string> = {
    idle: '#00B42A',
    using: '#FF7D00',
    overnight: '#722ED1',
    reserved: '#165DFF',
    maintenance: '#86909C'
  };
  return map[status];
}

export function getLoadLevelText(level: string): string {
  const map: Record<string, string> = {
    low: '空闲',
    medium: '正常',
    high: '繁忙',
    critical: '爆满'
  };
  return map[level] || '未知';
}

export function getLoadLevelColor(level: string): string {
  const map: Record<string, string> = {
    low: '#00B42A',
    medium: '#165DFF',
    high: '#FF7D00',
    critical: '#F53F3F'
  };
  return map[level] || '#86909C';
}

export function generateTicketNo(roomType: RoomType, seq: number): string {
  const prefix: Record<RoomType, string> = {
    standard: 'A',
    deluxe: 'B',
    vip: 'V',
    presidential: 'P'
  };
  return `${prefix[roomType]}${String(seq).padStart(3, '0')}`;
}

export function getPaymentMethodText(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    cash: '现金',
    wechat: '微信支付',
    alipay: '支付宝',
    card: '银行卡'
  };
  return map[method];
}

export function getBillStatusText(status: BillStatus): string {
  const map: Record<BillStatus, string> = {
    open: '进行中',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款'
  };
  return map[status];
}
