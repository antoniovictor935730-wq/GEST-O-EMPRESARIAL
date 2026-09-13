import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type DashboardSale = { total: unknown }
type DashboardExpense = { value: unknown }

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(period: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [salesCount, clientsCount, employeesCount, productsCount, lowStock] = await Promise.all([
      this.prisma.sale.count(),
      this.prisma.client.count(),
      this.prisma.employee.count(),
      this.prisma.product.count(),
      this.prisma.product.count({ where: { stockCurrent: { lte: 5 } } }),
    ])

    const totalMonthlySales = await this.prisma.sale.aggregate({
      _sum: { total: true },
      where: { date: { gte: startOfMonth } },
    })

    const totalYearSales = await this.prisma.sale.aggregate({
      _sum: { total: true },
      where: { date: { gte: startOfYear } },
    })

    const totalExpenses = await this.prisma.expense.aggregate({
      _sum: { value: true },
    })

    return {
      period,
      summary: {
        salesToday: Number(totalMonthlySales._sum.total ?? 0),
        salesMonth: Number(totalMonthlySales._sum.total ?? 0),
        salesYear: Number(totalYearSales._sum.total ?? 0),
        totalExpenses: Number(totalExpenses._sum.value ?? 0),
        estimatedProfit: Number(totalYearSales._sum.total ?? 0) - Number(totalExpenses._sum.value ?? 0),
        clients: clientsCount,
        employees: employeesCount,
        products: productsCount,
        lowStock,
        salesCount,
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
