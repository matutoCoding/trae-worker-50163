import React from 'react';
import { View, Text } from '@tarojs/components';
import classNames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  label: string;
  value: string | number;
  subText?: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'overnight';
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subText,
  icon,
  variant = 'default'
}) => {
  return (
    <View className={classNames(styles.statCard, styles[variant])}>
      <View className={styles.statHeader}>
        <Text className={styles.statLabel}>{label}</Text>
        {icon && <Text className={styles.statIcon}>{icon}</Text>}
      </View>
      <Text className={styles.statValue}>{value}</Text>
      {subText && <Text className={styles.statSub}>{subText}</Text>}
    </View>
  );
};

export default StatCard;
