<template>
  <div class="py-[12px] px-[16px] bg-[#F5F7FA]">
    <div class="text-[#313238] font-bold text-[12px] mb-[4px]">{{ $t('权限内容') }}</div>
    <ul v-if="value !== 'admin'">
      <li
        v-for="item in permissionContent"
        :key="item.resource"
        class="text-[#63656E] text-[12px] leading-[20px]"
      >
        <span class="font-bold">{{ item.resource }}</span>
        <span>：{{ item.operations.join(', ') }}</span>
      </li>
    </ul>
    <span
      v-else
      class="text-[#63656E] text-[12px] leading-[20px]"
      >{{ $t('拥有全部权限') }}</span
    >
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  import { useI18n } from 'vue-i18n';

  import { IRole, PERMISSION_LIST } from './permission-list';
  interface IProps {
    value: IRole;
  }

  const props = defineProps<IProps>();
  const { t } = useI18n();
  const permissionContent = computed(() => {
    if (props.value === 'admin') return [];
    const map = new Map();
    const curList = PERMISSION_LIST.filter(item => item[props.value]);
    for (const item of curList) {
      const groupKey = item.resource;
      if (!map.has(item.resource)) {
        map.set(groupKey, []);
      }
      map.get(groupKey).push(item.operation);
    }
    const allows = [];
    for (const [key, value] of map.entries()) {
      allows.push({
        resource: t(key),
        operations: value.map((item: string) => t(item)),
      });
    }
    return allows;
  });
</script>
