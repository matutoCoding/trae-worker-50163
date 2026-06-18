import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useQueueStore } from '@/store/queueStore';
import { QueueTicket, RoomType } from '@/types';
import { getRoomTypeText } from '@/utils/format';
import QueueWindowComp from '@/components/QueueWindow';
import EmptyState from '@/components/EmptyState';

type TicketTab = 'waiting' | 'all';

const STATUS_TEXT: Record<string, string> = {
  waiting: '等待中',
  calling: '叫号中',
  serving: '服务中',
  completed: '已完成',
  cancelled: '已取消'
};

const QueuePage: React.FC = () => {
  const [ticketTab, setTicketTab] = useState<TicketTab>('waiting');

  const windows = useQueueStore((s) => s.windows);
  const tickets = useQueueStore((s) => s.tickets);
  const getLoadBalanceStats = useQueueStore((s) => s.getLoadBalanceStats);
  const getRecommendedWindow = useQueueStore((s) => s.getRecommendedWindow);
  const callNextTicket = useQueueStore((s) => s.callNextTicket);
  const toggleWindowStatus = useQueueStore((s) => s.toggleWindowStatus);
  const confirmTicket = useQueueStore((s) => s.confirmTicket);
  const cancelTicket = useQueueStore((s) => s.cancelTicket);
  const completeTicket = useQueueStore((s) => s.completeTicket);
  const performRedistribution = useQueueStore((s) => s.performRedistribution);
  const createTicket = useQueueStore((s) => s.createTicket);

  const balanceStats = useMemo(() => getLoadBalanceStats(), [tickets, windows]);
  const recommendedWindow = useMemo(() => getRecommendedWindow(), [tickets, windows]);

  const displayTickets = useMemo(() => {
    if (ticketTab === 'waiting') {
      return tickets.filter(
        (t) => t.status === 'waiting' || t.status === 'calling' || t.status === 'serving'
      );
    }
    return tickets;
  }, [tickets, ticketTab]);

  const handleCallNext = (windowId: string) => {
    const ticket = callNextTicket(windowId);
    if (ticket) {
      Taro.showToast({ title: `叫号 ${ticket.ticketNo}`, icon: 'none' });
    } else {
      Taro.showToast({ title: '暂无等待号码', icon: 'none' });
    }
  };

  const handleToggleWindow = (windowId: string) => {
    toggleWindowStatus(windowId);
    Taro.showToast({ title: '状态已更新', icon: 'success' });
  };

  const handleConfirm = (ticketId: string) => {
    confirmTicket(ticketId);
    Taro.showToast({ title: '已确认就位', icon: 'success' });
  };

  const handleCancel = (ticketId: string) => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个号码吗？',
      success: (res) => {
        if (res.confirm) {
          cancelTicket(ticketId);
          Taro.showToast({ title: '已取消', icon: 'success' });
        }
      }
    });
  };

  const handleComplete = (ticketId: string) => {
    completeTicket(ticketId);
    Taro.showToast({ title: '已完成', icon: 'success' });
  };

  const handleRedistribute = () => {
    performRedistribution();
    Taro.showToast({ title: '已执行负载均衡', icon: 'success' });
  };

  const handleCreateTicket = () => {
    Taro.showActionSheet({
      itemList: ['标准间', '豪华间', 'VIP包间', '总统套房'],
      success: (res) => {
        const types: RoomType[] = ['standard', 'deluxe', 'vip', 'presidential'];
        const ticket = createTicket({
          roomType: types[res.tapIndex],
          partySize: 4
        });
        Taro.showToast({
          title: `已取号 ${ticket.ticketNo}`,
          icon: 'success'
        });
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>叫号排队</Text>
        <View className={styles.balanceStats}>
          <View className={styles.balanceItem}>
            <Text className={styles.balanceValue}>{balanceStats.totalWaiting}</Text>
            <View className={styles.balanceLabel}>等待中</View>
          </View>
          <View className={styles.balanceItem}>
            <Text className={styles.balanceValue}>{balanceStats.activeWindows}</Text>
            <View className={styles.balanceLabel}>活跃窗口</View>
          </View>
          <View className={styles.balanceItem}>
            <Text className={styles.balanceValue}>
              {Math.floor(balanceStats.averageWaitTime / 60)}分
            </Text>
            <View className={styles.balanceLabel}>平均等待</View>
          </View>
        </View>
      </View>

      {recommendedWindow && (
        <View className={styles.recommendCard}>
          <View className={styles.recommendHeader}>
            <Text className={styles.recommendIcon}>💡</Text>
            <Text className={styles.recommendTitle}>智能推荐</Text>
          </View>
          <View className={styles.recommendContent}>
            <Text className={styles.recommendWindow}>
              建议前往 窗口{recommendedWindow.windowNo}
            </Text>
            <Text className={styles.recommendHint}>当前最空闲</Text>
          </View>
        </View>
      )}

      <View className={styles.content}>
        <View className={styles.actionBar}>
          <Button
            className={classNames(styles.actionBtn, styles.secondary)}
            onClick={handleRedistribute}
          >
            🔄 负载均衡
          </Button>
          <Button
            className={classNames(styles.actionBtn, styles.primary)}
            onClick={handleCreateTicket}
          >
            ➕ 取号
          </Button>
        </View>

        <Text className={styles.sectionTitle}>前台窗口</Text>
        <View className={styles.windowList}>
          {windows.map((window) => (
            <QueueWindowComp
              key={window.id}
              window={window}
              tickets={tickets}
              isRecommended={recommendedWindow?.id === window.id}
              onCallNext={() => handleCallNext(window.id)}
              onToggleStatus={() => handleToggleWindow(window.id)}
            />
          ))}
        </View>

        <View className={styles.ticketSection}>
          <Text className={styles.sectionTitle}>排队号码</Text>
          <View className={styles.ticketTabs}>
            <Text
              className={classNames(styles.ticketTab, ticketTab === 'waiting' && styles.active)}
              onClick={() => setTicketTab('waiting')}
            >
              进行中
            </Text>
            <Text
              className={classNames(styles.ticketTab, ticketTab === 'all' && styles.active)}
              onClick={() => setTicketTab('all')}
            >
              全部
            </Text>
          </View>

          <View className={styles.ticketList}>
            {displayTickets.length > 0 ? (
              displayTickets.map((ticket) => (
                <View key={ticket.id} className={styles.ticketCard}>
                  <View className={styles.ticketInfo}>
                    <Text className={styles.ticketNo}>{ticket.ticketNo}</Text>
                    <Text className={styles.ticketMeta}>
                      {getRoomTypeText(ticket.roomType)} · {ticket.partySize}人
                      {ticket.customerName && ` · ${ticket.customerName}`}
                    </Text>
                    {(ticket.status === 'serving' || ticket.status === 'calling') &&
                      ticket.windowId && (
                        <Text className={styles.ticketMeta}>
                          窗口：{windows.find((w) => w.id === ticket.windowId)?.windowNo || '-'}
                        </Text>
                      )}
                    <View className={styles.ticketActions}>
                      {ticket.status === 'calling' && (
                        <Button
                          className={classNames(styles.ticketBtn, styles.primary)}
                          onClick={() => handleConfirm(ticket.id)}
                        >
                          确认就位
                        </Button>
                      )}
                      {ticket.status === 'serving' && (
                        <Button
                          className={classNames(styles.ticketBtn, styles.primary)}
                          onClick={() => handleComplete(ticket.id)}
                        >
                          完成服务
                        </Button>
                      )}
                      {(ticket.status === 'waiting' || ticket.status === 'calling') && (
                        <Button
                          className={classNames(styles.ticketBtn, styles.secondary)}
                          onClick={() => handleCancel(ticket.id)}
                        >
                          取消
                        </Button>
                      )}
                    </View>
                  </View>
                  <Text
                    className={classNames(styles.ticketStatus, styles[ticket.status])}
                  >
                    {STATUS_TEXT[ticket.status]}
                  </Text>
                </View>
              ))
            ) : (
              <EmptyState
                icon="🎫"
                title="暂无号码"
                description="点击上方取号按钮添加新号码"
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default QueuePage;
