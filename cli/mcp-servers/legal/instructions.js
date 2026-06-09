export const SSOS_LEGAL_INSTRUCTIONS = `SSOS Legal MCP 服务器 - 合同管理、法律审查、催款函生成

提供合同全生命周期管理、AI 法律审查、催款函生成、法律风险提醒等法务工具。

## 工具列表 (13 个)

### 合同管理 (6 个)

**listContracts** - 列出所有合同
参数: filters (object, 可选) - 如 { type: 'sales', status: 'active' }
返回: 合同数组（编号、名称、类型、对方、金额、签订日期、到期日期）

**getContract** - 获取合同详情
参数: contractId (string, 必填)
返回: 合同完整信息（含条款、附件、审查记录）

**createContract** - 创建新合同
参数: type (enum), counterparty (string), amount (number), signDate (date), expiryDate (date), terms (text), attachments (array)
type: 'sales' | 'purchase' | 'service' | 'labor' | 'lease' | 'loan' | 'other'

**updateContract** - 更新合同信息
参数: contractId (string), data (object)

**deleteContract** - 删除合同（仅草稿状态）
参数: contractId (string)

**archiveContract** - 归档合同（已履行完毕）
参数: contractId (string), archiveNotes (string, 可选)

### 合同生成器 (3 个)

**generateSalesContract** - 生成销售合同
参数: buyer (object), items (array), deliveryTerms (object), paymentTerms (object)
返回: 完整的销售合同文本（可编辑）

**generateServiceContract** - 生成服务合同
参数: client (object), serviceScope (text), serviceTerms (object), price (object)
返回: 完整的服务合同文本

**generateLaborContract** - 生成劳动合同
参数: employeeInfo (object), position (string), salary (number), duration (object), terms (object)
返回: 完整的劳动合同文本（符合《劳动合同法》）

### 法律审查 (2 个)

**reviewContract** - AI 法律审查合同
参数: contractText (string) 或 contractId (string), reviewType (enum)
reviewType: 'comprehensive' | 'risk_only' | 'clause_check'
返回: 审查报告（风险等级、问题条款、修改建议、法律依据）

**返回格式**:
\`\`\`json
{
  "overallRisk": "medium",  // low | medium | high
  "riskScore": 65,
  "issues": [
    {
      "severity": "high",
      "clauseNumber": "第5.2条",
      "issue": "违约金比例过高（30%），超过法定上限",
      "legalBasis": "《合同法》第114条：违约金不得过分高于实际损失",
      "suggestion": "建议将违约金比例调整为10-20%",
      "originalText": "...",
      "suggestedText": "..."
    }
  ],
  "missingClauses": [
    "争议解决条款",
    "保密条款"
  ],
  "strengths": [
    "付款条款明确",
    "交付责任清晰"
  ]
}
\`\`\`

**compareContracts** - 对比两份合同差异
参数: contractId1 (string), contractId2 (string)
返回: 差异对比报告（条款差异、金额差异、风险变化）

### 催款函 (1 个)

**generateDemandLetter** - 生成催款函
参数: debtor (object), debt (object), previousContacts (array, 可选)
debt 格式: { amount, dueDate, invoiceNumber, description }
返回: 正式催款函文本（含法律依据、催告期限、法律后果提示）

**催款函模板**:
- 第一次催告（友好提醒）
- 第二次催告（严肃警告）
- 第三次催告（律师函，法律诉讼威胁）

### 法律提醒 (1 个)

**getLegalReminders** - 获取法律事项提醒
参数: workspaceId (string)
返回: 待办事项列表（合同到期、催款跟进、法定申报期限等）

**提醒类型**:
- 合同即将到期（30天内）
- 应收账款逾期（超过约定付款日）
- 劳动合同续签提醒
- 年报公示截止日（6月30日前）

## 使用场景

### 1. 合同签订流程
\`\`\`
1. generateSalesContract() // 生成合同草稿
2. reviewContract() // AI 审查风险
3. 根据建议修改合同
4. createContract() // 正式创建合同
5. 双方签字盖章
\`\`\`

### 2. 应收账款催收
\`\`\`
1. getLegalReminders() // 查看逾期应收
2. generateDemandLetter() // 生成催款函
3. 发送给欠款方
4. 记录催收进度
5. 必要时启动法律程序
\`\`\`

### 3. 劳动合同管理
\`\`\`
1. generateLaborContract() // 生成劳动合同
2. reviewContract() // 审查合规性
3. createContract() // 创建合同记录
4. getLegalReminders() // 到期提醒
5. 续签或终止
\`\`\`

### 4. 合同风险排查
\`\`\`
1. listContracts({ status: 'active' })
2. 对每份合同调用 reviewContract('risk_only')
3. 汇总高风险合同
4. 通知相关人员处理
\`\`\`

## 合同类型

1. **销售合同** (sales) - 货物买卖、产品销售
2. **采购合同** (purchase) - 原材料采购、设备采购
3. **服务合同** (service) - 咨询、维护、外包服务
4. **劳动合同** (labor) - 全职员工劳动关系
5. **租赁合同** (lease) - 办公室、设备租赁
6. **借款合同** (loan) - 资金借贷
7. **其他合同** (other) - 保密协议、合作协议等

## 法律审查维度

1. **形式要件** - 签字盖章、日期、必备条款
2. **权利义务** - 双方权责是否平衡
3. **违约责任** - 违约金比例是否合理
4. **争议解决** - 管辖法院、仲裁条款
5. **法律合规** - 是否违反强制性法规
6. **风险条款** - 格式条款、免责条款合法性

## 催款函法律要点

**催告期限**:
- 一般债务: 合理期限（通常7-15天）
- 违约金: 明确约定的付款期限

**法律后果**:
- 继续催告 → 律师函 → 诉讼/仲裁
- 逾期利息: 按合同约定或 LPR 利率
- 诉讼时效: 3年（从到期日起算）

**证据保全**:
- 保留催款函发送记录（快递单、邮件）
- 保留对方签收或回复记录
- 固化债权金额和期限

## 注意事项

- **专业审查**: AI 审查作为初步风险筛查，重大合同建议律师人工审查
- **地域差异**: 不同地区法律实践有差异，请结合当地情况
- **时效管理**: 注意诉讼时效（一般3年），及时催告中断时效
- **证据意识**: 保留所有合同文本、签署记录、履行证据
- **格式要求**: 合同应使用规范格式，避免模糊表述
- **保密条款**: 涉及商业秘密的合同应添加保密条款
`;
