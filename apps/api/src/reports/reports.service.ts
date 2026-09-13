import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async sales(period?: string) {
    const now = new Date()
    const startDate = new Date()

    if (period === 'month') {
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'year') {
      startDate.setMonth(0, 1)
      startDate.setHours(0, 0, 0, 0)
    } else {
      startDate.setDate(now.getDate() - 30)
    }

    const sales = (await this.prisma.sale.findMany({
      where: { date: { gte: startDate } },
      include: { client: true },
      orderBy: { date: 'asc' },
    })).map((sale) => ({ ...sale, total: Number(sale.total) }))

    return {
      period: period || '30d',
      data: sales,
      total: sales.reduce((sum: number, sale) => sum + Number(sale.total), 0),
    }
  }

  async financial(period?: string) {
    const expenses = (await this.prisma.expense.findMany({
      where: period === 'month' ? { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } : undefined,
      orderBy: { date: 'asc' },
    })).map((expense) => ({ ...expense, value: Number(expense.value) }))

    const revenues = (await this.prisma.revenue.findMany({
      where: period === 'month' ? { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } : undefined,
      orderBy: { date: 'asc' },
    })).map((revenue) => ({ ...revenue, value: Number(revenue.value) }))

    const sales = (await this.prisma.sale.findMany({
      where: period === 'month' ? { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } : undefined,
      orderBy: { date: 'asc' },
    })).map((sale) => ({ ...sale, total: Number(sale.total) }))

    return {
      expenses,
      revenues,
      sales,
      totalExpenses: expenses.reduce((sum: number, item) => sum + Number(item.value), 0),
      totalRevenues: revenues.reduce((sum: number, item) => sum + Number(item.value), 0),
      totalSales: sales.reduce((sum: number, item) => sum + Number(item.total), 0),
    }
  }
}
