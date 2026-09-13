import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.supplier.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { nif: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } })
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado.')
    return supplier
  }

  async create(data: any) {
    return this.prisma.supplier.create({
      data: {
        name: data.name,
        company: data.company,
        phone: data.phone,
        email: data.email,
        address: data.address,
        nif: data.nif,
        products: data.products,
        purchases: data.purchases ? Number(data.purchases) : null,
        paidAmount: data.paidAmount ? Number(data.paidAmount) : null,
        pendingAmount: data.pendingAmount ? Number(data.pendingAmount) : null,
      },
    })
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.supplier.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Fornecedor não encontrado.')

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        company: data.company,
        phone: data.phone,
        email: data.email,
        address: data.address,
        nif: data.nif,
        products: data.products,
        purchases: data.purchases !== undefined ? Number(data.purchases) : undefined,
        paidAmount: data.paidAmount !== undefined ? Number(data.paidAmount) : undefined,
        pendingAmount: data.pendingAmount !== undefined ? Number(data.pendingAmount) : undefined,
      },
    })
  }

  async remove(id: string) {
    const exists = await this.prisma.supplier.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Fornecedor não encontrado.')

    return this.prisma.supplier.delete({ where: { id } })
  }
}
