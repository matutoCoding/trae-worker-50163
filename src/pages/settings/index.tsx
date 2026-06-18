import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useRoomStore } from '@/store/roomStore';
import { useQueueStore } from '@/store/queueStore';
import { getRoomTypeText, formatCurrency } from '@/utils/format';

const SettingsPage: React.FC = () => {
  const billingRules = useRoomStore((s) => s.billingRules);
  const windows = useQueueStore((s) => s.windows);
  const toggleWindowStatus = useQueueStore((s) => s.toggleWindowStatus);

  const handleEditRule = (ruleId: string) => {
    Taro.navigateTo({ url: `/pages/ruleConfig/index?id=${ruleId}` });
  };

  const handleToggleWindow = (windowId: string) => {
    toggleWindowStatus(windowId);
    Taro.showToast({ title: '状态已更新', icon: 'success' });
  };

  const handleMenuClick = (action: string) => {
    switch (action) {
      case 'ruleConfig':
        Taro.navigateTo({ url: '/pages/ruleConfig/index' });
        break;
      case 'report':
        Taro.navigateTo({ url: '/pages/report/index' });
        break;
      case 'member':
        Taro.navigateTo({ url: '/pages/member/index' });
        break;
      case 'about':
        Taro.showModal({
          title: '关于系统',
          content: '棋牌室包间计时系统 v1.0.0\n\n模块：\n• 计费规则引擎\n• 账单生成系统\n• 并行叫号系统\n• 负载均衡调度',
          showCancel: false
        });
        break;
    }
  };

  const statusText = {
    active: '营业中',
    paused: '已暂停',
    inactive: '未启用'
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>系统设置</Text>
        <Text className={styles.pageDesc}>管理计费规则、前台窗口等系统配置</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>计费规则</Text>
          <View className={styles.ruleList}>
            {billingRules.map((rule) => (
              <View key={rule.id} className={styles.ruleCard}>
                <View className={styles.ruleHeader}>
                  <Text className={styles.ruleName}>
                    {getRoomTypeText(rule.roomType)}
                  </Text>
                  <Text className={styles.ruleTag}>
                    {rule.overnightEnabled ? '支持包夜' : '不支持包夜'}
                  </Text>
                </View>

                <View className={styles.ruleGrid}>
                  <View className={styles.ruleItem}>
                    <Text className={styles.ruleItemLabel}>起步价</Text>
                    <Text className={styles.ruleItemValue}>
                      {formatCurrency(rule.startingPrice)}
                    </Text>
                    <Text className={styles.ruleItemLabel}>
                      ({rule.startingMinutes}分钟内)
                    </Text>
                  </View>
                  <View className={styles.ruleItem}>
                    <Text className={styles.ruleItemLabel}>按时单价</Text>
                    <Text className={styles.ruleItemValue}>
                      {formatCurrency(rule.hourlyRate)}/时
                    </Text>
                  </View>
                  <View className={styles.ruleItem}>
                    <Text className={styles.ruleItemLabel}>封顶价</Text>
                    <Text className={styles.ruleItemValue}>
                      {formatCurrency(rule.ceilingPrice)}
                    </Text>
                  </View>
                  <View className={styles.ruleItem}>
                    <Text className={styles.ruleItemLabel}>包夜价格</Text>
                    <Text className={styles.ruleItemValue}>
                      {rule.overnightEnabled ? formatCurrency(rule.overnightPrice) : '-'}
                    </Text>
                  </View>
                </View>

                {rule.overnightEnabled && (
                  <View className={styles.overnightInfo}>
                    <Text className={styles.overnightLabel}>包夜时段</Text>
                    <Text className={styles.overnightValue}>
                      {rule.overnightStartTime} - {rule.overnightEndTime}
                    </Text>
                  </View>
                )}

                <Button
                  className={styles.editBtn}
                  onClick={() => handleEditRule(rule.id)}
                >
                  编辑规则
                </Button>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>前台窗口</Text>
          <View className={styles.windowList}>
            {windows.map((window) => (
              <View key={window.id} className={styles.windowCard}>
                <View className={styles.windowInfo}>
                  <Text className={styles.windowName}>
                    窗口 {window.windowNo} · {window.name}
                  </Text>
                  <Text className={styles.windowMeta}>
                    已服务 {window.completedCount} 位顾客 · 平均等待 {Math.floor(window.averageWaitTime / 60)}分钟
                  </Text>
                </View>
                <Button
                  className={classNames(styles.windowStatus, styles[window.status])}
                  onClick={() => handleToggleWindow(window.id)}
                >
                  {statusText[window.status]}
                </Button>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>其他</Text>
          <View className={styles.menuList}>
            <View className={styles.menuItem} onClick={() => handleMenuClick('member')}>
              <View className={styles.menuLeft}>
                <Text className={styles.menuIcon}>👑</Text>
                <Text className={styles.menuText}>会员中心</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
            <View className={styles.menuItem} onClick={() => handleMenuClick('report')}>
              <View className={styles.menuLeft}>
                <Text className={styles.menuIcon}>📊</Text>
                <Text className={styles.menuText}>经营报表</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
            <View className={styles.menuItem} onClick={() => handleMenuClick('ruleConfig')}>
              <View className={styles.menuLeft}>
                <Text className={styles.menuIcon}>💰</Text>
                <Text className={styles.menuText}>计费规则配置</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
            <View className={styles.menuItem} onClick={() => handleMenuClick('about')}>
              <View className={styles.menuLeft}>
                <Text className={styles.menuIcon}>ℹ️</Text>
                <Text className={styles.menuText}>关于系统</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SettingsPage;
