<template>
  <div>TODO: 资源列表</div>
</template>

<script lang="ts" setup>
  import { TopologyNode } from '~/@types/topology';

  defineProps<{
    nodes: TopologyNode[];
  }>();
</script>
