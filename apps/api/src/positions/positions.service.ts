import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.position.findMany({ orderBy: { name: 'asc' } })
  }

  async findOne(id: string) {
    const position = await this.prisma.position.findUnique({ where: { id } })
    if (!position) {
      throw new NotFoundException('Cargo não encontrado.')
    }
    return position
  }

  async create(data: any) {
    return this.prisma.position.create({
      data: {
        name: data.name,
      },
    })
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.position.findUnique({ where: { id } })
    if (!exists) {
      throw new NotFoundException('Cargo não encontrado.')
    }

    return this.prisma.position.update({
      where: { id },
      data,
    })
  }

  async remove(id: string) {
    const exists = await this.prisma.position.findUnique({ where: { id } })
    if (!exists) {
      throw new NotFoundException('Cargo não encontrado.')
    }

    return this.prisma.position.delete({ where: { id } })
  }
}
