import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })
    if (!product) throw new NotFoundException('Produto não encontrado.')
    return product
  }

  async create(data: any) {
    return this.prisma.product.create({
      data: {
        sku: data.sku,
        barcode: data.barcode,
        name: data.name,
        description: data.description,
        brand: data.brand,
        unit: data.unit,
        purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : 0,
        salePrice: Number(data.salePrice),
        stockCurrent: Number(data.stockCurrent ?? 0),
        stockMin: Number(data.stockMin ?? 0),
        stockMax: Number(data.stockMax ?? 0),
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
      },
    })
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.product.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Produto não encontrado.')

    return this.prisma.product.update({
      where: { id },
      data: {
        sku: data.sku,
        barcode: data.barcode,
        name: data.name,
        description: data.description,
        brand: data.brand,
        unit: data.unit,
        purchasePrice: data.purchasePrice !== undefined ? Number(data.purchasePrice) : undefined,
        salePrice: data.salePrice !== undefined ? Number(data.salePrice) : undefined,
        stockCurrent: data.stockCurrent !== undefined ? Number(data.stockCurrent) : undefined,
        stockMin: data.stockMin !== undefined ? Number(data.stockMin) : undefined,
        stockMax: data.stockMax !== undefined ? Number(data.stockMax) : undefined,
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
      },
    })
  }

  async remove(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Produto não encontrado.')

    return this.prisma.product.delete({ where: { id } })
  }
}
