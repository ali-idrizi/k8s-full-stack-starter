import { Prisma, User } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'

export class UserDb {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    })
  }

  async createUser(user: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: user,
    })
  }
}
