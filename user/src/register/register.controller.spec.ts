import { HttpException, HttpStatus } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ClientProxy } from '@nestjs/microservices'
import { Test, TestingModule } from '@nestjs/testing'
import { Prisma, User } from '@prisma/client'
import { Response } from 'express'
import { DeepMockProxy, mockDeep } from 'jest-mock-extended'
import { PrismaService } from 'nestjs-prisma'
import { of } from 'rxjs'
import { AuthService } from 'src/auth/auth.service'
import { HashUtil } from 'src/common/utils/hash.util'
import { Environment, Tokens } from 'src/user.interface'
import { RegisterController } from './register.controller'
import { RegisterService } from './register.service'

const TEST_USER: User = {
  id: 'id',
  name: 'Test',
  email: 'test@email.com',
  password: HashUtil.hashSync('password'),
  createdAt: new Date(),
  updatedAt: new Date(),
} as const

const TEST_TOKENS: Tokens = {
  jwt: 'jwt',
  refreshToken: 'refreshToken',
} as const

const ENV: Partial<Environment> = {
  JWT_COOKIE_NAME: 'jwt',
  REFRESH_TOKEN_COOKIE_NAME: 'refresh-token',
}

describe('UserController', () => {
  let registerController: RegisterController

  let prisma: DeepMockProxy<PrismaService>
  let authClient: DeepMockProxy<ClientProxy>
  let res: DeepMockProxy<Response>

  beforeEach(async () => {
    prisma = mockDeep()
    authClient = mockDeep()
    res = mockDeep()

    const app: TestingModule = await Test.createTestingModule({
      controllers: [RegisterController],
      providers: [
        RegisterService,
        AuthService,
        {
          provide: 'AUTH_SERVICE',
          useValue: authClient,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [
            (): Partial<Environment> => {
              // Delete variables defined in `ENV` from `process.env`
              // TODO: Use `ignoreEnvVarsOnGet` when https://github.com/nestjs/config/pull/997 is merged
              Object.keys(ENV).forEach((key) => delete process.env[key])

              return ENV
            },
          ],
        }),
      ],
    }).compile()

    registerController = app.get<RegisterController>(RegisterController)
  })

  it('should be defined', () => {
    expect(registerController).toBeDefined()
  })

  describe('/register', () => {
    const registerData = {
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: 'password',
      confirmPassword: 'password',
    }

    it('should create user set cookies', async () => {
      prisma.user.create.mockResolvedValue(TEST_USER)
      authClient.send.mockReturnValue(of(TEST_TOKENS))

      const user = await registerController.register(res, registerData)

      expect(user).toEqual(TEST_USER)

      expect(res.cookie).toHaveBeenCalledWith(
        ENV.JWT_COOKIE_NAME,
        TEST_TOKENS.jwt,
        expect.anything(),
      )
      expect(res.cookie).toHaveBeenCalledWith(
        ENV.REFRESH_TOKEN_COOKIE_NAME,
        TEST_TOKENS.refreshToken,
        expect.anything(),
      )
    })

    it('should throw', async () => {
      // Test that a correct HttpException is thrown when the email is already registered
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Invalid `this.prisma.user.create()` invocation',
          'P2002',
          '',
        ),
      )
      await expect(registerController.register(res, registerData)).rejects.toThrow(
        new HttpException('Email address is already registered', HttpStatus.CONFLICT),
      )

      // Test that the same error is thrown in every other case
      prisma.user.create.mockRejectedValue(new Error())
      await expect(registerController.register(res, registerData)).rejects.toThrow(new Error())
    })
  })
})
