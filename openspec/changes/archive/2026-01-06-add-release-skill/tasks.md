## 1. 实施 (Implementation)
- [x] 1.1 创建 `.coco/skills/release/SKILL.md`，包含技能定义
- [x] 1.2 创建 `.coco/skills/release/workflow.md`，描述全自动发布流程
- [x] 1.3 升级技能逻辑：集成 Git 提交、打标签和推送的自动化指令
- [x] 1.4 实现交互确认机制，确保每一步关键操作都经过用户许可

## 2. 验证 (Validation)
- [x] 2.1 运行 `openspec validate add-release-skill --strict`
- [x] 2.2 模拟一次完整发布流程，验证 Git 指令的自动生成与执行
