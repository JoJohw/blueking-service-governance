<!--
 - TencentBlueKing is pleased to support the open source community by making
 - 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 - Copyright (C) Tencent. All rights reserved.
 - Licensed under the MIT License (the "License"); you may not use this file except
 - in compliance with the License. You may obtain a copy of the License at
 -
 -  http://opensource.org/licenses/MIT
 -
 - Unless required by applicable law or agreed to in writing, software distributed under
 - the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 - either express or implied. See the License for the specific language governing permissions
 - and limitations under the License.
 -
 - We undertake not to change the open source license (MIT license) applicable
 - to the current version of the project delivered to anyone in the future.
-->

<template>
  <div
    class="viz-preview"
    :style="tokenVar"
  >
    <!-- 线条：连线与网格线的三种笔形 -->
    <div
      v-if="sample === 'line'"
      class="viz-board viz-line-board"
    >
      <span class="viz-line viz-line-solid" />
      <span class="viz-line viz-line-dashed" />
      <span class="viz-line viz-line-dotted" />
    </div>

    <!-- 面：画布底 + 浮起的卡片 -->
    <div
      v-else-if="sample === 'surface'"
      class="viz-board viz-surface-board"
    >
      <div class="viz-surface-canvas">
        <div class="viz-surface-card">
          <span class="viz-surface-line" />
          <span class="viz-surface-line viz-surface-line-short" />
        </div>
      </div>
    </div>

    <!-- 状态：minimap 里的实色状态块 -->
    <div
      v-else-if="sample === 'status'"
      class="viz-board viz-status-board"
    >
      <div class="viz-status-map">
        <span class="viz-status-block viz-status-current" />
        <span class="viz-status-block" />
        <span class="viz-status-block" />
        <span class="viz-status-block viz-status-block-wide" />
      </div>
    </div>

    <!-- 文字：浅底与深底各一份，反白色也能看清 -->
    <div
      v-else-if="sample === 'text'"
      class="viz-board viz-text-board"
    >
      <div class="viz-text-pane viz-text-light">
        <span class="viz-text-sample">服务治理</span>
        <small class="viz-text-caption">浅底</small>
      </div>
      <div class="viz-text-pane viz-text-dark">
        <span class="viz-text-sample">服务治理</span>
        <small class="viz-text-caption">深底</small>
      </div>
    </div>

    <!-- 图表：坐标轴、网格、折线、浮层与图例 -->
    <div
      v-else-if="sample === 'chart'"
      class="viz-board viz-chart-board"
    >
      <div class="viz-chart-grid">
        <span class="viz-chart-row" />
        <span class="viz-chart-row" />
        <span class="viz-chart-row" />
        <svg
          aria-hidden="true"
          class="viz-chart-line"
          preserveAspectRatio="none"
          viewBox="0 0 160 90"
        >
          <polyline
            class="viz-chart-base"
            points="8,72 45,44 82,58 118,22 152,36"
          />
          <polyline
            class="viz-chart-current"
            points="45,44 82,58 118,22"
          />
        </svg>
        <div class="viz-chart-tooltip">
          <span class="viz-chart-legend">请求量</span>
          <strong>128</strong>
        </div>
      </div>
    </div>

    <!-- 选中态：画布节点的描边高亮 -->
    <div
      v-else-if="sample === 'state'"
      class="viz-board viz-state-board"
    >
      <div class="viz-state-node">节点 A</div>
      <div class="viz-state-node viz-state-selected">节点 B</div>
      <div class="viz-state-node">节点 C</div>
    </div>

    <!-- 曲线配色：八条曲线各取一色，被审视的那条加粗，说明它的真实用途是折线图取色 -->
    <div
      v-else-if="sample === 'series'"
      class="viz-board viz-series-board"
    >
      <div class="viz-series-chart">
        <span class="viz-series-grid viz-series-grid-1" />
        <span class="viz-series-grid viz-series-grid-2" />
        <span class="viz-series-grid viz-series-grid-3" />
        <svg
          aria-hidden="true"
          class="viz-series-svg"
          preserveAspectRatio="none"
          viewBox="0 0 240 64"
        >
          <polyline
            v-for="(name, index) in seriesNames"
            :key="name"
            class="viz-series-curve"
            :class="{ 'is-current': name === token.name }"
            :points="seriesPaths[index]"
            :style="{ stroke: `var(${name})` }"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
      <span class="viz-series-caption">折线图里每条曲线取一个颜色</span>
      <span
        v-if="locked"
        class="viz-series-lock"
      >
        锁定
      </span>
    </div>

    <div
      v-else
      class="viz-fallback"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  import { isVizLocked, VIZ_SERIES_NAMES, vizSampleOf } from './vizSamples';

  import type { Token } from '../../util/tokens';

  const props = defineProps<{ token: Token }>();

  const sample = computed(() => vizSampleOf(props.token.name));
  const locked = computed(() => isVizLocked(props.token.name));
  const seriesNames = VIZ_SERIES_NAMES;

  /** 八条曲线的走势，仅用于小样展示；下标与 series-1…8 顺序对应 */
  const seriesPaths = [
    '0,50 40,42 80,47 120,30 160,36 200,20 240,27',
    '0,55 40,49 80,35 120,44 160,25 200,31 240,15',
    '0,44 40,53 80,39 120,21 160,43 200,27 240,33',
    '0,58 40,45 80,53 120,37 160,19 200,35 240,21',
    '0,40 40,31 80,43 120,51 160,39 200,23 240,35',
    '0,48 40,57 80,31 120,45 160,31 200,41 240,17',
    '0,36 40,47 80,59 120,39 160,27 200,45 240,31',
    '0,52 40,35 80,45 120,55 160,41 200,29 240,39',
  ];

  /** 小样里被审视的部件统一读这个变量，值即当前 viz 令牌 */
  const tokenVar = computed(() => ({ '--sample-viz': `var(${props.token.name})` }));
