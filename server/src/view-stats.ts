import { pool } from './db.js';

async function viewStats() {
  try {
    console.log('\n📊 Статистика регистраций\n');
    
    // Общая статистика
    const totalResult = await pool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE is_verified = true'
    );
    const total = parseInt(totalResult.rows[0].count);
    
    const pendingResult = await pool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE is_verified = false'
    );
    const pending = parseInt(pendingResult.rows[0].count);
    
    console.log(`✅ Подтверждено: ${total}`);
    console.log(`⏳ Ожидают подтверждения: ${pending}`);
    console.log(`📈 Всего попыток: ${total + pending}`);
    
    // Последние регистрации
    const recentResult = await pool.query(
      `SELECT first_name, last_name, email, verified_at 
       FROM registrations 
       WHERE is_verified = true 
       ORDER BY verified_at DESC 
       LIMIT 10`
    );
    
    if (recentResult.rows.length > 0) {
      console.log('\n🕐 Последние 10 регистраций:\n');
      console.table(recentResult.rows.map(row => ({
        'Имя': row.first_name,
        'Фамилия': row.last_name,
        'Email': row.email,
        'Дата': new Date(row.verified_at).toLocaleString('ru-RU')
      })));
    }
    
    // Статистика по дням
    const dailyResult = await pool.query(
      `SELECT 
        DATE(verified_at) as date,
        COUNT(*) as count
       FROM registrations 
       WHERE is_verified = true
       GROUP BY DATE(verified_at)
       ORDER BY date DESC
       LIMIT 7`
    );
    
    if (dailyResult.rows.length > 0) {
      console.log('\n📅 Регистрации по дням:\n');
      console.table(dailyResult.rows.map(row => ({
        'Дата': new Date(row.date).toLocaleDateString('ru-RU'),
        'Количество': row.count
      })));
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

viewStats();
