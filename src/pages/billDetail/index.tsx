import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useBillingStore } from '@/store/billingStore';
import { Bill } from '@/types';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  getPaymentMethodText,
  getBillStatusText
} from '@/utils/format';

const BillDetailPage: React.FC = () => {
  const router = useRouter();
  const billId = router.params?.id;

  const getBillById = useBillingStore((s) => s.getBillById);
  const recalculateBill = useBillingStore((s) => s.recalculateBill);

  const [bill, setBill] = useState<Bill | undefined>();

  useEffect(() => {
    if (!billId) {
      Taro.showToast({ title: '账单ID不存在', icon: 'none' });
      return;
    }
    loadBill();
  }, [billId]);

  const loadBill = () => {
    const found = getBillById(billId!);
    if (!found) {
      Taro.showToast({ title: '账单不存在', icon: 'none' });
      return;
    }
    if (found.status === 'open') {
      recalculateBill(billId!);
      setBill(getBillById(billId!));
    } else {
      setBill(found);
    }
  };

  if (!bill) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.pageTitle}>账单详情</Text>
        </View>
        <View className={styles.empty}>
          <Text>账单不存在</Text>
        </View>
      </View>
    );
  }

  const isPaid = bill.status === 'paid';

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>账单详情</Text>
        <View className={styles.statusBadge}>
          <Text className={classNames(styles.statusText, isPaid ? styles.paid : styles.open)}>
            {getBillStatusText(bill.status)}
          </Text>
        </View>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>基本信息</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>账单编号</Text>
            <Text className={styles.infoValue}>{bill.id}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>包间</Text>
            <Text className={styles.infoValue}>{bill.roomName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>开台时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(bill.startTime)}</Text>
          </View>
          {bill.endTime && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>结账时间</Text>
              <Text className={styles.infoValue}>{formatDateTime(bill.endTime)}</Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>消费时长</Text>
            <Text className={styles.infoValue}>
              {formatDuration(bill.durationMinutes || Math.floor((Date.now() - bill.startTime) / 60000))}
            </Text>
          </View>
          {bill.paymentMethod && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>支付方式</Text>
              <Text className={styles.infoValue}>{getPaymentMethodText(bill.paymentMethod)}</Text>
            </View>
          )}
        </View>

        <View className={styles.tagRow}>
          {bill.startingPriceApplied && (
            <View className={classNames(styles.tag, styles.tagOrange)}>
              <Text className={styles.tagText}>起步价</Text>
            </View>
          )}
          {bill.ceilingPriceApplied && (
            <View className={classNames(styles.tag, styles.tagRed)}>
              <Text className={styles.tagText}>已封顶</Text>
            </View>
          )}
          {bill.overnightApplied && (
            <View className={classNames(styles.tag, styles.tagPurple)}>
              <Text className={styles.tagText}>包夜套餐</Text>
            </View>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>消费明细</Text>
            <Text className={styles.itemCount}>共 {bill.items.length} 项</Text>
          </View>
          <View className={styles.itemList}>
            {bill.items.map((item) => (
              <View key={item.id} className={styles.itemRow}>
                <View className={styles.itemInfo}>
                  <Text className={styles.itemName}>{item.description}</Text>
                  <Text className={styles.itemMeta}>
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </Text>
                </View>
                <Text className={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>费用合计</Text>
          </View>
          <View className={styles.totalRow}>
            <Text className={styles.totalLabel}>小计</Text>
            <Text className={styles.totalValue}>{formatCurrency(bill.subtotal)}</Text>
          </View>
          {bill.discount > 0 && (
            <View className={styles.totalRow}>
              <Text className={styles.totalLabel}>优惠</Text>
              <Text className={classNames(styles.totalValue, styles.discount)}>
                -{formatCurrency(bill.discount)}
              </Text>
            </View>
          )}
          <View className={styles.finalRow}>
            <Text className={styles.finalLabel}>应付金额</Text>
            <Text className={styles.finalValue}>{formatCurrency(bill.total)}</Text>
          </View>
        </View>

        {isPaid && bill.closedAt && (
          <View className={styles.paidInfo}>
            <Text className={styles.paidIcon}>✅</Text>
            <View className={styles.paidTextWrap}>
              <Text className={styles.paidTitle}>已支付</Text>
              <Text className={styles.paidTime}>
                支付时间：{formatDateTime(bill.closedAt)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default BillDetailPage;
