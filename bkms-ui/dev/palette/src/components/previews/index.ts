import type { Component } from 'vue';

import type { Token } from '../../util/tokens';
import BackgroundPreview from './BackgroundPreview.vue';
import LinePreview from './LinePreview.vue';
import ShadowPreview from './ShadowPreview.vue';
import SwatchPreview from './SwatchPreview.vue';
import TextPreview from './TextPreview.vue';

interface PreviewRule {
  match: (token: Token) => boolean;
  component: Component;
}

/**
 * 展示形态按「token 是什么」决定，与它挂在哪个分区无关。
 * 新增类别（渐变、遮罩等）只需在这里加一条规则 + 一个预览组件。
 */
const rules: PreviewRule[] = [
  { match: token => token.kind === 'shadow', component: ShadowPreview },
  { match: token => token.name.startsWith('--bkms-text-'), component: TextPreview },
  { match: token => token.name.startsWith('--bkms-line-'), component: LinePreview },
  { match: token => token.name.startsWith('--bkms-bg-'), component: BackgroundPreview },
];

/** 没有用途语境的原子色（色阶级、keep 级）落到色块 */
export function previewFor(token: Token): Component {
  return rules.find(rule => rule.match(token))?.component ?? SwatchPreview;
}
