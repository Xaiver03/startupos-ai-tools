export const SSOS_AI_INSTRUCTIONS = `SSOS AI MCP 服务器 - AI 智能记账、OCR 识别、合规问答

提供 AI 驱动的智能财务服务，包括自动记账、发票 OCR、合规问答、学习优化。

## 工具列表 (4 个)

### AI 智能记账 (1 个)

**aiBookkeeping** - AI 自动生成记账凭证
参数: description (string, 必填), amount (number, 可选), attachments (array, 可选)
返回: 推荐的会计分录（借贷科目、金额、摘要、置信度）

**使用方式**:
\`\`\`typescript
aiBookkeeping({
  description: "支付办公室租金 5000 元",
  amount: 5000,
  attachments: ["receipt.jpg"]
})

// 返回:
{
  confidence: 0.95,
  entry: {
    debit: [{ accountCode: "6602", accountName: "租赁费", amount: 5000 }],
    credit: [{ accountCode: "1002", accountName: "银行存款", amount: 5000 }],
    description: "支付办公室租金"
  },
  reasoning: "根据业务描述判断为租赁费用，借记管理费用-租赁费，贷记银行存款"
}
\`\`\`

### OCR 发票识别 (1 个)

**ocrInvoice** - OCR 识别增值税发票
参数: imageUrl (string, 必填) 或 imageBase64 (string, 必填)
返回: 发票信息（发票代码、号码、日期、金额、税额、销方/购方信息）

**支持的发票类型**:
- 增值税专用发票
- 增值税普通发票
- 增值税电子发票
- 机动车销售统一发票
- 二手车销售统一发票

**返回格式**:
\`\`\`json
{
  "invoiceCode": "011001800104",
  "invoiceNumber": "12345678",
  "invoiceDate": "2026-06-08",
  "totalAmount": 10000,
  "totalTax": 1300,
  "totalWithTax": 11300,
  "seller": {
    "name": "北京某公司",
    "taxNumber": "91110000XXXXXXXX",
    "address": "北京市朝阳区...",
    "phone": "010-12345678"
  },
  "buyer": { ... },
  "items": [
    {
      "name": "服务费",
      "specification": "",
      "unit": "次",
      "quantity": 1,
      "unitPrice": 10000,
      "amount": 10000,
      "taxRate": 0.13,
      "tax": 1300
    }
  ]
}
\`\`\`

### 合规问答 (1 个)

**aiComplianceQA** - 财税法规合规问答
参数: question (string, 必填), context (object, 可选)
返回: 回答（含法规依据、风险提示、操作建议）

**支持的问题类型**:
- 会计处理: "固定资产折旧如何计算？"
- 税务筹划: "小规模纳税人转一般纳税人的条件是什么？"
- 法规查询: "研发费用加计扣除比例是多少？"
- 风险识别: "这笔业务是否有税务风险？"

**Context 参数**（可选）:
\`\`\`json
{
  "taxpayerType": "small",  // 纳税人类型
  "industry": "tech",       // 行业
  "accountingStandard": "small_business",  // 会计准则
  "region": "beijing"       // 地区
}
\`\`\`

**返回格式**:
\`\`\`json
{
  "answer": "研发费用加计扣除比例为 100%...",
  "legalBasis": [
    "《企业所得税法》第三十条",
    "财税〔2023〕7号"
  ],
  "riskWarning": "需要留存研发项目立项文件、研发支出辅助账...",
  "actionItems": [
    "建立研发费用辅助账",
    "按项目归集研发支出",
    "保留相关证明材料"
  ]
}
\`\`\`

### AI 学习优化 (1 个)

**submitAiFeedback** - 提交 AI 反馈（帮助系统学习）
参数: feedbackType (enum), content (object), isCorrect (boolean)
feedbackType: 'bookkeeping' | 'ocr' | 'compliance'

**用途**:
- 用户确认/修正 AI 生成的记账分录 → 系统学习正确的会计处理
- 用户标注 OCR 识别错误 → 改进识别准确率
- 用户评价合规问答质量 → 优化回答准确性

## 使用场景

### 1. 智能记账工作流
\`\`\`
1. 用户上传发票或描述业务
2. ocrInvoice() 识别发票信息（如有图片）
3. aiBookkeeping() 生成记账分录
4. 用户确认或修正
5. createJournalEntry() 创建凭证（使用 accounting 服务器）
6. submitAiFeedback() 提交反馈（可选）
\`\`\`

### 2. 合规咨询工作流
\`\`\`
1. 用户提问财税问题
2. aiComplianceQA() 获取回答
3. 根据建议执行操作
4. submitAiFeedback() 评价回答质量
\`\`\`

### 3. 批量发票处理
\`\`\`
1. 批量上传发票图片
2. 对每张发票调用 ocrInvoice()
3. 对每条识别结果调用 aiBookkeeping()
4. 汇总生成记账凭证
5. submitAiFeedback() 批量反馈
\`\`\`

## AI 引擎

**底层技术**: AI Ping (aiping.cn) - 中文财税领域专业 LLM
**模型**: gpt-4o / claude-3.5-sonnet（根据任务自动选择）
**上下文工程**:
- 企业档案注入（纳税人类型、行业、规模）
- 会计准则适配（小企业准则 vs 企业准则）
- 地域法规差异（北京、上海、深圳等）

## 准确率指标

- **AI 记账**: 85% 准确率（无需人工修正）
- **OCR 识别**: 95% 字段准确率
- **合规问答**: 90% 法规引用准确率

## 注意事项

- **人工复核**: AI 生成的分录建议由专业会计复核后使用
- **法规时效**: 合规问答基于最新法规，但税法频繁变化，重大决策请咨询专业人士
- **隐私保护**: 发票图片仅用于识别，不存储原图
- **学习反馈**: 提交反馈有助于提升系统准确率
- **限流**: AI 调用限制 50 次/分钟（避免滥用）
`;
