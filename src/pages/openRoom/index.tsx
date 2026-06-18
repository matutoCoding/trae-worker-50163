import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useRoomStore } from '@/store/roomStore';
import { useBillingStore } from '@/store/billingStore';
import { Room } from '@/types';
import { getRoomTypeText, formatCurrency } from '@/utils/format';

const OpenRoomPage: React.FC = () => {
  const router = useRouter();
  const preselectedRoomId = router.params?.roomId;
  
  const rooms = useRoomStore((s) => s.rooms);
  const getBillingRule = useRoomStore((s) => s.getBillingRule);
  const openRoom = useRoomStore((s) => s.openRoom);
  const createBill = useBillingStore((s) => s.createBill);

  const [selectedRoomId, setSelectedRoomId] = useState<string>(preselectedRoomId || '');
  const [mode, setMode] = useState<'normal' | 'overnight'>('normal');
  const [submitting, setSubmitting] = useState(false);

  const idleRooms = useMemo(() => rooms.filter((r) => r.status === 'idle'), [rooms]);
  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId), [rooms, selectedRoomId]);
  const selectedRule = useMemo(() => selectedRoom ? getBillingRule(selectedRoom.roomType) : undefined, [selectedRoom, getBillingRule]);

  const handleSelectRoom = (room: Room) => {
    setSelectedRoomId(room.id);
  };

  const handleSubmit = async () => {
    if (!selectedRoomId || !selectedRoom || !selectedRule) {
      Taro.showToast({ title: '请选择包间', icon: 'none' });
      return;
    }

    if (mode === 'overnight' && !selectedRule.overnightEnabled) {
      Taro.showToast({ title: '该包间不支持包夜', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      const billId = openRoom(selectedRoomId, mode === 'overnight');
      
      createBill({
        billId,
        roomId: selectedRoom.id,
        roomName: selectedRoom.name,
        roomNo: selectedRoom.roomNo,
        roomType: selectedRoom.roomType,
        overnight: mode === 'overnight'
      });

      Taro.showToast({ title: '开台成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1000);
    } catch (e) {
      Taro.showToast({ title: '开台失败', icon: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>快速开台</Text>
        <Text className={styles.pageDesc}>选择空闲包间并确认开台</Text>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>选择包间</Text>
          {idleRooms.length > 0 ? (
            <View className={styles.roomList}>
              {idleRooms.map((room) => (
                <View
                  key={room.id}
                  className={classNames(styles.roomCard, selectedRoomId === room.id && styles.selected)}
                  onClick={() => handleSelectRoom(room)}
                >
                  <View className={styles.roomHeader}>
                    <Text className={styles.roomNo}>{room.roomNo}</Text>
                    <Text className={styles.roomType}>{getRoomTypeText(room.roomType)}</Text>
                  </View>
                  <View className={styles.roomMeta}>
                    <Text className={styles.capacity}>👥 容纳 {room.capacity} 人</Text>
                  </View>
                  <View className={styles.equipmentList}>
                    {room.equipment.slice(0, 3).map((e) => (
                      <Text key={e} className={styles.equipmentTag}>{e}</Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={styles.emptyState}>
              <Text className={styles.emptyIcon}>😅</Text>
              <Text className={styles.emptyText}>暂无空闲包间</Text>
            </View>
          )}
        </View>

        {selectedRoom && selectedRule && (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>选择模式</Text>
            <View className={styles.modeSelector}>
              <View
                className={classNames(styles.modeCard, mode === 'normal' && styles.active)}
                onClick={() => setMode('normal')}
              >
                <Text className={styles.modeIcon}>⏱️</Text>
                <Text className={styles.modeName}>普通计时</Text>
                <Text className={styles.modeDesc}>
                  起步 {formatCurrency(selectedRule.startingPrice)} ({selectedRule.startingMinutes}分钟)
                </Text>
                <Text className={styles.modeDesc}>
                  {formatCurrency(selectedRule.hourlyRate)}/小时，封顶 {formatCurrency(selectedRule.ceilingPrice)}
                </Text>
              </View>
              <View
                className={classNames(
                  styles.modeCard,
                  mode === 'overnight' && styles.active,
                  !selectedRule.overnightEnabled && styles.disabled
                )}
                onClick={() => selectedRule.overnightEnabled && setMode('overnight')}
              >
                <Text className={styles.modeIcon}>🌙</Text>
                <Text className={styles.modeName}>包夜套餐</Text>
                {selectedRule.overnightEnabled ? (
                  <>
                    <Text className={styles.modeDesc}>
                      一口价 {formatCurrency(selectedRule.overnightPrice)}
                    </Text>
                    <Text className={styles.modeDesc}>
                      {selectedRule.overnightStartTime} - {selectedRule.overnightEndTime}
                    </Text>
                  </>
                ) : (
                  <Text className={styles.modeDesc}>暂不支持</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {selectedRoom && selectedRule && (
          <View className={styles.summaryCard}>
            <Text className={styles.summaryTitle}>开台信息</Text>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>包间</Text>
              <Text className={styles.summaryValue}>{selectedRoom.name}</Text>
            </View>
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>模式</Text>
              <Text className={styles.summaryValue}>
                {mode === 'normal' ? '普通计时' : '包夜套餐'}
              </Text>
            </View>
            {mode === 'overnight' && (
              <View className={styles.summaryRow}>
                <Text className={styles.summaryLabel}>包夜价格</Text>
                <Text className={classNames(styles.summaryValue, styles.price)}>
                  {formatCurrency(selectedRule.overnightPrice)}
                </Text>
              </View>
            )}
            {mode === 'normal' && (
              <View className={styles.summaryRow}>
                <Text className={styles.summaryLabel}>起步价</Text>
                <Text className={classNames(styles.summaryValue, styles.price)}>
                  {formatCurrency(selectedRule.startingPrice)}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View className={styles.footer}>
        <Button
          className={classNames(styles.submitBtn, !selectedRoomId && styles.disabled)}
          onClick={handleSubmit}
          disabled={!selectedRoomId || submitting}
          loading={submitting}
        >
          {submitting ? '开台中...' : '确认开台'}
        </Button>
      </View>
    </View>
  );
};

export default OpenRoomPage;
