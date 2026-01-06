# 发布工作流 (Release Workflow)

## 1. 准备阶段
- 确保代码已通过 `lint` 和 `check`。
- 确保所有 OpenSpec 变更提案已通过验证并获得批准。

## 2. 差异分析 (Diff Analysis)
使用以下命令查看自上一版本以来的变更统计：
```bash
git diff $(git describe --tags --abbrev=0) HEAD --stat
```
查看详细的提交日志：
```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

## 3. 版本推荐逻辑 (SemVer)
- **修订号 (Patch - x.x.1)**：仅包含 bug 修复、文档更新或细微的样式/性能微调。
- **次版本号 (Minor - x.1.0)**：包含向后兼容的新功能、较大规模的内部重构或新技能的添加。
- **主版本号 (Major - 1.0.0)**：包含不兼容的 API 变更、核心架构的重大调整或彻底的破坏性改动。

## 4. 更新步骤
1. 修改 `package.json` 中的 `version` 字段。
2. 在 `CHANGELOG.md` 顶部插入新版本信息。
3. 按照“✨ 新功能”、“🐛 缺陷修复”、“🔧 内部重构”等类别整理变更点。
4. **强制校验 (Critical Check)**：在执行 Git 提交前，必须运行 `cat package.json` 和 `head CHANGELOG.md` 确保物理文件内容已更新。

## 5. 全自动发布执行 (Automated Execution)
在用户批准版本推荐和更新日志后，AI 必须主动引导并执行以下操作：

1. **执行文件更新**：更新 `package.json` 和 `CHANGELOG.md`。
2. **本地提交**：
   AI 必须根据本次发布的变更核心（参考 CHANGELOG 摘要）生成描述性的提交信息。
   ```bash
   git add . && git commit -m "chore: release vX.X.X (包含简短的变更摘要)"
   ```
3. **创建标签**：
   ```bash
   git tag vX.X.X
   ```
4. **远程推送**：
   ```bash
   git push && git push --tags
   ```

> **安全准则**：AI 在执行上述步骤 2、3、4 前，必须向用户展示拟执行的完整命令并请求“确认执行”。
