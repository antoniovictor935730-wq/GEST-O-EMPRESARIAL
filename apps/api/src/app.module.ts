import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CompanySettingsModule } from './company-settings/company-settings.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { EmployeesModule } from './employees/employees.module'
import { DepartmentsModule } from './departments/departments.module'
import { PositionsModule } from './positions/positions.module'
import { ClientsModule } from './clients/clients.module'
import { SuppliersModule } from './suppliers/suppliers.module'
import { CategoriesModule } from './categories/categories.module'
import { ProductsModule } from './products/products.module'
import { StockModule } from './stock/stock.module'
import { SalesModule } from './sales/sales.module'
import { CashModule } from './cash/cash.module'
import { FinanceModule } from './finance/finance.module'
import { ReportsModule } from './reports/reports.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CompanySettingsModule,
    DashboardModule,
    EmployeesModule,
    DepartmentsModule,
    PositionsModule,
    ClientsModule,
    SuppliersModule,
    CategoriesModule,
    ProductsModule,
    StockModule,
    SalesModule,
    CashModule,
    FinanceModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
