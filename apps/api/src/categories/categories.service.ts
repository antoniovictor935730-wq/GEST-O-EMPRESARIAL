import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } })
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } })
    if (!category) throw new NotFoundException('Categoria não encontrada.')
    return category
  }

  async create(data: any) {
    return this.prisma.category.create({
      data: {
        name: data.name,
      },
    })
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.category.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Categoria não encontrada.')

    return this.prisma.category.update({
      where: { id },
      data: { name: data.name },
    })
  }

  async remove(id: string) {
    const exists = await this.prisma.category.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Categoria não encontrada.')

    return this.prisma.category.delete({ where: { id } })
  }
}
