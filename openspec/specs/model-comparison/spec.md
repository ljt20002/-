# Capability: Model Comparison

## Purpose
支持同时向多个 AI 模型发起相同问题的请求，并由 AI 裁判进行横向对比打分，帮助用户评估不同模型的回答质量、速度和性价比。

## Requirements

### Requirement: Parallel Requests
系统 SHALL 支持向选定的多个模型并行发送对话请求。

#### Scenario: Compare multiple models
- **WHEN** 用户选定 2 个或更多模型并点击发送提问
- **THEN** 系统为每个模型独立发起流式请求，并实时展示各自的生成进度

### Requirement: AI Judge Evaluation
系统 SHALL 支持使用指定的裁判模型对各模型的回复进行综合评价。评分体系 MUST 包含质量、耗时和性价比三个维度，并遵循预设的权重比例。

#### Scenario: Generate evaluation report
- **WHEN** 所有模型回复完成后点击“综合评价”
- **THEN** 裁判模型按以下比例进行打分：回复质量（核心维度）占 70%，响应耗时（速度维度）占 15%，性价比（成本/质量比）占 15%，并输出 JSON 格式的评分及优缺点分析

### Requirement: AI Question Generation
系统 SHALL 能够根据比较维度自动生成测试题目。

#### Scenario: Auto-generate test question
- **WHEN** 用户输入比较维度并点击“AI 出题”
- **THEN** 裁判模型生成一个具有针对性的测试题目并填充到输入框
