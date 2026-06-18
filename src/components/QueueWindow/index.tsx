import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';
import { QueueWindow as QueueWindowType, QueueTicket } from '@/types';
import {
  getLoadLevelText,
  getLoadLevelColor,
  getRoomTypeText
} from '@/utils/format';
import { calculateWindowLoad, getLoadLevel } from '@/utils/loadBalancer';

interface QueueWindowProps {
  window: QueueWindowType;
  tickets: QueueTicket[];
  isRecommended?: boolean;
  onCallNext?: () => void;
  onToggleStatus?: () => void;
  onAssign?: () => void;
}

const QueueWindow: React.FC<QueueWindowProps> = ({
  window,
  tickets,
  isRecommended,
  onCallNext,
  onToggleStatus,
  onAssign
}) => {
  const load = calculateWindowLoad(window, tickets);
  const loadLevel = getLoadLevel(load);
  const loadPercent = Math.min(100, load * 2);

  const waitingTickets = tickets.filter(
    (t) => t.assignedWindowId === window.id && t.status === 'waiting'
  );

  const statusText = {
    active: '营业中',
    paused: '已暂停',
    inactive: '未启用'
  };

  return (
    <View className={styles.queueWindow}>
      <View className={styles.windowHeader}>
        <View className={styles.windowInfo}>
          <Text className={styles.windowNo}>窗口 {window.windowNo}</Text>
          <Text className={styles.windowName}>{window.name}</Text>
          {isRecommended && (
            <Text className={styles.recommendedBadge}>推荐</Text>
          )}
        </View>
        <Text className={classNames(styles.windowStatus, styles[window.status])}>
          {statusText[window.status]}
        </Text>
      </View>

      <View className={styles.currentServing}>
        <Text className={styles.servingLabel}>当前服务</Text>
        {window.currentServing ? (
          <Text className={styles.servingTicket}>{window.currentServing}</Text>
        ) : (
          <Text className={styles.noServing}>暂无服务</Text>
        )}
      </View>

      <View className={styles.windowStats}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{window.servingCount}</Text>
          <Text className={styles.statLabel}>服务中</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{window.completedCount}</Text>
          <Text className={styles.statLabel}>已完成</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>
            {Math.floor(window.averageWaitTime / 60)}分
          </Text>
          <Text className={styles.statLabel}>平均等待</Text>
        </View>
      </View>

      <View className={styles.loadBar}>
        <View className={styles.loadLabel}>
          <Text className={styles.loadText}>负载情况</Text>
          <Text
            className={styles.loadLevel}
            style={{ color: getLoadLevelColor(loadLevel) }}
          >
            {getLoadLevelText(loadLevel)}
          </Text>
        </View>
        <View className={styles.loadTrack}>
          <View
            className={classNames(styles.loadFill, styles[`${loadLevel}Load`])}
            style={{ width: `${loadPercent}%` }}
          />
        </View>
      </View>

      <View className={styles.waitingList}>
        <Text className={styles.listTitle}>
          等待队列 ({waitingTickets.length})
        </Text>
        {waitingTickets.length > 0 ? (
          <View className={styles.ticketList}>
            {waitingTickets.slice(0, 6).map((ticket) => (
              <Text key={ticket.id} className={styles.ticketChip}>
                {ticket.ticketNo} · {getRoomTypeText(ticket.roomType)}
              </Text>
            ))}
            {waitingTickets.length > 6 && (
              <Text className={styles.ticketChip}>
                +{waitingTickets.length - 6}
              </Text>
            )}
          </View>
        ) : (
          <Text className={styles.noTickets}>暂无等待</Text>
        )}
      </View>

      <View className={styles.actionButtons}>
        <Button
          className={classNames(styles.actionBtn, styles.secondary)}
          onClick={onToggleStatus}
        >
          {window.status === 'active' ? '暂停' : '启用'}
        </Button>
        {onAssign && (
          <Button
            className={classNames(
              styles.actionBtn,
              isRecommended ? styles.recommended : styles.secondary
            )}
            onClick={onAssign}
          >
            分配到此
          </Button>
        )}
        <Button
          className={classNames(styles.actionBtn, styles.primary)}
          onClick={onCallNext}
          disabled={window.status !== 'active'}
        >
          叫下一位
        </Button>
      </View>
    </View>
  );
};

export default QueueWindow;
