import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.sale.findMany({
      where: search
        ? {
            OR: [
              { saleNumber: { contains: search, mode: 'insensitive' } },
              { userName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        client: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        client: true,
        items: { include: { product: true } },
      },
    })

    if (!sale) throw new NotFoundException('Venda não encontrada.')
    return sale
  }

  async create(data: any) {
    const items = data.items || []
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('A venda deve conter pelo menos um item.')
    }

    let subtotal = 0
    const normalizedItems: any[] = []

    for (const item of items) {
      const product = await this.prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) throw new NotFoundException(`Produto com ID ${item.productId} não encontrado.`)

      const quantity = Number(item.quantity || 1)
      if (quantity <= 0) throw new BadRequestException('A quantidade do item deve ser maior que zero.')
      if (product.stockCurrent < quantity) {
        throw new BadRequestException(`Stock insuficiente para o produto ${product.name}.`)
      }

      const price = Number(item.price || product.salePrice)
      const itemTotal = quantity * price
      subtotal += itemTotal

      normalizedItems.push({
        product,
        quantity,
        price,
        itemTotal,
      })
    }

    const saleNumber = data.saleNumber || `SV-${Date.now()}`
    const discount = Number(data.discount || 0)
    const total = Number(data.total || subtotal - discount)

    const sale = await this.prisma.sale.create({
      data: {
        saleNumber,
        date: new Date(data.date || Date.now()),
        time: data.time || new Date().toLocaleTimeString('pt-PT'),
        userName: data.userName,
        clientId: data.clientId || null,
        subtotal: subtotal,
        discount,
        total,
        paymentMethod: data.paymentMethod || 'CASH',
        status: data.status || 'PAID',
      },
    })

    for (const item of normalizedItems) {
      await this.prisma.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
          total: item.itemTotal,
        },
      })

      await this.prisma.stockMovement.create({
        data: {
          productId: item.product.id,
          quantity: item.quantity,
          movementType: 'SALE',
          reason: 'Venda registrada',
          userName: data.userName,
        },
      })

      await this.prisma.product.update({
        where: { id: item.product.id },
        data: {
          stockCurrent: item.product.stockCurrent - item.quantity,
        },
      })
    }

    return sale
  }
}
