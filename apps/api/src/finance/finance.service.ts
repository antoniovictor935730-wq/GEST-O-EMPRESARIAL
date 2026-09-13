import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getExpenses() {
    return this.prisma.expense.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async getRevenues() {
    return this.prisma.revenue.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async getSummary() {
    const [totalExpenses, totalRevenues, totalSales] = await Promise.all([
      this.prisma.expense.aggregate({ _sum: { value: true } }),
      this.prisma.revenue.aggregate({ _sum: { value: true } }),
      this.prisma.sale.aggregate({ _sum: { total: true } }),
    ])

    return {
      expenses: Number(totalExpenses._sum.value ?? 0),
      revenues: Number(totalRevenues._sum.value ?? 0),
      sales: Number(totalSales._sum.total ?? 0),
      profit: Number(totalSales._sum.total ?? 0) - Number(totalExpenses._sum.value ?? 0),
    }
  }

  async createExpense(data: any) {
    return this.prisma.expense.create({
      data: {
        category: data.category,
        description: data.description,
        value: Number(data.value || 0),
        date: new Date(data.date || Date.now()),
      },
    })
  }

  async createRevenue(data: any) {
    return this.prisma.revenue.create({
      data: {
        source: data.source,
        description: data.description,
        value: Number(data.value || 0),
        date: new Date(data.date || Date.now()),
      },
    })
  }

  async updateExpense(data: any, id: string) {
    const exists = await this.prisma.expense.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Despesa não encontrada.')

    return this.prisma.expense.update({
      where: { id },
      data: {
        category: data.category,
        description: data.description,
        value: Number(data.value || exists.value),
        date: data.date ? new Date(data.date) : exists.date,
      },
    })
  }

  async updateRevenue(data: any, id: string) {
    const exists = await this.prisma.revenue.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Receita não encontrada.')

    return this.prisma.revenue.update({
      where: { id },
      data: {
        source: data.source,
        description: data.description,
        value: Number(data.value || exists.value),
        date: data.date ? new Date(data.date) : exists.date,
      },
    })
  }
}
