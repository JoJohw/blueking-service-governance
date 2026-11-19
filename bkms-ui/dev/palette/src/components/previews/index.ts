/*
 * TencentBlueKing is pleased to support the open source community by making
 * 蓝鲸智云 - 服务治理 (BlueKing Service Governance) available.
 * Copyright (C) Tencent. All rights reserved.
 * Licensed under the MIT License (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 *  http://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 * either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

import type { Component } from 'vue';

import type { Token } from '../../util/tokens';
import BackgroundPreview from './BackgroundPreview.vue';
import LinePreview from './LinePreview.vue';
import RadiusPreview from './RadiusPreview.vue';
import ShadowPreview from './ShadowPreview.vue';
import SwatchPreview from './SwatchPreview.vue';
import TextPreview from './TextPreview.vue';
import VizPreview from './VizPreview.vue';

interface PreviewRule {
  match: (token: Token) => boolean;
  component: Component;
}

/**
 * 展示形态按「token 是什么」决定，与它挂在哪个分区无关。
 * 新增类别（渐变、遮罩等）只需在这里加一条规则 + 一个预览组件。
 * 细粒度形态（如圆角语义档的控件小样）由预览组件内部再分派，不在这里拆规则：
 * 圆角语义的映射表在 `./radiusSamples.ts`，模板分支在 `./RadiusPreview.vue`。
 */
const rules: PreviewRule[] = [
  { match: token => token.kind === 'viz', component: VizPreview },
  { match: token => token.kind === 'radius', component: RadiusPreview },
  { match: token => token.kind === 'shadow', component: ShadowPreview },
  { match: token => token.name.startsWith('--bkms-text-'), component: TextPreview },
  { match: token => token.name.startsWith('--bkms-line-'), component: LinePreview },
  { match: token => token.name.startsWith('--bkms-bg-'), component: BackgroundPreview },
];

/** 没有用途语境的原子色（色阶级）落到色块 */
export function previewFor(token: Token): Component {
  return rules.find(rule => rule.match(token))?.component ?? SwatchPreview;
}
