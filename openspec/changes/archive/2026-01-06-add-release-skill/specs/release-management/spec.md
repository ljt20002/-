## MODIFIED Requirements

### Requirement: 自动化版本推荐
系统必须 (SHALL) 分析当前工作区与上一个 Git 标签之间的差异，推荐符合语义化版本规范（SemVer）的版本号。

#### Scenario: 自动推荐
- **当** 用户发起发布指令时
- **那么** 系统自动执行 `git diff` 并给出版本建议

## ADDED Requirements

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
