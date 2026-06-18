import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useMemberStore } from '@/store/memberStore';
import { useBillingStore } from '@/store/billingStore';
import { Member } from '@/types';
import { formatCurrency } from '@/utils/format';
import EmptyState from '@/components/EmptyState';

const MemberCenterPage: React.FC = () => {
  const [searchText, setSearchText] = useState('');

  const members = useMemberStore((s) => s.members);
  const searchMembers = useMemberStore((s) => s.searchMembers);
  const getMemberLevelText = useMemberStore((s) => s.getMemberLevelText);
  const getMemberLevelColor = useMemberStore((s) => s.getMemberLevelColor);
  const getLatestTransaction = useMemberStore((s) => s.getLatestTransaction);
  const bills = useBillingStore((s) => s.bills);

  const filteredMembers = useMemo(() => {
    return searchMembers(searchText);
  }, [searchText, searchMembers]);

  const getMemberStats = (memberId: string) => {
    const memberBills = bills.filter(
      (b) => b.memberId === memberId && b.status === 'paid'
    );
    const latestTx = getLatestTransaction(memberId);
    return {
      billCount: memberBills.length,
      recentBill: memberBills.sort(
        (a, b) => (b.closedAt || 0) - (a.closedAt || 0)
      )[0],
      latestTx
    };
  };

  const handleMemberClick = (memberId: string) => {
    Taro.navigateTo({
      url: `/pages/memberDetail/index?id=${memberId}`
    });
  };

  const totalMemberBalance = useMemo(() => {
    return members.reduce((sum, m) => sum + m.balance, 0);
  }, [members]);

  const totalMemberConsumption = useMemo(() => {
    return members.reduce((sum, m) => sum + m.totalConsumption, 0);
  }, [members]);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>会员中心</Text>
        <View className={styles.summaryRow}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{members.length}</Text>
            <Text className={styles.summaryLabel}>会员总数</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{formatCurrency(totalMemberBalance)}</Text>
            <Text className={styles.summaryLabel}>储值总额</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{formatCurrency(totalMemberConsumption)}</Text>
            <Text className={styles.summaryLabel}>累计消费</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.searchBar}>
          <Text className={styles.searchIcon}>🔍</Text>
          <Input
            className={styles.searchInput}
            placeholder='搜索姓名 / 手机号 / 会员卡号'
            value={searchText}
            onInput={(e) => setSearchText(e.detail.value)}
            confirmType='search'
          />
          {searchText && (
            <Text className={styles.clearBtn} onClick={() => setSearchText('')}>
              ✕
            </Text>
          )}
        </View>

        <ScrollView className={styles.memberList} scrollY>
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member: Member) => {
              const stats = getMemberStats(member.id);
              return (
                <View
                  key={member.id}
                  className={styles.memberCard}
                  onClick={() => handleMemberClick(member.id)}
                >
                  <View className={styles.memberAvatar}>
                    <Text className={styles.avatarText}>
                      {member.name.charAt(0)}
                    </Text>
                  </View>
                  <View className={styles.memberInfo}>
                    <View className={styles.memberHeader}>
                      <Text className={styles.memberName}>{member.name}</Text>
                      <Text
                        className={styles.memberLevel}
                        style={{ color: getMemberLevelColor(member.level) }}
                      >
                        {getMemberLevelText(member.level)}
                      </Text>
                    </View>
                    <View className={styles.memberMeta}>
                      <Text className={styles.metaText}>{member.memberNo}</Text>
                      <Text className={styles.metaText}>{member.phone}</Text>
                    </View>
                    <View className={styles.memberStats}>
                      <Text className={styles.statsText}>
                        余额 {formatCurrency(member.balance)}
                      </Text>
                      <Text className={styles.statsDot}>·</Text>
                      <Text className={styles.statsText}>
                        消费 {member.visitCount} 次
                      </Text>
                      {stats.latestTx && (
                        <>
                          <Text className={styles.statsDot}>·</Text>
                          <Text className={classNames(styles.statsText, styles.latestTx)}>
                            {stats.latestTx.type === 'recharge' ? '充值' : '消费'} {stats.latestTx.type === 'recharge' ? '+' : '-'}{formatCurrency(stats.latestTx.amount)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Text className={styles.arrow}>›</Text>
                </View>
              );
            })
          ) : (
            <EmptyState
              icon='🔍'
              title='未找到会员'
              description='请尝试其他搜索关键词'
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default MemberCenterPage;
