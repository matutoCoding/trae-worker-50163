import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { Bill } from '@/types';
import { formatDateTime, formatCurrency, formatDuration } from '@/utils/format';

interface BillItemProps {
  bill: Bill;
  onCheckout?: () => void;
  onViewDetail?: () => void;
}

const BillItem: React.FC<BillItemProps> = ({ bill, onCheckout, onViewDetail }) => {
  const statusText = {
    open: '进行中',
    closed: '已关闭',
    paid: '已支付'
  };

  const handleViewDetail = () => {
    Taro.navigateTo({ url: `/pages/billDetail/index?id=${bill.id}` });
  };

  const getPaymentMethodText = (method?: string) => {
    const map: Record<string, string> = {
      cash: '现金',
      wechat: '微信支付',
      alipay: '支付宝',
      card: '会员卡'
    };
    return map[method || ''] || '';
  };

  return (
    <View className={styles.billItem}>
      <View className={styles.billHeader}>
        <View className={styles.billInfo}>
          <Text className={styles.roomName}>{bill.roomName}</Text>
          <Text className={styles.billMeta}>
            开台时间：{formatDateTime(bill.startTime)}
          </Text>
          {bill.durationMinutes && (
            <Text className={styles.billMeta}>
              用时：{formatDuration(bill.durationMinutes)}
            </Text>
          )}
          {bill.paymentMethod && (
            <Text className={styles.billMeta}>
              支付方式：{getPaymentMethodText(bill.paymentMethod)}
            </Text>
          )}
        </View>
        <Text className={classNames(styles.billStatus, styles[bill.status])}>
          {statusText[bill.status]}
        </Text>
      </View>

      {(bill.startingPriceApplied || bill.ceilingPriceApplied || bill.overnightApplied) && (
        <View className={styles.billBadges}>
          {bill.startingPriceApplied && (
            <Text className={classNames(styles.badge, styles.startingPrice)}>
              起步价
            </Text>
          )}
          {bill.ceilingPriceApplied && (
            <Text className={classNames(styles.badge, styles.ceilingPrice)}>
              已封顶
            </Text>
          )}
          {bill.overnightApplied && (
            <Text className={classNames(styles.badge, styles.overnightPrice)}>
              包夜套餐
            </Text>
          )}
        </View>
      )}

      <View className={styles.billBody}>
        <View className={styles.itemList}>
          {bill.items.slice(0, 3).map((item) => (
            <View key={item.id} className={styles.itemRow}>
              <Text className={styles.itemDesc}>{item.description}</Text>
              <Text className={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
          {bill.items.length > 3 && (
            <View className={styles.itemRow}>
              <Text className={styles.itemDesc}>... 等{bill.items.length}项</Text>
              <Text className={styles.itemAmount}></Text>
            </View>
          )}
        </View>

        <View className={styles.billSummary}>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>小计</Text>
            <Text className={styles.summaryValue}>{formatCurrency(bill.subtotal)}</Text>
          </View>
          {bill.discount > 0 && (
            <View className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>优惠</Text>
              <Text className={styles.summaryValue}>-{formatCurrency(bill.discount)}</Text>
            </View>
          )}
          <View className={classNames(styles.summaryRow, styles.total)}>
            <Text className={styles.totalLabel}>合计</Text>
            <Text className={styles.totalValue}>{formatCurrency(bill.total)}</Text>
          </View>
        </View>
      </View>

      <View className={styles.billFooter}>
        <Button
          className={classNames(styles.actionBtn, styles.secondary)}
          onClick={onViewDetail || handleViewDetail}
        >
          查看详情
        </Button>
        {bill.status === 'open' && (
          <Button
            className={classNames(styles.actionBtn, styles.primary)}
            onClick={onCheckout}
          >
            立即结账
          </Button>
        )}
      </View>
    </View>
  );
};

export default BillItem;
