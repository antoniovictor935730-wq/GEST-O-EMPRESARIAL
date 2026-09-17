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
    const { startDate, endDate } = this.getPeriodDates(period, now)

    const sales = (await this.prisma.sale.findMany({
      where: { date: { gte: startDate, lt: endDate } },
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
    const { startDate, endDate } = this.getPeriodDates(period, new Date())
    const dateFilter = { gte: startDate, lt: endDate }
    const expenses = (await this.prisma.expense.findMany({
      where: { date: dateFilter },
      orderBy: { date: 'asc' },
    })).map((expense: ReportExpense) => ({ ...expense, value: Number(expense.value) }))

    const revenues = (await this.prisma.revenue.findMany({
      where: { date: dateFilter },
      orderBy: { date: 'asc' },
    })).map((revenue: ReportRevenue) => ({ ...revenue, value: Number(revenue.value) }))

    const sales = (await this.prisma.sale.findMany({
      where: { date: dateFilter },
      orderBy: { date: 'asc' },
    })).map((sale: ReportSale) => ({ ...sale, total: Number(sale.total) }))

    const totalExpenses = expenses.reduce((sum: number, item: NormalizedReportExpense) => sum + item.value, 0)
    const totalRevenues = revenues.reduce((sum: number, item: NormalizedReportRevenue) => sum + item.value, 0)
    const totalSales = sales.reduce((sum: number, item: NormalizedReportSale) => sum + item.total, 0)

    return {
      expenses,
      revenues,
      sales,
      totalExpenses,
      totalRevenues,
      totalSales,
      profit: totalSales - totalExpenses,
    }
  }

  private getPeriodDates(period: string | undefined, now: Date) {
    const startDate = new Date(now)
    const endDate = new Date(now)

    if (period === 'day') {
      startDate.setHours(0, 0, 0, 0)
      endDate.setDate(endDate.getDate() + 1)
      endDate.setHours(0, 0, 0, 0)
    } else if (period === 'year') {
      startDate.setMonth(0, 1)
      startDate.setHours(0, 0, 0, 0)
      endDate.setFullYear(endDate.getFullYear() + 1, 0, 1)
      endDate.setHours(0, 0, 0, 0)
    } else {
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      endDate.setMonth(endDate.getMonth() + 1, 1)
      endDate.setHours(0, 0, 0, 0)
    }

    return { startDate, endDate }
  }
}
