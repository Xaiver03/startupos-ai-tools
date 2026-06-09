---
name: organize-finances
description: 整理混乱的财务资料并生成标准会计账本，支持导入到 SSOS 系统
author: Claude
version: 1.4.0
model: sonnet
tags:
  - finance
  - accounting
  - reconciliation
  - invoice
  - bank-statements
  - chinese-accounting
  - ssos-integration
parameters:
  - name: directory
    type: string
    required: true
    description: 银行流水或发票文件所在目录
  - name: company_name
    type: string
    required: false
    description: 公司名称（如未提供，尝试从文件中推断）
  - name: taxpayer_type
    type: enum
    values: [small_scale, general]
    required: false
    description: 纳税人类型（small_scale=小规模纳税人, general=一般纳税人）
  - name: ssos_workspace_id
    type: string
    required: false
    description: SSOS 工作空间ID（如提供，将自动导入数据到 SSOS 系统）
  - name: import_to_ssos
    type: boolean
    default: false
    description: 是否导入数据到 SSOS 系统（需要 SSOS MCP Suite）
dependencies:
  - python: ">=3.12"
  - pandas: ">=2.0"
  - openpyxl: ">=3.1"
mcp_servers:
  - name: ssos-accounting
    required: false
    description: SSOS 财务管理 MCP 服务器
    tools:
      - import_bank_transactions
      - batch_create_journal_entries
      - create_partner
      - list_partners
capabilities:
  - 银行流水统一（工商银行、招商银行）
  - 发票数据清洗和去重
  - 红字发票检测（XML解析）
  - 多重匹配算法（精确、模糊、关键词、字符拆分）
  - 按客户汇总对账（避免单张发票误判）
  - 生成标准账簿和财务报表
  - 识别个人垫付情况
  - 小规模/一般纳税人分类处理
  - 可选导入到 SSOS 系统（通过 MCP）
inputs:
  - 银行流水Excel文件（工商银行/招商银行格式）
  - 发票对账表Excel（可选）
  - 发票XML文件（用于红字发票检测）
outputs:
  - 统一银行流水Excel
  - 发票对账表（含收款状态）
  - 未收款催款清单
  - 银行存款日记账（按季度）
  - 利润表（按季度）
  - 对账报告Markdown
  - SSOS系统数据（如启用MCP集成）
---

# 财务账本整理 Skill

将混乱的银行流水、发票等原始资料整理成符合会计准则的标准账本和财务报表。

## 功能

1. **读取各种格式的银行流水**
   - 工商银行Excel格式（借贷方分列）
   - 招商银行Excel格式（付方/收方格式）
   - 自动识别收支类型
   - **正确识别付款方/收款方**

2. **数据清洗和去重**
   - 自动检测重复交易
   - 识别内部转账
   - 按日期排序
   - **按时间+金额+银行去重**

3. **发票数据去重和核对** ⭐新增
   - 检测重复录入的发票
   - 识别冲红发票（正票+红票）
   - 按客户匹配收款
   - 识别拆分支付（一张发票多笔收款）
   - 生成催款清单
   - **支持小规模纳税人和一般纳税人**

4. **生成标准会计账簿**
   - 银行存款日记账（按季度）
   - 按会计准则分类收支

5. **生成财务报表**
   - 利润表（按季度）
   - 收支明细汇总
   - 自动计算余额
   - **发票对账表**
   - **未收款催款清单**

6. **账务核对**
   - 验证期初+收入-支出=期末
   - 与实际银行余额核对
   - 生成差异分析报告
   - **发票与银行流水核对**
   - **识别个人垫付情况**

## 使用方法

```bash
# 基本用法：整理指定目录的银行流水
/organize-finances <银行流水目录路径>

# 示例
/organize-finances "/Users/xxx/发票处理/银行流水"
```

## 输入要求

### 银行流水文件格式

**工商银行**：
- Excel文件，第2行为表头
- 必需列：交易时间（列4）、借方发生额（列6）、贷方发生额（列7）、摘要（列9）

**招商银行**：
- Excel文件，第2行为表头
- 必需列：付方账户（列1）、收方账户（列5）、交易金额（列9）、交易时间（列11）

## 输出结构

```
财务账本_YYYY-YYYY/
├── 01_原始凭证/          # 复制原始流水文件
├── 02_记账凭证/          # （待补充）
├── 03_分类账簿/          # 银行日记账（按季度）
│   ├── 银行存款日记账_2024Q1.xlsx
│   ├── 银行存款日记账_2024Q2.xlsx
│   └── ...
├── 04_财务报表/          # 财务报表（按季度）
│   ├── 利润表_2024Q1.xlsx
│   ├── 利润表_2024Q2.xlsx
│   └── ...
├── 05_辅助账/            # （待补充）
├── 06_期末结账/          # （待补充）
└── README.md            # 汇总说明文档
```

## 处理流程

### 步骤1：数据收集
```python
- 扫描目录下所有Excel文件
- 识别银行类型（工行/招行）
- 读取交易记录
```

### 步骤2：数据清洗
```python
- 去除重复交易（按时间+金额+银行）
- 识别内部转账（工行→招行）
- 按日期排序
```

### 步骤3：交易分类
```python
收入分类：
  - 主营业务收入（正常收款）
  - 其他收入（退款等）

支出分类：
  - 职工薪酬（工资、代发）
  - 销售费用（推广、服务、运营）
  - 成本（采购、物料）
  - 税金（税费、国库）
  - 其他费用
```

### 步骤4：生成账簿
```python
- 按季度生成银行日记账
- 包含：日期、凭证号、摘要、对方、收入、支出、余额
- 自动计算累计余额
```

### 步骤5：生成报表
```python
- 按季度生成利润表
- 包含：营业收入、成本费用、利润总额
- 按类别明细列示
```

### 步骤6：核对验证
```python
- 计算：期初 + 收入 - 支出 = 期末
- 与实际银行余额对比
- 生成核对报告
```

## 配置选项

```yaml
# 公司信息
company_name: "某公司文化产业发展（北京）有限公司"
company_account: "110963153910001"  # 招商银行账号

# 会计准则
accounting_standard: "small_business"  # 小企业会计准则

# 银行账户
banks:
  - name: "工商银行"
    account: "0200095709200450880"
    format: "icbc"
  - name: "招商银行"
    account: "110963153910001"
    format: "cmb"

# 分类规则
classification:
  income:
    - keyword: "退"
      category: "其他收入"
    - default: "主营业务收入"
  
  expense:
    - keywords: ["工资", "代发"]
      category: "职工薪酬"
    - keywords: ["推广", "服务", "运营"]
      category: "销售费用"
    - keywords: ["税", "国库"]
      category: "税金"
    - keywords: ["物料", "采购"]
      category: "成本"
    - default: "其他费用"
```

## 注意事项

### 1. 文件格式
- 确保Excel文件未损坏
- 表头必须在第2行
- 日期格式需统一

### 2. 数据完整性
- 检查流水是否连续
- 确认没有缺失月份
- 核对期初期末余额

### 3. 内部转账
- 自动识别工行→招行转账
- 标记为内部转账，不重复计算

### 4. 手工调整
- 生成后可手工调整分类
- 补充缺失的摘要
- 修正错误的对方单位

## 错误处理

### 常见错误

**错误1：找不到表头**
```
原因：Excel格式不标准
解决：检查第2行是否为表头
```

**错误2：金额解析失败**
```
原因：金额包含特殊字符或格式错误
解决：清理数据，确保金额为数字
```

**错误3：余额对不上**
```
原因：有重复或遗漏的交易
解决：检查去重逻辑，确认所有文件已读取
```

## 示例

### 输入
```
银行流水/
├── 工商银行_2024-03至2024-05.xlsx
├── 工商银行_2024-06至2024-12.xlsx
├── 招商银行_2025-03至2025-05.xlsx
└── 招商银行_2025-06至2026-06.xlsx
```

### 输出
```
财务账本_2024-2026/
├── 03_分类账簿/
│   └── 银行存款日记账_2024Q1~2026Q2.xlsx（10个文件）
├── 04_财务报表/
│   └── 利润表_2024Q1~2026Q2.xlsx（10个文件）
└── README.md
```

### 执行结果
```
✓ 读取交易: 178 笔
✓ 去重: 0 笔重复
✓ 分组季度: 10 个季度
✓ 生成银行日记账: 10 个文件
✓ 生成利润表: 10 个文件
✓ 余额核对: 50,598.82 元 ✅
```

## 发票收款核对规则 ⭐重要

### 规则0：必须检查XML原始文件（最重要！）

**发票对账表不可信！必须从XML读取真实状态！**

#### XML文件位置
```
已整理发票/
├── 2024-09/
│   ├── dzfp_发票号_客户_时间.xml
│   └── ...
├── 2024-10/
└── ...
```

#### XML中的关键字段

**1. 是否蓝字发票标志（第8-11行）**
```xml
<InIssuType>
    <LabelCode>Y</LabelCode>  <!-- Y=蓝字发票，N=红字发票 -->
    <LabelName>是否蓝字发票标志</LabelName>
</InIssuType>
```

**判断规则**：
- `LabelCode = "Y"` → 蓝字发票（正常发票）✅
- `LabelCode = "N"` → 红字发票（冲红）❌

**2. 发票金额（第47-49行）**
```xml
<BasicInformation>
    <TotalAmWithoutTax>495.05</TotalAmWithoutTax>  <!-- 不含税金额 -->
    <TotalTaxAm>4.95</TotalTaxAm>                    <!-- 税额 -->
    <TotalTax-includedAmount>500.00</TotalTax-includedAmount>  <!-- 价税合计 -->
</BasicInformation>
```

**红字发票的金额是负数**：
```xml
<TotalTax-includedAmount>-500.00</TotalTax-includedAmount>
<TotalTax-includedAmountInChinese>（负数）伍佰圆整</TotalTax-includedAmountInChinese>
```

**3. 红字发票信息（第67-70行）**
```xml
<SpecificInformation>
    <RedEInvoice>
        <OriginalInvoiceCode>24112000000135114086</OriginalInvoiceCode>  <!-- 原蓝字发票号 -->
        <CreditNoteNumber>11010824091002615708</CreditNoteNumber>        <!-- 红字确认单号 -->
    </RedEInvoice>
</SpecificInformation>
```

**4. 备注（第73行）**
```xml
<AdditionalInformation>
    <Remark>被红冲蓝字数电票号码：24112000000135114086 红字发票信息确认单编号：11010824091002615708</Remark>
</AdditionalInformation>
```

#### 检测方法

```python
import xml.etree.ElementTree as ET

def check_invoice_type(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    # 方法1：检查是否蓝字发票标志
    label_code = root.find('.//InIssuType/LabelCode')
    if label_code is not None:
        if label_code.text == 'Y':
            return '蓝字发票'
        elif label_code.text == 'N':
            return '红字发票'
    
    # 方法2：检查金额是否为负数
    amount = root.find('.//TotalTax-includedAmount')
    if amount is not None:
        if float(amount.text) < 0:
            return '红字发票'
    
    # 方法3：检查是否有RedEInvoice节点
    red_invoice = root.find('.//RedEInvoice')
    if red_invoice is not None:
        return '红字发票'
    
    return '蓝字发票'
```

#### 处理流程

```python
# 步骤1：扫描所有XML文件
for xml_file in glob('已整理发票/**/*.xml'):
    invoice_type = check_invoice_type(xml_file)
    invoice_number = extract_invoice_number(xml_file)
    amount = extract_amount(xml_file)
    
    # 记录发票类型和金额
    invoices[invoice_number] = {
        '类型': invoice_type,
        '金额': amount
    }

# 步骤2：分类统计
blue_invoices = {k:v for k,v in invoices.items() if v['类型'] == '蓝字发票'}
red_invoices = {k:v for k,v in invoices.items() if v['类型'] == '红字发票'}

# 步骤3：计算净额
total_blue = sum(inv['金额'] for inv in blue_invoices.values())
total_red = sum(inv['金额'] for inv in red_invoices.values())  # 负数
net_amount = total_blue + total_red  # 净开票金额
```

#### 红字发票的会计处理

**示例**：
```
2024-09-15 开出蓝字发票：24112000000135114086，500元
  → 计入收入：500元

2024-09-20 开出红字发票：24112000000135104455，-500元
  → 冲减收入：-500元
  → 备注：冲红蓝字发票24112000000135114086

净额：500 + (-500) = 0元
```

#### 对账表处理

**正确的对账表格式**：

| 开票日期 | 发票号码 | 客户 | 发票类型 | 金额 | 原发票号 | 是否收款 | 净额 |
|---------|---------|------|---------|------|---------|---------|------|
| 2024-09-15 | 24112...114086 | 北京林业大学 | 蓝字发票 | 500 | - | 否 | 0 |
| 2024-09-20 | 24112...104455 | 北京林业大学 | 红字发票 | -500 | 24112...114086 | - | 0 |

**说明**：
1. 蓝字发票和红字发票都要记录
2. 红字发票的金额是负数
3. 如果蓝字发票被冲红，净额为0，不应催收
4. 红字发票的"原发票号"列要填写被冲红的蓝字发票号

---

### 规则1：去重优先（必须！）

**发票表常见问题**：
- 同一张发票录入2次甚至多次
- 需要按发票号码去重

**去重流程**：
```python
1. 按发票号码分组
2. 检查每组的开票日期：
   - 如果日期相同 → 数据录入重复，保留1条
   - 如果日期不同 → 可能是冲红，需人工确认
3. 检查金额是否为负数：
   - 负数 → 红字发票（冲红）
   - 正数 → 正常发票
```

### 规则2：冲红发票检测

**冲红发票的3种特征**：

**1. 负数金额**（100%确定）
```
发票金额 < 0 → 肯定是红字发票
例如：-10,000元
```

**2. 同发票号+不同日期**（高度可疑）
```
例如：
- 2024-10-01：发票123，10,000元（正票）
- 2024-10-15：发票123，10,000元（红票）
→ 可能是冲红，需人工确认
```

