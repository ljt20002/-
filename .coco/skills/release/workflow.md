# 发布工作流 (Release Workflow)

## 1. 准备阶段
- 确保代码已通过 `lint` 和 `check`。
- 确保所有 OpenSpec 变更提案已通过验证并获得批准。

## 2. 分析与建议 (Analysis & Proposal)
1. 使用 `git diff` 和 `git log` 查看自上一版本以来的变更。
2. 根据 SemVer 逻辑拟定版本号建议。
3. 拟定 `CHANGELOG.md` 的中文摘要内容。
4. **交互确认**：向用户展示上述建议及拟执行的 Git 命令。
5. **审批闸口 (CRITICAL)**：在获得用户明确批准前，**严禁修改** `package.json` 和 `CHANGELOG.md`。

## 3. 全自动发布执行 (Automated Execution)
用户批准后，按顺序执行以下操作：

1. **修改物理文件**：
   - 更新 `package.json` 中的 `version` 字段。
   - 在 `CHANGELOG.md` 顶部插入新版本信息。
2. **强制校验 (Critical Check)**：
   - 必须运行 `cat package.json` 和 `head CHANGELOG.md` 确保内容已正确写入。
3. **本地提交**：
   - AI 根据变更摘要生成描述性信息。
   - 执行：`git add . && git commit -m "chore: release vX.X.X (摘要)"`
4. **创建标签与推送**：
   - 执行：`git tag vX.X.X`
   - 执行：`git push && git push --tags`

> **安全准则**：AI 在执行步骤 3、4 前，必须向用户展示拟执行的完整命令并再次请求“确认执行”。
