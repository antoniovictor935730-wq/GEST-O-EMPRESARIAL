import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  clearSession,
  DashboardSummary,
  EmployeeRecord,
  FinanceSummary,
  getDashboardSummary,
  getEmployees,
  getFinanceEntries,
  getFinanceSummary,
  getFinancialReport,
  getLowStock,
  getProducts,
  getSalesReport,
  getStockHistory,
  getStockSummary,
  getStoredSession,
  loginRequest,
  ProductRecord,
  ReportSummary,
  saveSession,
  SessionState,
  StockAlert,
  StockMovement,
  StockSummary,
} from './lib/api'

const formatMoney = (value: number) => `AOA ${value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fallbackStats = [
  { label: 'Vendas do dia', value: 'AOA 0,00', change: '+0.0%' },
  { label: 'Vendas do mês', value: 'AOA 0,00', change: '+0.0%' },
  { label: 'Despesas', value: 'AOA 0,00', change: '-0.0%' },
  { label: 'Lucro', value: 'AOA 0,00', change: '+0.0%' },
]

const moduleConfig = [
  'Dashboard',
  'Funcionários',
  'Clientes',
  'Fornecedores',
  'Produtos',
  'Stock',
  'Vendas',
  'Caixa',
  'Financeiro',
  'Relatórios',
  'Configurações',
] as const

type ModuleName = typeof moduleConfig[number]

const mockSales = [
  { id: '#1051', customer: 'Maria Silva', total: 'AOA 2.420', status: 'Pago' },
  { id: '#1052', customer: 'João Costa', total: 'AOA 1.760', status: 'Pago' },
  { id: '#1053', customer: 'Ana Gomes', total: 'AOA 3.100', status: 'Em aberto' },
]

export default function App() {
  const [session, setSession] = useState<SessionState | null>(null)
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [products, setProducts] = useState<ProductRecord[]>([])
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
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)

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
      setProducts([])
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
        const [nextEmployees, nextProducts, nextStockSummary, nextLowStock, nextStockHistory, nextFinanceSummary, nextFinanceEntries, nextSalesReport, nextFinancialReport] = await Promise.all([
          getEmployees(session.accessToken),
          getProducts(session.accessToken),
          getStockSummary(session.accessToken),
          getLowStock(session.accessToken),
          getStockHistory(session.accessToken),
          getFinanceSummary(session.accessToken),
          getFinanceEntries(session.accessToken),
          getSalesReport(session.accessToken, 'month'),
          getFinancialReport(session.accessToken, 'month'),
        ])

        setEmployees(nextEmployees)
        setProducts(nextProducts)
        setStockSummary(nextStockSummary)
        setLowStock(nextLowStock)
        setStockHistory(nextStockHistory)
        setFinanceSummary(nextFinanceSummary)
        setFinanceEntries(nextFinanceEntries)
        setSalesReport(nextSalesReport)
        setFinancialReport(nextFinancialReport)
      } catch (moduleError) {
        console.error(moduleError)
      }
    }

    loadDashboard()
    loadModuleData()
  }, [session])

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

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setDashboard(null)
    setError('')
  }

  const renderModuleContent = () => {
    switch (currentModule) {
      case 'Dashboard':
        return (
          <>
            <section className="stats-grid">
              {stats.map((stat) => (
                <article className="card stat-card" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.change}</small>
                </article>
              ))}
            </section>

            <section className="content-grid">
              <article className="card chart-card">
                <div className="section-heading">
                  <h2>Vendas por mês</h2>
                  <span className="chip positive">+18.4%</span>
                </div>
                <div className="chart-bars">
                  {[42, 58, 50, 75, 68, 82, 90, 78, 96, 84, 110, 120].map((height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </article>

              <article className="card summary-card">
                <div className="section-heading">
                  <h2>Fluxo do caixa</h2>
                  <span className="chip neutral">{isLoadingDashboard ? 'A carregar...' : 'Hoje'}</span>
                </div>
                <div className="cash-summary">
                  <div>
                    <label>Entradas</label>
                    <strong>{dashboard ? formatMoney(dashboard.summary.salesMonth) : 'AOA 0,00'}</strong>
                  </div>
                  <div>
                    <label>Saídas</label>
                    <strong>{dashboard ? formatMoney(dashboard.summary.totalExpenses) : 'AOA 0,00'}</strong>
                  </div>
                  <div>
                    <label>Saldo</label>
                    <strong className="accent">
                      {dashboard ? formatMoney(dashboard.summary.estimatedProfit) : 'AOA 0,00'}
                    </strong>
                  </div>
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
              <button type="button" className="primary-btn">Novo funcionário</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Departamento</th>
                  <th>Posição</th>
                  <th>Status</th>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>Sem funcionários registados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )

      case 'Clientes':
        return (
          <section className="card module-card">
            <div className="section-heading">
              <h2>Clientes</h2>
              <button type="button" className="primary-btn">Novo cliente</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Mensal</th>
                </tr>
              </thead>
              <tbody>
                {mockSales.length > 0 ? (
                  mockSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.customer}</td>
                      <td>{sale.customer.toLowerCase().replace(/\s+/g, '.')}@demo.com</td>
                      <td><span className={sale.status === 'Pago' ? 'badge success' : 'badge warning'}>{sale.status}</span></td>
                      <td>{sale.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>Sem clientes registados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )

      case 'Produtos':
        return (
          <section className="card module-card">
            <div className="section-heading">
              <h2>Produtos</h2>
              <button type="button" className="primary-btn">Adicionar produto</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Stock</th>
                  <th>Preço</th>
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

            <section className="content-grid">
              <article className="card module-card">
                <div className="section-heading">
                  <h2>Alertas de stock</h2>
                  <button type="button" className="primary-btn">Nova movimentação</button>
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
              <button type="button" className="primary-btn">Nova venda</button>
            </div>
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
                {mockSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.id}</td>
                    <td>{sale.customer}</td>
                    <td>{sale.total}</td>
                    <td><span className={sale.status === 'Em aberto' ? 'badge warning' : 'badge success'}>{sale.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
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
                <strong>{financialReport ? formatMoney(Number((financialReport.totalRevenues || 0) - (financialReport.totalExpenses || 0))) : 'AOA 0,00'}</strong>
                <small>Resultado líquido</small>
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

      default:
        return (
          <section className="card module-card">
            <h2>{currentModule}</h2>
            <p>Esta área do ERP será expandida com gestão específica para este módulo.</p>
          </section>
        )
    }
  }

  if (!session) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">ERP</div>
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
      <aside className="sidebar">
        <div className="brand">ERP</div>
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

        {renderModuleContent()}
      </main>
    </div>
  )
}
