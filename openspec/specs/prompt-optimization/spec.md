# Capability: Prompt Optimization

## Purpose
通过调用专门的“专家”提示词模型，将用户简单的指令改写为更加清晰、专业、详细且易于 AI 理解的高质量提示词。

## Requirements

### Requirement: Professional Rewriting
系统 SHALL 调用指定的优化模型对用户当前输入的内容进行流式改写。

#### Scenario: Successful optimization
- **WHEN** 用户输入一段文本并点击“优化提示词”按钮
- **THEN** 系统发起请求，并用优化后的流式输出逐步替换输入框内的原始文本

### Requirement: Expert System Prompt
系统在优化时 SHALL 使用预设的专家级 System Prompt。

#### Scenario: Optimization context
- **WHEN** 发起优化请求
- **THEN** 请求中必须包含指示模型作为“提示词工程专家”进行改写的指令
