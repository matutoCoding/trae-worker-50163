import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useBillingStore } from '@/store/billingStore';
import { useMemberStore } from '@/store/memberStore';
import { Bill, RoomType, PaymentMethod, MemberTransaction } from '@/types';
import {
  formatCurrency,
  formatDuration,
  getRoomTypeText,
  getPaymentMethodText,
  formatDateTime
} from '@/utils/format';
import BillItem from '@/components/BillItem';
import EmptyState from '@/components/EmptyState';

type PeriodType = 'today' | 'week' | 'month' | 'custom';
type FilterKey =
  | 'all'
  | RoomType
  | PaymentMethod
  | 'member'
  | 'nonMember'
  | 'overnight'
  | 'longDuration'
  | 'shortDuration'
  | 'memberRecharge';

const PERIOD_OPTIONS: Array<{ key: PeriodType; label: string }> = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'custom', label: '自定义' }
];

const ROOM_TYPES: RoomType[] = ['standard', 'deluxe', 'vip', 'presidential'];
const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'wechat', 'alipay', 'card', 'member'];

const ReportPage: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<PeriodType>('today');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [showBillList, setShowBillList] = useState(true);

  const [activeFilterKey, setActiveFilterKey] = useState<FilterKey>('all');

  const bills = useBillingStore((s) => s.bills);
  const transactions = useMemberStore((s) => s.transactions);
  const getMemberById = useMemberStore((s) => s.getMemberById);

  const getPeriodRange = (period: PeriodType): [number, number] => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    if (period === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return [start.getTime(), end.getTime()];
    }

    if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      return [start.getTime(), end.getTime()];
    }

    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return [start.getTime(), end.getTime()];
    }

    const s = new Date(customStart);
    s.setHours(0, 0, 0, 0);
    const e = new Date(customEnd);
    e.setHours(23, 59, 59, 999);
    return [s.getTime(), e.getTime()];
  };

  const [startTime, endTime] = useMemo(
    () => getPeriodRange(activePeriod),
    [activePeriod, customStart, customEnd]
  );

  const periodBills = useMemo(() => {
    return bills.filter((b) => {
      if (b.status !== 'paid') return false;
      const closedAt = b.closedAt || 0;
      return closedAt >= startTime && closedAt <= endTime;
    });
  }, [bills, startTime, endTime]);

  const periodRecharges = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'recharge') return false;
      return t.createdAt >= startTime && t.createdAt <= endTime;
    });
  }, [transactions, startTime, endTime]);

  const totalRevenue = useMemo(() => {
    return periodBills.reduce((sum, b) => sum + b.total, 0);
  }, [periodBills]);

  const totalRecharge = useMemo(() => {
    return periodRecharges.reduce((sum, t) => sum + t.amount, 0);
  }, [periodRecharges]);

  const billCount = periodBills.length;

  const overnightCount = useMemo(() => {
    return periodBills.filter((b) => b.overnightApplied).length;
  }, [periodBills]);

  const overnightRatio = useMemo(() => {
    if (billCount === 0) return 0;
    return Math.round((overnightCount / billCount) * 100);
  }, [billCount, overnightCount]);

  const roomTypeStats = useMemo(() => {
    const map = new Map<RoomType, { count: number; revenue: number }>();
    periodBills.forEach((b) => {
      const existing = map.get(b.roomType) || { count: 0, revenue: 0 };
      map.set(b.roomType, { count: existing.count + 1, revenue: existing.revenue + b.total });
    });
    return Array.from(map.entries())
      .map(([type, data]) => ({ type, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.count - a.count);
  }, [periodBills]);

  const popularType = roomTypeStats[0];

  const totalDuration = useMemo(() => {
    return periodBills.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);
  }, [periodBills]);

  const avgDuration = useMemo(() => {
    if (billCount === 0) return 0;
    return Math.round(totalDuration / billCount);
  }, [billCount, totalDuration]);

  const paymentStats = useMemo(() => {
    const map = new Map<PaymentMethod, { count: number; revenue: number }>();
    periodBills.forEach((b) => {
      const method = b.paymentMethod || 'cash';
      const existing = map.get(method) || { count: 0, revenue: 0 };
      map.set(method, { count: existing.count + 1, revenue: existing.revenue + b.total });
    });
    return Array.from(map.entries())
      .map(([method, data]) => ({ method, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [periodBills]);

  const memberStats = useMemo(() => {
    const memberBills = periodBills.filter((b) => b.memberId);
    const memberRevenue = memberBills.reduce((sum, b) => sum + b.total, 0);
    const count = memberBills.length;
    return {
      count,
      revenue: memberRevenue,
      countRatio: billCount > 0 ? Math.round((count / billCount) * 100) : 0,
      revenueRatio: totalRevenue > 0 ? Math.round((memberRevenue / totalRevenue) * 100) : 0
    };
  }, [periodBills, billCount, totalRevenue]);

  const filteredBills = useMemo(() => {
    let list = [...periodBills];
    if (activeFilterKey === 'all') return list;
    if ((ROOM_TYPES as string[]).includes(activeFilterKey as string))
      return list.filter((b) => b.roomType === activeFilterKey);
    if ((PAYMENT_METHODS as string[]).includes(activeFilterKey as string))
      return list.filter((b) => (b.paymentMethod || 'cash') === activeFilterKey);
    if (activeFilterKey === 'member') return list.filter((b) => !!b.memberId);
    if (activeFilterKey === 'nonMember') return list.filter((b) => !b.memberId);
    if (activeFilterKey === 'overnight') return list.filter((b) => b.overnightApplied);
    if (activeFilterKey === 'longDuration')
      return list.filter((b) => (b.durationMinutes || 0) >= avgDuration && avgDuration > 0);
    if (activeFilterKey === 'shortDuration')
      return list.filter((b) => (b.durationMinutes || 0) < avgDuration);
    return list;
  }, [periodBills, activeFilterKey, avgDuration]);

  const handleViewBills = () => {
    setShowBillList(!showBillList);
  };

  const handleBillDetail = (billId: string) => {
    Taro.navigateTo({
      url: `/pages/billDetail/index?id=${billId}`
    });
  };

  const handleFilterClick = (key: FilterKey) => {
    setActiveFilterKey(activeFilterKey === key ? 'all' : key);
  };

  const getFilterLabel = (key: FilterKey): string => {
    if (key === 'all') return '全部';
    if ((ROOM_TYPES as string[]).includes(key as string)) return getRoomTypeText(key as RoomType);
    if ((PAYMENT_METHODS as string[]).includes(key as string)) return getPaymentMethodText(key as PaymentMethod);
    const labelMap: Record<string, string> = {
      member: '会员消费',
      nonMember: '非会员消费',
      overnight: '包夜账单',
      longDuration: `长时消费（≥${formatDuration(avgDuration)}）`,
      shortDuration: `短时消费（<${formatDuration(avgDuration)}）`,
      memberRecharge: '会员充值'
    };
    return labelMap[key] || '';
  };

  const isActiveFilter = (key: FilterKey) => activeFilterKey === key;

  const maxRoomRevenue = Math.max(...roomTypeStats.map((s) => s.revenue), 1);
  const maxPaymentRevenue = Math.max(...paymentStats.map((s) => s.revenue), 1);

  const generateReportText = (): string => {
    const periodLabel = PERIOD_OPTIONS.find((p) => p.key === activePeriod)?.label || '自定义';
    const dateRange = `${new Date(startTime).toLocaleDateString()} ~ ${new Date(endTime).toLocaleDateString()}`;

    let text = `【棋牌室经营报表 - ${periodLabel}】\n`;
    text += `统计周期：${dateRange}\n`;
    text += `生成时间：${new Date().toLocaleString()}\n`;
    text += '-----------------------------------\n';
    text += `总营收：${formatCurrency(totalRevenue)}\n`;
    text += `订单数：${billCount} 笔\n`;
    text += `平均时长：${formatDuration(avgDuration)}\n`;
    text += `包夜占比：${overnightRatio}%\n`;
    text += `会员储值充值：${formatCurrency(totalRecharge)} (${periodRecharges.length} 笔)\n`;
    text += '\n--- 支付方式汇总 ---\n';
    paymentStats.forEach((p) => {
      text += `${getPaymentMethodText(p.method)}：${formatCurrency(p.revenue)} (${p.count}笔)\n`;
    });
    text += '\n--- 包间类型汇总 ---\n';
    roomTypeStats.forEach((r) => {
      text += `${getRoomTypeText(r.type)}：${formatCurrency(r.revenue)} (${r.count}笔)\n`;
    });
    if (activeFilterKey !== 'all' && filteredBills.length > 0) {
      text += `\n--- 当前筛选：${getFilterLabel(activeFilterKey)} (${filteredBills.length}笔) ---\n`;
      filteredBills.forEach((b, i) => {
        const methodText = b.paymentMethod ? getPaymentMethodText(b.paymentMethod) : '现金';
        text += `${i + 1}. ${b.roomName} ${formatCurrency(b.total)} ${methodText} ${formatDuration(b.durationMinutes || 0)}\n`;
      });
    }
    return text;
  };

  const handleCopyReport = async () => {
    const text = generateReportText();
    try {
      await Taro.setClipboardData({ data: text });
      Taro.showToast({ title: '报表已复制', icon: 'success' });
    } catch (e) {
      Taro.showModal({
        title: '报表数据',
        content: text,
        showCancel: false
      });
    }
  };

  const handleExportBills = async () => {
    let text = `【账单明细 - ${PERIOD_OPTIONS.find((p) => p.key === activePeriod)?.label || '自定义'}】\n`;
    text += `包间,开台时间,结账时间,时长,金额,支付方式,会员\n`;
    (activeFilterKey !== 'all' ? filteredBills : periodBills).forEach((b) => {
      const memberText = b.memberName ? `${b.memberName}(${b.memberNo || b.memberId})` : '散客';
      text += `${b.roomName},${formatDateTime(b.startTime)},${formatDateTime(b.closedAt || 0)},${formatDuration(b.durationMinutes || 0)},${b.total.toFixed(2)},${getPaymentMethodText(b.paymentMethod || 'cash')},${memberText}\n`;
    });
    try {
      await Taro.setClipboardData({ data: text });
      Taro.showToast({ title: '账单明细已复制', icon: 'success' });
    } catch (e) {
      Taro.showModal({
        title: '账单明细 (CSV)',
        content: text,
        showCancel: false
      });
    }
  };

  const isRechargeView = activeFilterKey === 'memberRecharge';

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerRow}>
          <Text className={styles.pageTitle}>经营报表</Text>
          <View className={styles.headerActions}>
            <Text className={styles.actionBtn} onClick={handleCopyReport}>
              📋 复制报表
            </Text>
          </View>
        </View>
        <View className={styles.periodTabs}>
          {PERIOD_OPTIONS.map((opt) => (
            <Text
              key={opt.key}
              className={classNames(
                styles.periodTab,
                activePeriod === opt.key && styles.active
              )}
              onClick={() => setActivePeriod(opt.key)}
            >
              {opt.label}
            </Text>
          ))}
        </View>

        {activePeriod === 'custom' && (
          <View className={styles.customRange}>
            <View className={styles.dateInput}>
              <Text className={styles.dateLabel}>开始</Text>
              <Input
                type='text'
                className={styles.dateField}
                value={customStart}
                onInput={(e) => setCustomStart(e.detail.value)}
                placeholder='YYYY-MM-DD'
              />
            </View>
            <Text className={styles.dateSep}>~</Text>
            <View className={styles.dateInput}>
              <Text className={styles.dateLabel}>结束</Text>
              <Input
                type='text'
                className={styles.dateField}
                value={customEnd}
                onInput={(e) => setCustomEnd(e.detail.value)}
                placeholder='YYYY-MM-DD'
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.revenueCard}>
          <Text className={styles.revenueLabel}>总营收</Text>
          <Text className={styles.revenueValue}>{formatCurrency(totalRevenue)}</Text>
          <View className={styles.revenueMeta}>
            <Text className={styles.metaItem}>
              {billCount} 笔订单
            </Text>
            <Text className={styles.metaDivider}>·</Text>
            <Text className={styles.metaItem}>
              平均 {formatDuration(avgDuration)}
            </Text>
            <Text className={styles.metaDivider}>·</Text>
            <Text className={styles.metaItem}>
              储值充值 {formatCurrency(totalRecharge)}
            </Text>
          </View>
        </View>

        <View className={styles.statsGrid}>
          <View
            className={classNames(styles.statCard, isActiveFilter('all') && styles.cardActive)}
            onClick={() => handleFilterClick('all')}
          >
            <Text className={styles.statIcon}>📋</Text>
            <Text className={styles.statValue}>{billCount}</Text>
            <Text className={styles.statLabel}>开台次数</Text>
          </View>
          <View
            className={classNames(styles.statCard, isActiveFilter('overnight') && styles.cardActive)}
            onClick={() => handleFilterClick('overnight')}
          >
            <Text className={styles.statIcon}>🌙</Text>
            <Text className={styles.statValue}>{overnightRatio}%</Text>
            <Text className={styles.statLabel}>包夜占比</Text>
            <Text className={styles.statHint}>点击查看包夜账单</Text>
          </View>
          <View
            className={classNames(styles.statCard, isActiveFilter('longDuration') && styles.cardActive)}
            onClick={() => avgDuration > 0 && handleFilterClick('longDuration')}
          >
            <Text className={styles.statIcon}>⏱️</Text>
            <Text className={styles.statValue}>{formatDuration(avgDuration)}</Text>
            <Text className={styles.statLabel}>平均时长</Text>
            <Text className={styles.statHint}>点击查看长时消费</Text>
          </View>
          <View
            className={classNames(styles.statCard, popularType && isActiveFilter(popularType.type) && styles.cardActive)}
            onClick={() => popularType && handleFilterClick(popularType.type)}
          >
            <Text className={styles.statIcon}>🏆</Text>
            <Text className={styles.statValue}>{popularType ? getRoomTypeText(popularType.type) : '-'}</Text>
            <Text className={styles.statLabel}>热门类型</Text>
          </View>
        </View>

        <View className={styles.statsGrid}>
          <View
            className={classNames(styles.statCard, isActiveFilter('member') && styles.cardActive)}
            onClick={() => handleFilterClick('member')}
          >
            <Text className={styles.statIcon}>👑</Text>
            <Text className={styles.statValue}>{memberStats.countRatio}%</Text>
            <Text className={styles.statLabel}>会员订单占比</Text>
          </View>
          <View
            className={classNames(styles.statCard, isActiveFilter('member') && styles.cardActive)}
            onClick={() => handleFilterClick('member')}
          >
            <Text className={styles.statIcon}>💰</Text>
            <Text className={styles.statValue}>{memberStats.revenueRatio}%</Text>
            <Text className={styles.statLabel}>会员营收占比</Text>
          </View>
          <View
            className={classNames(styles.statCard, isActiveFilter('nonMember') && styles.cardActive)}
            onClick={() => handleFilterClick('nonMember')}
          >
            <Text className={styles.statIcon}>🎯</Text>
            <Text className={styles.statValue}>{billCount - memberStats.count}</Text>
            <Text className={styles.statLabel}>散客订单</Text>
          </View>
          <View
            className={classNames(styles.statCard, isActiveFilter('memberRecharge') && styles.cardActive)}
            onClick={() => handleFilterClick('memberRecharge')}
          >
            <Text className={styles.statIcon}>💎</Text>
            <Text className={styles.statValue}>{formatCurrency(totalRecharge)}</Text>
            <Text className={styles.statLabel}>储值充值额</Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>对账汇总</Text>
            <Text className={styles.sectionHint}>支付方式 + 储值充值</Text>
          </View>

          <View className={styles.reconcileGrid}>
            {PAYMENT_METHODS.map((m) => {
              const stat = paymentStats.find((p) => p.method === m);
              return (
                <View
                  key={m}
                  className={classNames(
                    styles.reconcileItem,
                    isActiveFilter(m) && styles.reconcileActive
                  )}
                  onClick={() => handleFilterClick(m)}
                >
                  <Text className={styles.reconcileLabel}>{getPaymentMethodText(m)}</Text>
                  <Text className={styles.reconcileValue}>
                    {formatCurrency(stat?.revenue || 0)}
                  </Text>
                  <Text className={styles.reconcileCount}>{stat?.count || 0} 笔</Text>
                </View>
              );
            })}
            <View
              className={classNames(
                styles.reconcileItem,
                styles.reconcileRecharge,
                isActiveFilter('memberRecharge') && styles.reconcileActive
              )}
              onClick={() => handleFilterClick('memberRecharge')}
            >
              <Text className={styles.reconcileLabel}>💳 储值充值</Text>
              <Text className={styles.reconcileValue}>
                {formatCurrency(totalRecharge)}
              </Text>
              <Text className={styles.reconcileCount}>{periodRecharges.length} 笔</Text>
            </View>
          </View>

          <View className={styles.reconcileTotal}>
            <Text className={styles.reconcileTotalLabel}>
              合计（含充值）
            </Text>
            <Text className={styles.reconcileTotalValue}>
              {formatCurrency(totalRevenue + totalRecharge)}
            </Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>包间类型分布</Text>
            <Text className={styles.sectionHint}>点击类型可筛选账单</Text>
          </View>
          {roomTypeStats.length > 0 ? (
            <View className={styles.typeList}>
              {roomTypeStats.map((item, index) => {
                const percentage = billCount > 0 ? Math.round((item.count / billCount) * 100) : 0;
                const revenuePercent = Math.round((item.revenue / maxRoomRevenue) * 100);
                const active = isActiveFilter(item.type);
                return (
                  <View
                    key={item.type}
                    className={classNames(styles.typeItem, active && styles.active)}
                    onClick={() => handleFilterClick(item.type)}
                  >
                    <View className={styles.typeHeader}>
                      <View className={styles.typeLeft}>
                        <Text className={styles.typeRank}>{index + 1}</Text>
                        <Text className={styles.typeName}>{getRoomTypeText(item.type)}</Text>
                      </View>
                      <View className={styles.typeRight}>
                        <Text className={styles.typeCount}>{item.count} 笔</Text>
                        <Text className={styles.typePercent}>{percentage}%</Text>
                        <Text className={styles.typeRevenue}>{formatCurrency(item.revenue)}</Text>
                      </View>
                    </View>
                    <View className={styles.progressBar}>
                      <View
                        className={classNames(
                          styles.progressFill,
                          index === 0 && styles.first
                        )}
                        style={{ width: `${revenuePercent}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState icon="📊" title="暂无数据" description="该时间段内暂无统计数据" />
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>支付方式分布</Text>
            <Text className={styles.sectionHint}>点击方式可筛选账单</Text>
          </View>
          {paymentStats.length > 0 ? (
            <View className={styles.typeList}>
              {paymentStats.map((item, index) => {
                const countPercent = billCount > 0 ? Math.round((item.count / billCount) * 100) : 0;
                const revenuePercent = Math.round((item.revenue / maxPaymentRevenue) * 100);
                const active = isActiveFilter(item.method);
                return (
                  <View
                    key={item.method}
                    className={classNames(styles.typeItem, active && styles.active)}
                    onClick={() => handleFilterClick(item.method)}
                  >
                    <View className={styles.typeHeader}>
                      <View className={styles.typeLeft}>
                        <Text className={styles.typeRank}>{index + 1}</Text>
                        <Text className={styles.typeName}>{getPaymentMethodText(item.method)}</Text>
                        {item.method === 'member' && (
                          <Text className={styles.memberBadge}>储值</Text>
                        )}
                      </View>
                      <View className={styles.typeRight}>
                        <Text className={styles.typeCount}>{item.count} 笔</Text>
                        <Text className={styles.typePercent}>{countPercent}%</Text>
                        <Text className={styles.typeRevenue}>{formatCurrency(item.revenue)}</Text>
                      </View>
                    </View>
                    <View className={styles.progressBar}>
                      <View
                        className={classNames(
                          styles.progressFill,
                          item.method === 'member' && styles.member
                        )}
                        style={{ width: `${revenuePercent}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState icon="💳" title="暂无支付数据" description="该时间段内暂无支付记录" />
          )}
        </View>

        <View className={styles.filterBar}>
          <Text className={styles.filterTitle}>筛选条件</Text>
          <View className={styles.filterChips}>
            <Text
              className={classNames(styles.chip, isActiveFilter('all') && styles.chipActive)}
              onClick={() => handleFilterClick('all')}
            >
              全部
            </Text>
            <Text
              className={classNames(styles.chip, isActiveFilter('member') && styles.chipActive)}
              onClick={() => handleFilterClick('member')}
            >
              👑 会员
            </Text>
            <Text
              className={classNames(styles.chip, isActiveFilter('nonMember') && styles.chipActive)}
              onClick={() => handleFilterClick('nonMember')}
            >
              🎯 散客
            </Text>
            <Text
              className={classNames(styles.chip, isActiveFilter('overnight') && styles.chipActive)}
              onClick={() => handleFilterClick('overnight')}
            >
              🌙 包夜
            </Text>
            <Text
              className={classNames(styles.chip, isActiveFilter('longDuration') && styles.chipActive)}
              onClick={() => avgDuration > 0 && handleFilterClick('longDuration')}
            >
              ⏱️ 长时
            </Text>
            <Text
              className={classNames(styles.chip, isActiveFilter('shortDuration') && styles.chipActive)}
              onClick={() => avgDuration > 0 && handleFilterClick('shortDuration')}
            >
              ⚡ 短时
            </Text>
          </View>
          <View className={styles.filterChips}>
            {ROOM_TYPES.map((t) => (
              <Text
                key={t}
                className={classNames(styles.chip, isActiveFilter(t) && styles.chipActive)}
                onClick={() => handleFilterClick(t)}
              >
                {getRoomTypeText(t)}
              </Text>
            ))}
          </View>
          <View className={styles.filterChips}>
            {PAYMENT_METHODS.map((m) => (
              <Text
                key={m}
                className={classNames(styles.chip, isActiveFilter(m) && styles.chipActive)}
                onClick={() => handleFilterClick(m)}
              >
                {getPaymentMethodText(m)}
              </Text>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              {isRechargeView ? '储值充值明细' : '账单明细'}
            </Text>
            <View className={styles.sectionActions}>
              <Text
                className={styles.exportBtn}
                onClick={handleExportBills}
              >
                📤 导出
              </Text>
              <Text className={styles.toggleText} onClick={handleViewBills}>
                {showBillList ? '收起' : `查看 (${isRechargeView ? periodRecharges.length : filteredBills.length})`}
              </Text>
            </View>
          </View>
          {activeFilterKey !== 'all' && (
            <View className={styles.activeFilterTag}>
              <Text>当前筛选：</Text>
              <Text className={styles.filterTagText}>{getFilterLabel(activeFilterKey)}</Text>
              <Text className={styles.clearFilter} onClick={() => setActiveFilterKey('all')}>
                ✕ 清除
              </Text>
            </View>
          )}
          {showBillList && isRechargeView && (
            periodRecharges.length > 0 ? (
              <View className={styles.billList}>
                {periodRecharges.map((tx) => {
                  const member = getMemberById(tx.memberId);
                  return (
                    <View key={tx.id} className={styles.rechargeItem}>
                      <View className={styles.rechargeLeft}>
                        <Text className={styles.rechargeIcon}>💰</Text>
                        <View>
                          <Text className={styles.rechargeTitle}>
                            {member?.name || '会员'} 储值充值
                          </Text>
                          <Text className={styles.rechargeMeta}>
                            {member?.memberNo} · {formatDateTime(tx.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View className={styles.rechargeRight}>
                        <Text className={styles.rechargeAmount}>
                          +{formatCurrency(tx.amount)}
                        </Text>
                        <Text className={styles.rechargeBalance}>
                          余额 {formatCurrency(tx.balanceAfter)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <EmptyState icon="💎" title="暂无充值记录" description="该时间段内暂无会员储值充值" />
            )
          )}
          {showBillList && !isRechargeView && (
            filteredBills.length > 0 ? (
              <View className={styles.billList}>
                {filteredBills.map((bill) => (
                  <BillItem
                    key={bill.id}
                    bill={bill}
                    onViewDetail={() => handleBillDetail(bill.id)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState icon="📋" title="暂无账单" description={activeFilterKey !== 'all' ? '当前筛选条件下暂无匹配账单' : '该时间段内暂无已支付账单'} />
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ReportPage;
