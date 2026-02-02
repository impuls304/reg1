# 📋 Шпаргалка по системе регистрации

## 🚀 Быстрые команды

### Backend
\`\`\`bash
cd server

# Разработка
npm run dev

# Продакшн
npm run build
pm2 start dist/index.js --name registration-api
pm2 logs registration-api
pm2 restart registration-api

# БД
npm run db:migrate    # Миграции
npm run db:stats      # Статистика
npm run db:export     # Экспорт в CSV
\`\`\`

### Frontend
\`\`\`bash
cd app

# Разработка
npm run dev

# Продакшн
npm run build
# Файлы в dist/ - раздаются через Nginx
\`\`\`

## 📊 База данных

\`\`\`bash
# Подключение
sudo -u postgres psql -d registration_db

# Просмотр данных
SELECT * FROM registrations WHERE is_verified = true;

# Экспорт
\\copy (SELECT first_name, last_name, email FROM registrations WHERE is_verified = true) TO '/tmp/export.csv' CSV HEADER;

# Выход
\\q
\`\`\`

## 🔧 Nginx

\`\`\`bash
# Проверка конфига
sudo nginx -t

# Перезапуск
sudo systemctl restart nginx

# Логи
sudo tail -f /var/log/nginx/error.log
\`\`\`

## 📧 Email настройка

### Yandex
\`\`\`env
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=465
EMAIL_USER=your@yandex.ru
EMAIL_PASSWORD=app_password
\`\`\`

### Mail.ru
\`\`\`env
EMAIL_HOST=smtp.mail.ru
EMAIL_PORT=465
EMAIL_USER=your@mail.ru
EMAIL_PASSWORD=app_password
\`\`\`

## 🔐 Переменные окружения

### server/.env
\`\`\`env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=registration_db
DB_USER=reg_user
DB_PASSWORD=your_password
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=465
EMAIL_USER=your@yandex.ru
EMAIL_PASSWORD=app_password
MAX_PARTICIPANTS=100
ALLOWED_ORIGINS=https://yourdomain.com
NODE_ENV=production
\`\`\`

### app/.env
\`\`\`env
VITE_API_URL=https://yourdomain.com
\`\`\`

## 🛠️ Решение проблем

### Backend не запускается
\`\`\`bash
pm2 logs registration-api
pm2 restart registration-api
\`\`\`

### БД недоступна
\`\`\`bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
sudo -u postgres psql -c "SELECT 1;"
\`\`\`

### Email не отправляются
Включите режим разработки в \`server/.env\`:
\`\`\`env
NODE_ENV=development
\`\`\`
Коды будут в консоли: \`pm2 logs registration-api\`

### CORS ошибки
Проверьте \`ALLOWED_ORIGINS\` в \`server/.env\`

## 📊 API Endpoints

\`\`\`bash
# Доступность
curl http://localhost:3000/api/availability

# Статистика
curl http://localhost:3000/api/stats

# Health
curl http://localhost:3000/health
\`\`\`

## 🔄 Обновление

\`\`\`bash
# Backend
cd server
pm2 stop registration-api
git pull
npm install
npm run build
npm run db:migrate  # если есть новые миграции
pm2 start registration-api

# Frontend
cd app
git pull
npm install
npm run build
\`\`\`

## 💾 Резервное копирование

\`\`\`bash
# Бэкап
sudo -u postgres pg_dump registration_db > backup_$(date +%Y%m%d).sql

# Восстановление
sudo -u postgres psql registration_db < backup_20260202.sql

# Автобэкап (cron)
0 3 * * * sudo -u postgres pg_dump registration_db | gzip > /var/backups/reg_$(date +\%Y\%m\%d).sql.gz
\`\`\`

## 📁 Структура файлов

\`\`\`
reg_mer/
├── server/         Backend
│   ├── src/       Исходники TypeScript
│   ├── dist/      Скомпилированные файлы
│   └── .env       Конфигурация
├── app/           Frontend
│   ├── src/       Исходники React
│   ├── dist/      Сборка для продакшн
│   └── .env       Конфигурация
└── *.md          Документация
\`\`\`

## 🔗 Полезные ссылки

- [README.md](README.md) - Описание проекта
- [DEPLOYMENT.md](DEPLOYMENT.md) - ⭐ Полная инструкция
- [QUICKSTART.md](QUICKSTART.md) - Быстрый старт
- [COMMANDS.md](COMMANDS.md) - Подробные команды
- [SUMMARY.md](SUMMARY.md) - Итоговая информация
