<template>
  <Table
    border
    :cell-class-name="handleCellClassName"
    :column-config="{
      isHover: true,
      isCurrent: false,
    }"
    :data="tableData"
    :header-cell-class-name="handleHeaderCellClassName"
    :merge-cells="mergeCellsConfig"
    :row-class-name="handleRowClassName"
    :row-config="{
      isHover: false,
      isCurrent: false,
    }"
    @cell-click="handleBeforeSelect"
    @header-cell-click="handleBeforeSelect"
  >
    <TableColumn
      field="resource"
      :label="$t('资源类型')"
    >
      <template #default="{ row }">
        {{ $t(row.resource) }}
      </template>
    </TableColumn>
    <TableColumn
      class-name="last:bg-[blue]"
      field="operation"
      :label="$t('操作')"
    >
      <template #default="{ row }">
        {{ $t(row.operation) }}
      </template>
    </TableColumn>
    <TableColumn
      field="admin"
      :label="$t('管理员')"
    >
      <template #default="{ row }">
        <Done
          v-if="row.admin"
          :fill="curColumn === 'admin' ? '#2CAF5E' : '#C4C6CC'"
          :height="26"
          :width="24"
        />
        <Error
          v-else
          :fill="curColumn === 'admin' ? '#EA3636' : '#C4C6CC'"
          :height="26"
          :width="18"
        />
      </template>
    </TableColumn>
    <TableColumn
      field="developer"
      :label="$t('开发者')"
    >
      <template #default="{ row }">
        <Done
          v-if="row.developer"
          :fill="curColumn === 'developer' ? '#2CAF5E' : '#C4C6CC'"
          :height="26"
          :width="24"
        />
        <Error
          v-else
          :fill="curColumn === 'developer' ? '#EA3636' : '#C4C6CC'"
          :height="26"
          :width="18"
        />
      </template>
    </TableColumn>
    <TableColumn
      field="sre"
      label="SRE"
    >
      <template #default="{ row }">
        <Done
          v-if="row.sre"
          :fill="curColumn === 'sre' ? '#2CAF5E' : '#C4C6CC'"
          :height="26"
          :width="24"
        />
        <Error
          v-else
          :fill="curColumn === 'sre' ? '#EA3636' : '#C4C6CC'"
          :height="26"
          :width="18"
        />
      </template>
    </TableColumn>
    <TableColumn
      field="operator"
      :label="$t('运营者')"
    >
      <template #default="{ row }">
        <Done
          v-if="row.operator"
          :fill="curColumn === 'operator' ? '#2CAF5E' : '#C4C6CC'"
          :height="26"
          :width="24"
        />
        <Error
          v-else
          :fill="curColumn === 'operator' ? '#EA3636' : '#C4C6CC'"
          :height="26"
          :width="18"
        />
      </template>
    </TableColumn>
  </Table>
</template>
<script setup lang="ts">
  import { ref, watch } from 'vue';

  import { Table, TableColumn } from '@blueking/table';
  import { Done, Error } from 'bkui-vue/lib/icon';

  import { PERMISSION_LIST } from './permission-list';

  interface IColumn {
    field: string;
  }
  interface IEmits {
    (e: 'change', val: IRole): void;
  }
  type IProps = {
    active?: IRole;
  };
  type IRole = 'admin' | 'developer' | 'operator' | 'sre';
  interface MergeCells {
    col: number;
    colspan: number;
    row: number;
    rowspan: number;
  }
  interface Row {
    admin: boolean;
    developer: boolean;
    operation: string;
    operator: boolean;
    resource: string;
    sre: boolean;
  }

  const props = defineProps<IProps>();

  const emits = defineEmits<IEmits>();

  const tableData = ref<Row[]>(PERMISSION_LIST);

  // 合并单元格配置
  const mergeCellsConfig = ref<MergeCells[]>([
    { row: 0, col: 0, rowspan: 4, colspan: 1 },
    { row: 4, col: 0, rowspan: 4, colspan: 1 },
    { row: 8, col: 0, rowspan: 5, colspan: 1 },
  ]);

  // 列是否可高亮配置
  const curColumn = ref<IRole | undefined>(props.active || 'developer');
  function handleBeforeSelect({ column }: { column: IColumn }) {
    if (column.field === 'operation' || column.field === 'resource') return;
    curColumn.value = column.field as IRole;
  }
  /**
   * 单元格样式
   */
  function handleCellClassName({ column }: { column: IColumn }) {
    if (curColumn.value === column.field && column.field === 'operator') {
      return 'bg-[#F0F5FF] border-[#3A84FF] border-l-[1px] border-r-[2px] active-cell';
    }
    if (curColumn.value === column.field) {
      return 'bg-[#F0F5FF] border-[#3A84FF] border-x active-cell';
    }
    return '';
  }
  /**
   * 表头单元格样式
   */
  function handleHeaderCellClassName({ column }: { column: IColumn }) {
    if (curColumn.value === column.field && column.field === 'operator') {
      return 'border-[#3A84FF] border border-r-[2px] border-t-[2px] border-b-0';
    }
    if (curColumn.value === column.field) {
      return 'border-[#3A84FF] border border-t-[2px] border-b-0';
    }
    return '';
  }
  /**
   * 行样式
   */
  function handleRowClassName({ rowIndex }: { rowIndex: number }) {
    if (rowIndex === tableData.value.length - 1) {
      return 'last-row';
    }
    return '';
  }

  watch(
    () => props.active,
    (val: IRole | undefined) => {
      if (!val) return;
      curColumn.value = val;
    },
  );
  watch(curColumn, (val: IRole | undefined) => {
    if (!val) return;
    emits('change', val);
  });
</script>
<style scoped lang="postcss">
  :deep(.vxe-body--row.last-row) {
    .active-cell {
      border-bottom: 2px solid #3a84ff;
    }
  }
  .col--current {
    --vxe-ui-table-border-color: #3a84ff;
  }
</style>
