import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type DashboardSale = { total: unknown }
type DashboardExpense = { value: unknown }

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(period: string) {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfNextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [salesCount, clientsCount, employeesCount, productsCount, lowStock] = await Promise.all([
      this.prisma.sale.count(),
      this.prisma.client.count(),
      this.prisma.employee.count(),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { stockCurrent: { lte: 5 } } }),
    ])

    const latestTodayRegister = await this.prisma.cashRegister.findFirst({
      where: { date: { gte: startOfDay, lt: startOfNextDay } },
      orderBy: { date: 'desc' },
    })
    const dailySalesStart = latestTodayRegister?.date || startOfDay

    const totalDailySales = await this.prisma.sale.aggregate({
      _sum: { total: true },
      where: { date: { gt: dailySalesStart, lt: startOfNextDay } },
    })

    const totalMonthlySales = await this.prisma.sale.aggregate({
      _sum: { total: true },
      where: { date: { gte: startOfMonth } },
    })

    const totalYearSales = await this.prisma.sale.aggregate({
      _sum: { total: true },
      where: { date: { gte: startOfYear } },
    })

    const [totalExpenses, payrollEmployees] = await Promise.all([
      this.prisma.expense.aggregate({ _sum: { value: true } }),
      this.prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        select: {
          salary: true,
          salaryBonus: true,
          attendance: { where: { createdAt: { gte: startOfMonth, lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) }, absence: true } },
        },
      }),
    ])
    const payrollGross = payrollEmployees.reduce((sum, employee) => sum + Number(employee.salary || 0) + Number(employee.salaryBonus || 0), 0)
    const payrollDiscounts = payrollEmployees.reduce((sum, employee) => sum + (Number(employee.salary || 0) / 30) * employee.attendance.length, 0)

    return {
      period,
      summary: {
        salesToday: Number(totalDailySales._sum.total ?? 0),
        salesMonth: Number(totalMonthlySales._sum.total ?? 0),
        salesYear: Number(totalYearSales._sum.total ?? 0),
        totalExpenses: Number(totalExpenses._sum.value ?? 0),
        estimatedProfit: Number(totalYearSales._sum.total ?? 0) - Number(totalExpenses._sum.value ?? 0),
        clients: clientsCount,
        employees: employeesCount,
        products: productsCount,
        lowStock,
        salesCount,
        payrollGross,
        payrollDiscounts,
        payrollNet: Math.max(0, payrollGross - payrollDiscounts),
        payrollAbsences: payrollEmployees.reduce((sum, employee) => sum + employee.attendance.length, 0),
      },
      recent: {
        sales: (await this.prisma.sale.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { client: true },
        })).map((sale: DashboardSale) => ({ ...sale, total: Number(sale.total) })),
        expenses: (await this.prisma.expense.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        })).map((expense: DashboardExpense) => ({ ...expense, value: Number(expense.value) })),
      },
    }
  }
}
