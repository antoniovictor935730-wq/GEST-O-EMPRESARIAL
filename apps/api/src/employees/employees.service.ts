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

  async getPayroll(month?: string) {
    const selectedMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7)
    const [year, monthNumber] = selectedMonth.split('-').map(Number)
    const startDate = new Date(year, monthNumber - 1, 1)
    const endDate = new Date(year, monthNumber, 1)
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { attendance: { where: { createdAt: { gte: startDate, lt: endDate } } }, department: true, position: true },
      orderBy: { fullName: 'asc' },
    })
    const rows = employees.map((employee) => {
      const salary = Number(employee.salary || 0)
      const bonus = Number(employee.salaryBonus || 0)
      const absences = employee.attendance.filter((record) => record.absence).length
      const discount = (salary / 30) * absences
      return { employeeId: employee.id, employeeCode: employee.employeeCode, fullName: employee.fullName, department: employee.department?.name || null, position: employee.position?.name || null, salary, bonus, absences, discount, netSalary: Math.max(0, salary + bonus - discount) }
    })
    return {
      month: selectedMonth,
      rows,
      totalGross: rows.reduce((sum, row) => sum + row.salary + row.bonus, 0),
      totalDiscounts: rows.reduce((sum, row) => sum + row.discount, 0),
      totalNet: rows.reduce((sum, row) => sum + row.netSalary, 0),
      totalAbsences: rows.reduce((sum, row) => sum + row.absences, 0),
    }
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
        salaryBonus: data.salaryBonus ? Number(data.salaryBonus) : 0,
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
        salaryBonus: data.salaryBonus !== undefined ? Number(data.salaryBonus) : undefined,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        status: data.status,
        photoUrl: data.photoUrl,
        notes: data.notes,
        department: data.departmentId ? { connect: { id: data.departmentId } } : data.departmentId === '' ? { disconnect: true } : undefined,
        position: data.positionId ? { connect: { id: data.positionId } } : data.positionId === '' ? { disconnect: true } : undefined,
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
