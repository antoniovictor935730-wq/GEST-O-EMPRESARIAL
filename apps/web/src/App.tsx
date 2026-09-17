import { FormEvent, useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import {
  clearSession,
  CategoryRecord,
  CashSummary,
  ClientRecord,
  CompanySettings,
  createCategory,
  createCashMovement,
  createCashRegister,
  createDepartment,
  createExpense,
  createClient,
  createEmployee,
  createProduct,
  createSale,
  createStockMovement,
  createPosition,
  createSupplier,
  DepartmentRecord,
  deleteResource,
  DashboardSummary,
  EmployeeRecord,
  FinanceSummary,
  getDashboardSummary,
  getEmployees,
  getClients,
  getCategories,
  getCashSummary,
  getCompanySettings,
  getDepartments,
  getFinanceEntries,
  getFinanceSummary,
  getFinancialReport,
  getLowStock,
  getProducts,
  getPayrollSummary,
  getPositions,
  getSuppliers,
  getSales,
  getSalesReport,
  getStockHistory,
  getStockSummary,
  getStoredSession,
  loginRequest,
  ProductRecord,
  PositionRecord,
  PayrollSummary,
  ReportSummary,
  SaleRecord,
  saveSession,
  SessionState,
  StockAlert,
  StockMovement,
  StockSummary,
  SupplierRecord,
  updateResource,
} from './lib/api'

const formatMoney = (value: number) => `AOA ${value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

type ReportPeriod = 'day' | 'month' | 'year'

const reportPeriodLabels: Record<ReportPeriod, string> = {
  day: 'Diário',
  month: 'Mensal',
  year: 'Anual',
}

const fallbackStats = [
  { label: 'Vendas do dia', value: 'AOA 0,00', change: '+0.0%' },
  { label: 'Vendas do mês', value: 'AOA 0,00', change: '+0.0%' },
  { label: 'Despesas', value: 'AOA 0,00', change: '-0.0%' },
  { label: 'Lucro', value: 'AOA 0,00', change: '+0.0%' },
]

const moduleConfig = [
  'Dashboard',
  'Funcionários',
  'Pagamentos',
  'Departamentos',
  'Posições',
  'Clientes',
  'Fornecedores',
  'Produtos',
  'Categorias',
  'Stock',
  'Vendas',
  'Caixa',
  'Financeiro',
  'Relatórios',
  'Configurações',
] as const

type ModuleName = typeof moduleConfig[number]

export default function App() {
  const [session, setSession] = useState<SessionState | null>(null)
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [payroll, setPayroll] = useState<PayrollSummary | null>(null)
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7))
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [positions, setPositions] = useState<PositionRecord[]>([])
  const [categories, setCategories] = useState<CategoryRecord[]>([])
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([])
  const [cashSummary, setCashSummary] = useState<CashSummary | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [stockSummary, setStockSummary] = useState<StockSummary | null>(null)
  const [lowStock, setLowStock] = useState<StockAlert[]>([])
  const [stockHistory, setStockHistory] = useState<StockMovement[]>([])
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null)
  const [financeEntries, setFinanceEntries] = useState<{ expenses: any[]; revenues: any[] }>({ expenses: [], revenues: [] })
  const [salesReport, setSalesReport] = useState<ReportSummary | null>(null)
  const [financialReport, setFinancialReport] = useState<ReportSummary | null>(null)
  const [currentModule, setCurrentModule] = useState<ModuleName>('Dashboard')
  const [email, setEmail] = useState('admin@erp.com')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloadingReport, setIsDownloadingReport] = useState<ReportPeriod | null>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [activeForm, setActiveForm] = useState<'employee' | 'client' | 'product' | 'sale' | 'movement' | 'department' | 'position' | 'category' | 'supplier' | 'cashMovement' | 'cashClose' | 'expense' | 'settings' | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const storedSession = getStoredSession()
    if (storedSession) {
      setSession(storedSession)
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setDashboard(null)
      setEmployees([])
      setPayroll(null)
      setClients([])
      setProducts([])
      setSales([])
      setDepartments([])
      setPositions([])
      setCategories([])
      setSuppliers([])
      setCashSummary(null)
      setCompanySettings(null)
      setStockSummary(null)
      setLowStock([])
      setStockHistory([])
      return
    }

    const loadDashboard = async () => {
      try {
        setIsLoadingDashboard(true)
        const summary = await getDashboardSummary(session.accessToken)
        setDashboard(summary)
      } catch (dashboardError) {
        console.error(dashboardError)
        setError('Não foi possível carregar o resumo do dashboard.')
      } finally {
        setIsLoadingDashboard(false)
      }
    }

    const loadModuleData = async () => {
      try {
        const [nextEmployees, nextClients, nextProducts, nextDepartments, nextPositions, nextCategories, nextSuppliers, nextCashSummary, nextCompanySettings, nextStockSummary, nextLowStock, nextStockHistory, nextFinanceSummary, nextFinanceEntries, nextSales, nextSalesReport, nextFinancialReport, nextPayroll] = await Promise.all([
          getEmployees(session.accessToken),
          getClients(session.accessToken),
          getProducts(session.accessToken),
          getDepartments(session.accessToken),
          getPositions(session.accessToken),
          getCategories(session.accessToken),
          getSuppliers(session.accessToken),
          getCashSummary(session.accessToken),
          getCompanySettings(session.accessToken),
          getStockSummary(session.accessToken),
          getLowStock(session.accessToken),
          getStockHistory(session.accessToken),
          getFinanceSummary(session.accessToken),
          getFinanceEntries(session.accessToken),
          getSales(session.accessToken),
          getSalesReport(session.accessToken, 'month'),
          getFinancialReport(session.accessToken, 'month'),
          getPayrollSummary(session.accessToken, payrollMonth),
        ])

        setEmployees(nextEmployees)
        setClients(nextClients)
        setProducts(nextProducts)
        setDepartments(nextDepartments)
        setPositions(nextPositions)
        setCategories(nextCategories)
        setSuppliers(nextSuppliers)
        setCashSummary(nextCashSummary)
        setCompanySettings(nextCompanySettings)
        setStockSummary(nextStockSummary)
        setLowStock(nextLowStock)
        setStockHistory(nextStockHistory)
        setFinanceSummary(nextFinanceSummary)
        setFinanceEntries(nextFinanceEntries)
        setSales(nextSales)
        setSalesReport(nextSalesReport)
        setFinancialReport(nextFinancialReport)
        setPayroll(nextPayroll)
      } catch (moduleError) {
        console.error(moduleError)
      }
    }

    loadDashboard()
    loadModuleData()
  }, [session, currentModule, payrollMonth])

  const stats = useMemo(() => {
    if (!dashboard) {
      return fallbackStats
    }

    return [
      { label: 'Vendas do dia', value: formatMoney(dashboard.summary.salesToday), change: '+8.2%' },
      { label: 'Vendas do mês', value: formatMoney(dashboard.summary.salesMonth), change: '+12.7%' },
      { label: 'Despesas', value: formatMoney(dashboard.summary.totalExpenses), change: '-2.4%' },
      { label: 'Lucro', value: formatMoney(dashboard.summary.estimatedProfit), change: '+15.8%' },
    ]
  }, [dashboard])

  const recentSales = useMemo(() => {
    if (!dashboard) {
      return []
    }

    return dashboard.recent.sales.map((sale) => ({
      id: `#${sale.id}`,
      customer: sale.client?.name || 'Cliente não informado',
      total: formatMoney(sale.total),
      status: 'Pago',
    }))
  }, [dashboard])

  const activities = useMemo(() => {
    if (!dashboard) {
      return []
    }

    return [
      { title: 'Clientes registados', detail: `${dashboard.summary.clients} clientes no sistema`, time: 'Agora' },
      { title: 'Produtos em stock baixo', detail: `${dashboard.summary.lowStock} produtos abaixo do limite`, time: 'Hoje' },
      { title: 'Vendas no sistema', detail: `${dashboard.summary.salesCount} registos de vendas`, time: 'Este mês' },
      { title: 'Folha de pagamento', detail: `${dashboard.summary.employees} funcionários ativos`, time: 'Hoje' },
    ]
  }, [dashboard])

  const dashboardStatTargets: Record<string, ModuleName> = {
    'Vendas do dia': 'Vendas',
    'Vendas do mês': 'Vendas',
    Despesas: 'Financeiro',
    Lucro: 'Relatórios',
  }

  const goToDashboardArea = (label: string) => {
    setCurrentModule(dashboardStatTargets[label] || 'Dashboard')
  }

  const monthlySales = useMemo(() => {
    const totals = Array.from({ length: 12 }, () => 0)
    const currentYear = new Date().getFullYear()

    sales.forEach((sale) => {
      const date = new Date(sale.date)
      if (date.getFullYear() === currentYear) {
        totals[date.getMonth()] += Number(sale.total || 0)
      }
    })

    const maximum = Math.max(...totals, 1)
    return totals.map((total) => Math.max(8, Math.round((total / maximum) * 100)))
  }, [sales])

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Introduza email e senha para entrar.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      const nextSession = await loginRequest(email, password)
      saveSession(nextSession)
      setSession(nextSession)
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Erro ao iniciar sessão.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (path: string, reload: () => Promise<void>) => {
    if (!window.confirm('Tem certeza que deseja eliminar este registo?')) return
    try {
      await deleteResource(session!.accessToken, path)
      await reload()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível eliminar o registo.')
    }
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setDashboard(null)
    setError('')
  }

  const handleDownloadReport = async (period: ReportPeriod) => {
    if (!session) return

    try {
      setIsDownloadingReport(period)
      setError('')
      const [salesData, financialData] = await Promise.all([
        getSalesReport(session.accessToken, period),
        getFinancialReport(session.accessToken, period),
      ])
      const document = new jsPDF()
      const companyName = companySettings?.companyName || 'Empresa'
      const currency = companySettings?.currency || 'AOA'
      const generatedAt = new Date().toLocaleString('pt-PT')
      const money = (value: number) => `${currency} ${value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      let y = 52

      document.setFillColor(6, 27, 40)
      document.rect(0, 0, 210, 38, 'F')
      document.setTextColor(255, 255, 255)
      document.setFontSize(18)
      document.text(companyName, 16, 16)
      document.setFontSize(9)
      document.text('RELATÓRIO DE GESTÃO EMPRESARIAL', 16, 25)
      document.text(`Período: ${reportPeriodLabels[period]}`, 145, 16)
      document.text(`Emitido em: ${generatedAt}`, 145, 23)

      document.setTextColor(35, 45, 52)
      document.setFontSize(10)
      document.text(`NIF: ${companySettings?.nif || 'Não informado'}`, 16, y)
      document.text(`Telefone: ${companySettings?.phone || 'Não informado'}`, 16, y + 6)
      document.text(`Email: ${companySettings?.email || 'Não informado'}`, 16, y + 12)
      document.text(`Endereço: ${companySettings?.address || 'Não informado'}`, 110, y)
      document.text(`Website: ${companySettings?.website || 'Não informado'}`, 110, y + 6)

      y += 28
      document.setFillColor(231, 242, 246)
      document.roundedRect(16, y - 6, 178, 24, 3, 3, 'F')
      document.setFontSize(10)
      document.text(`Vendas: ${money(Number(salesData.total || 0))}`, 22, y + 4)
      document.text(`Receitas: ${money(Number(financialData.totalRevenues || 0))}`, 22, y + 12)
      document.text(`Despesas: ${money(Number(financialData.totalExpenses || 0))}`, 105, y + 4)
      document.text(`Resultado: ${money(Number(financialData.profit ?? (financialData.totalSales || 0) - (financialData.totalExpenses || 0)))}`, 105, y + 12)

      y += 34
      document.setFontSize(12)
      document.setTextColor(6, 86, 117)
      document.text('Vendas realizadas', 16, y)
      y += 8
      document.setFontSize(9)
      document.setTextColor(35, 45, 52)
      document.text('Documento', 16, y)
      document.text('Cliente', 48, y)
      document.text('Data', 128, y)
      document.text('Total', 170, y)
      y += 5
      document.setDrawColor(160, 180, 188)
      document.line(16, y, 194, y)
      y += 7

      const salesRows = Array.isArray(salesData.data) ? salesData.data : []
      if (salesRows.length === 0) {
        document.text('Nenhuma venda registada no período.', 16, y)
      } else {
        salesRows.forEach((sale) => {
          if (y > 274) {
            document.addPage()
            y = 20
          }
          document.text(String(sale.id).slice(0, 16), 16, y)
          document.text((sale.client?.name || 'Cliente').slice(0, 38), 48, y)
          document.text(sale.date ? new Date(sale.date).toLocaleDateString('pt-PT') : '—', 128, y)
          document.text(money(Number(sale.total || 0)), 170, y)
          y += 6
        })
      }

      y += 12
      if (y > 270) {
        document.addPage()
        y = 20
      }
      document.setFontSize(12)
      document.setTextColor(6, 86, 117)
      document.text('Resumo financeiro', 16, y)
      y += 9
      document.setFontSize(10)
      document.setTextColor(35, 45, 52)
      document.text(`Despesas: ${money(Number(financialData.totalExpenses || 0))}`, 16, y)
      document.text(`Receitas: ${money(Number(financialData.totalRevenues || 0))}`, 16, y + 7)
      document.text(`Vendas: ${money(Number(financialData.totalSales || 0))}`, 16, y + 14)
      document.text(`Resultado líquido: ${money(Number(financialData.profit ?? (financialData.totalSales || 0) - (financialData.totalExpenses || 0)))}`, 16, y + 21)
      document.setFontSize(8)
      document.setTextColor(100, 115, 122)
      document.text('Documento emitido pelo sistema de gestão empresarial.', 16, 287)
      document.save(`relatorio-${period}-${new Date().toISOString().slice(0, 10)}.pdf`)
      setSalesReport(salesData)
      setFinancialReport(financialData)
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'Não foi possível gerar o relatório PDF.')
    } finally {
      setIsDownloadingReport(null)
    }
  }

  const openForm = (form: 'employee' | 'client' | 'product' | 'sale' | 'movement' | 'department' | 'position' | 'category' | 'supplier' | 'cashMovement' | 'cashClose' | 'expense' | 'settings', record?: Record<string, unknown>) => {
    setError('')
    setFormData(record ? Object.fromEntries(Object.entries(record).map(([key, value]) => [key, String(value ?? '')])) : {})
    setEditingId(record?.id ? String(record.id) : null)
    setActiveForm(form)
  }

  const closeForm = () => {
    setActiveForm(null)
    setFormData({})
    setEditingId(null)
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeForm) return

    try {
      setIsSubmitting(true)
      if (activeForm === 'employee') {
        if (editingId) await updateResource(session!.accessToken, `employees/${editingId}`, formData)
        else await createEmployee(session!.accessToken, formData)
        setEmployees(await getEmployees(session!.accessToken))
      } else if (activeForm === 'department') {
        if (editingId) await updateResource(session!.accessToken, `departments/${editingId}`, formData)
        else await createDepartment(session!.accessToken, formData)
        setDepartments(await getDepartments(session!.accessToken))
      } else if (activeForm === 'position') {
        if (editingId) await updateResource(session!.accessToken, `positions/${editingId}`, formData)
        else await createPosition(session!.accessToken, formData)
        setPositions(await getPositions(session!.accessToken))
      } else if (activeForm === 'category') {
        if (editingId) await updateResource(session!.accessToken, `categories/${editingId}`, formData)
        else await createCategory(session!.accessToken, formData)
        setCategories(await getCategories(session!.accessToken))
      } else if (activeForm === 'supplier') {
        if (editingId) await updateResource(session!.accessToken, `suppliers/${editingId}`, formData)
        else await createSupplier(session!.accessToken, formData)
        setSuppliers(await getSuppliers(session!.accessToken))
      } else if (activeForm === 'cashMovement') {
        await createCashMovement(session!.accessToken, formData)
        setCashSummary(await getCashSummary(session!.accessToken))
      } else if (activeForm === 'cashClose') {
        await createCashRegister(session!.accessToken, {
          closingAmount: formData.closingAmount,
          employeeName: session!.user.name,
          date: new Date().toISOString(),
        })
        const refreshedDashboard = await getDashboardSummary(session!.accessToken)
        setDashboard(refreshedDashboard)
        setCashSummary(await getCashSummary(session!.accessToken))
      } else if (activeForm === 'expense') {
        await createExpense(session!.accessToken, formData)
        setFinanceEntries(await getFinanceEntries(session!.accessToken))
        setFinanceSummary(await getFinanceSummary(session!.accessToken))
        setCashSummary(await getCashSummary(session!.accessToken))
      } else if (activeForm === 'settings') {
        await updateResource(session!.accessToken, 'company-settings', formData)
        setCompanySettings(await getCompanySettings(session!.accessToken))
      } else if (activeForm === 'client') {
        if (editingId) await updateResource(session!.accessToken, `clients/${editingId}`, formData)
        else await createClient(session!.accessToken, formData)
        setClients(await getClients(session!.accessToken))
      } else if (activeForm === 'product') {
        if (editingId) await updateResource(session!.accessToken, `products/${editingId}`, formData)
        else await createProduct(session!.accessToken, formData)
        setProducts(await getProducts(session!.accessToken))
      } else if (activeForm === 'sale') {
        const salePayload = {
          ...formData,
          items: [{ productId: formData.productId, quantity: formData.quantity || '1', price: formData.price }],
        }
        if (editingId) await updateResource(session!.accessToken, `sales/${editingId}`, salePayload)
        else await createSale(session!.accessToken, salePayload)
        setSales(await getSales(session!.accessToken))
        setProducts(await getProducts(session!.accessToken))
      } else {
        await createStockMovement(session!.accessToken, {
          ...formData,
          movementType: formData.movementType || 'ENTRY',
        })
        setProducts(await getProducts(session!.accessToken))
        setStockSummary(await getStockSummary(session!.accessToken))
        setLowStock(await getLowStock(session!.accessToken))
        setStockHistory(await getStockHistory(session!.accessToken))
      }
      setDashboard(await getDashboardSummary(session!.accessToken))
      closeForm()
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Não foi possível guardar o registo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderModuleContent = () => {
    switch (currentModule) {
      case 'Dashboard':
        return (
          <>
            <section className="stats-grid">
              {stats.map((stat) => (
                <button
                  className="card stat-card stat-card-button"
                  key={stat.label}
                  type="button"
                  onClick={() => goToDashboardArea(stat.label)}
                  aria-label={`Abrir área de ${stat.label}`}
                >
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.change}</small>
                  <em>Ver detalhes</em>
                </button>
              ))}
            </section>

            <section className="content-grid">
              <article className="card chart-card">
                <div className="section-heading">
                  <h2>Vendas por mês</h2>
                  <span className="chip positive">+18.4%</span>
                </div>
                <div className="chart-bars">
                  {monthlySales.map((height, index) => (
                    <span key={index} title={`Mês ${index + 1}: ${formatMoney(sales.reduce((total, sale) => {
                      const date = new Date(sale.date)
                      return date.getFullYear() === new Date().getFullYear() && date.getMonth() === index ? total + Number(sale.total || 0) : total
                    }, 0))}`} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </article>

              <article className="card summary-card">
                <div className="section-heading">
                  <h2>Fluxo do caixa</h2>
                  <button type="button" className="secondary-btn" onClick={() => openForm('cashClose')}>Fechar dia</button>
                </div>
                <div className="cash-summary">
                  <button type="button" className="cash-summary-link" onClick={() => setCurrentModule('Vendas')}>
                    <label>Entradas</label>
                    <strong>{dashboard ? formatMoney(dashboard.summary.salesMonth) : 'AOA 0,00'}</strong>
                  </button>
                  <button type="button" className="cash-summary-link" onClick={() => setCurrentModule('Financeiro')}>
                    <label>Saídas</label>
                    <strong>{dashboard ? formatMoney(dashboard.summary.totalExpenses) : 'AOA 0,00'}</strong>
                  </button>
                  <button type="button" className="cash-summary-link" onClick={() => setCurrentModule('Relatórios')}>
                    <label>Saldo</label>
                    <strong className="accent">
                      {dashboard ? formatMoney(dashboard.summary.estimatedProfit) : 'AOA 0,00'}
                    </strong>
                  </button>
                  <button type="button" className="cash-summary-link" onClick={() => setCurrentModule('Pagamentos')}>
                    <label>Folha a pagar</label>
                    <strong>{dashboard ? formatMoney(dashboard.summary.payrollNet) : 'AOA 0,00'}</strong>
                    <small>{dashboard?.summary.payrollAbsences || 0} saídas/faltas no mês</small>
                  </button>
                </div>
              </article>
            </section>

            <section className="bottom-grid">
              <article className="card table-card">
                <h2>Vendas recentes</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Doc</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.length > 0 ? (
                      recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td>{sale.id}</td>
                          <td>{sale.customer}</td>
                          <td>{sale.total}</td>
                          <td>
                            <span className={sale.status === 'Crédito' ? 'badge warning' : 'badge success'}>
                              {sale.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>Sem vendas recentes.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </article>

              <article className="card activity-card">
                <h2>Atividades recentes</h2>
                <ul className="activity-list">
                  {activities.length > 0 ? (
                    activities.map((item) => (
                      <li key={item.title}>
                        <div className="status-dot" />
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.detail}</span>
                        </div>
                        <small>{item.time}</small>
                      </li>
                    ))
                  ) : (
                    <li><span>Nenhuma atividade disponível.</span></li>
                  )}
                </ul>
              </article>
            </section>
          </>
        )

      case 'Funcionários':
        return (
          <section className="card module-card">
            <div className="section-heading">
              <h2>Funcionários</h2>
              <button type="button" className="primary-btn" onClick={() => openForm('employee')}>Novo funcionário</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Departamento</th>
                  <th>Posição</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.employeeCode}</td>
                      <td>{employee.fullName}</td>
                      <td>{employee.department?.name || '—'}</td>
                      <td>{employee.position?.name || '—'}</td>
                      <td>
                        <span className={employee.status === 'ACTIVE' ? 'badge success' : 'badge warning'}>
                          {employee.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="row-actions">
                        <button type="button" onClick={() => openForm('employee', employee as unknown as Record<string, unknown>)}>Editar</button>
                        <button type="button" onClick={() => handleDelete(`employees/${employee.id}`, async () => setEmployees(await getEmployees(session!.accessToken)))}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Sem funcionários registados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )

      case 'Pagamentos':
        return (
          <>
            <section className="stats-grid">
              <article className="card stat-card"><span>Folha bruta</span><strong>{formatMoney(payroll?.totalGross || 0)}</strong><small>Mês selecionado</small></article>
              <article className="card stat-card"><span>Descontos</span><strong>{formatMoney(payroll?.totalDiscounts || 0)}</strong><small>{payroll?.totalAbsences || 0} saídas/faltas</small></article>
              <article className="card stat-card"><span>Folha líquida</span><strong>{formatMoney(payroll?.totalNet || 0)}</strong><small>Após descontos</small></article>
            </section>
            <section className="card module-card">
              <div className="section-heading">
                <div>
                  <h2>Pagamento dos funcionários</h2>
                  <p className="module-subtitle">Cálculo sincronizado com os funcionários ativos e os registos de assiduidade.</p>
                </div>
                <label className="month-filter">Mês<input type="month" value={payrollMonth} onChange={(event) => setPayrollMonth(event.target.value)} /></label>
              </div>
              <table>
                <thead><tr><th>Funcionário</th><th>Salário base</th><th>Bônus</th><th>Saídas/faltas</th><th>Desconto</th><th>A receber</th></tr></thead>
                <tbody>
                  {payroll?.rows.length ? payroll.rows.map((row) => (
                    <tr key={row.employeeId}>
                      <td><strong>{row.fullName}</strong><small className="table-secondary">{row.employeeCode} · {row.position || 'Sem posição'}</small></td>
                      <td>{formatMoney(row.salary)}</td>
                      <td>{formatMoney(row.bonus)}</td>
                      <td>{row.absences}</td>
                      <td>{formatMoney(row.discount)}</td>
                      <td><strong>{formatMoney(row.netSalary)}</strong></td>
                    </tr>
                  )) : <tr><td colSpan={6}>Sem funcionários ativos ou registos para este mês.</td></tr>}
                </tbody>
              </table>
            </section>
          </>
        )

      case 'Clientes':
        return (
          <section className="card module-card">
            <div className="section-heading">
              <h2>Clientes</h2>
              <button type="button" className="primary-btn" onClick={() => openForm('client')}>Novo cliente</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Código</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.length > 0 ? (
                  clients.map((client) => (
                    <tr key={client.id}>
                      <td>{client.name}</td>
                      <td>{client.email || '—'}</td>
                      <td><span className="badge success">{client.status === 'ACTIVE' ? 'Ativo' : client.status || 'Ativo'}</span></td>
                      <td>{client.code}</td>
                      <td className="row-actions">
                        <button type="button" onClick={() => openForm('client', client as unknown as Record<string, unknown>)}>Editar</button>
                        <button type="button" onClick={() => handleDelete(`clients/${client.id}`, async () => setClients(await getClients(session!.accessToken)))}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>Sem clientes registados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )

      case 'Fornecedores':
        return (
          <section className="card module-card">
            <div className="section-heading"><h2>Fornecedores</h2><button type="button" className="primary-btn" onClick={() => openForm('supplier')}>Novo fornecedor</button></div>
            <table><thead><tr><th>Nome</th><th>Empresa</th><th>Contacto</th><th>Produtos</th><th>Pendente</th><th>Ações</th></tr></thead><tbody>
              {suppliers.length > 0 ? suppliers.map((supplier) => <tr key={supplier.id}><td>{supplier.name}</td><td>{supplier.company || '—'}</td><td>{supplier.phone || supplier.email || '—'}</td><td>{supplier.products || '—'}</td><td>{formatMoney(Number(supplier.pendingAmount || 0))}</td><td className="row-actions"><button type="button" onClick={() => openForm('supplier', supplier as unknown as Record<string, unknown>)}>Editar</button><button type="button" onClick={() => handleDelete(`suppliers/${supplier.id}`, async () => setSuppliers(await getSuppliers(session!.accessToken)))}>Eliminar</button></td></tr>) : <tr><td colSpan={6}>Sem fornecedores registados.</td></tr>}
            </tbody></table>
          </section>
        )

      case 'Departamentos':
        return (
          <section className="card module-card">
            <div className="section-heading"><h2>Departamentos</h2><button type="button" className="primary-btn" onClick={() => openForm('department')}>Novo departamento</button></div>
            <table><thead><tr><th>Nome</th><th>Descrição</th><th>Ações</th></tr></thead><tbody>
              {departments.length > 0 ? departments.map((department) => <tr key={department.id}><td>{department.name}</td><td>{department.description || '—'}</td><td className="row-actions"><button type="button" onClick={() => openForm('department', department as unknown as Record<string, unknown>)}>Editar</button><button type="button" onClick={() => handleDelete(`departments/${department.id}`, async () => setDepartments(await getDepartments(session!.accessToken)))}>Eliminar</button></td></tr>) : <tr><td colSpan={3}>Sem departamentos registados.</td></tr>}
            </tbody></table>
          </section>
        )

      case 'Posições':
        return (
          <section className="card module-card">
            <div className="section-heading"><h2>Posições</h2><button type="button" className="primary-btn" onClick={() => openForm('position')}>Nova posição</button></div>
            <table><thead><tr><th>Nome</th><th>Ações</th></tr></thead><tbody>
              {positions.length > 0 ? positions.map((position) => <tr key={position.id}><td>{position.name}</td><td className="row-actions"><button type="button" onClick={() => openForm('position', position as unknown as Record<string, unknown>)}>Editar</button><button type="button" onClick={() => handleDelete(`positions/${position.id}`, async () => setPositions(await getPositions(session!.accessToken)))}>Eliminar</button></td></tr>) : <tr><td colSpan={2}>Sem posições registadas.</td></tr>}
            </tbody></table>
          </section>
        )

      case 'Produtos':
        return (
          <section className="card module-card">
            <div className="section-heading">
              <h2>Produtos</h2>
              <button type="button" className="primary-btn" onClick={() => openForm('product')}>Adicionar produto</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Stock</th>
                  <th>Preço</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.sku}</td>
                      <td>{product.name}</td>
                      <td>{product.category?.name || '—'}</td>
                      <td>{product.stockCurrent}</td>
                      <td>{formatMoney(product.salePrice)}</td>
                      <td className="row-actions">
                        <button type="button" onClick={() => openForm('product', product as unknown as Record<string, unknown>)}>Editar</button>
                        <button type="button" onClick={() => handleDelete(`products/${product.id}`, async () => setProducts(await getProducts(session!.accessToken)))}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Sem produtos registados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )

      case 'Categorias':
        return (
          <section className="card module-card">
            <div className="section-heading"><h2>Categorias</h2><button type="button" className="primary-btn" onClick={() => openForm('category')}>Nova categoria</button></div>
            <table><thead><tr><th>Nome</th><th>Ações</th></tr></thead><tbody>
              {categories.length > 0 ? categories.map((category) => <tr key={category.id}><td>{category.name}</td><td className="row-actions"><button type="button" onClick={() => openForm('category', category as unknown as Record<string, unknown>)}>Editar</button><button type="button" onClick={() => handleDelete(`categories/${category.id}`, async () => setCategories(await getCategories(session!.accessToken)))}>Eliminar</button></td></tr>) : <tr><td colSpan={2}>Sem categorias registadas.</td></tr>}
            </tbody></table>
          </section>
        )

      case 'Stock':
        return (
          <>
            <section className="stats-grid">
              <article className="card stat-card">
                <span>Total de produtos</span>
                <strong>{stockSummary?.totalProducts ?? 0}</strong>
                <small>Inventário global</small>
              </article>
              <article className="card stat-card">
                <span>Stock baixo</span>
                <strong>{stockSummary?.lowStock ?? 0}</strong>
                <small>Níveis críticos</small>
              </article>
              <article className="card stat-card">
                <span>Sem stock</span>
                <strong>{stockSummary?.outOfStock ?? 0}</strong>
                <small>Produtos indisponíveis</small>
              </article>
              <article className="card stat-card">
                <span>Unidades</span>
                <strong>{stockSummary?.totalUnits ?? 0}</strong>
                <small>Total em armazém</small>
              </article>
            </section>

            <section className="card module-card">
              <div className="section-heading">
                <h2>Inventário</h2>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>SKU</th>
                    <th>Stock atual</th>
                    <th>Mínimo</th>
                    <th>Máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>{product.stockCurrent}</td>
                        <td>{product.stockMin}</td>
                        <td>{product.stockMax}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>Sem produtos registados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="content-grid">
              <article className="card module-card">
                <div className="section-heading">
                  <h2>Alertas de stock</h2>
                  <button type="button" className="primary-btn" onClick={() => openForm('movement')}>Nova movimentação</button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>SKU</th>
                      <th>Stock</th>
                      <th>Mínimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.length > 0 ? (
                      lowStock.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.sku}</td>
                          <td>{item.stockCurrent}</td>
                          <td>{item.stockMin}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>Não há produtos em stock baixo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </article>

              <article className="card module-card">
                <div className="section-heading">
                  <h2>Histórico</h2>
                </div>
                <ul className="activity-list compact-list">
                  {stockHistory.length > 0 ? (
                    stockHistory.slice(0, 6).map((movement) => (
                      <li key={movement.id}>
                        <div className="status-dot" />
                        <div>
                          <strong>{movement.product?.name || 'Produto'}</strong>
                          <span>{movement.movementType} · {movement.quantity} unidades</span>
                        </div>
                        <small>{new Date(movement.createdAt).toLocaleDateString('pt-PT')}</small>
                      </li>
                    ))
                  ) : (
                    <li><span>Sem movimentos recentes.</span></li>
                  )}
                </ul>
              </article>
            </section>
          </>
        )

      case 'Vendas':
        return (
          <section className="card module-card">
            <div className="section-heading">
              <h2>Vendas</h2>
              <button type="button" className="primary-btn" onClick={() => openForm('sale')}>Nova venda</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Doc</th>
                  <th>Cliente</th>
                  <th>Produto</th>
                  <th>Data</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.length > 0 ? sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.saleNumber}</td>
                    <td>{sale.client?.name || 'Cliente não informado'}</td>
                    <td>{sale.items?.[0]?.product?.name || '—'}</td>
                    <td>{new Date(sale.date).toLocaleDateString('pt-PT')}</td>
                    <td>{formatMoney(Number(sale.total || 0))}</td>
                    <td><span className={sale.status === 'PAID' ? 'badge success' : 'badge warning'}>{sale.status === 'PAID' ? 'Pago' : sale.status || 'Pendente'}</span></td>
                    <td className="row-actions">
                      <button type="button" onClick={() => openForm('sale', { ...sale, productId: sale.items?.[0]?.productId || '', quantity: sale.items?.[0]?.quantity || '1', price: sale.items?.[0]?.price || '' } as unknown as Record<string, unknown>)}>Editar</button>
                      <button type="button" onClick={() => handleDelete(`sales/${sale.id}`, async () => { setSales(await getSales(session!.accessToken)); setProducts(await getProducts(session!.accessToken)) })}>Eliminar</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={7}>Sem vendas registadas.</td></tr>}
              </tbody>
            </table>
          </section>
        )

      case 'Caixa':
        const cashChartValues = [
          { label: 'Vendas', value: Math.max(0, cashSummary?.totalSales ?? 0), className: 'sales' },
          { label: 'Despesas', value: Math.max(0, cashSummary?.totalExpenses ?? 0), className: 'expenses' },
          { label: 'Saldo', value: Math.max(0, cashSummary?.cashAvailable ?? 0), className: 'balance' },
        ]
        const cashChartTotal = cashChartValues.reduce((total, item) => total + item.value, 0)
        const cashChartPercentages = cashChartTotal > 0
          ? cashChartValues.map((item) => Math.round((item.value / cashChartTotal) * 100))
          : [0, 0, 0]
        return (
          <>
            <section className="stats-grid">
              <article className="card stat-card"><span>Vendas</span><strong>{formatMoney(cashSummary?.totalSales ?? 0)}</strong><small>Total registado</small></article>
              <article className="card stat-card"><span>Despesas</span><strong>{formatMoney(cashSummary?.totalExpenses ?? 0)}</strong><small>Custos registados</small></article>
              <article className="card stat-card"><span>Movimentos</span><strong>{formatMoney(cashSummary?.totalMovements ?? 0)}</strong><small>Lançamentos de caixa</small></article>
              <article className="card stat-card"><span>Saldo disponível</span><strong>{formatMoney(cashSummary?.cashAvailable ?? 0)}</strong><small>Vendas menos despesas</small></article>
            </section>
            <section className="card module-card">
              <div className="section-heading"><h2>Movimentos de caixa</h2><button type="button" className="primary-btn" onClick={() => openForm('cashMovement')}>Novo movimento</button></div>
              <p>Registe entradas e saídas para manter o saldo financeiro atualizado.</p>
            </section>
            <section className="card cash-chart-card">
              <div className="section-heading">
                <div><h2>Estado geral do caixa</h2><p>Distribuição dos valores registados</p></div>
                <span className="chip neutral">{cashChartTotal > 0 ? 'Atualizado' : 'Sem dados'}</span>
              </div>
              <div className="cash-chart-layout">
                <div className="pie-chart-3d" style={{ '--sales-stop': `${cashChartPercentages[0]}%`, '--expenses-stop': `${cashChartPercentages[0] + cashChartPercentages[1]}%` } as React.CSSProperties} aria-label="Gráfico de pizza do estado geral do caixa" role="img" />
                <div className="cash-chart-legend">
                  {cashChartValues.map((item, index) => (
                    <div className="legend-item" key={item.label}>
                      <span className={`legend-swatch ${item.className}`} />
                      <span><strong>{item.label}</strong><small>{cashChartPercentages[index]}% · {formatMoney(item.value)}</small></span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )

      case 'Financeiro':
        return (
          <>
            <section className="stats-grid">
              <article className="card stat-card">
                <span>Vendas</span>
                <strong>{financeSummary ? formatMoney(financeSummary.sales) : 'AOA 0,00'}</strong>
                <small>Receita total</small>
              </article>
              <article className="card stat-card">
                <span>Despesas</span>
                <strong>{financeSummary ? formatMoney(financeSummary.expenses) : 'AOA 0,00'}</strong>
                <small>Custos do período</small>
              </article>
              <article className="card stat-card">
                <span>Receitas</span>
                <strong>{financeSummary ? formatMoney(financeSummary.revenues) : 'AOA 0,00'}</strong>
                <small>Saídas de caixa</small>
              </article>
              <article className="card stat-card">
                <span>Lucro</span>
                <strong>{financeSummary ? formatMoney(financeSummary.profit) : 'AOA 0,00'}</strong>
                <small>Resultado líquido</small>
              </article>
            </section>

            <section className="content-grid">
              <article className="card module-card">
                <div className="section-heading">
                  <h2>Despesas</h2>
                  <button type="button" className="primary-btn" onClick={() => openForm('expense')}>Nova despesa</button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeEntries.expenses.length > 0 ? (
                      financeEntries.expenses.map((item) => (
                        <tr key={item.id}>
                          <td>{item.category || 'Geral'}</td>
                          <td>{item.description || '—'}</td>
                          <td>{formatMoney(Number(item.value || 0))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3}>Sem despesas registadas.</td></tr>
                    )}
                  </tbody>
                </table>
              </article>

              <article className="card module-card">
                <div className="section-heading">
                  <h2>Receitas</h2>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Fonte</th>
                      <th>Descrição</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeEntries.revenues.length > 0 ? (
                      financeEntries.revenues.map((item) => (
                        <tr key={item.id}>
                          <td>{item.source || 'Geral'}</td>
                          <td>{item.description || '—'}</td>
                          <td>{formatMoney(Number(item.value || 0))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3}>Sem receitas registadas.</td></tr>
                    )}
                  </tbody>
                </table>
              </article>
            </section>
          </>
        )

      case 'Relatórios':
        return (
          <>
            <section className="card report-download-card">
              <div>
                <span className="eyebrow">Exportação empresarial</span>
                <h2>Baixar relatório em PDF</h2>
                <p>Escolha o período para gerar um documento com os dados da empresa.</p>
              </div>
              <div className="report-download-actions">
                {(['day', 'month', 'year'] as ReportPeriod[]).map((period) => (
                  <button type="button" className="primary-btn" key={period} onClick={() => handleDownloadReport(period)} disabled={isDownloadingReport !== null}>
                    {isDownloadingReport === period ? 'A gerar...' : `Baixar ${reportPeriodLabels[period]}`}
                  </button>
                ))}
              </div>
            </section>
            <section className="stats-grid">
              <article className="card stat-card">
                <span>Vendas</span>
                <strong>{salesReport ? formatMoney(Number(salesReport.total || 0)) : 'AOA 0,00'}</strong>
                <small>{salesReport?.period || 'month'}</small>
              </article>
              <article className="card stat-card">
                <span>Despesas</span>
                <strong>{financialReport ? formatMoney(Number(financialReport.totalExpenses || 0)) : 'AOA 0,00'}</strong>
                <small>Gasto do período</small>
              </article>
              <article className="card stat-card">
                <span>Receitas</span>
                <strong>{financialReport ? formatMoney(Number(financialReport.totalRevenues || 0)) : 'AOA 0,00'}</strong>
                <small>Entrada do período</small>
              </article>
              <article className="card stat-card">
                <span>Margem</span>
                <strong>{financialReport ? formatMoney(Number(financialReport.profit ?? (financialReport.totalSales || 0) - (financialReport.totalExpenses || 0))) : 'AOA 0,00'}</strong>
                <small>Vendas menos despesas</small>
              </article>
            </section>

            <section className="content-grid">
              <article className="card module-card">
                <div className="section-heading">
                  <h2>Vendas por período</h2>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Doc</th>
                      <th>Cliente</th>
                      <th>Data</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReport && Array.isArray(salesReport.data) && salesReport.data.length > 0 ? (
                      salesReport.data.map((sale) => (
                        <tr key={sale.id}>
                          <td>{sale.id}</td>
                          <td>{sale.client?.name || 'Cliente'}</td>
                          <td>{sale.date ? new Date(sale.date).toLocaleDateString('pt-PT') : '—'}</td>
                          <td>{formatMoney(Number(sale.total || 0))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4}>Sem vendas no período.</td></tr>
                    )}
                  </tbody>
                </table>
              </article>

              <article className="card module-card">
                <div className="section-heading">
                  <h2>Resumo financeiro</h2>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Despesas</td>
                      <td>{financialReport ? formatMoney(Number(financialReport.totalExpenses || 0)) : 'AOA 0,00'}</td>
                    </tr>
                    <tr>
                      <td>Receitas</td>
                      <td>{financialReport ? formatMoney(Number(financialReport.totalRevenues || 0)) : 'AOA 0,00'}</td>
                    </tr>
                    <tr>
                      <td>Vendas</td>
                      <td>{financialReport ? formatMoney(Number(financialReport.totalSales || 0)) : 'AOA 0,00'}</td>
                    </tr>
                  </tbody>
                </table>
              </article>
            </section>
          </>
        )

      case 'Configurações':
        return (
          <section className="card module-card">
            <div className="section-heading"><h2>Configurações da empresa</h2><button type="button" className="primary-btn" onClick={() => openForm('settings', companySettings as unknown as Record<string, unknown>)}>Editar dados</button></div>
            <table><tbody>
              <tr><th>Empresa</th><td>{companySettings?.companyName || '—'}</td></tr>
              <tr><th>NIF</th><td>{companySettings?.nif || '—'}</td></tr>
              <tr><th>Telefone</th><td>{companySettings?.phone || '—'}</td></tr>
              <tr><th>Email</th><td>{companySettings?.email || '—'}</td></tr>
              <tr><th>Endereço</th><td>{companySettings?.address || '—'}</td></tr>
              <tr><th>Moeda</th><td>{companySettings?.currency || 'AOA'}</td></tr>
            </tbody></table>
          </section>
        )

      default:
        return null
    }
  }

  if (!session) {
    return (
      <div className="login-page">
        <div className="login-card">
          <img className="login-logo" src="/logo.png" alt="HEL Technology Service" />
          <h1>Entrar no painel</h1>
          <p>Gestão empresarial centralizada em um único ambiente.</p>

          <form onSubmit={handleLogin} className="login-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@erp.com"
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error ? <div className="error-box">{error}</div> : null}

            <button type="submit" className="login-button" disabled={isSubmitting}>
              {isSubmitting ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      {activeForm ? (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-card" onSubmit={handleCreate}>
            <div className="section-heading">
              <h2>{activeForm === 'employee' ? 'Novo funcionário' : activeForm === 'client' ? 'Novo cliente' : activeForm === 'product' ? 'Adicionar produto' : activeForm === 'department' ? 'Novo departamento' : activeForm === 'position' ? 'Nova posição' : activeForm === 'category' ? 'Nova categoria' : activeForm === 'supplier' ? 'Novo fornecedor' : activeForm === 'cashMovement' ? 'Novo movimento de caixa' : activeForm === 'cashClose' ? 'Fechar dia' : activeForm === 'expense' ? 'Nova despesa' : activeForm === 'settings' ? 'Configurações da empresa' : activeForm === 'sale' ? 'Nova venda' : 'Nova movimentação'}</h2>
              <button type="button" className="icon-btn" onClick={closeForm} aria-label="Fechar formulário">×</button>
            </div>

            {activeForm === 'employee' ? (
              <>
                <label>Código<input required value={formData.employeeCode || ''} onChange={(event) => setFormData({ ...formData, employeeCode: event.target.value })} /></label>
                <label>Nome completo<input required value={formData.fullName || ''} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} /></label>
                <label>Email<input type="email" value={formData.email || ''} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></label>
                <label>Telefone<input value={formData.phone || ''} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></label>
                <label>Salário base<input type="number" min="0" step="0.01" value={formData.salary || ''} onChange={(event) => setFormData({ ...formData, salary: event.target.value })} /></label>
                <label>Bônus salarial mensal<input type="number" min="0" step="0.01" value={formData.salaryBonus || '0'} onChange={(event) => setFormData({ ...formData, salaryBonus: event.target.value })} /></label>
                <label>Departamento
                  <select value={formData.departmentId || ''} onChange={(event) => setFormData({ ...formData, departmentId: event.target.value })}>
                    <option value="">Sem departamento</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                </label>
                <label>Posição
                  <select value={formData.positionId || ''} onChange={(event) => setFormData({ ...formData, positionId: event.target.value })}>
                    <option value="">Sem posição</option>
                    {positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
                  </select>
                </label>
              </>
            ) : null}

            {activeForm === 'client' ? (
              <>
                <label>Código<input required value={formData.code || ''} onChange={(event) => setFormData({ ...formData, code: event.target.value })} /></label>
                <label>Nome<input required value={formData.name || ''} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></label>
                <label>Email<input type="email" value={formData.email || ''} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></label>
                <label>Telefone<input value={formData.phone || ''} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></label>
              </>
            ) : null}

            {activeForm === 'supplier' ? (
              <>
                <label>Nome<input required value={formData.name || ''} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></label>
                <label>Empresa<input value={formData.company || ''} onChange={(event) => setFormData({ ...formData, company: event.target.value })} /></label>
                <label>Telefone<input value={formData.phone || ''} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></label>
                <label>Email<input type="email" value={formData.email || ''} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></label>
                <label>NIF<input value={formData.nif || ''} onChange={(event) => setFormData({ ...formData, nif: event.target.value })} /></label>
                <label>Produtos fornecidos<input value={formData.products || ''} onChange={(event) => setFormData({ ...formData, products: event.target.value })} /></label>
              </>
            ) : null}

            {activeForm === 'cashMovement' ? (
              <>
                <label>Tipo<select required value={formData.type || ''} onChange={(event) => setFormData({ ...formData, type: event.target.value })}><option value="">Selecione</option><option value="INCOME">Entrada</option><option value="EXPENSE">Saída</option></select></label>
                <label>Descrição<input required value={formData.description || ''} onChange={(event) => setFormData({ ...formData, description: event.target.value })} /></label>
                <label>Valor<input required type="number" min="0" step="0.01" value={formData.value || ''} onChange={(event) => setFormData({ ...formData, value: event.target.value })} /></label>
              </>
            ) : null}

            {activeForm === 'cashClose' ? (
              <>
                <p>Registe o valor final do caixa para encerrar o dia de trabalho.</p>
                <label>Valor final<input required type="number" min="0" step="0.01" value={formData.closingAmount || ''} onChange={(event) => setFormData({ ...formData, closingAmount: event.target.value })} /></label>
              </>
            ) : null}

            {activeForm === 'expense' ? (
              <>
                <label>Categoria<input required value={formData.category || ''} onChange={(event) => setFormData({ ...formData, category: event.target.value })} placeholder="Ex.: Transporte" /></label>
                <label>Descrição<input required value={formData.description || ''} onChange={(event) => setFormData({ ...formData, description: event.target.value })} /></label>
                <label>Valor<input required type="number" min="0.01" step="0.01" value={formData.value || ''} onChange={(event) => setFormData({ ...formData, value: event.target.value })} /></label>
              </>
            ) : null}

            {activeForm === 'settings' ? (
              <>
                <label>Nome da empresa<input required value={formData.companyName || ''} onChange={(event) => setFormData({ ...formData, companyName: event.target.value })} /></label>
                <label>NIF<input value={formData.nif || ''} onChange={(event) => setFormData({ ...formData, nif: event.target.value })} /></label>
                <label>Telefone<input value={formData.phone || ''} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} /></label>
                <label>Email<input type="email" value={formData.email || ''} onChange={(event) => setFormData({ ...formData, email: event.target.value })} /></label>
                <label>Endereço<input value={formData.address || ''} onChange={(event) => setFormData({ ...formData, address: event.target.value })} /></label>
                <label>Moeda<input value={formData.currency || 'AOA'} onChange={(event) => setFormData({ ...formData, currency: event.target.value })} /></label>
              </>
            ) : null}

            {activeForm === 'product' ? (
              <>
                <label>SKU<input required value={formData.sku || ''} onChange={(event) => setFormData({ ...formData, sku: event.target.value })} /></label>
                <label>Nome do produto<input required value={formData.name || ''} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></label>
                <label>Preço de venda<input required type="number" min="0" step="0.01" value={formData.salePrice || ''} onChange={(event) => setFormData({ ...formData, salePrice: event.target.value })} /></label>
                <label>Stock inicial<input type="number" min="0" value={formData.stockCurrent || '0'} onChange={(event) => setFormData({ ...formData, stockCurrent: event.target.value })} /></label>
                <label>Categoria
                  <select value={formData.categoryId || ''} onChange={(event) => setFormData({ ...formData, categoryId: event.target.value })}>
                    <option value="">Sem categoria</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
              </>
            ) : null}

            {activeForm === 'department' ? (
              <>
                <label>Nome<input required value={formData.name || ''} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></label>
                <label>Descrição<input value={formData.description || ''} onChange={(event) => setFormData({ ...formData, description: event.target.value })} /></label>
              </>
            ) : null}

            {activeForm === 'position' || activeForm === 'category' ? (
              <label>Nome<input required value={formData.name || ''} onChange={(event) => setFormData({ ...formData, name: event.target.value })} /></label>
            ) : null}

            {activeForm === 'sale' ? (
              <>
                <label>Cliente
                  <select required value={formData.clientId || ''} onChange={(event) => setFormData({ ...formData, clientId: event.target.value })}>
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.name} ({client.code})</option>)}
                  </select>
                </label>
                <label>Produto
                  <select required value={formData.productId || ''} onChange={(event) => setFormData({ ...formData, productId: event.target.value })}>
                    <option value="">Selecione um produto</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
                  </select>
                </label>
                <label>Quantidade<input required type="number" min="1" value={formData.quantity || '1'} onChange={(event) => setFormData({ ...formData, quantity: event.target.value })} /></label>
                <label>Preço unitário<input type="number" min="0" step="0.01" value={formData.price || ''} onChange={(event) => setFormData({ ...formData, price: event.target.value })} /></label>
                <label>Método de pagamento
                  <select value={formData.paymentMethod || 'CASH'} onChange={(event) => setFormData({ ...formData, paymentMethod: event.target.value })}>
                    <option value="CASH">Dinheiro</option><option value="BANK_TRANSFER">Transferência</option><option value="TPA">TPA</option>
                  </select>
                </label>
              </>
            ) : null}

            {activeForm === 'movement' ? (
              <>
                <label>Produto
                  <select required value={formData.productId || ''} onChange={(event) => setFormData({ ...formData, productId: event.target.value })}>
                    <option value="">Selecione um produto</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
                  </select>
                </label>
                <label>Tipo
                  <select required value={formData.movementType || 'ENTRY'} onChange={(event) => setFormData({ ...formData, movementType: event.target.value })}>
                    <option value="ENTRY">Entrada</option><option value="EXIT">Saída</option><option value="RETURN">Devolução</option><option value="ADJUSTMENT">Ajuste</option><option value="LOSS">Perda</option>
                  </select>
                </label>
                <label>Quantidade<input required type="number" min="1" value={formData.quantity || ''} onChange={(event) => setFormData({ ...formData, quantity: event.target.value })} /></label>
                <label>Motivo<input value={formData.reason || ''} onChange={(event) => setFormData({ ...formData, reason: event.target.value })} /></label>
              </>
            ) : null}

            <button type="submit" className="primary-btn" disabled={isSubmitting}>{isSubmitting ? 'A guardar...' : 'Guardar'}</button>
          </form>
        </div>
      ) : null}

      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.png" alt="HEL Technology Service" />
          <div className="company-sidebar-info">
            <strong>{companySettings?.companyName || 'Empresa'}</strong>
            {companySettings?.nif && <span>NIF {companySettings.nif}</span>}
            {companySettings?.phone && <span>{companySettings.phone}</span>}
            {companySettings?.email && <span>{companySettings.email}</span>}
            {companySettings?.address && <span>{companySettings.address}</span>}
          </div>
        </div>
        <nav>
          {moduleConfig.map((module) => (
            <button
              key={module}
              type="button"
              className={module === currentModule ? 'nav-item active' : 'nav-item'}
              onClick={() => setCurrentModule(module)}
            >
              {module}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Visão geral</p>
            <h1>{currentModule}</h1>
          </div>
          <div className="topbar-actions">
            <span className="user-pill">{session.user.name || session.user.role}</span>
            <button type="button" onClick={handleLogout}>Sair</button>
          </div>
        </header>

        {error ? <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div> : null}

        <div key={currentModule} className="module-transition">
          {renderModuleContent()}
        </div>
      </main>
    </div>
  )
}
