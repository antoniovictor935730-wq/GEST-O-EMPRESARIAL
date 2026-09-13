import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    return this.prisma.employee.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { employeeCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        department: true,
        position: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { department: true, position: true },
    })

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado.')
    }

    return employee
  }

  async create(data: any) {
    return this.prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        fullName: data.fullName,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        phone: data.phone,
        email: data.email,
        address: data.address,
        identificationNo: data.identificationNo,
        contractType: data.contractType,
        hireDate: data.hireDate ? new Date(data.hireDate) : null,
        salary: data.salary ? Number(data.salary) : null,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        status: data.status ?? 'ACTIVE',
        photoUrl: data.photoUrl,
        notes: data.notes,
        department: data.departmentId ? { connect: { id: data.departmentId } } : undefined,
        position: data.positionId ? { connect: { id: data.positionId } } : undefined,
      },
    })
  }

  async update(id: string, data: any) {
    const exists = await this.prisma.employee.findUnique({ where: { id } })
    if (!exists) {
      throw new NotFoundException('Funcionário não encontrado.')
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        employeeCode: data.employeeCode,
        fullName: data.fullName,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        phone: data.phone,
        email: data.email,
        address: data.address,
        identificationNo: data.identificationNo,
        contractType: data.contractType,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        salary: data.salary !== undefined ? Number(data.salary) : undefined,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        status: data.status,
        photoUrl: data.photoUrl,
        notes: data.notes,
        department: data.departmentId ? { connect: { id: data.departmentId } } : undefined,
        position: data.positionId ? { connect: { id: data.positionId } } : undefined,
      },
    })
  }

  async remove(id: string) {
    const exists = await this.prisma.employee.findUnique({ where: { id } })
    if (!exists) {
      throw new NotFoundException('Funcionário não encontrado.')
    }

    return this.prisma.employee.delete({ where: { id } })
  }
}
