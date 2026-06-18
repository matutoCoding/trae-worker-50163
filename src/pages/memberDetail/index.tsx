import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useMemberStore } from '@/store/memberStore';
import { useBillingStore } from '@/store/billingStore';
import { Member, Bill, MemberTransaction } from '@/types';
import { formatCurrency, formatDateTime, formatDuration } from '@/utils/format';
import BillItem from '@/components/BillItem';
import EmptyState from '@/components/EmptyState';

const RECHARGE_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const MemberDetailPage: React.FC = () => {
  const router = useRouter();
  const memberId = router.params?.id;

  const getMemberById = useMemberStore((s) => s.getMemberById);
  const recharge = useMemberStore((s) => s.recharge);
  const getMemberLevelText = useMemberStore((s) => s.getMemberLevelText);
  const getMemberLevelColor = useMemberStore((s) => s.getMemberLevelColor);
  const getTransactionsByMember = useMemberStore((s) => s.getTransactionsByMember);
  const canUpgrade = useMemberStore((s) => s.canUpgrade);
  const getUpgradeProgress = useMemberStore((s) => s.getUpgradeProgress);
  const getLevelUpgradeRule = useMemberStore((s) => s.getLevelUpgradeRule);
  const getNextLevel = useMemberStore((s) => s.getNextLevel);

  const bills = useBillingStore((s) => s.bills);
  const getBillById = useBillingStore((s) => s.getBillById);

  const [member, setMember] = useState<Member | undefined>();
  const [showRecharge, setShowRecharge] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [recharging, setRecharging] = useState(false);
  const [activeTab, setActiveTab] = useState<'bills' | 'transactions'>('bills');

  useEffect(() => {
    if (!memberId) {
      Taro.showToast({ title: '会员ID不存在', icon: 'none' });
      return;
    }
    loadMember();
  }, [memberId]);

  const loadMember = () => {
    const found = getMemberById(memberId!);
    if (!found) {
      Taro.showToast({ title: '会员不存在', icon: 'none' });
      return;
    }
    setMember(found);
  };

  const memberBills = useMemo(() => {
    if (!memberId) return [];
    return bills
      .filter((b) => b.memberId === memberId && b.status === 'paid')
      .sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  }, [memberId, bills]);

  const transactions = useMemo(() => {
    if (!memberId) return [];
    return getTransactionsByMember(memberId);
  }, [memberId, getTransactionsByMember]);

  const totalMemberSpent = useMemo(() => {
    return memberBills.reduce((sum: number, b: Bill) => sum + b.total, 0);
  }, [memberBills]);

  const totalRecharged = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'recharge')
      .reduce((sum: number, t) => sum + t.amount, 0);
  }, [transactions]);

  const upgradeInfo = useMemo(() => {
    if (!member) return null;
    const next = canUpgrade(member);
    const progress = getUpgradeProgress(member);
    const nextLevel = getNextLevel(member.level);
    const rule = nextLevel ? getLevelUpgradeRule(nextLevel) : undefined;
    return { next, progress, nextLevel, rule };
  }, [member, canUpgrade, getUpgradeProgress, getNextLevel, getLevelUpgradeRule]);

  const handleSelectAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  const getFinalAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    const custom = parseFloat(customAmount);
    return !isNaN(custom) && custom > 0 ? custom : 0;
  };

  const handleRecharge = async () => {
    if (!member) return;
    const amount = getFinalAmount();
    if (amount <= 0) {
      Taro.showToast({ title: '请选择或输入充值金额', icon: 'none' });
      return;
    }

    setRecharging(true);
    try {
      recharge(member.id, amount);
      Taro.showToast({ title: `充值成功 ${formatCurrency(amount)}`, icon: 'success' });
      loadMember();
      setShowRecharge(false);
      setSelectedAmount(null);
      setCustomAmount('');
    } catch (e) {
      Taro.showToast({ title: '充值失败', icon: 'error' });
    } finally {
      setRecharging(false);
    }
  };

  const handleBillClick = (billId: string) => {
    Taro.navigateTo({
      url: `/pages/billDetail/index?id=${billId}`
    });
  };

  const getTxTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      recharge: '充值',
      consume: '消费',
      refund: '退款',
      adjust: '调整'
    };
    return map[type] || type;
  };

  const getTxIcon = (type: string) => {
    const map: Record<string, string> = {
      recharge: '💰',
      consume: '💸',
      refund: '↩️',
      adjust: '⚙️'
    };
    return map[type] || '📝';
  };

  if (!member) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.pageTitle}>会员详情</Text>
        </View>
        <View className={styles.empty}>
          <Text>会员不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.profile}>
          <View className={styles.avatar}>
            <Text className={styles.avatarText}>{member.name.charAt(0)}</Text>
          </View>
          <View className={styles.profileInfo}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{member.name}</Text>
              <Text
                className={styles.levelBadge}
                style={{ backgroundColor: `${getMemberLevelColor(member.level)}20`, color: getMemberLevelColor(member.level) }}
              >
                {getMemberLevelText(member.level)}
              </Text>
            </View>
            <Text className={styles.memberNo}>{member.memberNo}</Text>
            <Text className={styles.phone}>{member.phone}</Text>
          </View>
        </View>

        {upgradeInfo && upgradeInfo.next && (
          <View className={styles.upgradeBanner}>
            <Text className={styles.upgradeIcon}>🎉</Text>
            <View className={styles.upgradeInfo}>
              <Text className={styles.upgradeTitle}>
                可升级为 {getMemberLevelText(upgradeInfo.next)}
              </Text>
              <Text className={styles.upgradeDesc}>
                已满足累计消费和来店次数条件
              </Text>
            </View>
          </View>
        )}

        {upgradeInfo && upgradeInfo.progress && !upgradeInfo.next && (
          <View className={styles.upgradeProgress}>
            <Text className={styles.progressTitle}>
              距离 {getMemberLevelText(upgradeInfo.progress.level)} 还差
            </Text>
            <View className={styles.progressBarRow}>
              <Text className={styles.progressLabel}>累计消费</Text>
              <View className={styles.progressWrap}>
                <View
                  className={styles.progressFill}
                  style={{ width: `${upgradeInfo.progress.consumptionProgress}%` }}
                />
              </View>
              <Text className={styles.progressText}>
                {formatCurrency(member.totalConsumption)} / {formatCurrency(upgradeInfo.rule?.minConsumption || 0)}
              </Text>
            </View>
            <View className={styles.progressBarRow}>
              <Text className={styles.progressLabel}>来店次数</Text>
              <View className={styles.progressWrap}>
                <View
                  className={classNames(styles.progressFill, styles.progressGold)}
                  style={{ width: `${upgradeInfo.progress.visitProgress}%` }}
                />
              </View>
              <Text className={styles.progressText}>
                {member.visitCount} / {upgradeInfo.rule?.minVisits || 0} 次
              </Text>
            </View>
          </View>
        )}

        <View className={styles.balanceCard}>
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>储值余额</Text>
            <Text className={styles.balanceValue}>{formatCurrency(member.balance)}</Text>
          </View>
          <View className={styles.balanceDivider} />
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>累计消费</Text>
            <Text className={styles.balanceValue}>{formatCurrency(member.totalConsumption)}</Text>
          </View>
          <View className={styles.balanceDivider} />
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>来店次数</Text>
            <Text className={styles.balanceValue}>{member.visitCount} 次</Text>
          </View>
        </View>

        <View className={styles.quickStats}>
          <View className={styles.quickItem}>
            <Text className={styles.quickValue}>{formatCurrency(totalRecharged)}</Text>
            <Text className={styles.quickLabel}>累计充值</Text>
          </View>
          <View className={styles.quickItem}>
            <Text className={styles.quickValue}>{transactions.length}</Text>
            <Text className={styles.quickLabel}>储值流水</Text>
          </View>
          <View className={styles.quickItem}>
            <Text className={styles.quickValue}>{memberBills.length}</Text>
            <Text className={styles.quickLabel}>消费笔数</Text>
          </View>
        </View>

        <Button className={styles.rechargeBtn} onClick={() => setShowRecharge(true)}>
          充值储值
        </Button>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.section}>
          <View className={styles.tabBar}>
            <Text
              className={classNames(styles.tabItem, activeTab === 'bills' && styles.active)}
              onClick={() => setActiveTab('bills')}
            >
              消费账单 ({memberBills.length})
            </Text>
            <Text
              className={classNames(styles.tabItem, activeTab === 'transactions' && styles.active)}
              onClick={() => setActiveTab('transactions')}
            >
              储值流水 ({transactions.length})
            </Text>
          </View>

          {activeTab === 'bills' && (
            memberBills.length > 0 ? (
              <View className={styles.billList}>
                {memberBills.map((bill) => (
                  <BillItem
                    key={bill.id}
                    bill={bill}
                    onViewDetail={() => handleBillClick(bill.id)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon='📋'
                title='暂无消费记录'
                description='该会员还没有消费记录'
              />
            )
          )}

          {activeTab === 'transactions' && (
            transactions.length > 0 ? (
              <View className={styles.txList}>
                {transactions.map((tx) => (
                  <View key={tx.id} className={styles.txItem}>
                    <View className={styles.txIconWrap}>
                      <Text className={styles.txIcon}>{getTxIcon(tx.type)}</Text>
                    </View>
                    <View className={styles.txInfo}>
                      <Text className={styles.txTitle}>
                        {getTxTypeLabel(tx.type)}
                      </Text>
                      <Text className={styles.txDesc}>{tx.description}</Text>
                      <Text className={styles.txTime}>{formatDateTime(tx.createdAt)}</Text>
                    </View>
                    <View className={styles.txAmountWrap}>
                      <Text
                        className={classNames(
                          styles.txAmount,
                          tx.type === 'recharge' ? styles.positive : styles.negative
                        )}
                      >
                        {tx.type === 'recharge' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </Text>
                      <Text className={styles.txBalance}>
                        余额 {formatCurrency(tx.balanceAfter)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon='💰'
                title='暂无储值流水'
                description='该会员还没有储值变动记录'
              />
            )
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>会员信息</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>注册时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(member.createdAt)}</Text>
          </View>
          {member.lastVisitAt && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>最近到店</Text>
              <Text className={styles.infoValue}>{formatDateTime(member.lastVisitAt)}</Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>累计消费次数</Text>
            <Text className={styles.infoValue}>{member.visitCount} 次</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>储值账户总额</Text>
            <Text className={styles.infoValue}>{formatCurrency(member.balance + member.totalConsumption)}</Text>
          </View>
        </View>
      </ScrollView>

      {showRecharge && (
        <View className={styles.modal}>
          <View className={styles.modalContent}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>充值储值</Text>
              <Text className={styles.modalClose} onClick={() => setShowRecharge(false)}>
                ✕
              </Text>
            </View>

            <ScrollView scrollY className={styles.modalScroll}>
              <View className={styles.currentBalance}>
                <Text className={styles.currentLabel}>当前余额</Text>
                <Text className={styles.currentValue}>{formatCurrency(member.balance)}</Text>
              </View>

              <Text className={styles.amountLabel}>选择金额</Text>
              <View className={styles.amountGrid}>
                {RECHARGE_AMOUNTS.map((amount) => (
                  <View
                    key={amount}
                    className={classNames(
                      styles.amountCard,
                      selectedAmount === amount && styles.active
                    )}
                    onClick={() => handleSelectAmount(amount)}
                  >
                    <Text className={styles.amountValue}>¥{amount}</Text>
                  </View>
                ))}
              </View>

              <View className={styles.customAmount}>
                <Text className={styles.amountLabel}>自定义金额</Text>
                <Input
                  className={styles.customInput}
                  type='digit'
                  placeholder='请输入充值金额'
                  value={customAmount}
                  onInput={(e) => handleCustomAmountChange(e.detail.value)}
                />
              </View>

              {getFinalAmount() > 0 && (
                <View className={styles.rechargeSummary}>
                  <Text className={styles.summaryLabel}>充值金额</Text>
                  <Text className={styles.summaryValue}>{formatCurrency(getFinalAmount())}</Text>
                </View>
              )}
            </ScrollView>

            <View className={styles.modalFooter}>
              <Button className={styles.cancelBtn} onClick={() => setShowRecharge(false)}>
                取消
              </Button>
              <Button
                className={classNames(styles.confirmBtn, getFinalAmount() <= 0 && styles.disabled)}
                onClick={handleRecharge}
                disabled={getFinalAmount() <= 0 || recharging}
                loading={recharging}
              >
                {recharging ? '充值中...' : `确认充值 ${formatCurrency(getFinalAmount())}`}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MemberDetailPage;