**3. 同发票号+相同日期**（数据录入重复）
```
例如：
- 2024-10-01：发票123，10,000元
- 2024-10-01：发票123，10,000元（重复录入）
→ 数据录入错误，去重即可
```

### 规则3：先匹配客户，再找交易

**正确流程**：
```python
1. 确定发票的客户名称
2. 在银行流水中查找该客户的**所有**收款记录
3. 核对金额和时间
4. 标记收款状态
```

**❌ 错误做法**：
- 只按金额匹配 → 可能匹配错误
- 只按日期匹配 → 可能漏掉延迟收款
- 看到金额相同就标记多张发票 → 导致虚增收款

### 规则4：识别拆分支付

**重要**：一张大额发票可能分多笔收款！

**案例**：
```
发票：杭州曼孚科技，100,000元
收款：
  - 2026-04-07：50,000元
  - 2026-04-10：50,000元
结果：✅ 已收款（2笔）
```

**匹配方法**：
```python
1. 找到该客户的所有收款记录
2. 尝试单笔匹配（金额完全相同）
3. 尝试两笔相加匹配
4. 尝试多笔组合匹配（最多5笔）
5. 标记收款明细（几笔，每笔多少）
```

### 规则5：避免批量发票误标记

**常见错误**：
```python
# ❌ 错误：开3张发票，只收1笔款，却把3张都标记为"已收款"
发票：
  - 3张 x 3,954.15元 = 11,862.45元
收款：
  - 1笔 3,954.15元
错误标记：3张都是"已收款" ❌

# ✅ 正确：只标记1张
正确标记：
  - 1张已收款
  - 2张未收款
  - 欠款：7,908.30元
```

### 规则6：正确识别付款方

**招商银行流水格式**：
```python
# 收入时
if 交易金额 > 0:
    对方名称 = 付方名称  # 列1，付款方
    
# 支出时
else:
    对方名称 = 收方名称  # 列5，收款方
```

**工商银行流水格式**：
```python
if 贷方发生额 > 0:  # 收入
    对方名称 = 列10  # 付款方
else:  # 支出
    对方名称 = 列10  # 收款方
```

### 规则7：时间容差

**收款时间通常晚于开票时间**：
- 一般延迟：1-30天
- 合理延迟：30-60天
- 超期延迟：60天以上（需催款）

**匹配范围**：
```python
开票日期 ≤ 收款日期 ≤ 开票日期 + 60天

# 特殊：先收款后开票（允许）
允许收款日期早于开票日期最多30天
```

### 发票核对案例

**案例1：拆分支付 ✅**
```
发票：100,000元
收款：50,000 + 50,000元
结果：✅ 已收款（2笔）
```

**案例2：批量开票部分收款 ⚠️**
```
发票：5张 x 8,781.95元 = 43,909.75元
收款：1笔 8,781.95元
结果：
  ✅ 1张已收款
  ❌ 4张未收款
  欠款：35,127.80元
```

**案例3：数据录入重复 ⚠️**
```
第2行：2024-09-20，发票123，500元
第4行：2024-09-20，发票123，500元
→ 同日期，去重，只保留1条
```

**案例4：冲红发票 🔴**
```
第10行：2024-10-01，发票456，10,000元
第15行：2024-10-15，发票456，-10,000元
→ 负数金额，确认是红字发票
→ 净额：0元
```

### 发票核对案例

**案例1：拆分支付 ✅**
```
发票：100,000元
收款：50,000 + 50,000元
结果：✅ 已收款（2笔）
```

**案例2：批量开票部分收款 ⚠️**
```
发票：5张 x 8,781.95元 = 43,909.75元
收款：1笔 8,781.95元
结果：
  ✅ 1张已收款
  ❌ 4张未收款
  欠款：35,127.80元
```

**案例3：数据录入重复 ⚠️**
```
第2行：2024-09-20，发票123，500元
第4行：2024-09-20，发票123，500元
→ 同日期，去重，只保留1条
```

**案例4：红字发票（从XML检测）🔴**
```
XML检查：
  <InIssuType><LabelCode>N</LabelCode></InIssuType>
  <TotalTax-includedAmount>-500.00</TotalTax-includedAmount>
  <RedEInvoice><OriginalInvoiceCode>24112...114086</OriginalInvoiceCode></RedEInvoice>

结果：
  发票号：24112...104455
  类型：红字发票
  金额：-500元
  冲红的原发票：24112...114086
  
处理：
  1. 标记为红字发票
  2. 找到原蓝字发票24112...114086
  3. 原蓝字发票净额 = 0（已被冲红）
  4. 不催收原蓝字发票
```

**案例5：蓝字发票被冲红（最危险！）⚠️⚠️⚠️**
```
对账表只有：
  2024-09-15，发票24112...114086，500元（蓝字）

XML检查后发现：
  2024-09-20，发票24112...104455，-500元（红字）
  备注：冲红24112...114086

错误处理：
  ❌ 把蓝字发票当成500元收入
  ❌ 催收这500元

正确处理：
  ✅ 净额 = 500 + (-500) = 0元
  ✅ 不催收
  ✅ 标记"已被冲红"
```

---

### 红字发票检查清单

在核对发票前，**必须完成**：

- [ ] 扫描所有XML文件
- [ ] 检查每个XML的`<InIssuType><LabelCode>`
- [ ] 提取所有红字发票（LabelCode=N）
- [ ] 提取所有蓝字发票（LabelCode=Y）
- [ ] 对于每个红字发票，找到原蓝字发票号（OriginalInvoiceCode）
- [ ] 标记被冲红的蓝字发票
- [ ] 计算净开票金额（蓝字-红字）
- [ ] 更新对账表，标注发票类型
- [ ] 剔除被冲红的发票，不催收

**不完成红字发票检查的风险**：
- ❌ 虚增收入（把已冲红的发票当成收入）
- ❌ 错误催收（催收已作废的发票）
- ❌ 回款率虚高
- ❌ 财务数据不准确

---

## 真实案例：2026年6月某公司对账错误

### 案例6：公司名称括号差异导致匹配失败 🚨（芝诺案例）

**错误现象**：
```
对账报告显示：A公司 欠款 ¥100,000
实际情况：2025-05-30 已收款 ¥100,000
```

**问题根源**：
```
发票抬头：A公司  # 全角括号（）
银行流水：芝诺未来生物科技(青岛)有限公司    # 半角括号()
```

**错误过程**：
1. 自动对账工具使用严格字符串匹配
2. "（青岛）" ≠ "(青岛)" → 匹配失败
3. 系统认为未收款
4. 将芝诺列入催款清单

**财务影响**：
```
错误数据：
- 未收款金额：¥148,315
- 回款率：79.8%

正确数据：
- 未收款金额：¥48,315
- 回款率：93.4%（提升13.6%）
```

**正确做法**：
```python
# ❌ 错误：严格匹配
if invoice_customer == bank_customer:
    match = True

# ✅ 正确：规范化后匹配
def normalize_company_name(name):
    # 统一括号
    name = name.replace('（', '(').replace('）', ')')
    # 统一空格
    name = name.replace(' ', '')
    # 统一大小写
    name = name.upper()
    return name

invoice_normalized = normalize_company_name(invoice_customer)
bank_normalized = normalize_company_name(bank_customer)

if invoice_normalized == bank_normalized:
    match = True
```

**预防措施**：
1. ✅ 对账前规范化所有公司名称
2. ✅ 支持模糊匹配（相似度≥90%）
3. ✅ 大额客户（>¥10,000）必须人工复核
4. ✅ 生成"未匹配清单"供人工检查

---

### 案例7：多张发票部分收款的正确处理（苏州赛益案例）

**情况**：
```
B公司：
- 发票1：¥100,000（2025-03）
- 发票2：¥50,000（2025-04）
- 发票3：¥50,000（2025-05）
应收合计：¥200,000

银行流水：
- 2025-04-28：¥100,000
```

**错误处理方式**：
```
❌ 方式1：只标记发票1为已收款
   问题：另外两张发票应该怎么分配？

❌ 方式2：按金额匹配，标记发票1为已收款
   问题：可能客户是先付的发票2+发票3，发票1未付

❌ 方式3：按时间匹配最近的
   问题：客户付款顺序可能与开票顺序不同
```

**正确处理方式**：
```
✅ 按客户汇总：
   应收：¥200,000
   实收：¥100,000
   未收：¥100,000
   回款率：50%

标注：部分收款，需跟进确认具体是哪张发票已付
```

**关键原则**：
1. **按客户汇总，不要按单张发票匹配**
2. 只有100%收款时才标记"已全额收款"
3. 部分收款标记"部分收款"，需人工确认明细
4. 生成催款清单时按客户维度，不按发票维度

---

### 案例8：公司名称变更的处理

**芝诺完整情况**：
```
A公司（旧名）：
- 2025-03-15：开具发票 ¥100,000（蓝字）
- 2025-05-10：冲红发票 ¥-100,000（红字）
- 净额：¥0

A公司：
- 2025-05-12：重新开具 ¥100,000（蓝字）
- 2025-05-30：收款 ¥100,000 ✅
```

**处理方式**：
```
1. 识别为同一客户（公司更名）
2. 旧公司净额：¥0（已冲红）
3. 新公司应收：¥100,000
4. 新公司已收：¥100,000
5. 结论：✅ 无欠款
```

**建立客户别名表**：
```
主客户名称 | 别名
----------------------------------------
芝诺未来生物科技（青岛）| 青岛芝诺生物科技
B公司    | 赛益生物
```

---

### 新增规则：公司名称规范化

**必须规范化的字符**：
```python
def normalize_company_name(name):
    """规范化公司名称，用于对账匹配"""
    if not name or pd.isna(name):
        return ""
    
    name = str(name).strip()
    
    # 1. 统一括号（全角→半角）
    name = name.replace('（', '(').replace('）', ')')
    name = name.replace('【', '[').replace('】', ']')
    
    # 2. 统一引号
    name = name.replace('"', '"').replace('"', '"')
    name = name.replace(''', "'").replace(''', "'")
    
    # 3. 移除多余空格
    name = ' '.join(name.split())
    
    # 4. 统一大小写（可选）
    # name = name.upper()
    
    return name
```

**对账匹配流程**：
```python
# 步骤1：规范化
invoice_name_normalized = normalize_company_name(invoice_customer)
bank_name_normalized = normalize_company_name(bank_customer)

# 步骤2：精确匹配
if invoice_name_normalized == bank_name_normalized:
    return "精确匹配"

# 步骤3：模糊匹配（相似度）
from difflib import SequenceMatcher
similarity = SequenceMatcher(None, invoice_name_normalized, bank_name_normalized).ratio()
if similarity >= 0.90:
    return f"模糊匹配（{similarity*100:.1f}%相似）"

# 步骤4：关键词匹配
invoice_keywords = set(invoice_name_normalized.split())
bank_keywords = set(bank_name_normalized.split())
common = invoice_keywords & bank_keywords
if len(common) >= 2:
    return f"关键词匹配（{len(common)}个共同词）"

# 步骤5：未匹配
return "未匹配"
```

---

### 对账工具质量要求

**必须支持**：
1. ✅ 公司名称规范化（括号、空格、引号）
2. ✅ 模糊匹配（相似度≥90%）
3. ✅ 按客户汇总（不按单张发票）
4. ✅ 红字发票检测（从XML读取）
5. ✅ 拆分支付识别（1张发票→多笔收款）
6. ✅ 生成未匹配清单（人工复核）

**禁止行为**：
1. ❌ 严格字符串匹配（会漏掉括号差异）
2. ❌ 只按金额匹配（会匹配错误）
3. ❌ 只按日期匹配（会漏掉延迟收款）
4. ❌ 不检查XML直接用对账表（会遗漏红字发票）

**质量指标**：
- 精确匹配率：≥95%
- 模糊匹配率：≥3%
- 未匹配率：≤2%
- 大额客户（>¥10,000）匹配率：100%（人工复核）

---
### 常见错误：未检查XML导致的问题

**错误1：对账表数据不准确**
```
对账表显示：56张发票，265,987.04元
实际情况：可能包含已被冲红的发票
正确做法：从XML读取，计算净额
```

**错误2：虚增收入**
```
错误：蓝字发票500元 → 计入收入500元
遗漏：红字发票-500元（未检查XML）
结果：虚增收入500元
```

**错误3：催收已作废发票**
```
错误：催收发票24112...114086的500元
实际：该发票已被冲红，净额为0
结果：白白催收，客户困惑
```

**错误4：回款率不准确**
```
错误计算：
  总开票：265,987.04元（含已冲红发票）
  已收款：226,549.90元
  回款率：85.2%

正确计算：
  总开票：净额（蓝字-红字）
  已收款：226,549.90元
  回款率：真实值
```

---

## 后续优化

1. **支持更多银行格式**
   - 建设银行
   - 中国银行
   - 农业银行

2. **增强分类规则**
   - AI自动分类
   - 机器学习改进分类准确度

3. **生成更多报表**
   - 资产负债表
   - 现金流量表
   - 财务分析报告

4. **发票对账增强** ⭐
   - ✅ 发票和流水自动匹配
   - ✅ 识别拆分支付
   - ✅ 检测冲红发票
   - ✅ 生成应收账款明细
   - ✅ 生成催款清单

5. **导出到会计系统**
   - 生成记账凭证
   - 导入到SSOS系统
   - 对接金蝶/用友

## 技术实现

**语言**: Python 3.12+  
**依赖**: openpyxl, pandas  
**标准**: 小企业会计准则

## 版本历史

- v1.1.0 (2026-06-03): 新增小规模纳税人处理
  - 识别企业纳税人类型
  - 小规模纳税人：进项发票全额计入成本，不分离进项税
  - 一般纳税人：进项发票分离税额，可抵扣
  - 个人垫付发票识别和处理建议
  
- v1.0.0 (2026-06-03): 初始版本
  - 支持工行、招行流水
  - 生成银行日记账和利润表
  - 自动核对余额
  - 发票对账功能

