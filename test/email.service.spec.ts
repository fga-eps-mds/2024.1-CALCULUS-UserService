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
      const loginLink = process.env.EMAIL_LINK;

      const email = 'test@example.com';

      await emailService.sendVerificationEmail(email);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Bem-vindo!',
        html: `
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #fff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #333;
              font-size: 24px;
              margin-top: 0;
            }
            p {
              line-height: 1.6;
              margin: 0 0 10px;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              font-size: 16px;
              color: #fff !important; /* Ensures text color is white */
              background-color: #f97316 !important; /* Tailwind's orange-500 color */
              text-decoration: none !important;
              border-radius: 9999px !important; /* Tailwind's rounded-full */
              margin-top: 20px;
              text-align: center;
              font-weight: bold !important;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important; /* Tailwind's shadow-md */
              transition: box-shadow 0.3s ease !important; /* Tailwind's transition duration */
            }
            .button:hover {
              box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2) !important; /* Tailwind's shadow-lg */
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #888;
              text-align: center;
            }
            .footer a {
              color: #007bff;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Bem-vindo ao Nosso Serviço!</h1>
            <p>Olá,</p>
            <p>Seu cadastro foi realizado com sucesso. Para acessar sua conta, clique no botão abaixo:</p>
            <div style="text-align: center;">
              <a href="${loginLink}" class="button">Acessar Conta</a>
            </div>
            <p>Se você não se cadastrou em nosso serviço, por favor ignore este e-mail.</p>
            <div class="footer">
              <p>Obrigado por se cadastrar!</p>
              <p>Equipe de Suporte</p>
              <p><a href="${loginLink}">${loginLink}</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      });
    });
  });
});
