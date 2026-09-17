const configuredApiUrl = import.meta.env.VITE_API_URL
const apiUrl = configuredApiUrl
  ? configuredApiUrl.startsWith('http')
    ? configuredApiUrl
    : `https://${configuredApiUrl}`
  : 'http://localhost:3000'

export const API_BASE_URL = apiUrl.replace(/\/+$/, '')

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}

export type SessionState = {
  accessToken: string
  user: SessionUser
}

export type DashboardSummary = {
  period: string
  summary: {
    salesToday: number
    salesMonth: number
    salesYear: number
    totalExpenses: number
    estimatedProfit: number
    clients: number
    employees: number
    products: number
    lowStock: number
    salesCount: number
    payrollGross: number
    payrollDiscounts: number
    payrollNet: number
    payrollAbsences: number
  }
  recent: {
    sales: Array<{
      id: string
      total: number
      date: string
      client?: { name?: string }
    }>
    expenses: Array<{
      id: string
      value: number
      description?: string
      createdAt?: string
    }>
  }
}

export type PayrollSummary = {
  month: string
  rows: Array<{
    employeeId: string
    employeeCode: string
    fullName: string
    department?: string | null
    position?: string | null
    salary: number
    bonus: number
    absences: number
    discount: number
    netSalary: number
    paidAmount: number
    isPaid: boolean
  }>
  totalGross: number
  totalDiscounts: number
  totalNet: number
  totalAbsences: number
}

export type EmployeeRecord = {
  id: string
  employeeCode: string
  fullName: string
  email?: string | null
  phone?: string | null
  status?: string
  salary?: number | string | null
  salaryBonus?: number | string | null
  departmentId?: string | null
  positionId?: string | null
  department?: { name?: string } | null
  position?: { name?: string } | null
}

export type DepartmentRecord = {
  id: string
  name: string
  description?: string | null
}

export type PositionRecord = {
  id: string
  name: string
}

export type CategoryRecord = {
  id: string
  name: string
}

export type SupplierRecord = {
  id: string
  name: string
  company?: string | null
  phone?: string | null
  email?: string | null
  nif?: string | null
  products?: string | null
  pendingAmount?: number | string | null
}

export type CashSummary = {
  totalSales: number
  totalExpenses: number
  totalMovements: number
  cashAvailable: number
}

export type SaleRecord = {
  id: string
  saleNumber: string
  date: string
  total: number | string
  paymentMethod?: string
  status?: string
  client?: { name?: string } | null
  items?: Array<{ productId: string; quantity: number; price: number | string; product?: { name?: string } }>
}

export type CompanySettings = {
  id?: string
  companyName: string
  nif?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  website?: string | null
  currency?: string | null
}

export type ClientRecord = {
  id: string
  code: string
  name: string
  email?: string | null
  phone?: string | null
  status?: string
}

export type ProductRecord = {
  id: string
  name: string
  sku: string
  stockCurrent: number
  stockMin: number
  stockMax: number
  salePrice: number
  categoryId?: string | null
  category?: { name?: string } | null
}

export type StockSummary = {
  totalProducts: number
  lowStock: number
  outOfStock: number
  totalUnits: number
}

export type StockAlert = {
  id: string
  name: string
  sku: string
  stockCurrent: number
  stockMin: number
  category?: { name?: string } | null
}

export type StockMovement = {
  id: string
  productId: string
  quantity: number
  movementType: string
  reason?: string | null
  userName?: string | null
  createdAt: string
  product?: { name?: string }
}

export type FinanceSummary = {
  expenses: number
  revenues: number
  sales: number
  profit: number
}

export type FinanceEntry = {
  id: string
  category?: string
  description?: string
  source?: string
  value: number
  date?: string
}

export type ReportSummary = {
  period: string
  total: number
  data?: Array<{ id: string; total: number; date?: string; client?: { name?: string } }>
  totalExpenses?: number
  totalRevenues?: number
  totalSales?: number
  profit?: number
  expenses?: FinanceEntry[]
  revenues?: FinanceEntry[]
  sales?: Array<{ id: string; total: number; date?: string; client?: { name?: string } }>
}

export const SESSION_STORAGE_KEY = 'erp-session'

export function getStoredSession(): SessionState | null {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionState
  } catch {
    return null
  }
}

export function saveSession(session: SessionState) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}

export async function loginRequest(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao iniciar sessão.')
  }

  return payload as SessionState
}

export async function getDashboardSummary(token: string, period = 'month'): Promise<DashboardSummary> {
  const response = await fetch(`${API_BASE_URL}/dashboard/summary?period=${encodeURIComponent(period)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao carregar o dashboard.')
  }

  return payload as DashboardSummary
}

export async function getEmployees(token: string): Promise<EmployeeRecord[]> {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => [])

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao carregar funcionários.')
  }

  return Array.isArray(payload) ? payload : []
}

export async function getPayrollSummary(token: string, month: string): Promise<PayrollSummary> {
  const response = await fetch(`${API_BASE_URL}/employees/payroll/summary?month=${encodeURIComponent(month)}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Erro ao carregar pagamentos.')
  return payload as PayrollSummary
}

export async function createEmployeeAttendance(token: string, data: Record<string, string>) {
  return createResource(token, 'employees/attendance', data)
}

export async function createPayrollPayment(token: string, data: Record<string, string>) {
  return createResource(token, 'employees/payroll/payment', data)
}

async function createResource<T>(token: string, path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || 'Não foi possível guardar o registo.')
  }

  return payload as T
}

export function createEmployee(token: string, data: unknown) {
  return createResource<EmployeeRecord>(token, 'employees', data)
}

export function createClient(token: string, data: unknown) {
  return createResource<unknown>(token, 'clients', data)
}

