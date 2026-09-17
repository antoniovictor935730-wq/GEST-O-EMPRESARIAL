import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): { message: string } {
    return { message: 'API ERP em funcionamento' }
  }

  async resetOperationalData() {
    await this.prisma.$transaction([
      this.prisma.auditLog.deleteMany(),
      this.prisma.payrollPayment.deleteMany(),
      this.prisma.payrollAdjustment.deleteMany(),
      this.prisma.attendance.deleteMany(),
      this.prisma.vacation.deleteMany(),
      this.prisma.saleItem.deleteMany(),
      this.prisma.sale.deleteMany(),
      this.prisma.stockMovement.deleteMany(),
      this.prisma.cashMovement.deleteMany(),
      this.prisma.cashRegister.deleteMany(),
      this.prisma.expense.deleteMany(),
      this.prisma.revenue.deleteMany(),
      this.prisma.product.deleteMany(),
      this.prisma.category.deleteMany(),
      this.prisma.supplier.deleteMany(),
      this.prisma.client.deleteMany(),
      this.prisma.employee.deleteMany(),
      this.prisma.position.deleteMany(),
      this.prisma.department.deleteMany(),
    ])

    return { message: 'Dados operacionais reiniciados com sucesso.' }
  }
}
