export interface SSOSConfig {
    apiBaseUrl: string;
    email?: string;
    password?: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}
export interface APIResponse<T = any> {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface Workspace {
    id: string;
    name: string;
    taxpayer_type: string;
    company_type: string;
    accounting_standard: string;
}
export interface JournalEntry {
    id: string;
    entry_date: string;
    entry_number: string;
    description: string;
    total_debit: string;
    total_credit: string;
    status: string;
    line_items: JournalLineItem[];
}
export interface JournalLineItem {
    account_code: string;
    account_name: string;
    debit_amount: string;
    credit_amount: string;
    description: string;
}
export interface Account {
    id: string;
    code: string;
    name: string;
    category: string;
    balance: string;
}
export interface ListJournalEntriesInput {
    start_date?: string;
    end_date?: string;
    status?: 'draft' | 'posted' | 'voided';
    limit?: number;
}
export interface GetJournalEntryInput {
    id: string;
}
export interface CreateJournalEntryInput {
    entry_date: string;
    description: string;
    line_items: CreateJournalLineItemInput[];
}
export interface CreateJournalLineItemInput {
    account_code: string;
    debit_amount?: number;
    credit_amount?: number;
    description?: string;
}
export interface ListAccountsInput {
    category?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    search?: string;
}
export interface GetAccountBalanceInput {
    account_code: string;
    start_date?: string;
    end_date?: string;
}
export interface AIBookkeepingInput {
    text?: string;
    ocr_data?: Record<string, unknown>;
    input_mode?: 'text' | 'document' | 'text_with_document';
    conversation_id?: string;
}
export interface ListAIConversationsInput {
    type?: 'bookkeeping' | 'invoice_detection';
    limit?: number;
}
export interface OCRInvoiceInput {
    file_url?: string;
    image_url?: string;
    document_type: 'invoice' | 'bank_statement';
}
export interface AskComplianceQuestionInput {
    question: string;
}
export interface ListPartnersInput {
    partner_type?: string;
    search?: string;
}
export interface CreatePartnerInput {
    name: string;
    partner_type: 'customer' | 'supplier' | 'both';
    tax_number?: string;
    contact_person?: string;
    phone?: string;
    address?: string;
    bank_name?: string;
    bank_account?: string;
}
export interface UpdatePartnerInput {
    partner_id: string;
    name?: string;
    contact_person?: string;
    phone?: string;
    address?: string;
}
export interface ListVatInvoicesInput {
    invoice_type?: 'input' | 'output';
    start_date?: string;
    end_date?: string;
    limit?: number;
}
export interface CreateVatInvoiceInput {
    invoice_type: 'input' | 'output';
    invoice_number: string;
    invoice_date: string;
    total_amount: string;
    seller_name?: string;
    buyer_name?: string;
    amount?: string;
    tax_amount?: string;
    tax_rate?: number;
}
export interface ListAccountingPeriodsInput {
    status?: 'open' | 'closed';
}
export interface CreateAccountingPeriodInput {
    start_date: string;
    end_date: string;
    period_name: string;
}
export interface CloseAccountingPeriodInput {
    period_id: string;
}
export interface SetOpeningBalanceInput {
    account_id: string;
    debit_balance?: string;
    credit_balance?: string;
    period_start_date: string;
}
export interface ListExpenseClaimsInput {
    status?: 'pending' | 'approved' | 'rejected';
    employee_id?: string;
    limit?: number;
}
export interface CreateExpenseClaimInput {
    employee_id: string;
    claim_date: string;
    amount: string;
    description?: string;
    category?: string;
}
export interface ApproveExpenseClaimInput {
    claim_id: string;
}
export interface RejectExpenseClaimInput {
    claim_id: string;
    reason?: string;
}
export interface CreateExpenseItemInput {
    claim_id: string;
    expense_date: string;
    category: string;
    amount: number;
    description: string;
}
export interface ListDepartmentsInput {
    name?: string;
    parent_id?: string;
    manager_id?: string;
}
export interface CreateDepartmentInput {
    name: string;
    parent_id?: string;
    manager_id?: string;
    status?: string;
}
export interface UpdateDepartmentInput {
    id: string;
    name?: string;
    parent_id?: string;
}
export interface ListProjectsInput {
    status?: 'active' | 'completed' | 'cancelled';
}
export interface CreateProjectInput {
    name: string;
    code?: string;
    start_date?: string;
    end_date?: string;
    budget?: number;
    description?: string;
}
export interface SwitchAccountInput {
    account_id: string;
}
export interface RemoveAccountInput {
    account_id: string;
}
export interface ListEmployeesInput {
    status?: string;
    department_id?: string;
    limit?: number;
}
export interface GetEmployeeInput {
    employee_id: string;
}
export interface CreateEmployeeInput {
    name: string;
    employee_id?: string;
    id_card_no?: string;
    department_id?: string;
    department?: string;
    position?: string;
    hire_date?: string;
    salary?: number;
    phone?: string;
    email?: string;
    monthly_special_deduction?: number;
    status?: string;
    remark?: string;
}
export interface UpdateEmployeeInput {
    employee_id: string;
    name?: string;
    department_id?: string;
    position?: string;
    salary?: number;
    phone?: string;
    email?: string;
    status?: string;
}
export interface DeleteEmployeeInput {
    employee_id: string;
}
export interface ListPayrollRecordsInput {
    period?: string;
    employee_id?: string;
    status?: string;
    limit?: number;
}
export interface CreatePayrollRecordInput {
    employee_id: string;
    period: string;
    basic_salary: number;
    gross_salary?: number;
    allowances?: number;
    deductions?: number;
    social_insurance?: number;
    housing_fund?: number;
    special_deduction?: number;
    other_deduction?: number;
    remark?: string;
}
export interface PostPayrollInput {
    period: string;
    entry_date?: string;
}
export interface ListLaborContractsInput {
    employee_id?: string;
    status?: string;
}
export interface CreateLaborContractInput {
    employee_id: string;
    contract_type: string;
    start_date: string;
    end_date?: string;
    position: string;
    salary: number;
    probation_months?: number;
    base_salary?: number;
    remark?: string;
}
export interface ListContractsInput {
    contract_type?: string;
    status?: string;
    partner_id?: string;
    limit?: number;
}
export interface GetContractInput {
    contract_id: string;
}
export interface CreateContractInput {
    contract_name: string;
    contract_type: string;
    partner_id?: string;
    amount?: number;
    start_date?: string;
    end_date?: string;
    content?: string;
}
export interface GenerateContractInput {
    contract_type: string;
    template_id?: string;
    variables?: Record<string, string>;
}
export interface UpdateContractInput {
    contract_id: string;
    contract_name?: string;
    status?: string;
    amount?: number;
    start_date?: string;
    end_date?: string;
    content?: string;
}
export interface ReviewContractTextInput {
    contract_text: string;
    contract_type?: string;
}
export interface GetContractReviewInput {
    review_id: string;
}
export interface ListContractReviewsInput {
    contract_id?: string;
    status?: string;
    limit?: number;
}
export interface AskContractQuestionInput {
    review_id?: string;
    contract_id?: string;
    contract_text?: string;
    question: string;
}
export interface ListDemandLettersInput {
    status?: string;
    limit?: number;
}
export interface GenerateDemandLetterInput {
    debtor_name: string;
    creditor_name: string;
    amount: number;
    due_date: string;
    contract_number?: string;
    additional_info?: string;
}
export interface SaveDemandLetterInput {
    letter_id: string;
    status?: string;
}
export interface GetLegalPathRecommendationInput {
    amount: number;
    case_type?: string;
}
export interface ListWorkspacesInput {
    workspace_id?: string;
}
export interface GetCurrentWorkspaceInput {
}
export interface SwitchWorkspaceInput {
    workspace_id: string;
}
export interface GetWorkspaceSettingsInput {
}
export interface CreateApiKeyInput {
    name: string;
    workspace_id?: string;
    scopes?: string[];
    expires_at?: string;
    expires_in_days?: number;
}
export interface ListApiKeysInput {
    key_id?: string;
}
export interface RevokeApiKeyInput {
    key_id: string;
    is_active?: boolean;
}
export interface ToggleApiKeyInput {
    key_id: string;
    enabled: boolean;
}
export interface ListBankAccountsInput {
}
export interface CreateBankAccountInput {
    account_name: string;
    bank_name: string;
    account_number: string;
    currency?: string;
    opening_balance?: string;
}
export interface ListBankTransactionsInput {
    bank_account_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
}
export interface BankTransactionRecord {
    transaction_date: string;
    description: string;
    amount: string;
    balance: string;
    counterparty: string;
}
export interface ImportBankTransactionsInput {
    bank_account_id: string;
    transactions: BankTransactionRecord[];
}
export interface ListReconciliationRecordsInput {
    bank_account_id?: string;
    status?: 'pending' | 'reconciled';
}
export interface GetBalanceSheetInput {
    as_of_date: string;
}
export interface GetIncomeStatementInput {
    start_date: string;
    end_date: string;
}
export interface GetCashFlowStatementInput {
    start_date: string;
    end_date: string;
}
export interface GenerateTrialBalanceInput {
    period_id?: string;
}
export interface GenerateCashJournalInput {
    start_date?: string;
    end_date?: string;
}
export interface GenerateBankJournalInput {
    start_date?: string;
    end_date?: string;
    account_code?: string;
}
export interface GetGeneralLedgerInput {
    account_id?: string;
    start_date?: string;
    end_date?: string;
}
export interface GetAccountBalancesInput {
    period_id?: string;
}
export interface CalculateVATInput {
    start_date: string;
    end_date: string;
}
export interface CalculateIncomeTaxInput {
    year: number;
}
export interface GetTaxCalendarInput {
    year: number;
    month?: number;
}
export interface GetTaxCalendarTasksInput {
    from?: string;
    to?: string;
    status?: 'pending' | 'done' | 'skipped';
}
export interface GetTaxCalculationsInput {
    tax_type?: string;
    limit?: number;
}
export interface GetTaxFilingFormsInput {
    form_type?: string;
    status?: 'draft' | 'submitted' | 'approved';
}
