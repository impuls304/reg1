import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Создание транспорта для отправки email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendVerificationCode(email: string, code: string, firstName: string) {
  // В режиме разработки просто логируем код
  if (process.env.NODE_ENV === 'development') {
    console.log(`\n📧 [DEV MODE] Код подтверждения для ${email}: ${code}\n`);
    return { success: true, dev: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Регистрация на мероприятие" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Код подтверждения регистрации',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Подтверждение регистрации</h1>
            </div>
            <div class="content">
              <p>Здравствуйте, ${firstName}!</p>
              <p>Спасибо за регистрацию на наше мероприятие. Для завершения регистрации используйте следующий код подтверждения:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p>Код действителен в течение 15 минут.</p>
              <p>Если вы не регистрировались на мероприятие, просто проигнорируйте это письмо.</p>
              
              <div class="footer">
                <p>С уважением,<br>Команда организаторов</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Здравствуйте, ${firstName}!\n\nВаш код подтверждения: ${code}\n\nКод действителен в течение 15 минут.`,
    });

    console.log('✓ Email отправлен:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Ошибка при отправке email:', error);
    throw error;
  }
}

// Генерация 6-значного кода
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
