import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useBillingStore } from '@/store/billingStore';
import { useMemberStore } from '@/store/memberStore';
import { Bill, RoomType, PaymentMethod } from '@/types';
import { formatCurrency, formatDuration, getRoomTypeText, getPaymentMethodText } from '@/utils/format';
import BillItem from '@/components/BillItem';
import EmptyState from '@/components/EmptyState';

type PeriodType = 'today' | 'week' | 'month' | 'custom';
type FilterKey = 'all' | RoomType | PaymentMethod | 'member' | 'nonMember';

const PERIOD_OPTIONS: Array<{ key: PeriodType; label: string }> = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'custom', label: '自定义' }
];

const ROOM_TYPES: RoomType[] = ['standard', 'deluxe', 'vip', 'theme'];
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

  const totalRevenue = useMemo(() => {
    return periodBills.reduce((sum, b) => sum + b.total, 0);
  }, [periodBills]);

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
    return periodBills.filter((b) => {
      if (activeFilterKey === 'all') return true;
      if (ROOM_TYPES.includes(activeFilterKey as RoomType)) return b.roomType === activeFilterKey;
      if (PAYMENT_METHODS.includes(activeFilterKey as PaymentMethod)) return (b.paymentMethod || 'cash') === activeFilterKey;
      if (activeFilterKey === 'member') return !!b.memberId;
      if (activeFilterKey === 'nonMember') return !b.memberId;
      return true;
    });
  }, [periodBills, activeFilterKey]);

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
    if (ROOM_TYPES.includes(key as RoomType)) return getRoomTypeText(key as RoomType);
    if (PAYMENT_METHODS.includes(key as PaymentMethod)) return getPaymentMethodText(key as PaymentMethod);
    if (key === 'member') return '会员消费';
    if (key === 'nonMember') return '非会员';
    return '';
  };

  const isActiveFilter = (key: FilterKey) => activeFilterKey === key;

  const maxRoomRevenue = Math.max(...roomTypeStats.map((s) => s.revenue), 1);
  const maxPaymentRevenue = Math.max(...paymentStats.map((s) => s.revenue), 1);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>经营报表</Text>
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
              筛选 {filteredBills.length} 条
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
          <View className={styles.statCard}>
            <Text className={styles.statIcon}>🌙</Text>
            <Text className={styles.statValue}>{overnightRatio}%</Text>
            <Text className={styles.statLabel}>包夜占比</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statIcon}>⏱️</Text>
            <Text className={styles.statValue}>{formatDuration(avgDuration)}</Text>
            <Text className={styles.statLabel}>平均时长</Text>
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
            className={classNames(styles.statCard, isActiveFilter('member') && styles.cardActive)}
            onClick={() => handleFilterClick('member')}
          >
            <Text className={styles.statIcon}>💎</Text>
            <Text className={styles.statValue}>{formatCurrency(memberStats.revenue)}</Text>
            <Text className={styles.statLabel}>会员消费额</Text>
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
            <Text className={styles.sectionTitle}>账单明细</Text>
            <Text className={styles.toggleText} onClick={handleViewBills}>
              {showBillList ? '收起' : `查看全部 (${filteredBills.length})`}
            </Text>
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
          {showBillList && (
            filteredBills.length > 0 ? (
              <View className={styles.billList}>
                {filteredBills.map((bill) => (
                  <BillItem
                    key={bill.id}
                    bill={bill}
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
