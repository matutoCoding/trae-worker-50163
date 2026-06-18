import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useBillingStore } from '@/store/billingStore';
import { useMemberStore } from '@/store/memberStore';
import { Bill, Member } from '@/types';
import { formatCurrency, formatDuration, getPaymentMethodText } from '@/utils/format';
import BillItem from '@/components/BillItem';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';

type TabType = 'open' | 'paid';
type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card' | 'member';

const PAYMENT_METHODS: Array<{ key: PaymentMethod; label: string; icon: string }> = [
  { key: 'wechat', label: '微信支付', icon: '💚' },
  { key: 'alipay', label: '支付宝', icon: '💙' },
  { key: 'cash', label: '现金', icon: '💵' },
  { key: 'card', label: '银行卡', icon: '💳' },
  { key: 'member', label: '会员储值', icon: '👑' }
];

const BillingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [checkoutBill, setCheckoutBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const refreshTimer = useRef<number | null>(null);

  const bills = useBillingStore((s) => s.bills);
  const openBills = useBillingStore((s) => s.getOpenBills());
  const closedBills = useBillingStore((s) => s.getClosedBills());
  const todayRevenue = useBillingStore((s) => s.getTodayRevenue());
  const todayBillCount = useBillingStore((s) => s.getTodayBillCount());
  const closeBill = useBillingStore((s) => s.closeBill);
  const recalculateBill = useBillingStore((s) => s.recalculateBill);
  const getBillById = useBillingStore((s) => s.getBillById);

  const members = useMemberStore((s) => s.members);
  const searchMembers = useMemberStore((s) => s.searchMembers);
  const getMemberLevelText = useMemberStore((s) => s.getMemberLevelText);

  const displayBills = useMemo(() => {
    return activeTab === 'open' ? openBills : closedBills;
  }, [activeTab, openBills, closedBills]);

  const openTotal = useMemo(() => {
    return openBills.reduce((sum, b) => sum + b.total, 0);
  }, [openBills]);

  const filteredMembers = useMemo(() => {
    return searchMembers(memberSearch);
  }, [memberSearch, searchMembers]);

  useEffect(() => {
    if (checkoutBill && checkoutBill.status === 'open') {
      const doRefresh = () => {
        recalculateBill(checkoutBill.id);
        const fresh = getBillById(checkoutBill.id);
        if (fresh) {
          setCheckoutBill({ ...fresh });
        }
      };
      doRefresh();
      refreshTimer.current = window.setInterval(doRefresh, 30000);
    }
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
        refreshTimer.current = null;
      }
    };
  }, [checkoutBill?.id, checkoutBill?.status, recalculateBill, getBillById]);

  const handleCheckout = (bill: Bill) => {
    recalculateBill(bill.id);
    const freshBill = getBillById(bill.id);
    setCheckoutBill(freshBill || bill);
    setPaymentMethod('wechat');
    setSelectedMember(null);
    setShowMemberPicker(false);
    setMemberSearch('');
  };

  const handleConfirmCheckout = () => {
    if (!checkoutBill) return;

    if (paymentMethod === 'member') {
      if (!selectedMember) {
        Taro.showToast({ title: '请选择会员', icon: 'none' });
        return;
      }
      if (selectedMember.balance < checkoutBill.total) {
        const shortage = checkoutBill.total - selectedMember.balance;
        Taro.showModal({
          title: '会员储值不足',
          content: `${selectedMember.name} 余额 ${formatCurrency(selectedMember.balance)}\n应付 ${formatCurrency(checkoutBill.total)}\n还差 ${formatCurrency(shortage)}\n\n建议：更换会员或改用其他支付方式`,
          showCancel: true,
          cancelText: '换支付方式',
          confirmText: '更换会员',
          success: (res) => {
            if (res.confirm) {
              setSelectedMember(null);
              setShowMemberPicker(true);
            } else {
              setPaymentMethod('wechat');
              setSelectedMember(null);
              setShowMemberPicker(false);
            }
          }
        });
        return;
      }
      const result = closeBill(checkoutBill.id, 'member', selectedMember.id);
      if (result) {
        Taro.showToast({ title: '会员支付成功', icon: 'success' });
        setCheckoutBill(null);
        setSelectedMember(null);
      } else {
        Taro.showToast({ title: '支付失败', icon: 'error' });
      }
    } else {
      const result = closeBill(checkoutBill.id, paymentMethod);
      if (result) {
        Taro.showToast({ title: '结账成功', icon: 'success' });
        setCheckoutBill(null);
      }
    }
  };

  const handleCancelCheckout = () => {
    setCheckoutBill(null);
    setSelectedMember(null);
    setShowMemberPicker(false);
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setShowMemberPicker(false);
  };

  const currentDuration = checkoutBill
    ? Math.floor((Date.now() - checkoutBill.startTime) / 60000)
    : 0;

  const isMemberInsufficient =
    paymentMethod === 'member' && selectedMember && selectedMember.balance < (checkoutBill?.total || 0);
  const memberShortage = isMemberInsufficient
    ? (checkoutBill!.total - selectedMember!.balance)
    : 0;

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

            <ScrollView scrollY className={styles.modalScroll}>
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
                <View className={styles.detailRow}>
                  <Text className={styles.detailLabel}>当前时长</Text>
                  <Text className={styles.detailValue}>
                    {formatDuration(currentDuration)}
                  </Text>
                </View>
                <View className={styles.tagRow}>
                  {checkoutBill.startingPriceApplied && (
                    <View className={classNames(styles.tag, styles.tagOrange)}>
                      <Text className={styles.tagText}>起步价</Text>
                    </View>
                  )}
                  {checkoutBill.ceilingPriceApplied && (
                    <View className={classNames(styles.tag, styles.tagRed)}>
                      <Text className={styles.tagText}>已封顶</Text>
                    </View>
                  )}
                  {checkoutBill.overnightApplied && (
                    <View className={classNames(styles.tag, styles.tagPurple)}>
                      <Text className={styles.tagText}>包夜套餐</Text>
                    </View>
                  )}
                </View>
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
                      onClick={() => {
                        setPaymentMethod(method.key);
                        if (method.key !== 'member') {
                          setSelectedMember(null);
                          setShowMemberPicker(false);
                        }
                      }}
                    >
                      <Text className={styles.methodIcon}>{method.icon}</Text>
                      <Text className={styles.methodText}>{method.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {paymentMethod === 'member' && (
                <View className={styles.memberSection}>
                  <Text className={styles.methodsTitle}>选择会员</Text>
                  {selectedMember ? (
                    <View className={classNames(styles.selectedMember, isMemberInsufficient && styles.memberError)}>
                      <View className={styles.memberInfo}>
                        <Text className={styles.memberName}>{selectedMember.name}</Text>
                        <View className={styles.memberMeta}>
                          <Text
                            className={styles.memberLevel}
                            style={{ color: useMemberStore.getState().getMemberLevelColor(selectedMember.level) }}
                          >
                            {getMemberLevelText(selectedMember.level)}
                          </Text>
                          <Text className={styles.memberNo}>{selectedMember.memberNo}</Text>
                        </View>
                      </View>
                      <View className={styles.memberBalanceWrap}>
                        <Text className={styles.memberBalanceLabel}>余额</Text>
                        <Text className={classNames(styles.memberBalance, isMemberInsufficient && styles.balanceError)}>
                          {formatCurrency(selectedMember.balance)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View
                      className={styles.memberSelectBtn}
                      onClick={() => setShowMemberPicker(!showMemberPicker)}
                    >
                      <Text className={styles.memberSelectText}>选择会员扣款</Text>
                      <Text className={styles.memberSelectArrow}>›</Text>
                    </View>
                  )}

                  {showMemberPicker && (
                    <View className={styles.memberPicker}>
                      <Input
                        className={styles.memberSearchInput}
                        placeholder="搜索会员姓名/手机号/卡号"
                        value={memberSearch}
                        onInput={(e) => setMemberSearch(e.detail.value)}
                      />
                      <ScrollView className={styles.memberList} scrollY>
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map((m) => (
                            <View
                              key={m.id}
                              className={styles.memberPickItem}
                              onClick={() => handleSelectMember(m)}
                            >
                              <View className={styles.memberPickInfo}>
                                <Text className={styles.memberPickName}>{m.name}</Text>
                                <View className={styles.memberPickMeta}>
                                  <Text
                                    className={styles.memberPickLevel}
                                    style={{ color: useMemberStore.getState().getMemberLevelColor(m.level) }}
                                  >
                                    {getMemberLevelText(m.level)}
                                  </Text>
                                  <Text className={styles.memberPickPhone}>{m.phone}</Text>
                                </View>
                              </View>
                              <Text className={styles.memberPickBalance}>
                                {formatCurrency(m.balance)}
                              </Text>
                            </View>
                          ))
                        ) : (
                          <View className={styles.memberPickerEmpty}>
                            <Text>未找到会员</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {isMemberInsufficient && (
                    <View className={styles.balanceInsufficient}>
                      <View className={styles.insufficientHeader}>
                        <Text className={styles.insufficientIcon}>🚫</Text>
                        <Text className={styles.insufficientTitle}>储值余额不足</Text>
                      </View>
                      <View className={styles.insufficientDetail}>
                        <View className={styles.insufficientRow}>
                          <Text className={styles.insufficientLabel}>应付金额</Text>
                          <Text className={styles.insufficientValue}>{formatCurrency(checkoutBill!.total)}</Text>
                        </View>
                        <View className={styles.insufficientRow}>
                          <Text className={styles.insufficientLabel}>当前余额</Text>
                          <Text className={styles.insufficientValue}>{formatCurrency(selectedMember!.balance)}</Text>
                        </View>
                        <View className={styles.insufficientRow}>
                          <Text className={styles.insufficientLabel}>还需支付</Text>
                          <Text className={classNames(styles.insufficientValue, styles.shortage)}>
                            {formatCurrency(memberShortage)}
                          </Text>
                        </View>
                      </View>
                      <View className={styles.insufficientActions}>
                        <View
                          className={classNames(styles.insufficientAction, styles.primaryAction)}
                          onClick={() => setShowMemberPicker(true)}
                        >
                          <Text>换个会员</Text>
                        </View>
                        <View
                          className={classNames(styles.insufficientAction, styles.secondaryAction)}
                          onClick={() => {
                            setPaymentMethod('wechat');
                          }}
                        >
                          <Text>改用微信支付</Text>
                        </View>
                      </View>
                      <Text className={styles.insufficientHint}>
                        💡 也可以切换为现金、支付宝、银行卡等其他方式
                      </Text>
                    </View>
                  )}

                  {selectedMember && !isMemberInsufficient && (
                    <View
                      className={styles.changeMemberBtn}
                      onClick={() => {
                        setSelectedMember(null);
                        setShowMemberPicker(true);
                      }}
                    >
                      <Text>更换会员</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View className={styles.footer}>
              <Button className={styles.cancelBtn} onClick={handleCancelCheckout}>
                取消
              </Button>
              <Button
                className={classNames(
                  styles.confirmBtn,
                  (paymentMethod === 'member' && !selectedMember) || isMemberInsufficient ? styles.disabled : ''
                )}
                onClick={handleConfirmCheckout}
                disabled={paymentMethod === 'member' && (!selectedMember || isMemberInsufficient)}
              >
                {paymentMethod === 'member' && !selectedMember
                  ? '请选择会员'
                  : isMemberInsufficient
                  ? `余额不足 差${formatCurrency(memberShortage)}`
                  : `确认支付 ${formatCurrency(checkoutBill.total)}`}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BillingPage;
