const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@erp.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    console.log(`Admin user already exists: ${email}`)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email,
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log(`Admin user created: ${email}`)
}

main()
  .catch((error) => {
    console.error('Unable to seed admin user:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
