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

/**
 * 挂载前的设计器路由识别。
 * main.ts 要在 getUser / createApp 之前决定是否打桩，此时 vue-router 尚未安装、
 * route.name 也还没 resolve，只能读 hash；单独抽出来避免入口与 App.vue 各写一套正则。
 */
const FRAME_LOCATION = /^#?\/__designer-frame(?:[/?]|$)/;

export function isDesignerFrameLocation(location: string = window.location.hash): boolean {
  return FRAME_LOCATION.test(location);
}

/**
 * frame 页允许停留的路由：只有 designerFrame。
 * palette 内部改 query、父页 syncHashToFrame 同步 hash 都仍是 designerFrame，不受影响。
 * 约束由 frame 路由组件 palette.vue 挂载时注册 beforeEach、卸载时移除，业务路由模块完全不感知设计器。
 */
export function isFrameRoute(name: unknown): boolean {
  return name === 'designerFrame';
}
