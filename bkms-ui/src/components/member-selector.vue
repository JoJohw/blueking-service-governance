<template>
  <TagInput
    allow-create
    collapse-tags
    has-delete-icon
    :model-value="memberTags"
    :placeholder="placeholder"
    @change="handleMemberChange"
  />
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  import { TagInput } from 'bkui-vue';

  const members = defineModel('members', { type: String });
  defineProps({
    placeholder: {
      type: String,
      default: '',
    },
  });
  const memberTags = computed(() => (members.value ? members.value.split(';') : []));
  const handleMemberChange = (val: string[]) => (members.value = val.join(';'));
</script>
