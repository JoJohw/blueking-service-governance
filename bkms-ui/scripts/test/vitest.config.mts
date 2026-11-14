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
 * scripts/test 专用配置：仓库工具自身的测试，不含业务单测。
 *
 * scripts/theme-lint 等是自带的工具链而非业务代码，它们的用例故意不进主配置
 * （vite.config.mts 的 test.include 只收 test/**\/*.test.ts），因此 test:unit / test:ci
 * ——以及 GitHub 上的单元测试流水线——都不会跑到它们。统一用一条命令跑：
 *
 *   pnpm test:scripts
 *
 * 两个约束：
 * - include 相对 cwd（bkms-ui 根目录），所以命令要在 bkms-ui 下执行；
 * - 不复用主 vite 配置：不需要 jsdom、别名与组件链，跑得快也不受业务依赖影响。
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['scripts/test/**/*.test.mjs'],
    environment: 'node',
  },
});
