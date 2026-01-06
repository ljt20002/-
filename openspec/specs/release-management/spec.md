# release-management Specification

## Purpose
TBD - created by archiving change add-release-skill. Update Purpose after archive.
## Requirements
### Requirement: 自动化版本推荐
系统必须 (SHALL) 分析当前工作区与上一个 Git 标签之间的差异，推荐符合语义化版本规范（SemVer）的版本号。

#### Scenario: 自动推荐
- **当** 用户发起发布指令时
- **那么** 系统自动执行 `git diff` 并给出版本建议

### Requirement: 自动化更新日志生成
系统必须 (SHALL) 在 `CHANGELOG.md` 中生成一个新条目，总结自上一版本以来的变更，并按类型（如功能、缺陷修复）进行分类。

#### Scenario: 根据提交记录生成更新日志
- **当** 触发发布流程时
- **那么** 系统提取提交信息并将其格式化为 Markdown 格式的更新日志条目

### Requirement: 项目版本更新
在用户批准推荐的版本后，系统必须 (SHALL) 更新 `package.json` 中的 `version` 字段。

#### Scenario: 更新 package.json 版本
- **当** 用户确认推荐的版本号时
- **那么** 系统将新版本号写入 `package.json`

### Requirement: 全自动发布执行
系统必须 (SHALL) 在获得用户确认后，主动执行本地提交、打标签和远程推送的完整 Git 操作流。

#### Scenario: 自动化 Git 闭环
- **当** 用户批准版本和更新日志内容后
- **那么** 系统依次执行 `git commit`、`git tag` 和 `git push`

### Requirement: 交互确认门控
系统必须 (SHALL) 在执行任何持久性 Git 变更（如推送）前，向用户展示拟执行的命令并等待确认。

#### Scenario: 安全确认
- **当** 系统准备执行推送操作时
- **那么** 系统列出所有即将运行的命令并请求用户授权

