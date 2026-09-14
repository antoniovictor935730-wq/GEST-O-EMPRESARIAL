import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [sales, expenses, movements] = await Promise.all([
      this.prisma.sale.aggregate({ _sum: { total: true } }),
      this.prisma.expense.aggregate({ _sum: { value: true } }),
      this.prisma.cashMovement.aggregate({ _sum: { value: true } }),
    ])

    return {
      totalSales: Number(sales._sum.total ?? 0),
      totalExpenses: Number(expenses._sum.value ?? 0),
      totalMovements: Number(movements._sum.value ?? 0),
      cashAvailable: Number(sales._sum.total ?? 0) - Number(expenses._sum.value ?? 0),
    }
  }

  async createRegister(data: any) {
    const closingAmount = Number(data.closingAmount)
    if (!Number.isFinite(closingAmount) || closingAmount < 0) {
      throw new BadRequestException('Informe um valor final válido para fechar o dia.')
    }

    return this.prisma.cashRegister.create({
      data: {
        date: new Date(data.date || Date.now()),
        employeeName: data.employeeName,
        openingAmount: Number(data.openingAmount || 0),
        closingAmount,
      },
    })
  }

  async addMovement(data: any) {
    return this.prisma.cashMovement.create({
      data: {
        type: data.type,
        description: data.description,
        value: Number(data.value || 0),
        date: new Date(data.date || Date.now()),
        time: data.time || new Date().toLocaleTimeString('pt-PT'),
        userName: data.userName,
      },
    })
  }
}
