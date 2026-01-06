# 变更：添加全自动发布管理技能 (Full-Auto Release Management Skill)

## 为什么 (Why)
目前的发布过程依赖手动操作或 AI 的半自动操作。用户希望实现全自动化流程：AI 在交互式确认必要信息（如发布提示词、版本号）后，能够主动执行从差异分析、文件更新、本地提交、打标签到远程推送的完整闭环。

## 变更内容 (What Changes)
- **新增技能**：在 `.coco/skills/release/` 目录下创建全自动 `release` 技能。
- **全自动闭环**：AI 将主动执行以下指令：
    - `git commit -m "chore: release vX.X.X"`
    - `git tag vX.X.X`
    - `git push && git push --tags`
- **交互确认**：在执行 Git 变更和推送前，AI 必须向用户展示拟定的内容并获得明确确认。
- **中文化支持**：所有生成的 CHANGELOG 和交互提示均使用中文。

## 影响 (Impact)
- 受影响的规范：`release-management` (MODIFIED)
- 受影响的代码：`.coco/skills/release/SKILL.md`, `.coco/skills/release/workflow.md`