export function createProduct(token: string, data: unknown) {
  return createResource<ProductRecord>(token, 'products', data)
}

export function createSale(token: string, data: unknown) {
  return createResource<SaleRecord>(token, 'sales', data)
}

export function getSales(token: string) {
  return getCollection<SaleRecord>(token, 'sales', 'Erro ao carregar vendas.')
}

export function createStockMovement(token: string, data: unknown) {
  return createResource<StockMovement>(token, 'stock/movement', data)
}

export function createDepartment(token: string, data: unknown) {
  return createResource<DepartmentRecord>(token, 'departments', data)
}

export function createPosition(token: string, data: unknown) {
  return createResource<PositionRecord>(token, 'positions', data)
}

export function createCategory(token: string, data: unknown) {
  return createResource<CategoryRecord>(token, 'categories', data)
}

export function createSupplier(token: string, data: unknown) {
  return createResource<SupplierRecord>(token, 'suppliers', data)
}

export function createCashMovement(token: string, data: unknown) {
  return createResource<unknown>(token, 'cash/movement', data)
}

export function createCashRegister(token: string, data: unknown) {
  return createResource<unknown>(token, 'cash/register', data)
}

export function createExpense(token: string, data: unknown) {
  return createResource<FinanceEntry>(token, 'finance/expenses', data)
}

export function updateResource<T>(token: string, path: string, data: unknown) {
  return requestResource<T>(token, path, 'PUT', data)
}

export function deleteResource(token: string, path: string) {
  return requestResource<unknown>(token, path, 'DELETE')
}

async function requestResource<T>(token: string, path: string, method: 'PUT' | 'DELETE', data?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Não foi possível concluir a operação.')
  return payload as T
}

export async function getProducts(token: string): Promise<ProductRecord[]> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => [])

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao carregar produtos.')
  }

  return Array.isArray(payload) ? payload : []
}

export async function getClients(token: string): Promise<ClientRecord[]> {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const payload = await response.json().catch(() => [])
  if (!response.ok) throw new Error(payload.message || 'Erro ao carregar clientes.')
  return Array.isArray(payload) ? payload : []
}

async function getCollection<T>(token: string, path: string, message: string): Promise<T[]> {
  const response = await fetch(`${API_BASE_URL}/${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const payload = await response.json().catch(() => [])
  if (!response.ok) throw new Error(payload.message || message)
  return Array.isArray(payload) ? payload as T[] : []
}

export function getDepartments(token: string) {
  return getCollection<DepartmentRecord>(token, 'departments', 'Erro ao carregar departamentos.')
}

export function getPositions(token: string) {
  return getCollection<PositionRecord>(token, 'positions', 'Erro ao carregar posições.')
}

export function getCategories(token: string) {
  return getCollection<CategoryRecord>(token, 'categories', 'Erro ao carregar categorias.')
}

export function getSuppliers(token: string) {
  return getCollection<SupplierRecord>(token, 'suppliers', 'Erro ao carregar fornecedores.')
}

export async function getCashSummary(token: string): Promise<CashSummary> {
  const response = await fetch(`${API_BASE_URL}/cash/summary`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Erro ao carregar o caixa.')
  return payload as CashSummary
}

export async function getCompanySettings(token: string): Promise<CompanySettings> {
  const response = await fetch(`${API_BASE_URL}/company-settings`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Erro ao carregar configurações.')
  return payload as CompanySettings
}

export async function getStockSummary(token: string): Promise<StockSummary> {
  const response = await fetch(`${API_BASE_URL}/stock/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao carregar o resumo de stock.')
  }

  return payload as StockSummary
}

export async function getLowStock(token: string): Promise<StockAlert[]> {
  const response = await fetch(`${API_BASE_URL}/stock/low`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => [])

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao carregar alertas de stock.')
  }

  return Array.isArray(payload) ? payload : []
}

export async function getStockHistory(token: string, productId?: string): Promise<StockMovement[]> {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : ''
  const response = await fetch(`${API_BASE_URL}/stock/history${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => [])

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao carregar o histórico de stock.')
  }

  return Array.isArray(payload) ? payload : []
}

export async function getFinanceSummary(token: string): Promise<FinanceSummary> {
  const response = await fetch(`${API_BASE_URL}/finance/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao carregar o resumo financeiro.')
  }

  return payload as FinanceSummary
}

export async function getFinanceEntries(token: string): Promise<{ expenses: FinanceEntry[]; revenues: FinanceEntry[] }> {
  const [expensesResponse, revenuesResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/finance/expenses`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }),
    fetch(`${API_BASE_URL}/finance/revenues`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }),
  ])

  const [expensesPayload, revenuesPayload] = await Promise.all([
    expensesResponse.json().catch(() => []),
    revenuesResponse.json().catch(() => []),
  ])

  if (!expensesResponse.ok || !revenuesResponse.ok) {
    throw new Error('Erro ao carregar entradas financeiras.')
  }

  return {
    expenses: Array.isArray(expensesPayload) ? expensesPayload : [],
    revenues: Array.isArray(revenuesPayload) ? revenuesPayload : [],
  }
}

export async function getSalesReport(token: string, period = 'month'): Promise<ReportSummary> {
  const response = await fetch(`${API_BASE_URL}/reports/sales?period=${encodeURIComponent(period)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao carregar relatório de vendas.')
  }

  return payload as ReportSummary
}

export async function getFinancialReport(token: string, period = 'month'): Promise<ReportSummary> {
  const response = await fetch(`${API_BASE_URL}/reports/financial?period=${encodeURIComponent(period)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || 'Erro ao carregar relatório financeiro.')
  }

  return payload as ReportSummary
}
