# Stage 3: 归档变更 (Archive)

当变更已部署并验证通过后，将其归档并同步更新项目规范。

## 步骤 (Steps)

1.  **确认 ID**：确定要归档的 `change-id`。如果不确定，运行 `openspec list` 查看。
2.  **验证状态**：确保变更已实施完成且 `tasks.md` 已全部勾选。
3.  **执行归档**：运行 `openspec archive <id> --yes`。该命令会将变更移动至 `archive/` 目录并更新 `specs/` 下的规范文件。
4.  **最终检查**：
    - 检查输出，确保目标 spec 已更新。
    - 运行 `openspec validate --strict` 确保归档后规范依然有效。
    - 使用 `openspec show <id>` 确认归档位置。

## 注意事项

- 不要手动移动文件，始终使用 `openspec archive` 命令以确保规范同步更新。
- 如果只是工具性变更不涉及规范，可使用 `--skip-specs`。
