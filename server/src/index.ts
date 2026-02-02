import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { pool } from './db.js';
import { sendVerificationCode, generateVerificationCode } from './email.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.json());

// CORS настройка
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // максимум 10 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже',
});

app.use('/api/', limiter);

// Utility функция для логирования попыток
async function logAttempt(email: string, ip: string, success: boolean, errorMessage?: string) {
  try {
    await pool.query(
      'INSERT INTO registration_attempts (email, ip_address, success, error_message) VALUES ($1, $2, $3, $4)',
      [email, ip, success, errorMessage]
    );
  } catch (err) {
    console.error('Ошибка логирования попытки:', err);
  }
}

// Проверка доступности регистрации
app.get('/api/availability', async (req: Request, res: Response) => {
  try {
    const maxParticipants = parseInt(process.env.MAX_PARTICIPANTS || '100');
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE is_verified = true'
    );
    const currentCount = parseInt(result.rows[0].count);
    
    res.json({
      available: currentCount < maxParticipants,
      currentCount,
      maxParticipants,
    });
  } catch (error) {
    console.error('Ошибка проверки доступности:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Регистрация (шаг 1: отправка кода)
app.post('/api/register', async (req: Request, res: Response) => {
  const { firstName, lastName, email, honeypot, formStartTime } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    // Валидация
    if (!firstName || !lastName || !email) {
      await logAttempt(email, ip, false, 'Отсутствуют обязательные поля');
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    // Проверка honeypot (защита отботов)
    if (honeypot) {
      await logAttempt(email, ip, false, 'Honeypot заполнен');
      return res.status(400).json({ error: 'Обнаружена подозрительная активность' });
    }

    // Проверка времени заполнения формы (защита от ботов)
    if (formStartTime) {
      const timeTaken = Date.now() - formStartTime;
      if (timeTaken < 3000) { // менее 3 секунд - подозрительно
        await logAttempt(email, ip, false, 'Форма заполнена слишком быстро');
        return res.status(400).json({ error: 'Пожалуйста, заполните форму внимательно' });
      }
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await logAttempt(email, ip, false, 'Неверный формат email');
      return res.status(400).json({ error: 'Неверный формат email' });
    }

    // Проверка лимита участников
    const maxParticipants = parseInt(process.env.MAX_PARTICIPANTS || '100');
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE is_verified = true'
    );
    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount >= maxParticipants) {
      await logAttempt(email, ip, false, 'Регистрация закрыта');
      return res.status(403).json({ error: 'Регистрация закрыта, все места заняты' });
    }

    // Проверка существующей регистрации
    const existingResult = await pool.query(
      'SELECT * FROM registrations WHERE email = $1',
      [email.toLowerCase()]
    );

    let verificationCode: string;

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      
      if (existing.is_verified) {
        await logAttempt(email, ip, false, 'Email уже зарегистрирован');
        return res.status(400).json({ error: 'Этот email уже зарегистрирован' });
      }

      // Обновляем код для незавершенной регистрации
      verificationCode = generateVerificationCode();
      await pool.query(
        'UPDATE registrations SET verification_code = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
        [verificationCode, email.toLowerCase()]
      );
    } else {
      // Создаем новую запись
      verificationCode = generateVerificationCode();
      await pool.query(
        `INSERT INTO registrations 
         (first_name, last_name, email, verification_code, ip_address, user_agent) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [firstName, lastName, email.toLowerCase(), verificationCode, ip, req.get('user-agent')]
      );
    }

    // Отправка email с кодом
    await sendVerificationCode(email, verificationCode, firstName);
    await logAttempt(email, ip, true, null);

    res.json({ 
      success: true, 
      message: 'Код подтверждения отправлен на ваш email',
    });

  } catch (error: any) {
    console.error('Ошибка регистрации:', error);
    await logAttempt(email, ip, false, error.message);
    res.status(500).json({ error: 'Ошибка при регистрации. Попробуйте позже.' });
  }
});

// Верификация кода (шаг 2)
app.post('/api/verify', async (req: Request, res: Response) => {
  const { email, code } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    if (!email || !code) {
      return res.status(400).json({ error: 'Email и код обязательны' });
    }

    const result = await pool.query(
      'SELECT * FROM registrations WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Регистрация не найдена' });
    }

    const registration = result.rows[0];

    if (registration.is_verified) {
      return res.status(400).json({ error: 'Email уже подтвержден' });
    }

    // Проверка кода
    if (registration.verification_code !== code) {
      await logAttempt(email, ip, false, 'Неверный код');
      return res.status(400).json({ error: 'Неверный код подтверждения' });
    }

    // Проверка времени (код действителен 15 минут)
    const codeAge = Date.now() - new Date(registration.updated_at).getTime();
    if (codeAge > 15 * 60 * 1000) {
      await logAttempt(email, ip, false, 'Код истек');
      return res.status(400).json({ error: 'Код подтверждения истек. Запросите новый.' });
    }

    // Подтверждение регистрации
    await pool.query(
      'UPDATE registrations SET is_verified = true, verified_at = CURRENT_TIMESTAMP WHERE email = $1',
      [email.toLowerCase()]
    );

    await logAttempt(email, ip, true, null);

    res.json({ 
      success: true, 
      message: 'Регистрация успешно завершена!',
    });

  } catch (error: any) {
    console.error('Ошибка верификации:', error);
    await logAttempt(email, ip, false, error.message);
    res.status(500).json({ error: 'Ошибка при верификации' });
  }
});

// Получение статистики (для админки)
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const totalResult = await pool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE is_verified = true'
    );
    
    const pendingResult = await pool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE is_verified = false'
    );

    const recentResult = await pool.query(
      `SELECT first_name, last_name, email, verified_at 
       FROM registrations 
       WHERE is_verified = true 
       ORDER BY verified_at DESC 
       LIMIT 10`
    );

    res.json({
      total: parseInt(totalResult.rows[0].count),
      pending: parseInt(pendingResult.rows[0].count),
      maxParticipants: parseInt(process.env.MAX_PARTICIPANTS || '100'),
      recent: recentResult.rows,
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 Максимум участников: ${process.env.MAX_PARTICIPANTS || 100}`);
  console.log(`📧 Email сервис: ${process.env.EMAIL_HOST || 'не настроен'}`);
  console.log(`🌍 Разрешенные домены: ${allowedOrigins.join(', ')}\n`);
});

export default app;
