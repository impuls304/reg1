import { pool } from './db.js';

async function migrate() {
  console.log('Начало миграции базы данных...');
  
  try {
    // Создание таблицы registrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        verification_code VARCHAR(6) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP WITH TIME ZONE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создание индексов для оптимизации
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_email ON registrations(email);
      CREATE INDEX IF NOT EXISTS idx_verified ON registrations(is_verified);
      CREATE INDEX IF NOT EXISTS idx_registered_at ON registrations(registered_at);
    `);

    // Создание таблицы для логирования попыток регистрации
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registration_attempts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255),
        ip_address VARCHAR(45),
        success BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Создание индекса для мониторинга
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_attempts_email ON registration_attempts(email);
      CREATE INDEX IF NOT EXISTS idx_attempts_ip ON registration_attempts(ip_address);
    `);

    console.log('✓ Миграция завершена успешно!');
    console.log('✓ Таблицы созданы:');
    console.log('  - registrations (основная таблица с данными пользователей)');
    console.log('  - registration_attempts (журнал попыток регистрации)');
    
  } catch (error) {
    console.error('Ошибка при миграции:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate();
