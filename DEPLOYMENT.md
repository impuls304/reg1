# 📋 Инструкция по развертыванию системы регистрации

## 🎯 Обзор

Этот проект состоит из двух частей:
- **Frontend (React + Vite)** - пользовательский интерфейс
- **Backend (Node.js + Express + PostgreSQL)** - API и база данных

Все данные (имя, фамилия, email) сохраняются в базе данных PostgreSQL на вашем сервере.

---

## 📦 Что нужно для работы

### На вашем сервере должно быть установлено:
1. **Node.js** (версия 18 или выше) - [скачать](https://nodejs.org/)
2. **PostgreSQL** (версия 12 или выше) - [скачать](https://www.postgresql.org/download/)
3. **Nginx** или Apache (для раздачи файлов)
4. **PM2** (для запуска backend в фоне) - установка: `npm install -g pm2`

---

## 🗄️ Настройка базы данных PostgreSQL

### 1. Установка PostgreSQL

#### На Ubuntu/Debian:
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

#### На CentOS/RHEL:
\`\`\`bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

### 2. Создание базы данных и пользователя

\`\`\`bash
# Войти в PostgreSQL
sudo -u postgres psql

# Создать базу данных
CREATE DATABASE registration_db;

# Создать пользователя
CREATE USER reg_user WITH PASSWORD 'your_secure_password';

# Дать права пользователю
GRANT ALL PRIVILEGES ON DATABASE registration_db TO reg_user;

# Выйти
\\q
\`\`\`

### 3. Настройка удаленного подключения (если база на другом сервере)

Отредактируйте файл `/etc/postgresql/{version}/main/postgresql.conf`:
\`\`\`
listen_addresses = '*'
\`\`\`

Отредактируйте файл `/etc/postgresql/{version}/main/pg_hba.conf`:
\`\`\`
host    all             all             0.0.0.0/0               md5
\`\`\`

Перезапустите PostgreSQL:
\`\`\`bash
sudo systemctl restart postgresql
\`\`\`

---

## 🔧 Настройка Backend

### 1. Перейдите в папку сервера

\`\`\`bash
cd /home/imte/Downloads/reg_mer/server
\`\`\`

### 2. Установите зависимости

\`\`\`bash
npm install
\`\`\`

### 3. Настройте переменные окружения

Создайте файл `.env` на основе `.env.example`:

\`\`\`bash
cp .env.example .env
nano .env
\`\`\`

Заполните следующие параметры:

\`\`\`env
# Порт сервера
PORT=3000

# Настройки PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=registration_db
DB_USER=reg_user
DB_PASSWORD=your_secure_password

# Настройки Email (для отправки кодов)
# Рекомендуется использовать российские сервисы:

# Вариант 1: Yandex Mail
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@yandex.ru
EMAIL_PASSWORD=your_app_password

# Вариант 2: Mail.ru
# EMAIL_HOST=smtp.mail.ru
# EMAIL_PORT=465
# EMAIL_SECURE=true
# EMAIL_USER=your_email@mail.ru
# EMAIL_PASSWORD=your_app_password

# Максимальное количество участников
MAX_PARTICIPANTS=100

# Разрешенные домены (через запятую)
ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com

# Режим работы
NODE_ENV=production
\`\`\`

### 4. Получение пароля приложения для Email

#### Для Yandex:
1. Перейдите в настройки почты: https://id.yandex.ru/security
2. Включите "Пароли приложений"
3. Создайте пароль для вашего приложения
4. Используйте этот пароль в `EMAIL_PASSWORD`

#### Для Mail.ru:
1. Перейдите в настройки: https://account.mail.ru/user/2-step-auth/passwords/
2. Создайте пароль для внешнего приложения
3. Используйте этот пароль в `EMAIL_PASSWORD`

### 5. Выполните миграцию базы данных

\`\`\`bash
npm run build
npm run db:migrate
\`\`\`

Вы должны увидеть:
\`\`\`
✓ Подключение к PostgreSQL установлено
✓ Миграция завершена успешно!
✓ Таблицы созданы:
  - registrations (основная таблица с данными пользователей)
  - registration_attempts (журнал попыток регистрации)
\`\`\`

### 6. Запустите сервер

#### Для тестирования:
\`\`\`bash
npm run dev
\`\`\`

#### Для продакшена (с PM2):
\`\`\`bash
npm run build
pm2 start dist/index.js --name "registration-api"
pm2 save
pm2 startup
\`\`\`

Проверьте, что сервер работает:
\`\`\`bash
curl http://localhost:3000/health
\`\`\`

---

## 🎨 Настройка Frontend

### 1. Перейдите в папку приложения

\`\`\`bash
cd /home/imte/Downloads/reg_mer/app
\`\`\`

### 2. Установите зависимости

\`\`\`bash
npm install
\`\`\`

### 3. Настройте переменные окружения

Создайте файл `.env`:

\`\`\`bash
cp .env.example .env
nano .env
\`\`\`

Укажите URL вашего API:

\`\`\`env
# Для разработки
VITE_API_URL=http://localhost:3000

# Для продакшена (замените на ваш домен)
# VITE_API_URL=https://api.yourdomain.com
\`\`\`

### 4. Соберите приложение

\`\`\`bash
npm run build
\`\`\`

Готовые файлы будут в папке `dist/`.

---

## 🌐 Развертывание на сервере

### Вариант 1: На том же сервере (с Nginx)

#### 1. Установите Nginx

\`\`\`bash
sudo apt install nginx
\`\`\`

#### 2. Настройте Nginx

Создайте конфигурационный файл:

\`\`\`bash
sudo nano /etc/nginx/sites-available/registration
\`\`\`

Вставьте следующую конфигурацию:

\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /home/imte/Downloads/reg_mer/app/dist;
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических файлов
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Дополнительные заголовки безопасности
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
\`\`\`

#### 3. Активируйте конфигурацию

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/registration /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

#### 4. Настройте SSL (рекомендуется)

\`\`\`bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
\`\`\`

### Вариант 2: Статический хостинг (Vercel, Netlify)

Если backend на отдельном сервере, frontend можно разместить на Vercel/Netlify:

#### Vercel:
\`\`\`bash
npm install -g vercel
cd app
vercel
\`\`\`

#### Netlify:
\`\`\`bash
npm install -g netlify-cli
cd app
netlify deploy --prod
\`\`\`

Не забудьте настроить переменную окружения `VITE_API_URL` в настройках Vercel/Netlify.

---

## 🔐 Безопасность

### 1. Firewall

Откройте только необходимые порты:

\`\`\`bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
\`\`\`

### 2. Защита PostgreSQL

Убедитесь, что PostgreSQL доступен только локально:

\`\`\`bash
sudo nano /etc/postgresql/{version}/main/pg_hba.conf
\`\`\`

Должна быть строка:
\`\`\`
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
\`\`\`

### 3. Регулярные обновления

\`\`\`bash
sudo apt update && sudo apt upgrade -y
\`\`\`

---

## 📊 Мониторинг и просмотр данных

### 1. Просмотр логов PM2

\`\`\`bash
pm2 logs registration-api
\`\`\`

### 2. Просмотр данных в PostgreSQL

\`\`\`bash
sudo -u postgres psql -d registration_db

# Посмотреть всех зарегистрированных
SELECT first_name, last_name, email, registered_at FROM registrations WHERE is_verified = true;

# Количество зарегистрированных
SELECT COUNT(*) FROM registrations WHERE is_verified = true;

# Экспорт в CSV
\\copy (SELECT first_name, last_name, email, verified_at FROM registrations WHERE is_verified = true ORDER BY verified_at) TO '/tmp/registrations.csv' CSV HEADER;
\`\`\`

### 3. API для статистики

Доступен эндпоинт для просмотра статистики:

\`\`\`bash
curl http://localhost:3000/api/stats
\`\`\`

---

## 🇷🇺 Соответствие требованиям РФ

### База данных
- ✅ PostgreSQL установлен и работает на вашем сервере в РФ
- ✅ Все персональные данные хранятся локально
- ✅ Нет передачи данных третьим лицам

### Email сервисы
Рекомендуемые российские почтовые сервисы:
- **Yandex** (smtp.yandex.ru)
- **Mail.ru** (smtp.mail.ru)
- **Rambler** (smtp.rambler.ru)

### Хостинг
Рекомендуемые провайдеры с серверами в РФ:
- **Selectel** (selectel.ru)
- **Timeweb** (timeweb.com)
- **REG.RU** (reg.ru)
- **Beget** (beget.com)
- **Hetzner** (hetzner.com) - центры обработки данных в Финляндии

---

## ❓ Решение проблем

### Проблема: Backend не запускается

\`\`\`bash
# Проверьте логи
pm2 logs registration-api

# Проверьте подключение к БД
sudo -u postgres psql -d registration_db -c "SELECT 1;"
\`\`\`

### Проблема: Email не отправляются

\`\`\`bash
# Проверьте в режиме разработки
cd server
NODE_ENV=development npm run dev

# Код будет выводиться в консоль вместо отправки email
\`\`\`

### Проблема: CORS ошибки

Убедитесь, что в `server/.env` указан правильный домен в `ALLOWED_ORIGINS`:
\`\`\`
ALLOWED_ORIGINS=https://yourdomain.com
\`\`\`

### Проблема: Frontend не подключается к API

Проверьте `app/.env`:
\`\`\`
VITE_API_URL=https://yourdomain.com
\`\`\`

Если API на другом домене, должен быть полный URL:
\`\`\`
VITE_API_URL=https://api.yourdomain.com
\`\`\`

---

## 📞 Поддержка

При возникновении проблем проверьте:
1. Логи PM2: `pm2 logs registration-api`
2. Логи Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Логи PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-{version}-main.log`

---

## 🎉 Готово!

Ваша система регистрации готова к использованию! Все данные надежно хранятся в вашей базе данных PostgreSQL.

Проверьте работу:
1. Откройте сайт в браузере
2. Попробуйте зарегистрироваться
3. Проверьте email с кодом
4. Посмотрите данные в базе данных
