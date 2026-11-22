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
 * either express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * We undertake not to change the open source license (MIT license) applicable
 * to the current version of the project delivered to anyone in the future.
 */

/**
 * ToggleCard 预览插件：让真实态呈现组件本身。
 * icon 置空走组件自带 RightShape 展开箭头；icon/header-right 是追加位，真实态不传；
 * default 给业务样例，让展开/收起有内容可看。
 */
export default {
  name: 'components/toggle-card',

  // 业务中放在定宽容器里，折叠只收起内容、宽度与箭头 x 位置不变；
  // 预览 canvas 是 flex 自适应容器，不定宽会出现业务里不存在的宽度坍塌。
  containerWidth: {
    'components/toggle-card': 400,
  },

  propOverrides: {
    'components/toggle-card': {
      icon: '',
      name: '基本信息',
    },
  },

  slotOverrides: {
    'components/toggle-card': {
      default: {
        sample: [{ text: '点击标题栏可展开或收起下方内容' }, { repeat: 3, text: '配置项' }],
      },
    },
  },

  // 标题 + 内容 是本体，header-right / icon 是可选装饰位，各自单独叠加出一种组合
  slotCombos: {
    'components/toggle-card': {
      base: ['title', 'default'],
      extras: ['header-right', 'icon'],
    },
  },
};
