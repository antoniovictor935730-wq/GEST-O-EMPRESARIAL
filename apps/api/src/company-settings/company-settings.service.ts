import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CompanySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateDefault() {
    const settings = await this.prisma.companySetting.findFirst()

    if (settings) {
      return settings
    }

    return this.prisma.companySetting.create({
      data: {
        companyName: 'Empresa Demo',
        currency: 'AOA',
        nif: '123456789',
        phone: '+244 000 000 000',
        email: 'contato@empresa.com',
        address: 'Luanda, Angola',
      },
    })
  }

  async create(data: any) {
    return this.prisma.companySetting.create({ data })
  }

  async update(data: any) {
    const current = await this.findOrCreateDefault()
    return this.prisma.companySetting.update({
      where: { id: current.id },
      data,
    })
  }
}