---

## 📝 重要提醒：纳税人类型

### 小规模纳税人

**特点**:
- 年销售额 ≤ 500万
- 增值税征收率：3%（或1%优惠）
- **不能抵扣进项税**

**会计处理**:
```
借：成本/费用科目  XXX（发票全额）
  贷：银行存款/应付账款  XXX

说明：进项发票全额计入成本，不单独核算进项税
```

### 一般纳税人

**特点**:
- 年销售额 > 500万
- 增值税税率：13%/9%/6%
- **可以抵扣进项税**

**会计处理**:
```
借：成本/费用科目  XXX（不含税金额）
    应交税费-应交增值税(进项税额)  XXX
  贷：银行存款/应付账款  XXX

说明：进项发票分离税额，进项税可抵扣
```

### 对账报告中的税务收益

skill 在生成报告时，会：
1. 自动识别企业纳税人类型（从发票 XML 或用户确认）
2. 根据纳税人类型计算节税金额：
   - 小规模：只计算所得税节省
   - 一般纳税人：计算增值税抵扣 + 所得税节省

---

## 🔍 多重匹配算法（销项发票对账）

### 匹配策略

对每个客户的发票，使用**4种匹配方式**在银行流水中查找收款记录：

#### 1. 精确匹配
```python
# 完全匹配客户全名
df_income[df_income['付款方'] == 'A公司']
```

#### 2. 模糊匹配（包含）
```python
# 银行流水中的付款方包含客户全名
df_income[df_income['付款方'].str.contains('A公司')]
```

#### 3. 关键词匹配
```python
# 提取客户名称中的关键词，逐个搜索
keywords = ['芝诺', '青岛', '生物']
for keyword in keywords:
    matches = df_income[df_income['付款方'].str.contains(keyword)]
```

**关键词提取规则**：
- 公司名：提取前2-3个特征词（如"芝诺"、"梦溪"）
- 地名：提取城市名（如"青岛"、"长沙"）
- 行业词：提取行业特征（如"生物"、"科技"）
- 学校名：提取学校简称（如"北师大"、"西南大学"）

#### 4. 字符拆分匹配
```python
# 将客户名拆分成2-3字一组，逐个搜索
# "芝诺未来生物" → ["芝诺", "未来", "生物"]
for chars in ['芝诺', '未来', '生物']:
    matches = df_income[df_income['付款方'].str.contains(chars)]
```

### 匹配优先级

1. **精确匹配** → 最高可信度，直接确认
2. **模糊匹配** → 高可信度，直接确认
3. **关键词匹配** → 中等可信度，需人工确认
4. **字符拆分** → 低可信度，仅作为提示

### 按客户汇总原则

⚠️ **重要**：必须按客户汇总所有发票后再匹配收款！

**错误方法**（单张发票匹配）：
```python
# ❌ 错误：逐张发票匹配
for 发票 in 发票列表:
    在银行流水中查找该发票的收款
```

**问题**：
- 客户A有10张发票，但银行只有1-2笔大额收款
- 会导致大部分发票被错误标记为"未收款"

**正确方法**（按客户汇总）：
```python
# ✅ 正确：按客户汇总
for 客户 in 客户列表:
    应收金额 = sum(该客户的所有发票金额)
    实收金额 = sum(在银行流水中找到的该客户所有收款)
    未收金额 = 应收金额 - 实收金额
```

**案例**：
```
客户：北京林业大学
发票：11张，共¥19,449.52
收款：2笔，共¥19,582.20
结论：✅ 已全额收款（甚至多收了¥132）

如果按单张发票匹配：
- 第1张发票¥5,624 → 找到收款¥5,624 ✅
- 第2张发票¥9,716 → 找到收款¥9,716 ✅
- 第3-11张发票 → ❌ 错误标记为未收款（实际已包含在前2笔中）
```

### 实现示例

```python
import pandas as pd
from collections import defaultdict

def reconcile_invoices(df_invoices, df_income):
    """
    发票对账主函数
    
    Args:
        df_invoices: 发票数据（包含客户名称、金额等）
        df_income: 银行收入流水（包含付款方、金额等）
    
    Returns:
        对账结果列表
    """
    # 1. 按客户汇总发票
    customer_invoices = defaultdict(lambda: {'应收': 0, '发票数': 0})
    for _, invoice in df_invoices.iterrows():
        customer = invoice['客户名称']
        amount = invoice['开票金额']
        customer_invoices[customer]['应收'] += amount
        customer_invoices[customer]['发票数'] += 1
    
    # 2. 对每个客户进行多重匹配
    results = []
    for customer, inv_data in customer_invoices.items():
        应收 = inv_data['应收']
        
        # 使用4种匹配方式查找收款
        实收 = multi_match_payment(customer, df_income)
        
        results.append({
            '客户': customer,
            '发票数': inv_data['发票数'],
            '应收': 应收,
            '实收': 实收,
            '未收': 应收 - 实收,
            '状态': '已收款' if abs(应收 - 实收) < 1 else '未收款'
        })
    
    return results

def multi_match_payment(customer, df_income):
    """
    多重匹配：使用4种方式查找客户的所有收款记录
    """
    # 1. 精确匹配
    exact = df_income[df_income['付款方'] == customer]
    if len(exact) > 0:
        return exact['金额'].sum()
    
    # 2. 模糊匹配
    fuzzy = df_income[df_income['付款方'].str.contains(customer, na=False)]
    if len(fuzzy) > 0:
        return fuzzy['金额'].sum()
    
    # 3. 关键词匹配
    keywords = extract_keywords(customer)
    for keyword in keywords:
        matches = df_income[df_income['付款方'].str.contains(keyword, na=False)]
        if len(matches) > 0:
            return matches['金额'].sum()
    
    # 4. 都没找到
    return 0.0

def extract_keywords(customer):
    """提取客户名称中的关键词"""
    keywords = []
    
    # 特殊关键词映射
    keyword_map = {
        '芝诺': ['芝诺', '青岛', '生物'],
        '梦溪': ['梦溪', '创坛'],
        '西南大学': ['西南大学', '西南'],
        '北师大': ['北京师范', '师范大学', '北师大'],
        # ... 更多映射
    }
    
    for key, values in keyword_map.items():
        if key in customer:
            keywords.extend(values)
            return keywords
    
    # 默认：提取前5个字符作为关键词
    if len(customer) >= 5:
        keywords.append(customer[:5])
    
    return keywords
```

### 验证清单

对账完成后，必须验证：

- [ ] 是否按客户汇总（不是按单张发票）
- [ ] 是否使用了多重匹配（不是只精确匹配）
- [ ] 对于未找到的客户，是否尝试了所有4种匹配方式
- [ ] 回款率是否合理（通常应在60-90%之间，如果<30%可能有问题）
- [ ] 是否排除了红字发票和已被冲红的发票

---

## 版本历史更新

- v1.2.0 (2026-06-03): 新增多重匹配算法
  - 4种匹配方式：精确、模糊、关键词、字符拆分
  - 按客户汇总原则（避免重复标记未收款）
  - 关键词智能提取
  - 匹配验证清单


---

## ⚠️ 常见数据格式问题及解决方案

### 问题1：招商银行文件列名异常

**症状**：
- Excel 文件列名显示为 `2025-01-01至2025-06-03收支记录汇总`, `2025-01-01至2025-06-03收支记录汇总.1` 等
- 所有列名都是重复的标题

**原因**：
- 招商银行导出的 Excel 文件第一行是标题，第二行才是真正的列名

**解决方案**：
```python
# ❌ 错误：直接读取
df = pd.read_excel('招商银行_xxx.xlsx')  # 列名错误

# ✅ 正确：跳过第一行
df = pd.read_excel('招商银行_xxx.xlsx', header=1)
```

**验证方法**：
```python
df = pd.read_excel(file)
if '付方账户' not in df.columns:
    # 重新读取，跳过第一行
    df = pd.read_excel(file, header=1)
```

---

### 问题2：工商银行列名不一致

**症状**：
- 对方名称列在不同文件中名称不同
- 有的是 `对方户名`，有的是 `对方单位名称`

**解决方案**：
```python
# 兼容两种列名
counterparty_col = '对方单位名称' if '对方单位名称' in df.columns else '对方户名'
counterparty_name = row[counterparty_col]

# 或使用 get 方法
counterparty_name = row.get('对方单位名称') or row.get('对方户名', '')
```

---

### 问题3：工商银行金额格式（千分位）

**症状**：
- 金额字段包含千分位逗号：`'4,000.00'`, `'1,000.00'`
- 直接转换 `float()` 会报错

**解决方案**：
```python
# ❌ 错误
amount = float(row['借方发生额'])  # TypeError: could not convert string to float: '4,000.00'

# ✅ 正确：先移除千分位
amount_str = str(row['借方发生额']).replace(',', '').strip()
amount = float(amount_str) if amount_str not in [' ', '', 'nan'] else 0
```

---

### 问题4：空值判断不准确

**症状**：
- Excel 中的空值可能是 `' '`（空格）、`''`（空字符串）、`nan` 字符串、或 `NaN` 对象
- 简单判断会遗漏某些情况

**解决方案**：
```python
# ❌ 不够全面
if value:
    amount = float(value)

# ✅ 正确：多种空值判断
value_str = str(value).replace(',', '').strip()
if value_str and value_str not in [' ', '', 'nan', 'NaN']:
    amount = float(value_str)
else:
    amount = 0
```

---

### 问题5：重复数据未去重

**症状**：
- 多个银行文件时间范围重叠（如 `2024-06至2024-11` 和 `2024-06至2024-12`）
- 导致同一笔交易被导入多次

**解决方案**：
```python
# 按关键字段去重
df_unified = df_unified.drop_duplicates(
    subset=['交易时间', '交易金额', '银行'], 
    keep='first'
)

# 统计去重情况
before_dedup = len(df_all)
df_unified = df_unified.drop_duplicates(...)
after_dedup = len(df_unified)
print(f"去重：{before_dedup} → {after_dedup} (删除 {before_dedup - after_dedup} 条重复)")
```

---

## 🔧 完整的银行流水统一脚本模板

```python
import pandas as pd
import os

all_records = []

# ========== 工商银行 ==========
icbc_files = ['工商银行_2024-03至2024-05.xlsx', ...]

for file in icbc_files:
    if not os.path.exists(file):
        continue
    
    # 跳过第一行标题
    df = pd.read_excel(file, header=1)
    
    for _, row in df.iterrows():
        try:
            # 处理千分位格式
            debit_str = str(row['借方发生额']).replace(',', '').strip()
            credit_str = str(row['贷方发生额']).replace(',', '').strip()
            
            # 空值判断
            debit = float(debit_str) if debit_str not in [' ', '', 'nan'] else 0
            credit = float(credit_str) if credit_str not in [' ', '', 'nan'] else 0
            
            # 判断收入/支出
            if credit > 0:
                direction = '收入'
                amount = credit
            elif debit > 0:
                direction = '支出'
                amount = -debit
            else:
                continue
            
            # 兼容不同列名
            counterparty_col = '对方单位名称' if '对方单位名称' in df.columns else '对方户名'
            
            all_records.append({
                '银行': '工商银行',
                '账号': '200095709200450880',
                '交易时间': pd.to_datetime(row['交易时间']),
                '方向': direction,
                '交易金额': amount,
                '余额': float(str(row['余额']).replace(',', '')) if pd.notna(row['余额']) else 0,
                '对方名称（付款方/收款方）': str(row[counterparty_col]) if pd.notna(row[counterparty_col]) else '',
                '原始文件': file
            })
        except Exception as e:
            continue

# ========== 招商银行 ==========
cmb_files = ['招商银行_2025-03至2025-05.xlsx', ...]

for file in cmb_files:
    if not os.path.exists(file):
        continue
    
    # 招商银行也要跳过第一行
    df = pd.read_excel(file, header=1)
    
    for _, row in df.iterrows():
        try:
            # 判断收入/支出
            if pd.notna(row['收方名称']) and '某公司' in str(row['收方名称']):
                direction = '收入'
                counterparty = row['付方名称']
            elif pd.notna(row['付方名称']) and '某公司' in str(row['付方名称']):
                direction = '支出'
                counterparty = row['收方名称'] if pd.notna(row['收方名称']) else ''
            else:
                continue
            
            amount = float(row['交易金额'])
            if direction == '支出':
                amount = -abs(amount)
            
            all_records.append({
                '银行': '招商银行',
                '账号': '110963153910001',
                '交易时间': pd.to_datetime(row['交易时间']),
                '方向': direction,
                '交易金额': amount,
                '余额': float(row['余额']) if pd.notna(row['余额']) else 0,
                '对方名称（付款方/收款方）': str(counterparty) if pd.notna(counterparty) else '',
                '原始文件': file
            })
        except:
            continue

# ========== 生成统一文件 ==========
df_unified = pd.DataFrame(all_records)
df_unified = df_unified.sort_values('交易时间').reset_index(drop=True)

# 去重
df_unified = df_unified.drop_duplicates(
    subset=['交易时间', '交易金额', '银行'], 
    keep='first'
)

# 保存
df_unified.to_excel('✅_完整银行流水_统一格式.xlsx', index=False)
```

---

## ✅ 数据质量检查清单

统一银行流水后，必须检查：

- [ ] 工商银行数据是否为空？（如果为空，检查列名）
- [ ] 招商银行数据是否为空？（如果为空，检查 header 参数）
- [ ] 总记录数是否合理？（应该>100条）
- [ ] 是否有重复数据？（去重前后对比）
- [ ] 收入和支出总额是否合理？
- [ ] 关键交易是否存在？（如芝诺 ¥100,000）

**检查方法**：
```python
# 检查每个银行的记录数
print(f"工商银行: {len(df[df['银行']=='工商银行'])} 条")
print(f"招商银行: {len(df[df['银行']=='招商银行'])} 条")

# 搜索关键交易
zhino = df[df['对方名称（付款方/收款方）'].str.contains('芝诺', na=False)]
print(f"芝诺记录: {len(zhino)} 条")
```

