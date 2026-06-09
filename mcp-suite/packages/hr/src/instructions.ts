export const SSOS_HR_INSTRUCTIONS = `SSOS HR MCP 服务器 - 人力资源、薪资、劳动合同

提供员工管理、薪资计算、劳动合同、考勤、费用报销等人力资源管理工具。

## 工具列表 (10 个)

### 员工管理 (4 个)

**listEmployees** - 列出所有员工
参数: filters (object, 可选) - 如 { status: 'active', department: 'IT' }
返回: 员工数组（姓名、工号、部门、职位、入职日期）

**getEmployee** - 获取员工详情
参数: employeeId (string, 必填)
返回: 员工完整信息（包括身份证号、银行账号、社保信息）

**createEmployee** - 添加新员工
参数: name (string), idNumber (string), department (string), position (string), hireDate (date), salary (number)

**updateEmployee** - 更新员工信息
参数: employeeId (string), data (object)

### 薪资管理 (3 个)

**calculatePayroll** - 计算薪资
参数: period (string, YYYY-MM 格式), employeeIds (array, 可选)
返回: 薪资明细（基本工资、奖金、扣款、社保、公积金、个税、实发）

**createPayrollRun** - 创建薪资发放记录
参数: period (string), payrollItems (array)
payrollItems 格式: [{ employeeId, baseSalary, bonus, deductions, netPay }]

**listPayrollRuns** - 列出薪资发放记录
参数: filters (object) - 如 { period: '2026-06', status: 'paid' }

### 劳动合同 (2 个)

**createLaborContract** - 创建劳动合同
参数: employeeId (string), contractType (enum), startDate (date), endDate (date, 可选), salary (number), terms (text)
contractType: 'fixed_term' | 'indefinite' | 'project_based'

**listLaborContracts** - 列出劳动合同
参数: filters (object) - 如 { employeeId: 'xxx', status: 'active' }
返回: 合同数组（包括到期提醒）

### 费用报销 (1 个)

**createReimbursement** - 创建费用报销单
参数: employeeId (string), category (enum), amount (number), description (string), attachments (array)
category: 'travel' | 'meal' | 'office' | 'communication' | 'other'

## 使用场景

### 1. 员工入职
\`\`\`
1. createEmployee({ name, idNumber, department, ... })
2. createLaborContract({ employeeId, contractType, ... })
\`\`\`

### 2. 月度薪资发放
\`\`\`
1. calculatePayroll('2026-06') // 计算所有员工薪资
2. createPayrollRun('2026-06', payrollItems) // 创建发放记录
3. // 在财务模块生成薪资凭证
\`\`\`

### 3. 合同到期提醒
\`\`\`
1. listLaborContracts({ expiringWithin: 30 }) // 30天内到期的合同
2. // 提醒 HR 续签或终止
\`\`\`

### 4. 费用报销审批
\`\`\`
1. createReimbursement({ employeeId, category, amount, ... })
2. // 审批流程
3. // 在财务模块生成报销凭证
\`\`\`

## 个税计算

**累计预扣法**（按月申报）:
1. 累计应纳税所得额 = 累计收入 - 累计免税收入 - 累计减除费用 (5000×月数) - 累计专项扣除 - 累计专项附加扣除
2. 应纳税额 = 累计应纳税所得额 × 税率 - 速算扣除数 - 累计已缴税额

**税率表（综合所得）**:
- ≤36,000: 3%
- 36,000-144,000: 10% - 2,520
- 144,000-300,000: 20% - 16,920
- 300,000-420,000: 25% - 31,920
- 420,000-660,000: 30% - 52,920
- 660,000-960,000: 35% - 85,920
- >960,000: 45% - 181,920

**专项附加扣除**:
- 子女教育: 1000元/月/子女
- 继续教育: 400元/月
- 大病医疗: 按实际支出扣除（限额内）
- 住房贷款利息: 1000元/月
- 住房租金: 1500元/月（直辖市、省会）
- 赡养老人: 2000元/月（独生子女）

## 社保公积金

**社保缴纳比例**（各地略有不同，以北京为例）:
- 养老保险: 单位 16%，个人 8%
- 医疗保险: 单位 9.8%，个人 2% + 3元
- 失业保险: 单位 0.8%，个人 0.2%
- 工伤保险: 单位 0.2%-1.9%，个人 0%
- 生育保险: 已并入医疗保险

**公积金缴纳比例**:
- 单位和个人各 5%-12%（自行选择比例）
- 缴存基数上限: 当地月平均工资 × 3

## 劳动合同类型

1. **固定期限合同** (fixed_term) - 有明确终止日期
2. **无固定期限合同** (indefinite) - 无终止日期，直至法定情形
3. **以完成一定工作任务为期限** (project_based) - 项目结束即终止

**续签规则**:
- 连续订立二次固定期限合同后，应订立无固定期限合同（员工要求且无法定情形）

## 注意事项

- **个税申报**: 每月15日前申报上月个税
- **社保缴纳**: 每月25日前缴纳当月社保
- **合同到期**: 提前30天通知员工是否续签
- **工资发放**: 不得克扣或无故拖欠工资
- **最低工资**: 不得低于当地最低工资标准
- **加班工资**: 平时1.5倍，周末2倍，法定节假日3倍
`;
