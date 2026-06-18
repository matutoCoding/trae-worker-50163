import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useBillingStore } from '@/store/billingStore';
import { Bill, RoomType } from '@/types';
import { formatCurrency, formatDuration, getRoomTypeText } from '@/utils/format';
import BillItem from '@/components/BillItem';
import EmptyState from '@/components/EmptyState';

type PeriodType = 'today' | 'week' | 'month';

const PERIOD_OPTIONS: Array<{ key: PeriodType; label: string }> = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' }
];

const ReportPage: React.FC = () => {
  const [activePeriod, setActivePeriod] = useState<PeriodType>('today');
  const [showBillList, setShowBillList] = useState(false);

  const bills = useBillingStore((s) => s.bills);
  const getBillById = useBillingStore((s) => s.getBillById);

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
      const start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      return [start.getTime(), end.getTime()];
    }

    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return [start.getTime(), end.getTime()];
  };

  const [startTime, endTime] = useMemo(
    () => getPeriodRange(activePeriod),
    [activePeriod]
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
    const map = new Map<RoomType, number>();
    periodBills.forEach((b) => {
      const count = map.get(b.roomType) || 0;
      map.set(b.roomType, count + 1);
    });
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
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

  const handleViewBills = () => {
    setShowBillList(!showBillList);
  };

  const handleBillDetail = (billId: string) => {
    Taro.navigateTo({
      url: `/pages/billDetail/index?id=${billId}`
    });
  };

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
          </View>
        </View>

        <View className={styles.statsGrid}>
          <View className={styles.statCard}>
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
          <View className={styles.statCard}>
            <Text className={styles.statIcon}>🏆</Text>
            <Text className={styles.statValue}>{popularType ? getRoomTypeText(popularType.type) : '-'}</Text>
            <Text className={styles.statLabel}>热门类型</Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>包间类型分布</Text>
          </View>
          {roomTypeStats.length > 0 ? (
            <View className={styles.typeList}>
              {roomTypeStats.map((item, index) => {
                const percentage = billCount > 0 ? Math.round((item.count / billCount) * 100) : 0;
                return (
                  <View key={item.type} className={styles.typeItem}>
                    <View className={styles.typeHeader}>
                      <View className={styles.typeLeft}>
                        <Text className={styles.typeRank}>{index + 1}</Text>
                        <Text className={styles.typeName}>{getRoomTypeText(item.type)}</Text>
                      </View>
                      <View className={styles.typeRight}>
                        <Text className={styles.typeCount}>{item.count} 笔</Text>
                        <Text className={styles.typePercent}>{percentage}%</Text>
                      </View>
                    </View>
                    <View className={styles.progressBar}>
                      <View
                        className={classNames(
                          styles.progressFill,
                          index === 0 && styles.first
                        )}
                        style={{ width: `${percentage}%` }}
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
            <Text className={styles.sectionTitle}>账单明细</Text>
            <Text className={styles.toggleText} onClick={handleViewBills}>
              {showBillList ? '收起' : `查看全部 (${billCount})`}
            </Text>
          </View>
          {showBillList && (
            billCount > 0 ? (
              <View className={styles.billList}>
                {periodBills.map((bill) => (
                  <BillItem
                    key={bill.id}
                    bill={bill}
                  />
                ))}
              </View>
            ) : (
              <EmptyState icon="📋" title="暂无账单" description="该时间段内暂无已支付账单" />
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ReportPage;
