import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.client.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { nif: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } })
    if (!client) throw new NotFoundException('Cliente não encontrado.')
    return client
  }

  async create(data: any) {
    return this.prisma.client.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type ?? 'INDIVIDUAL',
        phone: data.phone,
        email: data.email,
        address: data.address,
        nif: data.nif,
        status: data.status ?? 'ACTIVE',
        observations: data.observations,
      },
    })
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.client.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Cliente não encontrado.')

    return this.prisma.client.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        phone: data.phone,
        email: data.email,
        address: data.address,
        nif: data.nif,
        status: data.status,
        observations: data.observations,
      },
    })
  }

  async remove(id: string) {
    const exists = await this.prisma.client.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Cliente não encontrado.')

    return this.prisma.client.delete({ where: { id } })
  }
}
