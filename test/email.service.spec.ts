import { Test, TestingModule } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { EmailService } from 'src/users/email.service';

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
      providers: [EmailService],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send an email', async () => {
      const email = 'test@example.com';
      const token = '123456';

      await emailService.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verificação de Conta',
        text: `Seu token de verificação é: ${token}`,
      });
    });
  });
});
