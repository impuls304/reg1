# 🚀 Быстрый старт - Система регистрации

## Шаг 1: Установка PostgreSQL

\`\`\`bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Создание базы данных
sudo -u postgres psql
CREATE DATABASE registration_db;
CREATE USER reg_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE registration_db TO reg_user;
\\q
\`\`\`

## Шаг 2: Настройка Backend

\`\`\`bash
cd server

# Установка зависимостей
npm install

# Настройка .env
cp .env.example .env
nano .env
# Заполните: DB_*, EMAIL_*, MAX_PARTICIPANTS, ALLOWED_ORIGINS

# Миграция БД
npm run build
npm run db:migrate

# Запуск (продакшн)
npm install -g pm2
pm2 start dist/index.js --name "registration-api"
pm2 save
\`\`\`

## Шаг 3: Настройка Frontend

\`\`\`bash
cd ../app

# Установка зависимостей
npm install

# Настройка .env
cp .env.example .env
nano .env
# Укажите VITE_API_URL=http://localhost:3000 (или ваш домен)

# Сборка
npm run build
\`\`\`

## Шаг 4: Nginx (опционально)

\`\`\`bash
sudo apt install nginx

# Создайте конфиг из DEPLOYMENT.md
sudo nano /etc/nginx/sites-available/registration

# Активируйте
sudo ln -s /etc/nginx/sites-available/registration /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

## Шаг 5: SSL (рекомендуется)

\`\`\`bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
\`\`\`

## 📧 Настройка Email (Yandex/Mail.ru)

1. Создайте "пароль приложения" в настройках вашей почты
2. Используйте его в \`.env\` как \`EMAIL_PASSWORD\`

## 🎯 Проверка работы

\`\`\`bash
# Backend
curl http://localhost:3000/health

# Просмотр данных
sudo -u postgres psql -d registration_db
SELECT * FROM registrations WHERE is_verified = true;
\`\`\`

## 📋 Полная инструкция

Смотрите [DEPLOYMENT.md](DEPLOYMENT.md) для детальной информации.
