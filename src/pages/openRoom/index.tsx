import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const OpenRoomPage: React.FC = () => {
  return (
    <View className={styles.page}>
      <Text className={styles.icon}>🎯</Text>
      <Text className={styles.title}>快速开台</Text>
      <Text className={styles.desc}>
        开台功能正在开发中...
        {'\n'}
        敬请期待！
      </Text>
      <Button
        className={styles.backBtn}
        onClick={() => Taro.navigateBack()}
      >
        返回首页
      </Button>
    </View>
  );
};

export default OpenRoomPage;
