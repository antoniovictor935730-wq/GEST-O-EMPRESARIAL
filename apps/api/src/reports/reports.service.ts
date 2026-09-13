import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

type ReportSale = { total: unknown }
type ReportExpense = { value: unknown }
type ReportRevenue = { value: unknown }
type NormalizedReportSale = { total: number }
type NormalizedReportExpense = { value: number }
type NormalizedReportRevenue = { value: number }

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
    })).map((sale: ReportSale) => ({ ...sale, total: Number(sale.total) }))

    return {
      period: period || '30d',
      data: sales,
      total: sales.reduce((sum: number, sale: NormalizedReportSale) => sum + sale.total, 0),
    }
  }

  async financial(period?: string) {
    const expenses = (await this.prisma.expense.findMany({
      where: period === 'month' ? { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } : undefined,
      orderBy: { date: 'asc' },
    })).map((expense: ReportExpense) => ({ ...expense, value: Number(expense.value) }))

    const revenues = (await this.prisma.revenue.findMany({
      where: period === 'month' ? { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } : undefined,
      orderBy: { date: 'asc' },
    })).map((revenue: ReportRevenue) => ({ ...revenue, value: Number(revenue.value) }))

    const sales = (await this.prisma.sale.findMany({
      where: period === 'month' ? { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } : undefined,
      orderBy: { date: 'asc' },
    })).map((sale: ReportSale) => ({ ...sale, total: Number(sale.total) }))

    return {
      expenses,
      revenues,
      sales,
      totalExpenses: expenses.reduce((sum: number, item: NormalizedReportExpense) => sum + item.value, 0),
      totalRevenues: revenues.reduce((sum: number, item: NormalizedReportRevenue) => sum + item.value, 0),
      totalSales: sales.reduce((sum: number, item: NormalizedReportSale) => sum + item.total, 0),
    }
  }
}