---

## 版本历史更新

- v1.4.0 (2026-06-03): 新增 SSOS MCP 集成支持
  - 完善 frontmatter 元数据（tags, parameters, dependencies, mcp_servers）
  - 添加 SSOS MCP 集成说明和使用方法
  - 支持自动导入数据到 SSOS 系统
  - 提供 MCP 工具调用示例代码

- v1.3.0 (2026-06-03): 新增数据格式问题处理
  - 招商银行列名异常处理（header=1）
  - 工商银行列名兼容（对方单位名称/对方户名）
  - 千分位格式处理
  - 空值多重判断
  - 完整的数据质量检查清单
  - 统一脚本模板

---

## 🔗 与 SSOS MCP 集成

### 概述

organize-finances skill 可以与 **SSOS MCP Suite** 集成，实现端到端的财务数据处理流程：

```
混乱的银行流水和发票
  ↓ 1️⃣ organize-finances skill
  ↓    统一格式 → 清洗数据 → 对账分析 → 生成报告
  ↓ 2️⃣ SSOS MCP 工具（可选）
  ↓    导入银行交易 → 创建记账凭证 → 创建客户/供应商
  ↓ 3️⃣ SSOS Web/App
  ↓    查看财务报表 → 在线管理 → 进一步分析
完整的财务账本系统
```

---

### 前置条件

#### 1. 安装 SSOS MCP Suite

```bash
cd /path/to/ssos-mcp-suite
npm install
npm run build
```

#### 2. 配置 MCP 服务器

在 `~/.claude/.mcp.json` 或项目 `.mcp.json` 中添加：

```json
{
  "mcpServers": {
    "ssos-accounting": {
      "command": "node",
      "args": ["/absolute/path/to/ssos-mcp-suite/packages/accounting/dist/index.js"],
      "env": {
        "SSOS_API_URL": "https://api.finlaw.cloud",
        "SSOS_API_KEY": "sk_live_your_api_key_here"
      }
    }
  }
}
```

