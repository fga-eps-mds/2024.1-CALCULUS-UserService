import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from 'src/users/email.service';

jest.mock('nodemailer');
jest.mock('nodemailer-sendgrid-transport', () =>
  jest.fn(() => ({
    sendMail: jest.fn(),
  })),
);

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: jest.Mocked<nodemailer.Transporter>;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<nodemailer.Transporter>;

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'FRONTEND_URL':
                  return 'http://frontend-url.com';
                case 'SENDGRID_API_KEY':
                  return 'fake-api-key';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send an email', async () => {
      const email = 'test@example.com';

      await emailService.sendVerificationEmail(email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Bem-vindo!',
        html: expect.any(String),
      });
    });
  });

  describe('sendForgotPassword', () => {
    it('should send a password reset email', async () => {
      const token = 'test-token';
      const email = 'test@example.com';

      await emailService.sendPasswordResetEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Solicitação de Redefinição de Senha',
        html: expect.any(String),
      });
    });
  });
});