</script>

<style scoped>
  .viz-preview {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: var(--preview-h, 170px);
    padding: 0 20px;
    overflow: hidden;
    background: var(--pal-bg-head);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }

  .viz-board {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  /* line */
  .viz-line-board {
    gap: 20px;
    height: 116px;
    padding: 0 14px;
    background: var(--bkms-viz-bg-card);
    border: 1px solid var(--bkms-viz-split-line);
    border-radius: 4px;
  }

  .viz-line {
    width: 100%;
    border-top: 2px solid var(--sample-viz);
  }

  .viz-line-dashed {
    border-top-style: dashed;
  }

  .viz-line-dotted {
    border-top-style: dotted;
  }

  /* surface */
  .viz-surface-canvas {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 112px;
    background: var(--sample-viz);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }

  .viz-surface-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 62%;
    padding: 12px;
    background: var(--bkms-viz-bg-card);
    border: 1px solid var(--bkms-viz-tooltip-border);
    border-radius: 4px;
    box-shadow: 0 4px 12px var(--bkms-viz-mask);
  }

  .viz-surface-line {
    height: 5px;
    background: var(--bkms-viz-split-line);
    border-radius: 3px;
  }

  .viz-surface-line-short {
    width: 55%;
  }

  /* status */
  .viz-status-map {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: 100%;
    height: 112px;
    padding: 14px;
    background: var(--bkms-viz-surface-canvas);
    border-radius: 4px;
  }

  .viz-status-block {
    background: var(--bkms-viz-line);
    border-radius: 2px;
    opacity: 0.55;
  }

  .viz-status-current {
    background: var(--sample-viz);
    box-shadow: 0 0 0 2px var(--bkms-viz-bg-card);
    opacity: 1;
  }

  .viz-status-block-wide {
    grid-column: span 2;
  }

  /* text */
  .viz-text-board {
    flex-direction: row;
    gap: 10px;
  }

  .viz-text-pane {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
    height: 112px;
    border-radius: 4px;
  }

  .viz-text-light {
    background: var(--bkms-viz-bg-card);
    border: 1px solid var(--bkms-viz-tooltip-border);
  }

  .viz-text-dark {
    background: var(--bkms-viz-surface-canvas);
  }

  .viz-text-sample {
    font-size: 18px;
    font-weight: 600;
    color: var(--sample-viz);
  }

  .viz-text-caption {
    font-size: 11px;
    color: var(--bkms-viz-legend-text);
  }

  /* chart */
  .viz-chart-grid {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 112px;
    overflow: hidden;
    background: var(--bkms-viz-tooltip-surface);
    border: 1px solid var(--bkms-viz-tooltip-border);
    border-radius: 4px;
  }

  .viz-chart-row {
    position: absolute;
    right: 0;
    left: 0;
    height: 1px;
    border-top: 1px dashed var(--bkms-viz-split-line);
  }

  .viz-chart-row:nth-child(1) {
    top: 28px;
  }

  .viz-chart-row:nth-child(2) {
    top: 56px;
  }

  .viz-chart-row:nth-child(3) {
    top: 84px;
  }

  .viz-chart-line {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .viz-chart-base {
    fill: none;
    stroke: var(--bkms-viz-line);
    stroke-width: 2;
  }

  .viz-chart-current {
    fill: none;
    stroke: var(--sample-viz);
    stroke-width: 3;
    stroke-linecap: round;
  }

  .viz-chart-tooltip {
    position: absolute;
    top: 8px;
    right: 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 10px;
    background: var(--bkms-viz-tooltip-surface);
    border: 1px solid var(--bkms-viz-tooltip-border);
    border-radius: 4px;
    box-shadow: 0 4px 12px var(--bkms-viz-mask);
  }

  .viz-chart-legend {
    font-size: 10px;
    color: var(--bkms-viz-legend-text);
  }

  .viz-chart-tooltip strong {
    font-size: 13px;
    color: var(--bkms-viz-text-title);
  }

  /* state */
  .viz-state-board {
    flex-direction: row;
    gap: 8px;
  }

  .viz-state-node {
    box-sizing: border-box;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 56px;
    font-size: 12px;
    color: var(--bkms-viz-text-body);
    background: var(--bkms-viz-bg-card);
    border: 1px solid var(--bkms-viz-split-line);
    border-radius: 4px;
  }

  .viz-state-selected {
    border: 2px solid var(--sample-viz);
    box-shadow: 0 0 0 3px var(--bkms-viz-bg-active);
  }

  /* series */
  .viz-series-board {
    gap: 8px;
  }

  .viz-series-chart {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 104px;
    overflow: hidden;
    background: var(--bkms-viz-tooltip-surface);
    border: 1px solid var(--bkms-viz-tooltip-border);
    border-radius: 4px;
  }

  .viz-series-grid {
    position: absolute;
    right: 0;
    left: 0;
    height: 1px;
    border-top: 1px dashed var(--bkms-viz-split-line);
  }

  .viz-series-grid-1 {
    top: 26px;
  }

  .viz-series-grid-2 {
    top: 52px;
  }

  .viz-series-grid-3 {
    top: 78px;
  }

  .viz-series-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .viz-series-curve {
    opacity: 0.65;
    fill: none;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .viz-series-curve.is-current {
    opacity: 1;
    stroke-width: 3.5;
  }

  .viz-series-caption {
    font-size: 11px;
    color: var(--bkms-viz-legend-text);
  }

  .viz-series-lock {
    padding: 2px 10px;
    font-size: 11px;
    color: var(--pal-text-body);
    background: var(--pal-bg-subtle);
    border: 1px solid var(--pal-line);
    border-radius: 10px;
  }

  .viz-fallback {
    width: 100%;
    height: 112px;
    background: var(--sample-viz);
    border: 1px solid var(--pal-line);
    border-radius: 4px;
  }
</style>
