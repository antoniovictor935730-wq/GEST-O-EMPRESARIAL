import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } })
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({ where: { id } })
    if (!department) {
      throw new NotFoundException('Departamento não encontrado.')
    }
    return department
  }

  async create(data: any) {
    return this.prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
      },
    })
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.department.findUnique({ where: { id } })
    if (!exists) {
      throw new NotFoundException('Departamento não encontrado.')
    }

    return this.prisma.department.update({
      where: { id },
      data,
    })
  }

  async remove(id: string) {
    const exists = await this.prisma.department.findUnique({ where: { id } })
    if (!exists) {
      throw new NotFoundException('Departamento não encontrado.')
    }

    return this.prisma.department.delete({ where: { id } })
  }
}
