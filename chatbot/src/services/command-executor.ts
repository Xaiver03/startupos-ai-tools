/**
 * Execute parsed CLI commands by calling the Startup OS API directly.
 * Avoids spawning child processes — uses the same apiFetch pattern as the CLI.
 */

const API_URL = process.env.API_URL || 'https://api.finlaw.cloud';

interface ApiFetchOptions {
  method?: string;
  body?: string;
}

async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<any> {
  const token = process.env.STARTUPOS_API_KEY;
  if (!token) throw new Error('STARTUPOS_API_KEY environment variable required');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

const ROUTE_MAP: Record<string, (args: string, workspaceId?: string) => Promise<any>> = {
  'accounting journal-list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/journal-entries?${params.toString()}`);
  },
  'accounting journal-get': async (args) => {
    const id = args.match(/(\w+-\w+-\w+-\w+)/)?.[1] || args.trim();
    return apiFetch(`/api/journal-entries/${id}`);
  },
  'accounting income-statement': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/reports/income-statement?${params.toString()}`);
  },
  'accounting trial-balance': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/reports/trial-balance?${params.toString()}`);
  },
  'accounting general-ledger': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/reports/general-ledger?${params.toString()}`);
  },
  'accounting account-list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/accounts?${params.toString()}`);
  },
  'accounting account-balances': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/reports/account-balances?${params.toString()}`);
  },
  'tax calendar': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/tax-calendar/tasks?${params.toString()}`);
  },
  'tax calculations': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/tax-calculations?${params.toString()}`);
  },
  'tax filings': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/tax-filing-forms?${params.toString()}`);
  },
  'tax compliance': async (_args, ws) => {
    const params = new URLSearchParams();
    if (ws) params.append('workspace_id', ws);
    return apiFetch(`/api/tax-compliance?${params.toString()}`);
  },
  'banking account-list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/bank-accounts?${params.toString()}`);
  },
  'banking transaction-list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/bank-transactions?${params.toString()}`);
  },
  'banking reconciliation-list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/reconciliation-records?${params.toString()}`);
  },
  'invoice list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/business-vat-invoices?${params.toString()}`);
  },
  'invoice partner-list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/partners?${params.toString()}`);
  },
  'hr employee-list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/employees?${params.toString()}`);
  },
  'hr payroll-list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/payroll-records?${params.toString()}`);
  },
  'hr contract-list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/labor-contracts?${params.toString()}`);
  },
  'expense list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/expense-claims?${params.toString()}`);
  },
  'legal contract-list': async (_args, _ws) => {
    return apiFetch('/api/contracts');
  },
  'legal demand-list': async (_args, _ws) => {
    return apiFetch('/api/demand-letters');
  },
  'period list': async (args, ws) => {
    const params = buildParams(args, ws);
    return apiFetch(`/api/accounting-periods?${params.toString()}`);
  },
  'workspace-api list': async () => {
    return apiFetch('/api/workspaces');
  },
  'workspace-api current': async () => {
    return apiFetch('/api/workspaces');
  },
};

function buildParams(args: string, workspaceId?: string): URLSearchParams {
  const params = new URLSearchParams();
  if (workspaceId) params.append('workspace_id', workspaceId);
  params.append('limit', '20');

  // Parse from args string
  if (args.includes('-s')) {
    const startMatch = args.match(/-s\s+(\d{4}-\d{2}-\d{2})/);
    if (startMatch) params.append('start_date', startMatch[1]);
  }
  if (args.includes('-e')) {
    const endMatch = args.match(/-e\s+(\d{4}-\d{2}-\d{2})/);
    if (endMatch) params.append('end_date', endMatch[1]);
  }
  if (args.includes('-l')) {
    const limitMatch = args.match(/-l\s+(\d+)/);
    if (limitMatch) params.set('limit', limitMatch[1]);
  }

  return params;
}

export async function executeCommand(
  command: { name: string; args: string },
  workspaceId?: string,
): Promise<any> {
  const executor = ROUTE_MAP[command.name];
  if (!executor) {
    throw new Error(`Unknown command: ${command.name}`);
  }

  const result = await executor(command.args, workspaceId);
  return result.data || result;
}
