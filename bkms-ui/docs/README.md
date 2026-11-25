# bkms-ui 文档目录

本目录存放 bkms-ui 前端项目的开发文档与参考资料。

## 文档索引

| 文档                                                                   | 说明                                                                   |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                                   | 前端架构 — 启动链路、目录职责、关键机制、依赖方向与功能放置指引        |
| [architecture-diagram.html](./architecture-diagram.html)               | 文件结构可视化快照；目录和数量可能随代码演进变化，以代码及架构文档为准 |
| [DEVELOPMENT.md](./DEVELOPMENT.md)                                     | 本地开发指南 — 环境搭建、命令、调试技巧                                |
| [API_GUIDE.md](./API_GUIDE.md)                                         | API 请求层指南 — ConsoleFetch、拦截器、新增接口步骤                    |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md)                           | 编码规范 — 命名、组件、License header、样式                            |
| [ENV_VARIABLES.md](./ENV_VARIABLES.md)                                 | 环境变量说明 — 构建时/运行时变量完整清单                               |
| [PALETTE.md](./PALETTE.md)                                             | Palette 架构与维护 — 分层、渲染/基建、扩展点、Skills                   |
| [theme-style/THEME.md](./theme-style/THEME.md)                         | 主题令牌体系 — 分层模型、覆写规约、操作步骤、现状快照                  |
| [theme-style/THIRD-PARTY-THEME.md](./theme-style/THIRD-PARTY-THEME.md) | 第三方库可视化主题 — viz 域令牌、canvas/编辑器取值、漂移自检           |
| [theme-style/DECISIONS.md](./theme-style/DECISIONS.md)                 | 主题决策档案、踩坑实证、预览隔离与威胁模型（归档，按需查）             |

工具类文档不在本目录：覆写生成器与纪律见 [scripts/theme-codemod/README.md](../scripts/theme-codemod/README.md)，组件预览清单生成见 [scripts/component-preview/README.md](../scripts/component-preview/README.md)，色板视图交互见 [dev/palette/README.md](../dev/palette/README.md)。

## 快速入口

- **新成员入门** → [DEVELOPMENT.md](./DEVELOPMENT.md) + [ARCHITECTURE.md](./ARCHITECTURE.md)
- **了解目录全貌** → [ARCHITECTURE.md](./ARCHITECTURE.md) + [architecture-diagram.html](./architecture-diagram.html)
- **新增 API 接口** → [API_GUIDE.md](./API_GUIDE.md)
- **新增页面/组件** → [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- **改主题色 / 加语义令牌** → [theme-designer skill](../.agents/skills/theme-designer/SKILL.md) + [theme-style/THEME.md](./theme-style/THEME.md) + [theme-codemod/README.md](../scripts/theme-codemod/README.md)
- **改组件样例 / 跑预览** → [component-preview-designer skill](../.agents/skills/component-preview-designer/SKILL.md)（设计侧改样例）或 [component-preview-sync skill](../.agents/skills/component-preview-sync/SKILL.md)（开发侧同步 props/slots）+ [component-preview/README.md](../scripts/component-preview/README.md)
- **色板 / 组件预览总览** → [PALETTE.md](./PALETTE.md) + [dev/palette/README.md](../dev/palette/README.md)
- **部署配置** → [ENV_VARIABLES.md](./ENV_VARIABLES.md) + 项目根 [DEPLOY.md](../DEPLOY.md)

## 相关文档

- [项目根 README](../README.md) — 快速开始、项目结构
- [DEPLOY.md](../DEPLOY.md) — Docker 生产部署完整说明
- [AGENTS.md](../../AGENTS.md) — 仓库全局规范（License header 等）
