import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title = '暂无数据',
  description = '快去添加一些内容吧~'
}) => {
  return (
    <View className={styles.emptyState}>
      <Text className={styles.emptyIcon}>{icon}</Text>
      <Text className={styles.emptyTitle}>{title}</Text>
      <Text className={styles.emptyDesc}>{description}</Text>
    </View>
  );
};

export default EmptyState;
