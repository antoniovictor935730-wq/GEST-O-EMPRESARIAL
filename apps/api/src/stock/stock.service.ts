import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { category: true },
      orderBy: { stockCurrent: 'asc' },
    })
  }

  async getSummary() {
    const [totalProducts, lowStock, outOfStock, totalUnits] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { stockCurrent: { lte: 10 } } }),
      this.prisma.product.count({ where: { stockCurrent: { lte: 0 } } }),
      this.prisma.product.aggregate({ _sum: { stockCurrent: true } }),
    ])

    return {
      totalProducts,
      lowStock,
      outOfStock,
      totalUnits: totalUnits._sum.stockCurrent ?? 0,
    }
  }

  async lowStock() {
    return this.prisma.product.findMany({
      where: {
        OR: [{ stockCurrent: { lte: 10 } }, { stockCurrent: { lte: 0 } }],
      },
      include: { category: true },
      orderBy: { stockCurrent: 'asc' },
    })
  }

  async history(productId?: string) {
    return this.prisma.stockMovement.findMany({
      where: productId ? { productId } : undefined,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  }

  async addMovement(data: any) {
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } })
    if (!product) throw new NotFoundException('Produto não encontrado.')

    const quantity = Number(data.quantity ?? 0)
    const movementType = data.movementType

    if (Number.isNaN(quantity) || quantity <= 0) {
      throw new BadRequestException('A quantidade da movimentação deve ser maior que zero.')
    }

    let newStock = product.stockCurrent

    if (movementType === 'ENTRY' || movementType === 'RETURN') {
      newStock += quantity
    }

    if (movementType === 'EXIT' || movementType === 'SALE' || movementType === 'LOSS' || movementType === 'TRANSFER') {
      if (product.stockCurrent < quantity) {
        throw new BadRequestException('Stock insuficiente para esta movimentação.')
      }
      newStock -= quantity
    }

    if (movementType === 'ADJUSTMENT') {
      newStock = quantity
    }

    await this.prisma.product.update({
      where: { id: product.id },
      data: { stockCurrent: newStock },
    })

    return this.prisma.stockMovement.create({
      data: {
        productId: product.id,
        quantity,
        movementType: movementType,
        reason: data.reason,
        userName: data.userName,
      },
    })
  }
}
