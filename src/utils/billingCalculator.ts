import dayjs from 'dayjs';
import { BillingRule, BillItem } from '@/types';

export interface BillingResult {
  roomFee: number;
  durationMinutes: number;
  items: BillItem[];
  overnightApplied: boolean;
  startingPriceApplied: boolean;
  ceilingPriceApplied: boolean;
  breakdown: {
    baseFee: number;
    hourlyFee: number;
    overnightFee: number;
    ceilingAdjustment: number;
  };
}

export function isOvernightTime(
  time: number,
  startTime: string,
  endTime: string
): boolean {
  const current = dayjs(time);
  const currentMinutes = current.hour() * 60 + current.minute();

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

export function calculateDurationInOvernight(
  startTime: number,
  endTime: number,
  overnightStart: string,
  overnightEnd: string
): number {
  let totalOvernightMinutes = 0;
  let current = dayjs(startTime);
  const end = dayjs(endTime);

  while (current.isBefore(end)) {
    const nextHour = current.add(1, 'minute');
    const checkTime = nextHour.isAfter(end) ? end.valueOf() : nextHour.valueOf();

    if (isOvernightTime(current.valueOf(), overnightStart, overnightEnd)) {
      totalOvernightMinutes += dayjs(checkTime).diff(current, 'minute');
    }

    current = nextHour;
    if (totalOvernightMinutes > 720) break;
  }

  return totalOvernightMinutes;
}

export function calculateBilling(
  rule: BillingRule,
  startTime: number,
  endTime?: number
): BillingResult {
  const actualEndTime = endTime || Date.now();
  const totalDuration = dayjs(actualEndTime).diff(startTime, 'minute');
  const items: BillItem[] = [];
  let breakdown = {
    baseFee: 0,
    hourlyFee: 0,
    overnightFee: 0,
    ceilingAdjustment: 0
  };
  let overnightApplied = false;
  let startingPriceApplied = false;
  let ceilingPriceApplied = false;

  console.log('[BillingCalculator] 开始计算费用', {
    roomType: rule.roomType,
    startTime: dayjs(startTime).format('YYYY-MM-DD HH:mm'),
    endTime: dayjs(actualEndTime).format('YYYY-MM-DD HH:mm'),
    totalDuration
  });

  if (rule.overnightEnabled) {
    const overnightMinutes = calculateDurationInOvernight(
      startTime,
      actualEndTime,
      rule.overnightStartTime,
      rule.overnightEndTime
    );

    if (overnightMinutes >= 180) {
      overnightApplied = true;
      breakdown.overnightFee = rule.overnightPrice;
      items.push({
        id: `overnight-${Date.now()}`,
        description: '包夜套餐',
        amount: rule.overnightPrice,
        quantity: 1,
        unitPrice: rule.overnightPrice,
        type: 'room'
      });

      const normalMinutes = Math.max(0, totalDuration - overnightMinutes);
      if (normalMinutes > 0) {
        const normalHours = Math.ceil(normalMinutes / 60);
        breakdown.hourlyFee = normalHours * rule.hourlyRate;
        items.push({
          id: `hourly-${Date.now()}`,
          description: `计时费用 (${normalMinutes}分钟)`,
          amount: breakdown.hourlyFee,
          quantity: normalHours,
          unitPrice: rule.hourlyRate,
          type: 'room'
        });
      }

      const totalBeforeCeiling = breakdown.overnightFee + breakdown.hourlyFee;
      console.log('[BillingCalculator] 包夜计算结果', {
        overnightMinutes,
        overnightFee: rule.overnightPrice,
        normalMinutes,
        totalBeforeCeiling
      });

      return {
        roomFee: totalBeforeCeiling,
        durationMinutes: totalDuration,
        items,
        overnightApplied: true,
        startingPriceApplied: false,
        ceilingPriceApplied: false,
        breakdown
      };
    }
  }

  if (totalDuration <= rule.startingMinutes) {
    startingPriceApplied = true;
    breakdown.baseFee = rule.startingPrice;
    items.push({
      id: `start-${Date.now()}`,
      description: `起步价 (${rule.startingMinutes}分钟内)`,
      amount: rule.startingPrice,
      quantity: 1,
      unitPrice: rule.startingPrice,
      type: 'room'
    });

    console.log('[BillingCalculator] 起步价生效', {
      duration: totalDuration,
      startingPrice: rule.startingPrice
    });

    return {
      roomFee: rule.startingPrice,
      durationMinutes: totalDuration,
      items,
      overnightApplied: false,
      startingPriceApplied: true,
      ceilingPriceApplied: false,
      breakdown
    };
  }

  const billableHours = Math.ceil(totalDuration / 60);
  breakdown.hourlyFee = billableHours * rule.hourlyRate;

  items.push({
    id: `hourly-${Date.now()}`,
    description: `计时费用 (${totalDuration}分钟)`,
    amount: breakdown.hourlyFee,
    quantity: billableHours,
    unitPrice: rule.hourlyRate,
    type: 'room'
  });

  let roomFee = breakdown.hourlyFee;

  if (roomFee > rule.ceilingPrice) {
    ceilingPriceApplied = true;
    breakdown.ceilingAdjustment = rule.ceilingPrice - roomFee;
    roomFee = rule.ceilingPrice;

    items.push({
      id: `ceiling-${Date.now()}`,
      description: '封顶价减免',
      amount: breakdown.ceilingAdjustment,
      quantity: 1,
      unitPrice: breakdown.ceilingAdjustment,
      type: 'room'
    });

    console.log('[BillingCalculator] 封顶价生效', {
      hourlyFee: breakdown.hourlyFee,
      ceilingPrice: rule.ceilingPrice,
      finalPrice: roomFee
    });
  }

  console.log('[BillingCalculator] 计算完成', {
    totalDuration,
    billableHours,
    roomFee
  });

  return {
    roomFee,
    durationMinutes: totalDuration,
    items,
    overnightApplied,
    startingPriceApplied,
    ceilingPriceApplied,
    breakdown
  };
}
