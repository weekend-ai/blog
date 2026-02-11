+++
title = "系统设计：深度研究代理"
date = "2026-02-11T00:00:00+00:00"

# description is optional
#
# description = "An optional description for SEO. If not provided, an automatically created summary will be used."

tags = ["ai","system-design","research","agents"]
+++

> 题目定义：
>
> 设计一个 Deep Research Agent。
用户会输入一个复杂问题，例如：
“分析 NVIDIA 和 Apple 最近一个季度的财报差异，并给出对未来 6 个月股价走势的结构化判断。”
>
> 当前人工分析师完成一次这样的研究需要 2–3 小时。
> 我们希望将其缩短到 30 分钟以内，同时保证：
>>  引用必须可追溯
>>
>>  不能 hallucinate
>>
>>  结论逻辑清晰
>>
>>  可以反复运行（可复现）
>
> 系统可以访问：
>
>>	web_search(query)
>>	
>>   fetch_url(url)
>>
>>   get_financials(ticker, quarter)
>>   
>>   get_internal_docs(query)
>
> 输出是一个结构化 research report（含引用链接）


## 目标定义

这个系统的目标是将复杂多源研究时间从 2–3 小时压缩到 30 分钟以内，同时保持报告的引用覆盖率和逻辑完整性不低于人工基准。

硬性约束是所有事实性陈述必须有可追溯来源，不允许无来源推断，输出必须可复现。

成功定义为结构完整、引用完备、冲突显式呈现、且结果可机器解析。

最危险的失败不是工具调用失败，而是生成看似合理但存在**隐性错误**或**遗漏反证**的报告，因此系统设计必须优先保证**可验证性**而不是速度。

## 用户旅程 （User Journey）

典型用户是需要进行复杂多源分析的研究人员或分析师。
用户通过提交一个高复杂度问题触发研究任务。
系统会在必要时补充上下文，例如时间范围或数据来源偏好。
该任务以异步方式运行，因为深度研究不是实时交互型任务。
输出是一个结构化 research report，面向人类决策者阅读，包含可点击的引用链接以保证可追溯性。

## 问题空间切分

> 时间主要花在哪个阶段？哪个阶段最容易被agent加速？哪个阶段最危险？

人类研究通常分为5个阶段

1. 问题理解与范围界定
2. 信息收集 （多源检索）
3. 信息压缩与结构化
4. 冲突与差异分析
5. 结构化写作与推论构建

2，3 是明显可以用agent加速；第4阶段也可以依赖agent来做判断；第5阶段需要严格证据约束，否则容易出错

agent最危险的阶段：
> 信息压缩阶段丢失关键反证
>
> 推论阶段跨越证据边界
>
> 在冲突未显示呈现的情况下给出单边结论

人类完成一次深度研究通常分为五个阶段：问题界定、多源检索、信息压缩、冲突识别以及结构化推论构建。
其中检索与信息压缩阶段高度机械化，是最容易被自动化加速的部分。
冲突识别可以部分自动化，但推论构建必须受到严格证据约束。
最危险的失败不是搜索不到信息，而是在压缩过程中丢失反证，或在没有证据支持的情况下生成判断。
因此系统设计必须优先解决信息源可信度与 claim-evidence 绑定问题。

## 系统边界与接口

这四个 API 分别覆盖信息发现、信息获取以及结构化财务数据访问阶段，其中 get_financials 属于高置信结构化数据源，应优先使用。
系统边界在于：它可以生成结构化判断，但必须明确列出支持该判断的证据与假设。
系统不应生成无证据推论，不应忽视冲突来源，也不应将低质量来源与高质量来源等权处理。

## 核心架构

我会用一个 Orchestrator 驱动的多阶段 pipeline，把深度研究拆成 Context → Evidence → Synthesis → Verification → Writing 五步。
第一步是 Context 对齐：澄清时间范围、实体、指标维度，避免后续跑偏。
第二步 Evidence 收集：通过 web_search / fetch_url / get_internal_docs / get_financials 获取多源材料，并对来源做分级，形成结构化证据集合。
第三步 Synthesis：将冗长材料压缩成 结构化 claim 列表（每条 claim 带置信度、来源类型、可追溯引用）。
第四步 Verification：强制 claim-evidence 绑定，并对冲突 claim 标记为“未决”，触发定向补搜或升级为 human-in-the-loop。
只有当 verifier 认为关键 claim 证据充分且冲突被显式呈现，才进入最后 Writing：基于 verified claims 生成结构化 report，并把引用嵌入到相应段落。

- 如何控制成本？

> Orchestrator 内置budget, 控制token消耗总量以及搜索api调用次数

- 如何加快？

> 在问题进来让agent预设 top claims. 只要搜到了top claims直接输出报告

## 决策 loop

这是一个 Hybrid 结构。
整体 pipeline 是 Plan-exec，由一个 state machine 驱动（Context → Evidence → Synthesis → Verification → Writing）。
但在 Evidence 阶段内部采用 ReAct，因为信息空间高度不确定，需要动态选择 tool 并递归搜索。
Deep research 的宏观路径是低方差的——人类研究流程是稳定的（检索、压缩、冲突分析、写作）。
但信息空间是高方差的，因此 Evidence 阶段必须允许探索性 tool use。
所以我选择宏观 Plan-exec 保证结构稳定，局部 ReAct 保证探索能力。
我会引入三个停止机制：
1.	明确的回流次数上限（例如 2 轮）
2.	信息增益检测（新增 claim 数量或置信度提升低于阈值则停止）
3.	预算上限（token / 调用次数 / wall clock）

---

另外一种research方案：

1.	生成 tentative hypotheses（提高效率）
2.	进行 counter-search（主动找反证）
3.	比较支持与反对证据强度
4.	生成判断

## 指标与演进

### 指标
#### 效率指标 （Speed）
将 mean time 从 2–3 小时降到 30 分钟，同时 P95 不超过 45 分钟。
#### 质量指标 （Quality）
- 引用覆盖率
- 冲突显示率
- 幻觉率
- 可复现率 （同样输入，多次运行结构一致）
#### 安全指标 （Safety）
- 来源污染率
- 低可信来源占比
- prompt injection成功率
#### 成本指标 （Cost）
- avg token cost
- api call count / round
- search count/round
- cost/report

### 演进
#### Episode replay
存储历史task，用新模型重跑；对比citation coverage/hallucination rate

#### Failure dataset
针对用户反馈或者bad case，强化verifier

#### source ranking优化
根据历史表现调整信源权重，建立白名单

#### 扩大自动化范围
报告 -> summary + 投资建议 -> 结构化json给下游系统

我会从效率、质量、安全与成本四个维度衡量系统表现。
效率上关注平均完成时间与 P95 延迟。
质量上重点监控引用覆盖率、冲突显式率与 hallucination rate。
安全上监控未验证 claim 输出比例与低可信来源占比。
成本上监控每份报告的 token 使用与 API 调用次数。
演进方面通过 episode replay、失败样本库与来源权重调整不断优化系统，并逐步扩大自动化范围。