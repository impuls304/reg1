# 🔧 Полезные команды и скрипты

## 📊 Работа с данными

### Просмотр статистики в консоли

\`\`\`bash
cd server
npm run db:stats
\`\`\`

Покажет:
- Количество подтвержденных регистраций
- Количество ожидающих подтверждения
- Последние 10 регистраций
- Статистику по дням

### Экспорт данных в CSV

\`\`\`bash
cd server
npm run db:export
\`\`\`

Создаст файлы в папке \`server/exports/\`:
- \`registrations_YYYY-MM-DD_HH-MM-SS.csv\` - все регистрации
- \`stats_YYYY-MM-DD_HH-MM-SS.csv\` - общая статистика

### Прямой доступ к базе данных

\`\`\`bash
# Подключение к БД
sudo -u postgres psql -d registration_db

# Полезные SQL запросы:

# Все подтвержденные регистрации
SELECT first_name, last_name, email, verified_at 
FROM registrations 
WHERE is_verified = true 
ORDER BY verified_at DESC;

# Количество по дням
SELECT DATE(verified_at) as date, COUNT(*) 
FROM registrations 
WHERE is_verified = true 
GROUP BY DATE(verified_at) 
ORDER BY date DESC;

# Поиск по email
SELECT * FROM registrations WHERE email = 'example@email.com';

# Удаление неподтвержденных старше 24 часов
DELETE FROM registrations 
WHERE is_verified = false 
AND created_at < NOW() - INTERVAL '24 hours';

# Выход
\\q
\`\`\`

## 🔄 Управление PM2

### Основные команды

\`\`\`bash
# Список процессов
pm2 list

# Логи
pm2 logs registration-api

# Только ошибки
pm2 logs registration-api --err

# Перезапуск
pm2 restart registration-api

# Остановка
pm2 stop registration-api

# Удаление из PM2
pm2 delete registration-api

# Мониторинг
pm2 monit

# Информация о процессе
pm2 info registration-api
\`\`\`

### Автозапуск при перезагрузке сервера

\`\`\`bash
pm2 startup
pm2 save
\`\`\`

## 🗄️ Резервное копирование PostgreSQL

### Создание бэкапа

\`\`\`bash
# Полный бэкап БД
sudo -u postgres pg_dump registration_db > backup_$(date +%Y%m%d).sql

# Только данные (без структуры)
sudo -u postgres pg_dump -a registration_db > data_backup_$(date +%Y%m%d).sql

# Только структура (без данных)
sudo -u postgres pg_dump -s registration_db > schema_backup_$(date +%Y%m%d).sql

# Сжатый бэкап
sudo -u postgres pg_dump registration_db | gzip > backup_$(date +%Y%m%d).sql.gz
\`\`\`

### Восстановление из бэкапа

\`\`\`bash
# Из обычного файла
sudo -u postgres psql registration_db < backup_20260202.sql

# Из сжатого файла
gunzip -c backup_20260202.sql.gz | sudo -u postgres psql registration_db
\`\`\`

### Автоматическое резервное копирование (cron)

\`\`\`bash
# Редактирование crontab
sudo crontab -e

# Добавьте строку для ежедневного бэкапа в 3:00
0 3 * * * sudo -u postgres pg_dump registration_db | gzip > /var/backups/registration_db_$(date +\%Y\%m\%d).sql.gz

# Удаление старых бэкапов (старше 30 дней)
0 4 * * * find /var/backups/registration_db_*.sql.gz -mtime +30 -delete
\`\`\`

## 📧 Тестирование email

### Режим разработки (без отправки email)

В \`server/.env\` установите:
\`\`\`
NODE_ENV=development
\`\`\`

Коды будут выводиться в консоль вместо отправки email.

### Тест отправки email

Создайте файл \`server/test-email.js\`:

\`\`\`javascript
import { sendVerificationCode } from './dist/email.js';

sendVerificationCode('your-email@example.com', '123456', 'Тест')
  .then(() => console.log('✅ Email отправлен'))
  .catch(err => console.error('❌ Ошибка:', err));
\`\`\`

Запустите:
\`\`\`bash
cd server
npm run build
node test-email.js
\`\`\`

## 🔍 Мониторинг и отладка

### Логи Nginx

\`\`\`bash
# Все логи
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Только ошибки за последний час
sudo grep "$(date -d '1 hour ago' '+%d/%b/%Y:%H')" /var/log/nginx/error.log
\`\`\`

### Логи PostgreSQL

\`\`\`bash
# Путь к логам (зависит от версии)
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Активные подключения
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='registration_db';"
\`\`\`

### Проверка производительности

\`\`\`bash
# Использование диска
df -h

# Использование памяти
free -h

# Нагрузка на CPU
top

# Размер базы данных
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('registration_db'));"

# Размер таблиц
sudo -u postgres psql -d registration_db -c "SELECT 
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as size
FROM pg_catalog.pg_statio_user_tables 
ORDER BY pg_total_relation_size(relid) DESC;"
\`\`\`

## 🧹 Очистка и обслуживание

### Очистка старых неподтвержденных регистраций

\`\`\`bash
sudo -u postgres psql -d registration_db -c "
DELETE FROM registrations 
WHERE is_verified = false 
AND created_at < NOW() - INTERVAL '24 hours';
"
\`\`\`

### Очистка старых логов попыток

\`\`\`bash
sudo -u postgres psql -d registration_db -c "
DELETE FROM registration_attempts 
WHERE attempted_at < NOW() - INTERVAL '30 days';
"
\`\`\`

### VACUUM (оптимизация БД)

\`\`\`bash
sudo -u postgres psql -d registration_db -c "VACUUM ANALYZE;"
\`\`\`

## 🔐 Безопасность

### Изменение пароля пользователя БД

\`\`\`bash
sudo -u postgres psql -c "ALTER USER reg_user WITH PASSWORD 'new_secure_password';"

# Не забудьте обновить server/.env
\`\`\`

### Просмотр попыток регистрации (поиск подозрительной активности)

\`\`\`bash
# Топ IP по количеству попыток
sudo -u postgres psql -d registration_db -c "
SELECT ip_address, COUNT(*) as attempts, 
       SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
FROM registration_attempts 
WHERE attempted_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address 
ORDER BY attempts DESC 
LIMIT 20;
"
\`\`\`

### Блокировка IP через iptables

\`\`\`bash
# Заблокировать IP
sudo iptables -A INPUT -s 192.168.1.100 -j DROP

# Разблокировать IP
sudo iptables -D INPUT -s 192.168.1.100 -j DROP

# Посмотреть правила
sudo iptables -L -n
\`\`\`

## 🚀 Обновление приложения

### Backend

\`\`\`bash
cd server

# Остановить процесс
pm2 stop registration-api

# Получить обновления (если используется git)
git pull

# Установить зависимости
npm install

# Собрать
npm run build

# Применить миграции (если есть новые)
npm run db:migrate

# Запустить
pm2 start registration-api

# Проверить логи
pm2 logs registration-api --lines 50
\`\`\`

### Frontend

\`\`\`bash
cd app

# Получить обновления
git pull

# Установить зависимости
npm install

# Собрать
npm run build

# Файлы автоматически обновятся в dist/
# Nginx раздает их автоматически
\`\`\`

## 📊 API для получения данных

### Curl примеры

\`\`\`bash
# Проверка доступности
curl http://localhost:3000/api/availability

# Статистика
curl http://localhost:3000/api/stats

# Health check
curl http://localhost:3000/health
\`\`\`

## 💡 Полезные алиасы

Добавьте в \`~/.bashrc\` или \`~/.zshrc\`:

\`\`\`bash
# Регистрация - алиасы
alias reg-logs='pm2 logs registration-api'
alias reg-restart='pm2 restart registration-api'
alias reg-stats='cd /home/imte/Downloads/reg_mer/server && npm run db:stats'
alias reg-export='cd /home/imte/Downloads/reg_mer/server && npm run db:export'
alias reg-db='sudo -u postgres psql -d registration_db'
\`\`\`

Перезагрузите терминал или выполните:
\`\`\`bash
source ~/.bashrc
\`\`\`

Теперь можно использовать:
\`\`\`bash
reg-logs      # Просмотр логов
reg-stats     # Просмотр статистики
reg-export    # Экспорт данных
reg-db        # Подключение к БД
\`\`\`

## 🎯 Производительность

### Настройка PostgreSQL для лучшей производительности

Отредактируйте \`/etc/postgresql/{version}/main/postgresql.conf\`:

\`\`\`ini
# Для сервера с 4GB RAM:
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5242kB
min_wal_size = 1GB
max_wal_size = 4GB
\`\`\`

Перезапустите PostgreSQL:
\`\`\`bash
sudo systemctl restart postgresql
\`\`\`

### Индексы для ускорения

Уже созданы в миграции:
- \`idx_email\` - поиск по email
- \`idx_verified\` - фильтр по статусу
- \`idx_registered_at\` - сортировка по дате

## 📱 Тестирование

### Локальное тестирование с ngrok

Если нужно протестировать на реальном домене:

\`\`\`bash
# Установка ngrok
snap install ngrok

# Запуск туннеля
ngrok http 3000

# Используйте предоставленный URL в app/.env
\`\`\`

---

**Вопросы?** Проверьте [DEPLOYMENT.md](DEPLOYMENT.md) или логи приложения.
