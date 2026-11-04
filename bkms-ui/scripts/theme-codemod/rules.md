# theme-codemod 规约占位

## 色值真源

`bkms-color-spec.md` 不进 git，真源位于 `C:\Users\Administrator\Downloads\bkms-color-spec.md`；本目录的 mapping.json / keep.json / pending-design.json 均从该文件录入。

## Step 2 实施结论（2026-11-03）

- **插件匹配面**：`node_modules/bkui-vue/` 全部样式（dist 的 css + lib 各组件 less，含 pnpm 多版本副本 beta.97/beta.63）。实测 bkui 组件 JS 打包时引入的是 lib 下的 less 源样式，仅匹配 dist 会漏掉大半规则。
- **拦截验证**：postcss 直跑单测（跳过 `--` 定义、大小写、渐变参数、8 位跳过、pending 标注、keep 保留全部通过）+ `pnpm build` 产物验证（`var(--bkms-` 从 440 → 926，`:root` 层 bridge 定义在旧定义之后、覆盖生效）。
- **dev/build 一致性**：`css.postcss` 为 Vite dev/build 共用配置，build 已验证；dev 待用户刷新目检确认。
- **范围外残留登记（已拍板 2026-11-03）**：`@blueking/date-picker`（独立日期组件包，选择器亦用 `.bk-` 前缀但非 bkui-vue）自带 68 处 mapping 旧色，用户确认纳入同一份 mapping，插件匹配面已扩展到该包。
- **构建环境注意**：`pnpm build` 需 `NODE_OPTIONS=--max-old-space-size=8192`（默认堆内存不足，Node 22 + Vite 构建崩 OOM，与本次改动无关）。

## 判定规则（待需求单原文核实后落成第三段逻辑）

- [ ] 散落的紫、青收进 Purple / Cyan 色阶（原文待核）
- [ ] 色差 ≤ 6 的散色进最近规范色（原文待核）

落实位置：本文件或 codemod.mjs 脚本常量，业务 codemod 与编译替换（Step 2 postcss）共用同一套未命中流程。

## 显式待定开关（Step 0 第 6 条，已于 Step 2 前盘点回填）

- [x] 编译替换是否覆盖组件库 `.js` 内嵌样式字符串：**只处理 css**。实测 `node_modules/bkui-vue/dist/*.js`（esm 52 处）内嵌色绝大多数为图表默认调色板数组 + 1 处 `style.setProperty('background', '#E2EDFF')` 动态注入（Table 固定列汇总行），不值得加 JS transform；`#E2EDFF` 登记进 Step 6 人工批（可改 `var(--bkms-bg-active)` 同源值）。
