import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useBillingStore } from '@/store/billingStore';
import { Bill } from '@/types';
import { formatCurrency } from '@/utils/format';
import BillItem from '@/components/BillItem';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';

type TabType = 'open' | 'paid';
type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card';

const PAYMENT_METHODS: Array<{ key: PaymentMethod; label: string; icon: string }> = [
  { key: 'cash', label: '现金', icon: '💵' },
  { key: 'wechat', label: '微信', icon: '💚' },
  { key: 'alipay', label: '支付宝', icon: '💙' },
  { key: 'card', label: '会员卡', icon: '💳' }
];

const BillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [checkoutBill, setCheckoutBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');

  const bills = useBillingStore((s) => s.bills);
  const openBills = useBillingStore((s) => s.getOpenBills());
  const closedBills = useBillingStore((s) => s.getClosedBills());
  const todayRevenue = useBillingStore((s) => s.getTodayRevenue());
  const todayBillCount = useBillingStore((s) => s.getTodayBillCount());
  const closeBill = useBillingStore((s) => s.closeBill);
  const recalculateBill = useBillingStore((s) => s.recalculateBill);
  const getBillById = useBillingStore((s) => s.getBillById);

  const displayBills = useMemo(() => {
    return activeTab === 'open' ? openBills : closedBills;
  }, [activeTab, openBills, closedBills]);

  const openTotal = useMemo(() => {
    return openBills.reduce((sum, b) => sum + b.total, 0);
  }, [openBills]);

  const handleCheckout = (bill: Bill) => {
    recalculateBill(bill.id);
    const freshBill = getBillById(bill.id);
    setCheckoutBill(freshBill || bill);
    setPaymentMethod('wechat');
  };

  const handleConfirmCheckout = () => {
    if (!checkoutBill) return;

    const result = closeBill(checkoutBill.id, paymentMethod);
    if (result) {
      Taro.showToast({ title: '结账成功', icon: 'success' });
      setCheckoutBill(null);
    }
  };

  const handleCancelCheckout = () => {
    setCheckoutBill(null);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>账单管理</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatCurrency(todayRevenue)}</Text>
            <View className={styles.statLabel}>今日营收</View>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{todayBillCount}</Text>
            <View className={styles.statLabel}>今日订单</View>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{openBills.length}</Text>
            <View className={styles.statLabel}>进行中</View>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.tabBar}>
          <Text
            className={classNames(styles.tabItem, activeTab === 'open' && styles.active)}
            onClick={() => setActiveTab('open')}
          >
            进行中 ({openBills.length})
          </Text>
          <Text
            className={classNames(styles.tabItem, activeTab === 'paid' && styles.active)}
            onClick={() => setActiveTab('paid')}
          >
            已支付 ({closedBills.length})
          </Text>
        </View>

        {activeTab === 'open' && openBills.length > 0 && (
          <View className={styles.summaryCard}>
            <View className={styles.summaryGrid}>
              <StatCard
                label="待结账数量"
                value={openBills.length}
                variant="warning"
                icon="📋"
              />
              <StatCard
                label="待收金额"
                value={formatCurrency(openTotal)}
                variant="primary"
                icon="💰"
              />
            </View>
          </View>
        )}

        <ScrollView className={styles.billList} scrollY>
          {displayBills.length > 0 ? (
            displayBills.map((bill) => (
              <BillItem
                key={bill.id}
                bill={bill}
                onCheckout={bill.status === 'open' ? () => handleCheckout(bill) : undefined}
              />
            ))
          ) : (
            <EmptyState
              icon="📋"
              title={activeTab === 'open' ? '暂无进行中的账单' : '暂无已支付账单'}
              description={activeTab === 'open' ? '开台后会在这里显示账单' : '完成结账后会在这里显示记录'}
            />
          )}
        </ScrollView>
      </View>

      {checkoutBill && (
        <View className={styles.modal}>
          <View className={styles.modalContent}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>确认结账</Text>
              <Text className={styles.closeBtn} onClick={handleCancelCheckout}>
                ✕
              </Text>
            </View>

            <ScrollView scrollY>
              <View className={styles.billDetail}>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>包间</Text>
                  <Text className={styles.detailValue}>{checkoutBill.roomName}</Text>
                </View>
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>开台时间</Text>
                  <Text className={styles.detailValue}>
                    {new Date(checkoutBill.startTime).toLocaleString()}
                  </Text>
                </View>
                {checkoutBill.durationMinutes && (
                  <View className={styles.detailRow}>
                    <Text className={styles.detailLabel}>消费时长</Text>
                    <Text className={styles.detailValue}>
                      {Math.floor(checkoutBill.durationMinutes / 60)}小时
                      {checkoutBill.durationMinutes % 60}分钟
                    </Text>
                  </View>
                )}
              </View>

              <Text className={styles.itemListTitle}>消费明细</Text>
              {checkoutBill.items.map((item) => (
                <View key={item.id} className={styles.itemRow}>
                  <Text className={styles.detailLabel}>{item.description}</Text>
                  <Text className={styles.detailValue}>{formatCurrency(item.amount)}</Text>
                </View>
              ))}

              <View className={styles.totalSection}>
                <View className={styles.totalRow}>
                  <Text className={styles.totalLabel}>小计</Text>
                  <Text className={styles.totalValue}>{formatCurrency(checkoutBill.subtotal)}</Text>
                </View>
                {checkoutBill.discount > 0 && (
                  <View className={styles.totalRow}>
                    <Text className={styles.totalLabel}>优惠</Text>
                    <Text className={styles.totalValue}>-{formatCurrency(checkoutBill.discount)}</Text>
                  </View>
                )}
                <View className={classNames(styles.totalRow, styles.final)}>
                  <Text className={styles.finalLabel}>应付金额</Text>
                  <Text className={styles.finalValue}>{formatCurrency(checkoutBill.total)}</Text>
                </View>
              </View>

              <View className={styles.paymentMethods}>
                <Text className={styles.methodsTitle}>选择支付方式</Text>
                <View className={styles.methodList}>
                  {PAYMENT_METHODS.map((method) => (
                    <View
                      key={method.key}
                      className={classNames(
                        styles.methodItem,
                        paymentMethod === method.key && styles.active
                      )}
                      onClick={() => setPaymentMethod(method.key)}
                    >
                      <Text className={styles.methodIcon}>{method.icon}</Text>
                      <Text className={styles.methodText}>{method.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View className={styles.footer}>
              <Button className={styles.cancelBtn} onClick={handleCancelCheckout}>
                取消
              </Button>
              <Button className={styles.confirmBtn} onClick={handleConfirmCheckout}>
                确认支付 {formatCurrency(checkoutBill.total)}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BillingPage;