**获取 API Key**:
1. 登录 SSOS (https://finlaw.cloud)
2. 进入"设置" → "API 密钥"
3. 创建新密钥（选择工作空间，设置过期时间）
4. 复制 `sk_live_` 开头的密钥

#### 3. 重启 Claude Code

```bash
# CLI 中执行
/clear
# 或重启应用
```

---

### 使用方法

#### 方式1：在 skill 执行后手动导入（推荐）

**步骤1**: 运行 skill 生成 Excel 报告
```bash
/organize-finances "/path/to/发票处理"
```

**步骤2**: 使用 MCP 工具导入数据
```python
# 导入银行交易
import pandas as pd

df = pd.read_excel('03_银行流水/✅_完整银行流水_统一格式.xlsx')

# 调用 MCP 工具（通过 Claude Code）
"使用 import_bank_transactions 工具导入这些交易记录到 SSOS 工作空间 [workspace_id]"
```

**步骤3**: 在 SSOS 中验证
- Web: https://finlaw.cloud → 银行对账
- 查看导入的交易记录

---

#### 方式2：在 Python 脚本中集成 MCP 调用

**创建集成脚本** `organize_and_import.py`:

```python
#!/usr/bin/env python3
"""
整理财务数据并导入到 SSOS 系统
"""
import pandas as pd
import subprocess
import json
import sys

def call_mcp_tool(server: str, tool: str, args: dict):
    """
    调用 MCP 工具（通过 Claude Code MCP 客户端）
    
    注意：这是示例代码，实际需要使用 MCP SDK
    """
    # 方法1：通过 Claude Code CLI
    prompt = f"使用 {server} 的 {tool} 工具，参数：{json.dumps(args, ensure_ascii=False)}"
    # 这里需要实现具体的 MCP 调用逻辑
    
    # 方法2：直接调用 SSOS API（不通过 MCP）
    import requests
    api_url = "https://api.finlaw.cloud"
    api_key = "sk_live_xxx"
    
    response = requests.post(
        f"{api_url}/api/{tool.replace('_', '-')}",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json=args
    )
    return response.json()

def import_bank_transactions(df: pd.DataFrame, workspace_id: str, bank_account_id: str):
    """导入银行交易到 SSOS"""
    transactions = []
    
    for _, row in df.iterrows():
        transactions.append({
            "date": row['交易时间'].strftime('%Y-%m-%d'),
            "amount": float(row['交易金额']),
            "description": f"{row['方向']} - {row['对方名称（付款方/收款方）']}",
            "counterparty": row['对方名称（付款方/收款方）'],
            "direction": "income" if row['方向'] == '收入' else "expense"
        })
    
    # 分批导入（每次最多50条）
    batch_size = 50
    for i in range(0, len(transactions), batch_size):
        batch = transactions[i:i+batch_size]
        
        result = call_mcp_tool('ssos-accounting', 'import_bank_transactions', {
            'workspace_id': workspace_id,
            'bank_account_id': bank_account_id,
            'transactions': batch
        })
        
        print(f"✅ 已导入 {len(batch)} 笔交易（第 {i+1}-{i+len(batch)} 笔）")
    
    return len(transactions)

def create_partners_from_transactions(df: pd.DataFrame, workspace_id: str):
    """从交易记录中提取并创建客户/供应商"""
    partners = df['对方名称（付款方/收款方）'].unique()
    partners = [p for p in partners if p and p.strip() and '内部转账' not in p]
    
    created = 0
    for partner_name in partners:
        try:
            # 检查是否已存在
            existing = call_mcp_tool('ssos-accounting', 'list_partners', {
                'workspace_id': workspace_id,
                'search': partner_name
            })
            
            if existing and len(existing.get('data', [])) > 0:
                continue  # 已存在，跳过
            
            # 创建新合作伙伴
            call_mcp_tool('ssos-accounting', 'create_partner', {
                'workspace_id': workspace_id,
                'name': partner_name,
                'type': 'both',  # 既是客户也是供应商
                'status': 'active'
            })
            created += 1
            print(f"✅ 创建合作伙伴: {partner_name}")
            
        except Exception as e:
            print(f"⚠️  创建合作伙伴失败 {partner_name}: {e}")
    
    return created

if __name__ == '__main__':
    # 配置
    WORKSPACE_ID = "your_workspace_id_here"
    BANK_ACCOUNT_ID = "your_bank_account_id_here"
    
    # 读取 organize-finances skill 生成的文件
    df_bank = pd.read_excel('03_银行流水/✅_完整银行流水_统一格式.xlsx')
    
    print(f"📊 读取到 {len(df_bank)} 笔银行交易")
    
    # 导入到 SSOS
    print("\n1️⃣ 导入银行交易...")
    total_imported = import_bank_transactions(df_bank, WORKSPACE_ID, BANK_ACCOUNT_ID)
    
    print("\n2️⃣ 创建合作伙伴...")
    total_partners = create_partners_from_transactions(df_bank, WORKSPACE_ID)
    
    print(f"\n✅ 导入完成！")
    print(f"  - 银行交易: {total_imported} 笔")
    print(f"  - 新增合作伙伴: {total_partners} 个")
    print(f"\n🌐 在 SSOS 中查看: https://finlaw.cloud")
```

**运行脚本**:
```bash
# 1. 先运行 skill 生成 Excel
/organize-finances "/path/to/发票处理"

# 2. 配置脚本中的 WORKSPACE_ID 和 BANK_ACCOUNT_ID
# 3. 运行导入脚本
python3 organize_and_import.py
```

---

### 可用的 SSOS MCP 工具

#### 银行对账工具
- **`import_bank_transactions`** — 导入银行交易记录
  ```json
  {
    "workspace_id": "xxx",
    "bank_account_id": "xxx",
    "transactions": [
      {
        "date": "2026-06-01",
        "amount": 50000.00,
        "description": "客户付款",
        "counterparty": "杭州曼孚科技有限公司"
      }
    ]
  }
  ```

- **`list_bank_transactions`** — 查询已导入的交易
- **`list_reconciliation_records`** — 查看对账历史

#### 记账凭证工具
- **`batch_create_journal_entries`** — 批量生成记账凭证（最多50条）
  ```json
  {
    "workspace_id": "xxx",
    "entries": [
      {
        "date": "2026-06-01",
        "description": "收到客户付款",
        "lines": [
          {
            "account_code": "1002",
            "debit": 50000.00,
            "credit": 0
          },
          {
            "account_code": "1122",
            "debit": 0,
            "credit": 50000.00
          }
        ]
      }
    ]
  }
  ```

#### 合作伙伴工具
- **`create_partner`** — 创建客户/供应商
- **`list_partners`** — 查询合作伙伴
- **`update_partner`** — 更新合作伙伴信息

#### AI 工具
- **`ai_bookkeeping`** — 自然语言记账
  ```json
  {
    "workspace_id": "xxx",
    "input": "今天收到客户付款5万元，银行转账"
  }
  ```

- **`ocr_invoice`** — 发票 OCR 识别
  ```json
  {
    "workspace_id": "xxx",
    "image_url": "https://..."
  }
  ```

完整工具列表: `/ssos-mcp-suite/README.md`

---

### 集成优势

**无集成**（仅使用 skill）:
- ✅ 生成 Excel 报告
- ❌ 需要手工将数据录入会计系统
- ❌ 无法在线查看和管理

**有集成**（skill + MCP）:
- ✅ 自动导入到 SSOS 系统
- ✅ 自动生成记账凭证
- ✅ 自动创建客户/供应商
- ✅ 在 Web/App 中在线查看
- ✅ 支持多用户协作
- ✅ 数据持久化和备份

---

### 常见问题

**Q1: MCP 工具调用失败怎么办？**

A: 检查以下几点：
1. MCP 服务器是否正确配置（`~/.claude/.mcp.json`）
2. API Key 是否有效（未过期）
3. Workspace ID 是否正确
4. 重启 Claude Code 后重试

**Q2: 是否必须使用 MCP 集成？**

A: 不是必须的。skill 仍可独立使用，生成 Excel 报告后手动导入到任何会计系统。

**Q3: 能否导入到其他会计系统（金蝶、用友）？**

A: 当前仅支持 SSOS 系统。未来可能支持更多系统的 API 集成。

**Q4: 数据安全吗？**

A: 
- MCP 工具通过 HTTPS 加密传输
- API Key 支持设置过期时间和权限范围
- 建议定期轮换 API Key

---

### 参考资料

- **SSOS MCP Suite 文档**: `/ssos-mcp-suite/README.md`
- **SSOS API 文档**: `https://api.finlaw.cloud/docs`
- **SSOS 项目文档**: `/docs/README.md`
- **集成分析报告**: `/发票处理/04_核心报告/📊_Skill与MCP集成分析报告.md`


---

## 标准文件夹结构规范

### 发票文件夹统一结构

**开具发票（销项）和取得发票（进项）必须使用相同的结构**：

```
XX_发票类型/
├── 📊_对账报表/          # 所有对账相关的Excel/CSV文件
│   ├── 发票对账表.xlsx
│   ├── 未收款清单.xlsx
│   ├── 供应商汇总表.csv
│   └── 智能对账结果.xlsx
│
├── 📋_说明文档/          # 所有说明文档和报告
│   ├── README.md
│   ├── 对账操作指南.md
│   └── 对账完成报告.md
│
└── 📁_原始发票XML/      # 所有原始发票XML文件
    ├── 发票1.xml
    ├── 发票2.xml
    └── ...
```

### 命名规范

**文件夹命名**：
- ✅ 使用emoji前缀：📊（报表）、📋（文档）、📁（原始数据）
- ✅ 使用下划线分隔：`📊_对账报表`
- ❌ 不要混用：`对账报表/`、`报表/`、`Excel文件/`

**文件命名**：
- ✅ 使用描述性名称：`发票对账表_完整版.xlsx`
- ✅ 带日期的文件：`银行流水_统一格式_最终版_20260603.xlsx`
- ✅ 状态标记：`✅_` 表示最终版本
- ❌ 不要使用：`新建文件夹`、`未命名`、`副本`

### Excel文件规范

**列名必须统一**（中英文一致）：

**销项发票对账表**：
```
必需列：
- 客户名称 (customer_name)
- 发票号码 (invoice_no)
- 开票日期 (invoice_date)
- 发票金额 (invoice_amount)
- 已收金额 (received_amount)
- 未收金额 (unpaid_amount)
- 收款状态 (payment_status)
- 是否红字 (is_red_invoice)

可选列：
- 收款日期 (payment_date)
- 收款笔数 (payment_count)
- 备注 (notes)
```

**进项发票对账表**：
```
必需列：
- 供应商名称 (supplier_name)
- 发票号码 (invoice_no)
- 开票日期 (invoice_date)
- 发票金额 (invoice_amount)
- 已付金额 (paid_amount)
- 未付金额 (unpaid_amount)
- 付款状态 (payment_status)
- 是否红字 (is_red_invoice)

可选列：
- 付款日期 (payment_date)
- 付款方式 (payment_method)
- 备注 (notes)
```

**银行流水统一格式**：
```
必需列：
- 银行 (bank)
- 账号 (account_no)
- 交易时间 (transaction_time)
- 方向 (direction)  # 收入/支出
- 交易金额 (amount)
- 余额 (balance)
- 对方名称 (counterparty)
- 摘要 (description)

可选列：
- 对方账号 (counterparty_account)
- 用途 (purpose)
- 原始文件 (source_file)
```

### 数据类型规范

```python
# 日期格式
invoice_date: datetime  # YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS

# 金额格式
amount: float  # 保留2位小数，不要加逗号分隔符
# ✅ 100000.00
# ❌ 100,000.00
# ❌ "¥100,000"

# 状态字段
payment_status: str  # 固定值："已收款"、"部分收款"、"未收款"
is_red_invoice: bool  # True/False 或 1/0

# 公司名称
company_name: str  # 规范化后存储（统一括号、去空格）
```

### 脚本兼容性要求

**所有处理脚本必须支持**：
1. ✅ 读取标准文件夹结构
2. ✅ 识别标准列名（中英文都支持）
3. ✅ 输出符合规范的Excel
4. ✅ 自动创建标准文件夹结构
5. ✅ 处理缺失字段（给出明确错误提示）

**脚本输入检查清单**：
```python
def validate_input_structure(directory):
    """验证输入目录结构是否符合规范"""
    
    # 检查必需文件夹
    required_folders = [
        "📊_对账报表",
        "📋_说明文档", 
        "📁_原始发票XML"
    ]
    
    for folder in required_folders:
        folder_path = os.path.join(directory, folder)
        if not os.path.exists(folder_path):
            raise ValueError(f"缺少必需文件夹: {folder}")
    
    # 检查XML文件
    xml_dir = os.path.join(directory, "📁_原始发票XML")
    xml_files = glob.glob(f"{xml_dir}/**/*.xml", recursive=True)
    if len(xml_files) == 0:
        raise ValueError(f"未找到发票XML文件: {xml_dir}")
    
    return True
```

### 迁移现有数据

**如果现有结构不规范，执行以下步骤**：

```bash
# 1. 创建标准文件夹
mkdir -p "📊_对账报表" "📋_说明文档" "📁_原始发票XML"

# 2. 移动对账报表文件
mv *.xlsx *.csv *.json "📊_对账报表/"

# 3. 移动说明文档
mv *.md "📋_说明文档/"

# 4. 移动或重命名XML文件夹
mv 发票XML文件 "📁_原始发票XML/"
# 或
mv 原始发票 "📁_原始发票XML/"

# 5. 验证结构
ls -la
```

---

## 版本历史

- v1.4.1 (2026-06-03): 添加真实对账错误案例（A公司括号差异、B公司部分收款）
- v1.4.0 (2026-06-03): 添加SSOS MCP集成支持
- v1.3.0 (2026-05): 添加红字发票XML检测
- v1.2.0: 添加按客户汇总对账
- v1.1.0: 添加拆分支付识别
- v1.0.0: 初始版本

---

---

## 发票XML完整字段提取规范

### 增值税电子发票XML结构

**必须提取的所有字段**（按国家税务总局标准）：

#### 1. 发票基本信息
```python
invoice_data = {
    # 发票标识
    'invoice_code': '',          # 发票代码（12位）
    'invoice_no': '',            # 发票号码（8位）
    'invoice_type': '',          # 发票类型（01=增值税专用发票，04=普通发票）
    'issue_type': '',            # LabelCode: Y=蓝字, N=红字
    'invoice_date': '',          # 开票日期 YYYY-MM-DD
    'invoice_time': '',          # 开票时间 HH:MM:SS
    
    # 冲红信息（仅红字发票）
    'original_invoice_code': '', # 原发票代码
    'original_invoice_no': '',   # 原发票号码
    'red_reason': '',            # 冲红原因
}
```

#### 2. 销售方信息（开票方）
```python
seller_info = {
    'seller_name': '',           # 销售方名称
    'seller_tax_no': '',         # 销售方纳税人识别号（统一社会信用代码）
    'seller_address': '',        # 销售方地址
    'seller_phone': '',          # 销售方电话
    'seller_bank': '',           # 销售方开户行
    'seller_account': '',        # 销售方银行账号
}
```

#### 3. 购买方信息（受票方）
```python
buyer_info = {
    'buyer_name': '',            # 购买方名称
    'buyer_tax_no': '',          # 购买方纳税人识别号
    'buyer_address': '',         # 购买方地址
    'buyer_phone': '',           # 购买方电话
    'buyer_bank': '',            # 购买方开户行
    'buyer_account': '',         # 购买方银行账号
}
```

#### 4. 金额信息
```python
amount_info = {
    'total_amount': 0.0,         # 价税合计（含税总额）
    'total_amount_without_tax': 0.0,  # 合计金额（不含税）
    'total_tax': 0.0,            # 合计税额
    'amount_in_words': '',       # 价税合计（大写）
}
```

#### 5. 商品明细（多行）
```python
items = [
    {
        'line_no': 1,                    # 行号
        'item_name': '',                 # 货物或应税劳务、服务名称
        'specification': '',             # 规格型号
        'unit': '',                      # 单位
        'quantity': 0.0,                 # 数量
        'unit_price': 0.0,               # 单价
        'amount': 0.0,                   # 金额（不含税）
        'tax_rate': 0.0,                 # 税率（如0.13表示13%）
        'tax_amount': 0.0,               # 税额
        'total': 0.0,                    # 价税合计
    }
]
```

#### 6. 其他信息
```python
other_info = {
    'payee': '',                 # 收款人
    'reviewer': '',              # 复核人
    'drawer': '',                # 开票人
    'remarks': '',               # 备注
    'machine_code': '',          # 税控码（密码区）
}
```

### XML解析示例

```python
import xml.etree.ElementTree as ET

def parse_invoice_xml(xml_file):
    """完整解析增值税发票XML"""
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    invoice = {}
    
    # 1. 发票基本信息
    invoice['invoice_code'] = get_text(root, './/InvoiceCode')
    invoice['invoice_no'] = get_text(root, './/InvoiceNo')
    invoice['invoice_date'] = get_text(root, './/IssueDate')
    invoice['invoice_time'] = get_text(root, './/IssueTime')
    
    # 判断蓝字/红字
    label_code = get_text(root, './/InIssuType/LabelCode')
    invoice['is_red'] = (label_code == 'N')
    invoice['issue_type'] = '红字' if invoice['is_red'] else '蓝字'
    
    # 冲红信息
    if invoice['is_red']:
        invoice['original_invoice_code'] = get_text(root, './/OriginalInvoiceCode')
        invoice['original_invoice_no'] = get_text(root, './/OriginalInvoiceNo')
    
    # 2. 销售方信息
    invoice['seller_name'] = get_text(root, './/SellerName')
    invoice['seller_tax_no'] = get_text(root, './/SellerTaxpayerID')
    invoice['seller_address'] = get_text(root, './/SellerAddress')
    invoice['seller_phone'] = get_text(root, './/SellerTel')
    invoice['seller_bank'] = get_text(root, './/SellerBankName')
    invoice['seller_account'] = get_text(root, './/SellerBankAccount')
    
    # 3. 购买方信息
    invoice['buyer_name'] = get_text(root, './/BuyerName')
    invoice['buyer_tax_no'] = get_text(root, './/BuyerTaxpayerID')
    invoice['buyer_address'] = get_text(root, './/BuyerAddress')
    invoice['buyer_phone'] = get_text(root, './/BuyerTel')
    invoice['buyer_bank'] = get_text(root, './/BuyerBankName')
    invoice['buyer_account'] = get_text(root, './/BuyerBankAccount')
    
    # 4. 金额信息
    invoice['total_amount'] = get_float(root, './/TotalTax-includedAmount')
    invoice['total_amount_without_tax'] = get_float(root, './/TotalAmWithoutTax')
    invoice['total_tax'] = get_float(root, './/TotalTaxAm')
    invoice['amount_in_words'] = get_text(root, './/TotalTax-includedAmountInWords')
    
    # 5. 商品明细
    items = []
    for idx, item_node in enumerate(root.findall('.//InvoiceLineItems/InvoiceLine'), 1):
        item = {
            'line_no': idx,
            'item_name': get_text(item_node, './/ItemName'),
            'specification': get_text(item_node, './/Specification'),
            'unit': get_text(item_node, './/MeteringUnit'),
            'quantity': get_float(item_node, './/Quantity'),
            'unit_price': get_float(item_node, './/UnitPrice'),
            'amount': get_float(item_node, './/AmountWithoutTax'),
            'tax_rate': get_float(item_node, './/TaxRate'),
            'tax_amount': get_float(item_node, './/TaxAmount'),
        }
        item['total'] = item['amount'] + item['tax_amount']
        items.append(item)
    
    invoice['items'] = items
    invoice['item_count'] = len(items)
    
    # 6. 其他信息
    invoice['payee'] = get_text(root, './/Payee')
    invoice['reviewer'] = get_text(root, './/Reviewer')
    invoice['drawer'] = get_text(root, './/Drawer')
    invoice['remarks'] = get_text(root, './/Remarks')
    invoice['machine_code'] = get_text(root, './/MachineCode')
    
    return invoice

def get_text(root, xpath, default=''):
    """安全获取XML文本"""
    elem = root.find(xpath)
    return elem.text if elem is not None and elem.text else default

def get_float(root, xpath, default=0.0):
    """安全获取XML浮点数"""
    text = get_text(root, xpath)
    try:
        return float(text) if text else default
    except ValueError:
        return default
```

### 标准Excel输出格式

**发票主表**（每张发票一行）:
```
列名（必需）：
- invoice_code          发票代码
- invoice_no            发票号码
- invoice_type          发票类型
- issue_type            蓝字/红字
- invoice_date          开票日期
- seller_name           销售方名称
- seller_tax_no         销售方税号
- buyer_name            购买方名称
- buyer_tax_no          购买方税号
- total_amount          价税合计
- total_amount_without_tax  不含税金额
- total_tax             税额
- payment_status        收款状态（对账后填写）
- received_amount       已收金额（对账后填写）
- unpaid_amount         未收金额（对账后填写）
- remarks               备注

可选列：
- original_invoice_no   原发票号（红字发票）
- seller_address        销售方地址
- seller_phone          销售方电话
- buyer_address         购买方地址
- buyer_phone           购买方电话
- payee                 收款人
- drawer                开票人
```

**发票明细表**（每个商品一行）:
```
列名：
- invoice_code          发票代码
- invoice_no            发票号码
- line_no               行号
- item_name             商品名称
- specification         规格型号
- unit                  单位
- quantity              数量
- unit_price            单价
- amount                金额（不含税）
- tax_rate              税率
- tax_amount            税额
- total                 价税合计
```

### 数据质量检查

**必须验证的字段**:
```python
def validate_invoice_data(invoice):
    """验证发票数据完整性"""
    
    errors = []
    
    # 1. 必需字段检查
    required_fields = [
        'invoice_code', 'invoice_no', 'invoice_date',
        'seller_name', 'seller_tax_no',
        'buyer_name', 'buyer_tax_no',
        'total_amount', 'total_amount_without_tax', 'total_tax'
    ]
    
    for field in required_fields:
        if not invoice.get(field):
            errors.append(f"缺少必需字段: {field}")
    
    # 2. 金额计算验证
    amount = invoice.get('total_amount_without_tax', 0)
    tax = invoice.get('total_tax', 0)
    total = invoice.get('total_amount', 0)
    
    if abs((amount + tax) - total) > 0.02:  # 允许2分误差
        errors.append(f"金额计算错误: {amount} + {tax} ≠ {total}")
    
    # 3. 税号格式验证
    seller_tax_no = invoice.get('seller_tax_no', '')
    if seller_tax_no and len(seller_tax_no) not in [15, 18, 20]:
        errors.append(f"销售方税号格式错误: {seller_tax_no}")
    
    buyer_tax_no = invoice.get('buyer_tax_no', '')
    if buyer_tax_no and len(buyer_tax_no) not in [15, 18, 20]:
        errors.append(f"购买方税号格式错误: {buyer_tax_no}")
    
    # 4. 红字发票检查
    if invoice.get('is_red') and invoice.get('total_amount', 0) > 0:
        errors.append(f"红字发票金额应为负数: {invoice.get('total_amount')}")
    
    return errors
```

---

## 版本历史更新

- v1.4.2 (2026-06-03): 添加发票XML完整字段提取规范（所有标准字段）
- v1.4.1 (2026-06-03): 添加真实对账错误案例
- v1.4.0 (2026-06-03): 添加SSOS MCP集成支持

---

---

## ⚠️ 常见错误和预防措施

### 错误1：未完整提取所有XML文件 🚨

**错误表现**：
- 只统计了96张发票，实际有208张
- 遗漏了大量发票和客户

**原因**：
- 只读取了一个子文件夹的XML
- 没有递归搜索所有子目录

**正确做法**：
```python
# ❌ 错误：只读取一层
xml_files = glob.glob("📁_原始发票XML/*.xml")

# ✅ 正确：递归搜索所有子目录
xml_files = glob.glob("📁_原始发票XML/**/*.xml", recursive=True)
```

**验证方法**：
```python
# 检查文件数量是否合理
if len(xml_files) < 50:
    print("⚠️ 警告：发票数量异常少，请检查路径")
```

---

### 错误2：未识别红字发票 🚨

**错误表现**：
- 虚增应收金额
- 催收已作废的发票
- 回款率虚高

**原因**：
- 没有检查XML中的`<LabelCode>`字段
- 直接按金额汇总，没有区分蓝字/红字

**正确做法**：
```python
# 必须先分离蓝字和红字
blue = df[df['issue_type'] == '蓝字']
red = df[df['issue_type'] == '红字']

# 按客户计算净额
net_amount = blue['amount'].sum() - red['amount'].abs().sum()
```

**验证方法**：
```python
# 检查是否有红字发票
red_count = len(df[df['issue_type'] == '红字'])
if red_count > 0:
    print(f"✅ 发现{red_count}张红字发票，已正确处理")
else:
    print("ℹ️ 无红字发票")
```

---

### 错误3：公司名称未规范化 🚨

**错误表现**：
- 芝诺未来生物科技（青岛）无法匹配
- 实际已收款¥10万，显示未收款
- 回款率降低13.6%

**原因**：
- 发票：芝诺未来生物科技**（**青岛**）**（全角括号）
- 流水：芝诺未来生物科技**(**青岛**)**（半角括号）
- 严格字符串匹配失败

**正确做法**：
```python
def normalize_company_name(name):
    """必须规范化后再匹配"""
    name = name.replace('（', '(').replace('）', ')')
    name = name.replace('【', '[').replace('】', ']')
    name = ' '.join(name.split())  # 统一空格
    return name.strip()
```

**验证方法**：
```python
# 检查未匹配的大额客户（>¥10,000）
unmatched = df_results[(df_results['实收']==0) & (df_results['净应收']>10000)]
if len(unmatched) > 0:
    print("⚠️ 以下大额客户未匹配，请人工检查：")
    print(unmatched[['客户', '净应收']])
```

---

### 错误4：混淆新旧公司名 🚨

**错误表现**：
- 青岛芝诺（旧）被冲红，应该净额¥0
- 芝诺未来（新）有新发票，应该净应收¥10万
- 混为一谈，导致对账错误

**原因**：
- 公司更名，重新开票
- 没有区分不同的legal entity

**正确做法**：
```python
# 按完整公司名称分组，不要合并
# ❌ 错误：按关键词合并
df.groupby(df['buyer_name'].str.contains('芝诺'))

# ✅ 正确：按完整公司名
df.groupby('buyer_name')
```

**客户别名表**：
```python
# 建立别名映射（仅用于显示）
aliases = {
    '芝诺未来生物科技（青岛）有限公司': ['青岛芝诺生物科技有限公司（旧名，已冲红）']
}
```

---

### 错误5：未排除完全冲红的客户 🚨

**错误表现**：
- 催收净额=0的客户
- 浪费催款资源

**案例**：
- 青岛芝诺：蓝¥10万 - 红¥10万 = 净¥0 ❌ 不应催款
- 常熟开发区：蓝¥20万 - 红¥20万 = 净¥0 ❌ 不应催款

**正确做法**：
```python
# 必须排除净额≤0的客户
df_valid = df[df['净应收'] > 0.01]
```

---

## ✅ 强制检查清单（每步必做）

### 第1步：验证文件夹结构

- [ ] 检查`📊_对账报表/`文件夹存在
- [ ] 检查`📁_原始发票XML/`文件夹存在
- [ ] 检查`📋_说明文档/`文件夹存在

### 第2步：提取所有XML发票

- [ ] 使用`recursive=True`递归搜索
- [ ] 验证发票数量>50张（合理性检查）
- [ ] 提取所有24个字段
- [ ] 检查是否有缺失字段

### 第3步：识别红字发票

- [ ] 统计红字发票数量
- [ ] 按客户汇总蓝字和红字金额
- [ ] 计算净应收金额
- [ ] 列出所有有红字的客户

### 第4步：排除完全冲红

- [ ] 找出净额=0的客户
- [ ] 标记为"完全冲红"
- [ ] 从对账清单中移除
- [ ] 生成"不应催款清单"

### 第5步：按客户名称匹配

- [ ] 规范化所有公司名称
- [ ] 按完整公司名分组（不合并）
- [ ] 支持拆分支付识别
- [ ] 生成未匹配清单（>¥10,000人工复核）

### 第6步：最终验证

- [ ] 总开票金额是否>¥100万
- [ ] 回款率是否在30%-95%之间
- [ ] 是否有大额客户（>¥10万）未匹配
- [ ] 生成对账报告

---

## 🔧 自动化脚本模板

```python
#!/usr/bin/env python3
"""
organize-finances 自动化对账脚本
严格按照5步流程执行，带验证检查点
"""

import pandas as pd
import xml.etree.ElementTree as ET
import glob
import os

def step1_validate_structure(base_dir):
    """第1步：验证文件夹结构"""
    required = ['📊_对账报表', '📁_原始发票XML', '📋_说明文档']
    for folder in required:
        path = os.path.join(base_dir, folder)
        assert os.path.exists(path), f"缺少文件夹: {folder}"
    print("✅ 第1步：文件夹结构验证通过")

def step2_extract_invoices(base_dir):
    """第2步：提取所有XML发票"""
    xml_dir = os.path.join(base_dir, '📁_原始发票XML')
    xml_files = glob.glob(f"{xml_dir}/**/*.xml", recursive=True)
    
    assert len(xml_files) >= 50, f"⚠️ 发票数量异常少: {len(xml_files)}"
    
    # 解析XML...
    invoices = []
    for xml_file in xml_files:
        invoice = parse_invoice_xml(xml_file)
        if invoice:
            invoices.append(invoice)
    
    print(f"✅ 第2步：成功提取{len(invoices)}张发票")
    return pd.DataFrame(invoices)

def step3_identify_red_invoices(df):
    """第3步：识别红字发票"""
    red_count = len(df[df['issue_type']=='红字'])
    print(f"✅ 第3步：发现{red_count}张红字发票")
    return df

def step4_exclude_fully_cancelled(df):
    """第4步：排除完全冲红的客户"""
    # 按客户计算净额...
    cancelled = df[df['净应收'] == 0]
    valid = df[df['净应收'] > 0]
    
    print(f"✅ 第4步：排除{len(cancelled)}个完全冲红客户")
    return valid

def step5_match_bank_statements(df_invoices, df_bank):
    """第5步：按客户匹配银行流水"""
    # 规范化名称后匹配...
    results = []
    
    # 验证：检查大额未匹配
    unmatched_large = [r for r in results if r['实收']==0 and r['净应收']>10000]
    if unmatched_large:
        print(f"⚠️ {len(unmatched_large)}个大额客户未匹配，需人工复核")
    
    print(f"✅ 第5步：完成对账，回款率{overall_rate:.1f}%")
    return pd.DataFrame(results)

# 主流程
if __name__ == '__main__':
    base_dir = input("请输入发票文件夹路径: ")
    
    step1_validate_structure(base_dir)
    df_invoices = step2_extract_invoices(base_dir)
    df_invoices = step3_identify_red_invoices(df_invoices)
    df_valid = step4_exclude_fully_cancelled(df_invoices)
    df_results = step5_match_bank_statements(df_valid, df_bank)
    
    print("\n✅ 全部5步完成！")
```

---

## 版本历史

- v1.4.3 (2026-06-03): 添加常见错误预防措施和强制检查清单
- v1.4.2 (2026-06-03): 添加发票XML完整字段提取规范
- v1.4.1 (2026-06-03): 添加真实对账错误案例

---

---

## 🚨 强制检查清单（每步必须验证，不可跳过）

### ⚠️ 关键检查（最容易出错的3项）

#### 🔴 强制检查1：发票是否冲红（最重要！）

**检查方法**：
```python
# 必须从XML提取LabelCode
label_code = root.find('.//InIssuType/LabelCode')
is_red = (label_code.text == 'N')  # N=红字, Y=蓝字

# 强制验证
assert label_code is not None, "❌ 未找到LabelCode，无法判断红字/蓝字"
```

**验证标准**：
- ✅ 每张发票必须有明确的蓝字/红字标识
- ✅ 红字发票数量必须统计
- ✅ 红字发票必须与蓝字发票配对
- ✅ 完全冲红的客户（净额=0）必须排除

**失败后果**：
- ❌ 虚增应收金额
- ❌ 催收已作废发票
- ❌ 回款率虚高

---

#### 🔴 强制检查2：发票号码是否重复

**检查方法**：
```python
# 提取唯一发票ID
eiid = root.find('.//EIid')
invoice_ids = [inv['invoice_id'] for inv in invoices]

# 强制去重检查
if len(invoice_ids) != len(set(invoice_ids)):
    duplicates = [id for id in invoice_ids if invoice_ids.count(id) > 1]
    raise ValidationError(f"❌ 发现重复发票ID: {set(duplicates)}")
```

**验证标准**：
- ✅ 每张发票ID必须唯一
- ✅ 如发现重复，必须人工确认
- ✅ 重复的可能是：多次下载、同一文件复制

**失败后果**：
- ❌ 虚增发票数量
- ❌ 虚增应收金额
- ❌ 对账数据翻倍

---

#### 🔴 强制检查3：金额完全相同的发票

**检查方法**：
```python
# 按客户+金额分组，查找相同金额
same_amount = df.groupby(['buyer_name', 'amount']).size()
duplicates_amount = same_amount[same_amount > 1]

if len(duplicates_amount) > 0:
    print("⚠️ 发现相同金额的发票，必须人工核对：")
    for (buyer, amount), count in duplicates_amount.items():
        print(f"  {buyer}: {count}张 x ¥{amount:,.2f}")
        
        # 检查发票ID是否不同
        same_invoices = df[(df['buyer_name']==buyer) & (df['amount']==amount)]
        ids = same_invoices['invoice_id'].tolist()
        
        if len(ids) != len(set(ids)):
            raise ValidationError(f"❌ {buyer}的¥{amount}发票ID重复！")
        else:
            print(f"    ✅ 发票ID不同，确认为{count}张独立发票")
```

**验证标准**：
- ✅ 相同客户+相同金额的发票，必须检查ID
- ✅ ID不同 → 独立发票 ✅
- ✅ ID相同 → 重复记录 ❌ 必须去重

**案例**：
```
苏州赛益生物有限公司:
- 发票1: ¥100,000, ID: 25112000000113489041, 日期: 2025-06-03
- 发票2: ¥100,000, ID: 25112000000161555589, 日期: 2025-08-02
✅ ID不同 → 确认为2张独立发票
```

---

## 📋 完整强制检查清单（按顺序执行）

### 步骤1：文件夹结构验证

- [ ] **必须**：`📊_对账报表/` 存在
- [ ] **必须**：`📁_原始发票XML/` 存在
- [ ] **必须**：`📋_说明文档/` 存在

### 步骤2：XML提取验证

- [ ] **必须**：使用 `recursive=True` 递归搜索
- [ ] **必须**：找到≥50个XML文件
- [ ] **必须**：成功解析率≥95%
- [ ] 🔴 **强制**：提取每张发票的 `EIid`（唯一ID）
- [ ] 🔴 **强制**：提取每张发票的 `LabelCode`（红字标识）
- [ ] 🔴 **强制**：检查发票ID无重复

### 步骤3：红字发票识别

- [ ] 🔴 **强制**：统计红字发票数量
- [ ] 🔴 **强制**：按客户汇总蓝字和红字金额
- [ ] 🔴 **强制**：计算净应收 = 蓝字 - 红字
- [ ] **必须**：列出所有有红字的客户

### 步骤4：完全冲红客户排除

- [ ] 🔴 **强制**：找出净额=0的客户
- [ ] 🔴 **强制**：从对账清单中移除净额=0的客户
- [ ] **必须**：生成"不应催款清单"
- [ ] **必须**：在报告中明确标注

### 步骤5：金额重复检查

- [ ] 🔴 **强制**：检查相同客户+相同金额的发票
- [ ] 🔴 **强制**：验证这些发票的ID是否不同
- [ ] **必须**：ID相同 → 去重；ID不同 → 保留
- [ ] **必须**：在报告中列出相同金额的发票

### 步骤6：银行流水匹配

- [ ] **必须**：规范化所有公司名称
- [ ] **必须**：按完整公司名分组（不合并）
- [ ] **必须**：支持拆分支付识别
- [ ] **必须**：生成未匹配清单（>¥10,000人工复核）

### 步骤7：最终合理性验证

- [ ] **必须**：总净应收在¥50,000-¥10,000,000之间
- [ ] **必须**：回款率在30%-95%之间
- [ ] **必须**：无大额客户（>¥10万）未匹配
- [ ] **必须**：生成完整对账报告

---

## 版本历史

- v1.4.4 (2026-06-03): 添加3个强制检查（冲红、重复ID、相同金额）+ 强制验证脚本
- v1.4.3 (2026-06-03): 添加常见错误预防措施
- v1.4.2 (2026-06-03): 添加发票XML完整字段提取规范

---

---

## 📋 完整强制检查清单（43项）

**重要**：所有43项检查都是**强制性**的，任何一项失败都必须停止流程并修正。

详细清单请查看：`~/.claude/skills/organize-finances-checklist.md`

### 检查项分类

| 步骤 | 检查项数量 | 关键项 |
|------|-----------|--------|
| 1. 文件夹结构验证 | 3项 | 全部强制 |
| 2. XML文件提取 | 8项 | 🔴 LabelCode, ID唯一性 |
| 3. 红字发票识别 | 6项 | 🔴 净额计算 |
| 4. 完全冲红排除 | 4项 | 🔴 排除净额=0 |
| 5. 重复和相同金额 | 4项 | 🔴 相同金额验证ID |
| 6. 公司名称规范化 | 3项 | 🔴 括号统一 |
| 7. 银行流水匹配 | 3项 | 🔴 不合并相似名 |
| 8. 最终合理性验证 | 5项 | 🔴 金额验算 |
| 9. 报告完整性 | 7项 | 🔴 含冲红清单 |
| **总计** | **43项** | **10项最关键** |

### Top 10 最容易出错的检查（必须特别注意）

1. 🔴 提取LabelCode（红字标识）— **最重要！**
2. 🔴 发票ID无重复
3. 🔴 计算净额 = 蓝字 - 红字
4. 🔴 排除净额=0的客户
5. 🔴 相同金额发票验证ID
6. 🔴 规范化公司名称括号
7. 🔴 不合并相似公司名
8. 🔴 大额客户100%匹配
9. 🔴 金额验算（蓝-红=净）
10. 🔴 报告含完全冲红清单

### 使用方法

**方式1：手动逐项检查**
```bash
# 打开检查清单
cat ~/.claude/skills/organize-finances-checklist.md

# 对照清单，逐项执行并标记
```

**方式2：使用验证脚本（推荐）**
```bash
# 运行自动验证
python3 ~/.claude/skills/organize-finances-validator.py "发票处理/01_开具发票（销项）"

# 脚本会自动执行所有43项检查
# 任何一项失败会立即停止并报错
```

---

## 版本历史

- v1.4.5 (2026-06-03): 扩展为43项完整强制检查清单
- v1.4.4 (2026-06-03): 添加3个强制检查
- v1.4.3 (2026-06-03): 添加常见错误预防措施
- v1.4.2 (2026-06-03): 添加发票XML完整字段提取规范
- v1.4.1 (2026-06-03): 添加真实对账错误案例

---

---

## 🚨 最关键的业务逻辑检查

### ⚠️ 异常回款率预警（防止错误催款）

**问题**：银行流水远小于开票金额时，不一定是客户欠款，可能是**我们多开了发票**！

**真实案例**（2026-06-03发现）：
```
苏州赛益生物有限公司：
- 开票：2张 x ¥100,000 = ¥200,000
- 收款：¥100,000
- 回款率：50%

❌ 错误判断：客户欠款¥10万，需催款
✅ 正确判断：多开了1张发票，需冲红

发现方式：用户手动核对业务合同后发现多开
```

### 自动预警规则

| 回款率 | 状态 | 处理 |
|--------|------|------|
| 0% - 29% | 正常欠款 | 催款 |
| **30% - 70%** | **⚠️ 异常** | **检查是否多开票** |
| 71% - 95% | 正常欠款 | 催款 |
| 96% - 100% | 已收款 | 无需处理 |
| > 100% | 多收款 | 检查预付款 |

### 强制检查流程

```python
# 第10步：业务逻辑验证
for customer in df_results:
    rate = customer['实收'] / customer['净应收'] * 100
    
    # 异常回款率预警
    if 30 <= rate <= 70:
        print(f"⚠️ 异常回款率预警: {customer['客户']}")
        print(f"   净应收: ¥{customer['净应收']:,.2f}")
        print(f"   实收: ¥{customer['实收']:,.2f}")
        print(f"   回款率: {rate:.1f}%")
        print(f"   可能问题：")
        print(f"   1. 多开/重复开票")
        print(f"   2. 发票金额错误")
        print(f"   3. 业务变更未及时冲红")
        print(f"   建议：人工核对业务真实性，不要盲目催款！")
        
        # 检查该客户的所有发票
        customer_invoices = df[df['buyer_name'] == customer['客户']]
        print(f"   发票明细：")
        for idx, inv in customer_invoices.iterrows():
            print(f"   - {inv['invoice_date']}: ¥{inv['amount']:,.2f} ({inv['issue_type']})")
```

### 必须在报告中包含

每个对账报告**必须**包含：

```markdown
## ⚠️ 异常回款率预警

以下客户回款率异常（30%-70%），可能多开发票，**禁止盲目催款**：

| 客户 | 净应收 | 实收 | 回款率 | 建议 |
|------|--------|------|--------|------|
| 苏州赛益 | ¥200,000 | ¥100,000 | 50.0% | 核对是否多开 |

**处理建议**：
1. 核对业务合同/订单
2. 确认实际应收金额
3. 如多开，立即冲红
4. 核对完成前，暂停催款
```

---

## 版本历史

- v1.5.0 (2026-06-03): 新增异常回款率预警（最关键！），总计49项强制检查
- v1.4.5 (2026-06-03): 扩展为43项完整强制检查清单
- v1.4.4 (2026-06-03): 添加3个强制检查

---

---

## 🎯 对账核心原则

### 原则1：按客户汇总，不按单张发票匹配（最重要！）

**错误做法** ❌：
```python
# 错误：尝试让每张发票匹配到具体的收款
for invoice in invoices:
    找到金额相等的收款记录
    if 找到:
        标记该发票为"已收款"
```

**问题**：
- 客户可能拆分支付（1张¥10万发票 → 2笔¥5万收款）
- 客户可能合并支付（3张¥3万发票 → 1笔¥9万收款）
- 无法匹配时会误判为"未收款"

---

**正确做法** ✅：
```python
# 正确：按客户汇总
for customer in customers:
    # 汇总该客户的所有发票（净额）
    总开票 = sum(蓝字发票) - sum(红字发票)
    
    # 汇总该客户的所有收款
    总收款 = sum(银行流水中该客户的所有收款)
    
    # 计算欠款
    欠款 = 总开票 - 总收款
    
    # 判断状态
    if 欠款 <= 0:
        状态 = "已收款"
    else:
        状态 = f"欠款¥{欠款}"
```

---

### 拆分支付案例

**案例1：杭州曼孚科技**
```
发票：1张 x ¥100,000

收款：
  2026-04-07: ¥50,000（招商银行）
  2026-04-10: ¥50,000（招商银行）

汇总：
  总开票：¥100,000
  总收款：¥50,000 + ¥50,000 = ¥100,000
  欠款：¥0

结果：✅ 已全额收款
```

**案例2：清华大学深圳国际研究生院**
```
发票：70张，净额 ¥96,797.76

收款：
  2024-09-15: ¥10,572.00
  2025-03-20: ¥3,839.40
  2025-06-10: ¥2,112.20

汇总：
  总开票：¥96,797.76
  总收款：¥16,523.60
  欠款：¥80,274.16

结果：⚠️ 部分收款，欠款¥80,274.16
```

---

### 为什么不能按单张发票匹配

**原因1：客户不知道发票号**
- 客户付款时通常只知道总金额
- 不会指定"这笔款对应发票123456"

**原因2：业务灵活性**
- 可能先付一部分（¥5万），后付剩余（¥5万）
- 可能一次性付多张发票的合计金额

**原因3：会计准则**
- 应收账款是按**客户**核算的
- 不是按单张发票核算的

---

### 强制原则（必须遵守）

- 🔴 **强制原则1**：永远按客户汇总，不按单张发票
- 🔴 **强制原则2**：汇总时包含该客户的所有发票（蓝字-红字）
- 🔴 **强制原则3**：汇总时包含该客户的所有收款（不限笔数）
- 🔴 **强制原则4**：只判断总额是否相等，不要求单笔对应

---

### 报告中的正确表述

**错误表述** ❌：
```
某公司：
- 发票123456: ¥100,000 ❌ 未收款
```

**正确表述** ✅：
```
某公司：
- 净开票总额：¥100,000
- 实收总额：¥100,000（2笔）
- 状态：✅ 已全额收款
- 收款明细：
  - 2026-04-07: ¥50,000
  - 2026-04-10: ¥50,000
```

---

## 版本历史

- v1.5.1 (2026-06-03): 明确对账核心原则：按客户汇总，支持拆分/合并支付
- v1.5.0 (2026-06-03): 新增异常回款率预警
- v1.4.5 (2026-06-03): 扩展为43项完整强制检查清单

---

---

## 🔧 处理发票ID重复的标准流程

### 重复类型判断

**类型1：文件重复下载**（最常见）✅
```
情况：同一发票ID，相同金额，相同类型（都是蓝字或都是红字）
原因：多次下载、文件复制
处理：保留最新的，删除旧的
```

**类型2：蓝字+红字配对**（正常）✅
```
情况：同一发票ID，一个蓝字，一个红字
原因：冲红操作
处理：两个都保留，计算净额
```

**类型3：真正的重复开票**（错误）❌
```
情况：不同的发票ID，相同客户，相同金额，相同日期
原因：操作失误
处理：人工核对，冲红多余的
```

---

### 自动去重规则

```python
def handle_duplicates(invoices):
    """
    处理重复发票ID
    返回：去重后的发票列表 + 重复报告
    """
    
    # 按ID分组
    grouped = {}
    for inv in invoices:
        id = inv['invoice_id']
        if id not in grouped:
            grouped[id] = []
        grouped[id].append(inv)
    
    # 处理重复
    deduplicated = []
    duplicate_report = []
    
    for invoice_id, files in grouped.items():
        if len(files) == 1:
            # 无重复
            deduplicated.append(files[0])
        
        elif len(files) == 2:
            # 检查是否为蓝字+红字配对
            types = [f['is_red'] for f in files]
            if True in types and False in types:
                # 蓝字+红字配对，正常
                deduplicated.extend(files)
                duplicate_report.append({
                    'id': invoice_id,
                    'type': '蓝字+红字配对',
                    'action': '保留两个'
                })
            else:
                # 文件重复下载
                deduplicated.append(files[0])  # 保留第一个
                duplicate_report.append({
                    'id': invoice_id,
                    'type': '文件重复',
                    'action': f'保留1个，删除{len(files)-1}个'
                })
        
        else:
            # 3个或更多重复
            # 检查是否都是同一类型
            types = set([f['is_red'] for f in files])
            if len(types) == 1:
                # 都是蓝字或都是红字 → 文件重复
                deduplicated.append(files[0])
                duplicate_report.append({
                    'id': invoice_id,
                    'type': '文件重复',
                    'action': f'保留1个，删除{len(files)-1}个'
                })
            else:
                # 混合类型，需要人工核对
                deduplicated.extend(files)
                duplicate_report.append({
                    'id': invoice_id,
                    'type': '异常重复',
                    'action': '需要人工核对'
                })
    
    return deduplicated, duplicate_report
```

---

### 文件清理建议

**推荐保留**：
- `完整下载_YYYYMMDD/` — 最新的完整下载

**建议删除**：
- `按月份/` — 旧的分月下载
- 任何带"副本"、"备份"的文件夹

**操作步骤**：
```bash
# 1. 备份整个文件夹
cp -r "📁_原始发票XML" "📁_原始发票XML_备份_20260603"

# 2. 删除旧文件夹
rm -rf "📁_原始发票XML/按月份"

# 3. 验证
python3 验证脚本.py

# 4. 确认无问题后，删除备份
rm -rf "📁_原始发票XML_备份_20260603"
```

---

### 强制检查更新

在**第2步 XML提取**中新增：

- [ ] 🔴 **强制2.9**：检测到重复ID时，必须判断重复类型
- [ ] 🔴 **强制2.10**：文件重复下载 → 自动去重
- [ ] 🔴 **强制2.11**：蓝字+红字配对 → 保留两个
- [ ] 🔴 **强制2.12**：异常重复 → 报告给用户
- [ ] 🔴 **强制2.13**：生成重复处理报告

---

## 版本历史

- v1.6.0 (2026-06-03): 新增自动去重规则和文件清理指导，总计54项强制检查
- v1.5.1 (2026-06-03): 明确按客户汇总原则
- v1.5.0 (2026-06-03): 新增异常回款率预警

---

---

## 📄 自动生成报告

### 报告模板

Skill执行完成后，**必须自动生成**以下报告：

#### 1. 对账总报告（必需）

```markdown
# 财务对账报告

**公司**: [公司名称]
**对账周期**: [开始日期] 至 [结束日期]
**报告日期**: [生成日期]
**Skill版本**: v1.6.0

---

## 执行摘要

| 项目 | 数值 |
|------|------|
| 原始XML文件 | XX个 |
| 去重后发票 | XX张 |
| 蓝字发票 | XX张 |
| 红字发票 | XX张 |
| 净应收金额 | ¥XX,XXX.XX |
| 实收金额 | ¥XX,XXX.XX |
| 未收金额 | ¥XX,XXX.XX |
| **回款率** | **XX.X%** |

---

## 🔴 完全冲红客户（不应催款）

| 客户 | 蓝字 | 红字 | 净额 |
|------|------|------|------|
| XXX | ¥XX | ¥XX | ¥0 |

---

## ⚠️ 异常回款率预警（30%-70%）

以下客户可能多开发票，**暂停催款**：

| 客户 | 净应收 | 实收 | 回款率 | 建议 |
|------|--------|------|--------|------|
| XXX | ¥XX | ¥XX | XX% | 核对业务 |

---

## 💰 Top 10 未收款客户

| 排名 | 客户 | 净应收 | 实收 | 未收 | 回款率 |
|------|------|--------|------|------|--------|
| 1 | XXX | ¥XX | ¥XX | ¥XX | XX% |

---

## ✅ 验证清单

- [x] 文件夹结构验证
- [x] XML提取并去重
- [x] 红字发票识别
- [x] 完全冲红排除
- [x] 公司名称规范化
- [x] 银行流水匹配
- [x] 异常回款率预警
- [x] 54项强制检查全部通过

---

## 📋 下一步行动

### 本周必做 🔴
1. 核对异常回款率客户（XX个）
2. 催款Top 3客户
3. 处理重复文件

### 本月完成 🟠
1. 催款Top 10客户
2. 清理旧文件夹

---

**报告生成时间**: [时间]
**生成工具**: organize-finances skill v1.6.0
```

---

#### 2. 重复文件报告（如有重复）

```markdown
# 重复文件处理报告

**检测时间**: [时间]

## 统计

- 总文件数: XX个
- 重复文件: XX个
- 去重后: XX张

## 重复详情

### 文件重复下载（可删除）

| 发票ID | 类型 | 金额 | 重复次数 | 文件路径 |
|--------|------|------|----------|----------|
| XXX | 蓝字 | ¥XX | 3 | 路径1, 路径2, 路径3 |

### 蓝字+红字配对（正常）

| 发票ID | 蓝字金额 | 红字金额 | 净额 |
|--------|----------|----------|------|
| XXX | ¥XX | ¥-XX | ¥0 |

## 清理建议

**保留**: `完整下载_20260603/`
**删除**: `按月份/`（旧下载）

**清理命令**:
\`\`\`bash
rm -rf "📁_原始发票XML/按月份"
\`\`\`
```

---

### Python自动生成报告函数

```python
def generate_report(df_results, df_abnormal, df_cancelled, total_files, unique_files):
    """
    自动生成Markdown格式的对账报告
    """
    
    report = f"""# 财务对账报告

**对账日期**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
**Skill版本**: v1.6.0

---

## 执行摘要

| 项目 | 数值 |
|------|------|
| 原始XML文件 | {total_files}个 |
| 去重后发票 | {unique_files}张 |
| 净应收金额 | ¥{df_results['净应收'].sum():,.2f} |
| 实收金额 | ¥{df_results['实收'].sum():,.2f} |
| 回款率 | {(df_results['实收'].sum()/df_results['净应收'].sum()*100):.1f}% |

"""
    
    # 完全冲红客户
    if len(df_cancelled) > 0:
        report += "\n## 🔴 完全冲红客户（不应催款）\n\n"
        report += df_cancelled.to_markdown(index=False)
    
    # 异常回款率
    if len(df_abnormal) > 0:
        report += "\n\n## ⚠️ 异常回款率预警\n\n"
        report += df_abnormal.to_markdown(index=False)
        report += "\n\n**建议**: 核对业务合同，确认是否多开发票\n"
    
    # Top 10
    report += "\n\n## 💰 Top 10 未收款\n\n"
    report += df_results.head(10).to_markdown(index=False)
    
    # 保存
    with open("对账报告.md", "w", encoding="utf-8") as f:
        f.write(report)
    
    print("✅ 报告已生成: 对账报告.md")
```

---

### 强制要求

- 🔴 **强制11.1**: 对账完成后，必须自动生成报告
- 🔴 **强制11.2**: 报告必须包含：摘要、冲红客户、异常预警、Top10
- 🔴 **强制11.3**: 报告必须保存为Markdown格式
- 🔴 **强制11.4**: 报告必须保存到 `04_核心报告/` 文件夹
- 🔴 **强制11.5**: 报告文件名必须包含日期：`对账报告_YYYYMMDD.md`

---

## 版本历史

- v1.6.1 (2026-06-03): 新增自动报告生成功能，总计59项强制检查
- v1.6.0 (2026-06-03): 新增自动去重规则
- v1.5.1 (2026-06-03): 明确按客户汇总原则

---

---

## 🔄 增量更新逻辑

### 场景识别

**全量对账**（初次运行）:
- 没有历史缓存
- 或用户明确要求全量

**增量更新**（后续运行）:
- 已有对账缓存
- 只处理新增/变更的文件

---

### 增量更新流程

#### 第1步：检测变更

```python
def detect_changes(cache_file="对账缓存.json"):
    """
    检测自上次对账以来的变更
    返回：新增/删除/修改的文件列表
    """
    
    # 读取上次对账的文件列表
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            cache = json.load(f)
        last_files = cache['files']  # {文件路径: 修改时间}
        last_date = cache['date']
    else:
        last_files = {}
        last_date = None
    
    # 扫描当前文件
    current_files = {}
    for xml_file in glob.glob("**/*.xml", recursive=True):
        mtime = os.path.getmtime(xml_file)
        current_files[xml_file] = mtime
    
    # 对比变更
    changes = {
        'new': [],      # 新增文件
        'modified': [], # 修改文件
        'deleted': [],  # 删除文件
    }
    
    for file, mtime in current_files.items():
        if file not in last_files:
            changes['new'].append(file)
        elif mtime > last_files[file]:
            changes['modified'].append(file)
    
    for file in last_files:
        if file not in current_files:
            changes['deleted'].append(file)
    
    return changes, last_date
```

---

#### 第2步：增量处理

```python
def incremental_update(changes, old_results):
    """
    增量更新对账结果
    只处理变更的发票
    """
    
    # 读取旧的对账结果
    df_old = pd.read_excel("✅_最终对账结果.xlsx")
    invoices_old = pd.read_excel("✅_完整发票数据.xlsx")
    
    # 提取变更文件中的发票
    new_invoices = []
    modified_invoices = []
    deleted_invoice_ids = []
    
    # 处理新增文件
    for file in changes['new']:
        invoice = parse_invoice_xml(file)
        if invoice:
            new_invoices.append(invoice)
    
    # 处理修改文件（重新解析）
    for file in changes['modified']:
        invoice = parse_invoice_xml(file)
        if invoice:
            modified_invoices.append(invoice)
    
    # 处理删除文件（从旧数据中找出对应的发票ID）
    for file in changes['deleted']:
        # 从文件名提取发票ID
        invoice_id = extract_id_from_filename(file)
        if invoice_id:
            deleted_invoice_ids.append(invoice_id)
    
    # 更新发票数据
    df_invoices = invoices_old.copy()
    
    # 删除已删除的发票
    df_invoices = df_invoices[~df_invoices['invoice_id'].isin(deleted_invoice_ids)]
    
    # 删除已修改的发票（准备重新插入）
    modified_ids = [inv['invoice_id'] for inv in modified_invoices]
    df_invoices = df_invoices[~df_invoices['invoice_id'].isin(modified_ids)]
    
    # 添加新增和修改的发票
    df_new = pd.DataFrame(new_invoices + modified_invoices)
    df_invoices = pd.concat([df_invoices, df_new], ignore_index=True)
    
    # 重新计算受影响客户的对账结果
    affected_customers = set()
    for inv in new_invoices + modified_invoices:
        affected_customers.add(inv['buyer_name'])
    
    # 只重新计算受影响的客户
    df_results = df_old.copy()
    for customer in affected_customers:
        # 重新计算该客户
        customer_result = recalculate_customer(customer, df_invoices, df_bank)
        # 更新结果
        df_results.loc[df_results['客户'] == customer] = customer_result
    
    return df_invoices, df_results
```

---

#### 第3步：更新报告

```python
def update_report(old_report_file, new_results):
    """
    更新已有报告，而不是完全重写
    """
    
    if os.path.exists(old_report_file):
        # 读取旧报告
        with open(old_report_file, 'r', encoding='utf-8') as f:
            old_report = f.read()
        
        # 提取版本号
        match = re.search(r'v(\d+)', old_report)
        if match:
            old_version = int(match.group(1))
            new_version = old_version + 1
        else:
            new_version = 2
        
        # 在报告开头添加更新记录
        update_note = f"""
---

## 📝 更新记录

**v{new_version}** ({datetime.now().strftime('%Y-%m-%d %H:%M')}):
- 新增发票: {len(changes['new'])}张
- 修改发票: {len(changes['modified'])}张
- 删除发票: {len(changes['deleted'])}张
- 增量更新，仅重新计算受影响的{len(affected_customers)}个客户

---
"""
        
        # 插入到报告开头
        new_report = old_report.replace('# 财务对账报告', 
                                        f'# 财务对账报告 v{new_version}' + update_note)
        
        # 更新数据部分
        new_report = update_report_data(new_report, new_results)
        
        # 保存
        with open(old_report_file, 'w', encoding='utf-8') as f:
            f.write(new_report)
    else:
        # 无旧报告，生成新报告
        generate_full_report(new_results)
```

---

### 缓存文件格式

```json
{
  "date": "2026-06-03 23:30:00",
  "version": "v1.6.1",
  "files": {
    "完整下载_20260603/发票1.xml": 1717431234.567,
    "完整下载_20260603/发票2.xml": 1717431235.678
  },
  "summary": {
    "total_invoices": 96,
    "total_net": 733868.84,
    "total_received": 682457.40,
    "last_check": "2026-06-03 23:30:00"
  }
}
```

---

### 使用方式

**自动判断**（推荐）:
```bash
python3 organize-finances-validator.py "发票处理" --mode auto
# 自动检测是全量还是增量
```

**强制全量**:
```bash
python3 organize-finances-validator.py "发票处理" --mode full
# 忽略缓存，完全重新对账
```

**强制增量**:
```bash
python3 organize-finances-validator.py "发票处理" --mode incremental
# 只处理变更，要求有缓存
```

---

### 增量更新触发条件

自动判断逻辑：

```python
if not os.exists("对账缓存.json"):
    mode = "full"  # 无缓存，必须全量
elif len(changes['new']) + len(changes['modified']) + len(changes['deleted']) == 0:
    print("✅ 无变更，跳过对账")
    mode = "skip"
elif len(changes['new']) + len(changes['modified']) > 50:
    # 变更太多，全量更快
    mode = "full"
else:
    # 少量变更，增量更新
    mode = "incremental"
```

---

### 性能对比

| 场景 | 全量 | 增量 | 提升 |
|------|------|------|------|
| 新增1张发票 | 96张全部重算 | 只重算1个客户 | **100倍** |
| 新增10张发票 | 96张全部重算 | 只重算10个客户 | **10倍** |
| 修改1张金额 | 96张全部重算 | 只重算1个客户 | **100倍** |
| 删除1张发票 | 96张全部重算 | 只重算1个客户 | **100倍** |

---

### 强制检查更新

- [ ] 🔴 **强制12.1**: 检测文件变更（新增/修改/删除）
- [ ] 🔴 **强制12.2**: 变更<50张 → 增量更新
- [ ] 🔴 **强制12.3**: 变更≥50张 → 全量更新
- [ ] 🔴 **强制12.4**: 保存对账缓存
- [ ] 🔴 **强制12.5**: 更新报告版本号和更新记录

---

## 版本历史

- v1.7.0 (2026-06-03): 新增增量更新逻辑，总计64项强制检查
- v1.6.1 (2026-06-03): 新增自动报告生成
- v1.6.0 (2026-06-03): 新增自动去重规则

---

---

## 🔒 Git版本控制（强制要求）

### 为什么必须使用Git

**数据安全**:
- ✅ 防止误删、误改
- ✅ 可以回滚到任何历史版本

**审计追溯**:
- ✅ 谁在什么时候改了什么
- ✅ 完整的变更记录
- ✅ 满足财务审计要求

**团队协作**:
- ✅ 多人同时工作
- ✅ 避免数据冲突和覆盖

---

### 强制要求

- 🔴 **强制13.1**: 发票处理目录必须在Git仓库中
- 🔴 **强制13.2**: 每次对账后必须提交Git commit
- 🔴 **强制13.3**: Commit message必须包含：日期、变更类型、影响范围
- 🔴 **强制13.4**: 敏感文件（XML）不得提交到Git（.gitignore）
- 🔴 **强制13.5**: 对账结果（Excel、报告）必须提交到Git

---

### .gitignore 配置

```gitignore
# 发票处理 - 排除敏感和临时文件
发票处理/01_开具发票（销项）/📁_原始发票XML/**/*.xml
发票处理/02_取得发票（进项）/📁_原始发票XML/**/*.xml
发票处理/03_银行流水/📁_原始银行流水/**/*.xlsx
发票处理/**/*备份*
发票处理/**/*缓存*
发票处理/**/.DS_Store

# 但保留对账结果和报告
!发票处理/**/📊_对账报表/*.xlsx
!发票处理/**/📋_说明文档/*.md
!发票处理/04_核心报告/*.md
```

---

### Commit规范

**命名格式**:
```
chore(发票): [操作类型] [影响范围] - [日期]

[详细说明]
- 变更1
- 变更2
- 变更3
```

**示例**:

```bash
# 初次对账
git commit -m "chore(发票): 初次对账完成 - 2026-06-03

- 提取96张发票（去重后）
- 净应收: ¥733,868.84
- 回款率: 93.0%
- 发现3个异常回款率客户"

# 增量更新
git commit -m "chore(发票): 增量更新 - 2026-06-04

- 新增2张发票
- 冲红1张发票（苏州赛益）
- 更新对账报告v2
- 净应收变更: ¥733,868 → ¥631,868"

# 催款记录
git commit -m "chore(发票): 更新催款状态 - 2026-06-05

- 北京云数安已收款¥20,000
- 更新回款率: 93.0% → 95.7%"
```

---

### 自动提交逻辑

```python
def auto_commit_after_reconciliation(changes, results):
    """
    对账完成后自动提交Git
    """
    
    # 检查是否在Git仓库中
    if not os.path.exists(".git"):
        raise Exception("❌ 错误：发票处理目录必须在Git仓库中")
    
    # 检查是否有变更
    status = subprocess.run(["git", "status", "--porcelain"], 
                           capture_output=True, text=True)
    
    if not status.stdout.strip():
        print("✅ 无变更，跳过提交")
        return
    
    # 添加文件
    files_to_add = [
        "03_银行流水/*.xlsx",
        "04_核心报告/*.md",
        "01_开具发票（销项）/📊_对账报表/*.xlsx",
        "02_取得发票（进项）/📊_对账报表/*.xlsx",
    ]
    
    for pattern in files_to_add:
        subprocess.run(["git", "add", pattern])
    
    # 生成commit message
    date = datetime.now().strftime("%Y-%m-%d")
    
    if changes['type'] == 'full':
        msg_type = "初次对账" if changes['is_first'] else "全量对账"
    else:
        msg_type = "增量更新"
    
    message = f"""chore(发票): {msg_type} - {date}

- 新增发票: {len(changes['new'])}张
- 修改发票: {len(changes['modified'])}张
- 删除发票: {len(changes['deleted'])}张
- 净应收: ¥{results['total_net']:,.2f}
- 回款率: {results['rate']:.1f}%
- 异常客户: {len(results['abnormal'])}个
"""
    
    # 提交
    subprocess.run(["git", "commit", "-m", message])
    print("✅ 已自动提交到Git")
    
    # 提示推送
    print("⚠️ 建议运行 'git push' 推送到远程仓库")
```

---

### 查看历史

**查看对账历史**:
```bash
# 查看所有对账记录
git log --grep="chore(发票)" --oneline

# 查看详细变更
git log --grep="chore(发票)" -p

# 查看特定文件的历史
git log --follow -- "04_核心报告/对账报告_20260603.md"
```

**回滚到历史版本**:
```bash
# 查看历史版本
git log --oneline | grep "发票"

# 回滚到指定版本
git checkout <commit-hash> -- "04_核心报告/对账报告_20260603.md"
```

**对比两次对账**:
```bash
# 对比两个版本的差异
git diff <commit1> <commit2> -- "01_开具发票（销项）/📊_对账报表/"
```

---

### 强制检查

在**第0步**（对账前检查）新增：

- [ ] 🔴 **强制0.1**: 检查当前目录是否在Git仓库中
- [ ] 🔴 **强制0.2**: 检查.gitignore是否正确配置
- [ ] 🔴 **强制0.3**: 检查是否有未提交的重要变更

在**最后一步**（对账后）新增：

- [ ] 🔴 **强制13.6**: 自动添加对账结果到Git
- [ ] 🔴 **强制13.7**: 自动生成规范的commit message
- [ ] 🔴 **强制13.8**: 自动提交（或提示用户提交）
- [ ] 🔴 **强制13.9**: 提示用户推送到远程仓库

---

## 版本历史

- v1.8.0 (2026-06-03): 新增Git版本控制强制要求，总计73项强制检查
- v1.7.0 (2026-06-03): 新增增量更新逻辑
- v1.6.1 (2026-06-03): 新增自动报告生成

---
