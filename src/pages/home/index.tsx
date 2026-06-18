import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useRoomStore } from '@/store/roomStore';
import { useBillingStore } from '@/store/billingStore';
import { RoomStatus } from '@/types';
import { formatCurrency } from '@/utils/format';
import StatCard from '@/components/StatCard';
import RoomCard from '@/components/RoomCard';
import EmptyState from '@/components/EmptyState';

const FILTERS: Array<{ key: RoomStatus | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'idle', label: '空闲' },
  { key: 'using', label: '使用中' },
  { key: 'overnight', label: '包夜中' },
  { key: 'maintenance', label: '维护中' }
];

const HomePage: React.FC = () => {
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all');
  const rooms = useRoomStore((s) => s.rooms);
  const roomStats = useRoomStore((s) => s.getRoomStats());
  const todayRevenue = useBillingStore((s) => s.getTodayRevenue());
  const todayBillCount = useBillingStore((s) => s.getTodayBillCount());

  const filteredRooms = useMemo(() => {
    if (filter === 'all') return rooms;
    return rooms.filter((r) => r.status === filter);
  }, [rooms, filter]);

  const handleRefresh = () => {
    Taro.showToast({ title: '刷新成功', icon: 'success' });
    Taro.stopPullDownRefresh();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'openRoom':
        Taro.navigateTo({ url: '/pages/openRoom/index' });
        break;
      case 'queue':
        Taro.switchTab({ url: '/pages/queue/index' });
        break;
      case 'billing':
        Taro.switchTab({ url: '/pages/billing/index' });
        break;
      case 'report':
        Taro.navigateTo({ url: '/pages/report/index' });
        break;
      case 'settings':
        Taro.switchTab({ url: '/pages/settings/index' });
        break;
    }
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={false}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.header}>
        <Text className={styles.greeting}>欢迎回来，管理员</Text>
        <Text className={styles.title}>棋牌室管理系统</Text>
      </View>

      <View className={styles.statsSection}>
        <View className={styles.revenueCard}>
          <View className={styles.revenueHeader}>
            <Text className={styles.revenueLabel}>今日营收</Text>
            <Text className={styles.revenueIcon}>💰</Text>
          </View>
          <Text className={styles.revenueValue}>{formatCurrency(todayRevenue)}</Text>
          <Text className={styles.revenueSub}>已完成 {todayBillCount} 笔订单</Text>
        </View>

        <View className={styles.statsGrid}>
          <StatCard
            label="空闲包间"
            value={roomStats.idle}
            variant="success"
            icon="🟢"
            subText={`共 ${roomStats.total} 间`}
          />
          <StatCard
            label="使用中"
            value={roomStats.using}
            variant="warning"
            icon="🟠"
          />
          <StatCard
            label="包夜中"
            value={roomStats.overnight}
            variant="overnight"
            icon="🟣"
          />
        </View>
      </View>

      <View className={styles.statsSection}>
        <View className={styles.quickActions}>
          <View
            className={styles.actionCard}
            onClick={() => handleQuickAction('openRoom')}
          >
            <Text className={styles.actionIcon}>🎯</Text>
            <Text className={styles.actionText}>快速开台</Text>
          </View>
          <View
            className={styles.actionCard}
            onClick={() => handleQuickAction('queue')}
          >
            <Text className={styles.actionIcon}>📣</Text>
            <Text className={styles.actionText}>叫号排队</Text>
          </View>
          <View
            className={styles.actionCard}
            onClick={() => handleQuickAction('billing')}
          >
            <Text className={styles.actionIcon}>💳</Text>
            <Text className={styles.actionText}>账单管理</Text>
          </View>
          <View
            className={styles.actionCard}
            onClick={() => handleQuickAction('report')}
          >
            <Text className={styles.actionIcon}>📊</Text>
            <Text className={styles.actionText}>经营报表</Text>
          </View>
          <View
            className={styles.actionCard}
            onClick={() => handleQuickAction('settings')}
          >
            <Text className={styles.actionIcon}>⚙️</Text>
            <Text className={styles.actionText}>系统设置</Text>
          </View>
        </View>
      </View>

      <View className={styles.roomSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>包间状态</Text>
          <Text className={styles.sectionAction}>共 {filteredRooms.length} 间</Text>
        </View>

        <ScrollView className={styles.filterTabs} scrollX>
          {FILTERS.map((f) => (
            <Text
              key={f.key}
              className={classNames(styles.filterTab, filter === f.key && styles.active)}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Text>
          ))}
        </ScrollView>

        <View className={styles.roomList}>
          {filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))
          ) : (
            <EmptyState
              icon="🚪"
              title="暂无包间"
              description="当前筛选条件下没有包间"
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
