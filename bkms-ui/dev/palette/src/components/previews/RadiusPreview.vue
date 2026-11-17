<template>
  <!-- 语义档：仿制该圆角实际落在的控件，圆角一律由 token.value 驱动 -->
  <div
    v-if="sample"
    class="radius-preview radius-preview-sample"
  >
    <div
      class="sample-board"
      :style="radiusVar"
    >
      <!-- field：输入框 + 占位文字 -->
      <p
        v-if="sample === 'field'"
        class="field"
      >
        <span class="field-placeholder">请输入</span>
      </p>

      <!-- tag：两个小标签 -->
      <div
        v-else-if="sample === 'tag'"
        class="tag-row"
      >
        <span class="tag">标签</span>
        <span class="tag tag-quiet">标签</span>
      </div>

      <!-- checkbox：未选 + 选中 -->
      <div
        v-else-if="sample === 'checkbox'"
        class="checkbox-row"
      >
        <span class="checkbox" />
        <span class="checkbox checkbox-checked">
          <span class="checkbox-tick">✓</span>
        </span>
      </div>

      <!-- scroll：细 track + 圆头 thumb -->
      <div
        v-else-if="sample === 'scroll'"
        class="scroll-body"
      >
        <span class="scroll-line" />
        <span class="scroll-line scroll-line-short" />
        <span class="scroll-line" />
        <span class="scroll-track">
          <span class="scroll-thumb" />
        </span>
      </div>

      <!-- control：主按钮 + 下拉选择器 -->
      <div
        v-else-if="sample === 'control'"
        class="control-row"
      >
        <span class="button">按钮</span>
        <span class="select">
          <span class="select-text">选项</span>
          <span class="select-arrow" />
        </span>
      </div>

      <!-- card：卡片标题 + 内容占位线 -->
      <div
        v-else-if="sample === 'card'"
        class="card"
      >
        <span class="card-title">卡片标题</span>
        <span class="card-line" />
        <span class="card-line card-line-short" />
      </div>

      <!-- overlay：浮层面板 + 两行菜单项 + 阴影 -->
      <div
        v-else-if="sample === 'overlay'"
        class="overlay"
      >
        <span class="overlay-item">编辑</span>
        <span class="overlay-item">删除</span>
      </div>

      <!-- tab：普通 tab + 选中 tab -->
      <div
        v-else-if="sample === 'tab'"
        class="tab-bar"
      >
        <span class="tab">基础信息</span>
        <span class="tab tab-active">高级配置</span>
      </div>

      <!-- menu：普通项 + 选中项 -->
      <div
        v-else-if="sample === 'menu'"
        class="menu"
      >
        <span class="menu-item">普通菜单</span>
        <span class="menu-item menu-item-active">选中菜单</span>
      </div>
    </div>
  </div>

  <!-- 档位档与兜底：同一半径在三种控件尺度上的观感 -->
  <div
    v-else
    class="radius-preview"
  >
    <div
      v-for="size in sizes"
      :key="size"
      class="radius-sample"
    >
      <div
        class="radius-box"
        :style="{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: token.value,
        }"
      />
      <span class="radius-size">{{ size }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import { radiusSampleOf } from './radiusSamples';

  import type { Token } from '../../util/tokens';

  const props = defineProps<{ token: Token }>();

  /** 同一半径在三种控件尺度上的观感：小标签、输入框/按钮、卡片/弹层 */
  const sizes = [24, 48, 88];

  /** 语义档才渲染控件小样；档位档与未知语义返回 null，走三尺寸方框 */
  const sample = computed(() => radiusSampleOf(props.token.name));

  /** 小样里的圆角全部读这个变量，值即当前令牌 */
  const radiusVar = computed(() => ({ '--sample-radius': props.token.value }));
</script>

<style scoped>
  .radius-preview {
    box-sizing: border-box;
    display: flex;
    gap: 18px;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: var(--preview-h, 170px);
    background: var(--pal-bg-head);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }

  .radius-sample {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
  }

  .radius-box {
    box-sizing: border-box;
    background: var(--pal-bg-card);
    border: 2px solid var(--pal-brand);
  }

  .radius-size {
    font-size: 10px;
    color: var(--pal-text-muted);
  }

  /* ---- 语义档：控件仿制 ---- */

  .radius-preview-sample {
    padding: 0 24px;
    overflow: hidden;
  }

  .sample-board {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  /* field */
  .field {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    width: 100%;
    height: 34px;
    padding: 0 12px;
    margin: 0;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: var(--sample-radius, 4px);
  }

  .field-placeholder {
    font-size: 13px;
    color: var(--pal-text-muted);
  }

  /* tag */
  .tag-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 8px;
    font-size: 12px;
    line-height: 1;
    color: var(--pal-brand);
    background: var(--pal-bg-brand-soft);
    border: 1px solid var(--pal-brand);
    border-radius: var(--sample-radius, 3px);
  }

  .tag-quiet {
    color: var(--pal-text-body);
    background: var(--pal-bg-subtle);
    border-color: var(--pal-line);
  }

  /* checkbox */
  .checkbox-row {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .checkbox {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-text-muted);
    border-radius: var(--sample-radius, 3px);
  }

  .checkbox-checked {
    background: var(--pal-brand);
    border-color: var(--pal-brand);
  }

  .checkbox-tick {
    font-size: 12px;
    line-height: 1;
    color: var(--pal-text-inverse);
  }

  /* scroll */
  .scroll-body {
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    height: 108px;
    padding: 12px 20px 12px 12px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: var(--sample-radius, 4px);
  }

  .scroll-line {
    height: 6px;
    background: var(--pal-line);
    border-radius: 3px;
  }

  .scroll-line-short {
    width: 60%;
  }

  .scroll-track {
    position: absolute;
    top: 10px;
    right: 6px;
    bottom: 10px;
    width: 6px;
    padding: 1px;
    background: var(--pal-bg-subtle);
    border-radius: calc(var(--sample-radius, 4px) + 2px);
  }

  .scroll-thumb {
    display: block;
    height: 46%;
    background: var(--pal-text-muted);
    border-radius: var(--sample-radius, 4px);
  }

  /* control */
  .control-row {
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;
  }

  .button,
  .select {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0 14px;
    font-size: 13px;
    border-radius: var(--sample-radius, 6px);
  }

  .button {
    color: var(--pal-text-inverse);
    background: var(--pal-brand);
  }

  .select {
    flex: 1;
    color: var(--pal-text-body);
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
  }

  .select-arrow {
    width: 0;
    height: 0;
    border-top: 5px solid var(--pal-text-muted);
    border-right: 4px solid transparent;
    border-left: 4px solid transparent;
  }

  /* card */
  .card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    padding: 14px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: var(--sample-radius, 6px);
  }

  .card-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--pal-text-title);
  }

  .card-line {
    height: 6px;
    background: var(--pal-line);
    border-radius: 3px;
  }

  .card-line-short {
    width: 55%;
  }

  /* overlay */
  .overlay {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 62%;
    padding: 6px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: var(--sample-radius, 6px);
    box-shadow: 0 4px 14px var(--pal-shadow-popover);
  }

  .overlay-item {
    padding: 7px 10px;
    font-size: 13px;
    color: var(--pal-text-body);
    border-radius: max(0px, calc(var(--sample-radius, 6px) - 2px));
  }

  .overlay-item:first-child {
    color: var(--pal-brand);
    background: var(--pal-bg-brand-soft);
  }

  /* tab */
  .tab-bar {
    display: flex;
    gap: 20px;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--pal-line);
  }

  .tab {
    padding: 6px 12px;
    font-size: 13px;
    line-height: 1;
    color: var(--pal-text-body);
    background: var(--pal-bg-subtle);
    border-radius: var(--sample-radius, 6px);
  }

  .tab-active {
    position: relative;
    color: var(--pal-brand);
    background: var(--pal-bg-brand-soft);
  }

  .tab-active::after {
    position: absolute;
    right: 6px;
    bottom: -9px;
    left: 6px;
    height: 2px;
    content: '';
    background: var(--pal-brand);
    border-radius: 1px;
  }

  /* menu */
  .menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding: 6px;
    background: var(--pal-bg-card);
    border: 1px solid var(--pal-line);
    border-radius: 6px;
  }

  .menu-item {
    padding: 8px 10px;
    font-size: 13px;
    color: var(--pal-text-body);
    border-radius: var(--sample-radius, 8px);
  }

  .menu-item-active {
    color: var(--pal-text-inverse);
    background: var(--pal-brand);
  }
</style>
