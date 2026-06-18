import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, Input, Switch } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classNames from 'classnames';
import styles from './index.module.scss';
import { useRoomStore } from '@/store/roomStore';
import { BillingRule, RoomType } from '@/types';
import { getRoomTypeText, formatCurrency } from '@/utils/format';

const RuleConfigPage: React.FC = () => {
  const router = useRouter();
  const ruleId = router.params?.id;

  const billingRules = useRoomStore((s) => s.billingRules);
  const getBillingRuleById = useRoomStore((s) => s.getBillingRuleById);
  const updateBillingRule = useRoomStore((s) => s.updateBillingRule);

  const [selectedType, setSelectedType] = useState<RoomType | ''>('');
  const [formData, setFormData] = useState<Partial<BillingRule>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ruleId) {
      const rule = getBillingRuleById(ruleId);
      if (rule) {
        setSelectedType(rule.roomType);
        setFormData(rule);
      }
    } else if (billingRules.length > 0) {
      setSelectedType(billingRules[0].roomType);
      setFormData(billingRules[0]);
    }
  }, [ruleId, billingRules, getBillingRuleById]);

  const handleSelectType = (type: RoomType) => {
    setSelectedType(type);
    const rule = billingRules.find((r) => r.roomType === type);
    if (rule) {
      setFormData(rule);
    }
  };

  const handleInputChange = (field: keyof BillingRule, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberInput = (field: keyof BillingRule, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      handleInputChange(field, num);
    } else if (val === '') {
      handleInputChange(field, 0);
    }
  };

  const handleSave = async () => {
    if (!selectedType || !formData.id) {
      Taro.showToast({ title: '请选择规则', icon: 'none' });
      return;
    }

    setSaving(true);
    try {
      updateBillingRule(formData.id, formData);
      Taro.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        Taro.navigateBack();
      }, 1000);
    } catch (e) {
      Taro.showToast({ title: '保存失败', icon: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>计费规则配置</Text>
        <Text className={styles.pageDesc}>修改起步价、封顶价、包夜价等计费参数</Text>
      </View>

      <ScrollView className={styles.content} scrollY>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>选择包间类型</Text>
          <View className={styles.typeList}>
            {billingRules.map((rule) => (
              <View
                key={rule.id}
                className={classNames(styles.typeCard, selectedType === rule.roomType && styles.selected)}
                onClick={() => handleSelectType(rule.roomType)}
              >
                <Text className={styles.typeName}>{getRoomTypeText(rule.roomType)}</Text>
                <Text className={styles.typeHint}>
                  起步 {formatCurrency(rule.startingPrice)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {selectedType && formData.id && (
          <>
            <View className={styles.section}>
              <Text className={styles.sectionTitle}>基础计费</Text>
              
              <View className={styles.formItem}>
                <View className={styles.labelRow}>
                  <Text className={styles.label}>起步价 (元)</Text>
                  <Text className={styles.hint}>{formData.startingMinutes}分钟内按此价格</Text>
                </View>
                <Input
                  className={styles.input}
                  type='digit'
                  value={String(formData.startingPrice || '')}
                  onInput={(e) => handleNumberInput('startingPrice', e.detail.value)}
                  placeholder='请输入起步价'
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.label}>起步时长 (分钟)</Text>
                <Input
                  className={styles.input}
                  type='number'
                  value={String(formData.startingMinutes || '')}
                  onInput={(e) => handleNumberInput('startingMinutes', e.detail.value)}
                  placeholder='请输入起步时长'
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.label}>按时单价 (元/小时)</Text>
                <Input
                  className={styles.input}
                  type='digit'
                  value={String(formData.hourlyRate || '')}
                  onInput={(e) => handleNumberInput('hourlyRate', e.detail.value)}
                  placeholder='请输入按时单价'
                />
              </View>

              <View className={styles.formItem}>
                <Text className={styles.label}>封顶价 (元)</Text>
                <Input
                  className={styles.input}
                  type='digit'
                  value={String(formData.ceilingPrice || '')}
                  onInput={(e) => handleNumberInput('ceilingPrice', e.detail.value)}
                  placeholder='单日最高收费'
                />
              </View>
            </View>

            <View className={styles.section}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>包夜套餐</Text>
                <Switch
                  checked={formData.overnightEnabled}
                  onChange={(e) => handleInputChange('overnightEnabled', e.detail.value)}
                  color='#D4380D'
                />
              </View>

              {formData.overnightEnabled && (
                <>
                  <View className={styles.formItem}>
                    <Text className={styles.label}>包夜价格 (元)</Text>
                    <Input
                      className={styles.input}
                      type='digit'
                      value={String(formData.overnightPrice || '')}
                      onInput={(e) => handleNumberInput('overnightPrice', e.detail.value)}
                      placeholder='请输入包夜一口价'
                    />
                  </View>

                  <View className={styles.formRow}>
                    <View className={styles.formItemHalf}>
                      <Text className={styles.label}>开始时间</Text>
                      <Input
                        className={styles.input}
                        value={formData.overnightStartTime || ''}
                        onInput={(e) => handleInputChange('overnightStartTime', e.detail.value)}
                        placeholder='如 22:00'
                      />
                    </View>
                    <View className={styles.formItemHalf}>
                      <Text className={styles.label}>结束时间</Text>
                      <Input
                        className={styles.input}
                        value={formData.overnightEndTime || ''}
                        onInput={(e) => handleInputChange('overnightEndTime', e.detail.value)}
                        placeholder='如 08:00'
                      />
                    </View>
                  </View>

                  <View className={styles.tipCard}>
                    <Text className={styles.tipIcon}>💡</Text>
                    <Text className={styles.tipText}>
                      提示：包夜时段内累计使用超过180分钟将自动按包夜套餐计费
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View className={styles.previewCard}>
              <Text className={styles.previewTitle}>规则预览</Text>
              <View className={styles.previewRow}>
                <Text className={styles.previewLabel}>计费模式</Text>
                <Text className={styles.previewValue}>
                  起步{formatCurrency(formData.startingPrice || 0)} + {formatCurrency(formData.hourlyRate || 0)}/时，封顶{formatCurrency(formData.ceilingPrice || 0)}
                </Text>
              </View>
              {formData.overnightEnabled && (
                <View className={styles.previewRow}>
                  <Text className={styles.previewLabel}>包夜套餐</Text>
                  <Text className={styles.previewValue}>
                    {formatCurrency(formData.overnightPrice || 0)} ({formData.overnightStartTime} - {formData.overnightEndTime})
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <View className={styles.footer}>
        <Button
          className={classNames(styles.saveBtn, !selectedType && styles.disabled)}
          onClick={handleSave}
          disabled={!selectedType || saving}
          loading={saving}
        >
          {saving ? '保存中...' : '保存规则'}
        </Button>
      </View>
    </View>
  );
};

export default RuleConfigPage;
