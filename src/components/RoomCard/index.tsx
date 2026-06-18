import React, { useState, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { Room } from '@/types';
import {
  getRoomStatusText,
  getRoomStatusColor,
  getRoomTypeText,
  formatDuration,
  formatCurrency,
  formatTime
} from '@/utils/format';
import { useRoomStore } from '@/store/roomStore';

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
  showAction?: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick, showAction = true }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const calculateRoomFee = useRoomStore((s) => s.calculateRoomFee);

  useEffect(() => {
    if (room.status !== 'idle' && room.status !== 'maintenance') {
      const timer = setInterval(() => {
        setCurrentTime(Date.now());
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [room.status]);

  const feeInfo =
    room.startTime ? calculateRoomFee(room.id, currentTime) : null;

  const duration =
    room.startTime
      ? Math.floor((currentTime - room.startTime) / 60000)
      : 0;

  const handleAction = () => {
    if (room.status === 'idle') {
      Taro.navigateTo({ url: '/pages/openRoom/index' });
    } else if (room.status === 'using' || room.status === 'overnight') {
      onClick?.();
    }
  };

  const getActionText = () => {
    switch (room.status) {
      case 'idle':
        return '立即开台';
      case 'using':
      case 'overnight':
        return '查看账单';
      case 'reserved':
        return '已预订';
      case 'maintenance':
        return '维护中';
      default:
        return '';
    }
  };

  return (
    <View className={styles.roomCard} onClick={onClick}>
      <View className={styles.cardHeader}>
        <View className={styles.roomInfo}>
          <Text className={styles.roomNo}>{room.roomNo}</Text>
          <Text className={styles.roomType}>{getRoomTypeText(room.roomType)}</Text>
        </View>
        <Text
          className={classNames(styles.statusTag, styles[room.status])}
          style={{ background: getRoomStatusColor(room.status) }}
        >
          {getRoomStatusText(room.status)}
        </Text>
      </View>

      <View className={styles.cardBody}>
        <View className={styles.equipmentList}>
          {room.equipment.slice(0, 4).map((equip) => (
            <Text key={equip} className={styles.equipmentTag}>
              {equip}
            </Text>
          ))}
          {room.equipment.length > 4 && (
            <Text className={styles.equipmentTag}>+{room.equipment.length - 4}</Text>
          )}
        </View>
        <View className={styles.capacityInfo}>
          <Text className={styles.capacityIcon}>👥</Text>
          <Text>容纳 {room.capacity} 人</Text>
        </View>
      </View>

      {(room.status === 'using' || room.status === 'overnight') && (
        <View className={styles.cardFooter}>
          <View className={styles.timeInfo}>
            <Text className={styles.timeLabel}>开始时间</Text>
            <Text className={styles.timeValue}>
              {room.startTime ? formatTime(room.startTime) : '--:--'}
            </Text>
          </View>
          <View className={styles.timeInfo}>
            <Text className={styles.timeLabel}>已用时长</Text>
            <Text className={styles.timeValue}>{formatDuration(duration)}</Text>
          </View>
          {feeInfo && (
            <View className={styles.feeInfo}>
              <Text className={styles.feeLabel}>当前费用</Text>
              <Text className={styles.feeValue}>{formatCurrency(feeInfo.fee)}</Text>
            </View>
          )}
          <View className={styles.badgeList}>
            {feeInfo?.startingPriceApplied && (
              <Text className={styles.badge}>起步价</Text>
            )}
            {feeInfo?.ceilingPriceApplied && (
              <Text className={styles.badge}>已封顶</Text>
            )}
            {feeInfo?.overnightApplied && (
              <Text className={styles.badge}>包夜</Text>
            )}
          </View>
        </View>
      )}

      {showAction && (
        <Button
          className={classNames(
            styles.actionButton,
            (room.status === 'reserved' || room.status === 'maintenance') &&
              styles.disabled
          )}
          onClick={(e) => {
            e.stopPropagation();
            handleAction();
          }}
          disabled={room.status === 'reserved' || room.status === 'maintenance'}
        >
          {getActionText()}
        </Button>
      )}
    </View>
  );
};

export default RoomCard;
