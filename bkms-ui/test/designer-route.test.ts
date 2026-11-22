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
import { describe, expect, it } from 'vitest';
import { isDesignerFrameLocation, isFrameRoute } from '~/pages/designer/preview/designer-route';

/** 应用挂载前只能读 history.location / hash，此时 vue-router 尚未 resolve */
describe('设计器路由识别', () => {
  it('识别 frame 路由及其 query', () => {
    expect(isDesignerFrameLocation('#/__designer-frame?view=colors')).toBe(true);
  });

  it('外壳路由不是 frame（外壳保留真实启动期请求）', () => {
    expect(isDesignerFrameLocation('#/__designer')).toBe(false);
  });

  it('业务路由不命中', () => {
    expect(isDesignerFrameLocation('#/space/1/app')).toBe(false);
  });
});

/** frame 页只允许停留 designerFrame；守卫由 frame 路由组件 palette.vue 注册 / 移除 */
describe('frame 页允许停留的路由', () => {
  it('业务路由 / 404 / 未命名路由都不允许', () => {
    expect(isFrameRoute('appDetail')).toBe(false);
    expect(isFrameRoute('403')).toBe(false);
    expect(isFrameRoute(undefined)).toBe(false);
  });

  it('designerFrame 放行（palette 改 query、父页同步 hash 都仍是它）', () => {
    expect(isFrameRoute('designerFrame')).toBe(true);
  });

  it('外壳 designer 不属于 frame 页，顶层重定向不受影响', () => {
    expect(isFrameRoute('designer')).toBe(false);
  });
});
