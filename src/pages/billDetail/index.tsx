import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const BillDetailPage: React.FC = () => {
  return (
    <View className={styles.page}>
      <Text className={styles.icon}>📋</Text>
      <Text className={styles.title}>账单详情</Text>
      <Text className={styles.desc}>
        账单详情功能正在开发中...
        {'\n'}
        敬请期待！
      </Text>
      <Button
        className={styles.backBtn}
        onClick={() => Taro.navigateBack()}
      >
        返回
      </Button>
    </View>
  );
};

export default BillDetailPage;
