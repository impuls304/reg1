#!/bin/bash

# Скрипт для автоматической настройки проекта

echo "🚀 Установка системы регистрации"
echo "=================================="
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+ и запустите скрипт снова."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) установлен"

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL не установлен"
    read -p "Установить PostgreSQL? (y/n): " install_pg
    
    if [ "$install_pg" = "y" ]; then
        echo "📦 Установка PostgreSQL..."
        if [ -f /etc/debian_version ]; then
            sudo apt update
            sudo apt install -y postgresql postgresql-contrib
        elif [ -f /etc/redhat-release ]; then
            sudo yum install -y postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
        else
            echo "❌ Неизвестная ОС. Установите PostgreSQL вручную."
            exit 1
        fi
        
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
        echo "✅ PostgreSQL установлен"
    else
        echo "❌ PostgreSQL необходим для работы приложения"
        exit 1
    fi
else
    echo "✅ PostgreSQL установлен"
fi

# Настройка базы данных
echo ""
echo "📊 Настройка базы данных"
echo "------------------------"
read -p "Создать базу данных? (y/n): " create_db

if [ "$create_db" = "y" ]; then
    read -p "Имя базы данных [registration_db]: " db_name
    db_name=${db_name:-registration_db}
    
    read -p "Имя пользователя [reg_user]: " db_user
    db_user=${db_user:-reg_user}
    
    read -sp "Пароль пользователя: " db_password
    echo ""
    
    echo "Создание базы данных..."
    sudo -u postgres psql << EOF
CREATE DATABASE $db_name;
CREATE USER $db_user WITH PASSWORD '$db_password';
GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ База данных создана"
    else
        echo "❌ Ошибка при создании базы данных"
        exit 1
    fi
fi

# Установка зависимостей Backend
echo ""
echo "📦 Установка зависимостей Backend..."
cd server
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей"
    exit 1
fi

echo "✅ Зависимости Backend установлены"

# Настройка .env для Backend
echo ""
echo "⚙️  Настройка Backend"
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Подставляем значения БД
    if [ ! -z "$db_name" ]; then
        sed -i "s/DB_NAME=.*/DB_NAME=$db_name/" .env
        sed -i "s/DB_USER=.*/DB_USER=$db_user/" .env
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" .env
    fi
    
    echo "📝 Файл .env создан. Отредактируйте его и укажите настройки Email:"
    echo "   nano .env"
    echo ""
    echo "Необходимо указать:"
    echo "  - EMAIL_HOST (например, smtp.yandex.ru)"
    echo "  - EMAIL_PORT (например, 465)"
    echo "  - EMAIL_USER (ваш email)"
    echo "  - EMAIL_PASSWORD (пароль приложения)"
    echo ""
    read -p "Нажмите Enter после редактирования .env..."
fi

# Сборка Backend
echo ""
echo "🔨 Сборка Backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке Backend"
    exit 1
fi

echo "✅ Backend собран"

# Миграция БД
echo ""
echo "📊 Применение миграций базы данных..."
npm run db:migrate

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при миграции базы данных"
    exit 1
fi

echo "✅ Миграции применены"

# Установка PM2
if ! command -v pm2 &> /dev/null; then
    echo ""
    read -p "Установить PM2 для управления процессами? (y/n): " install_pm2
    
    if [ "$install_pm2" = "y" ]; then
        sudo npm install -g pm2
        echo "✅ PM2 установлен"
    fi
fi

# Установка зависимостей Frontend
echo ""
echo "📦 Установка зависимостей Frontend..."
cd ../app
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей Frontend"
    exit 1
fi

echo "✅ Зависимости Frontend установлены"

# Настройка .env для Frontend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Файл app/.env создан"
fi

# Сборка Frontend
echo ""
echo "🔨 Сборка Frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке Frontend"
    exit 1
fi

echo "✅ Frontend собран"

# Завершение
echo ""
echo "🎉 Установка завершена!"
echo "======================="
echo ""
echo "Следующие шаги:"
echo ""
echo "1. Запустите Backend:"
echo "   cd server"
echo "   pm2 start dist/index.js --name registration-api"
echo "   pm2 save"
echo ""
echo "2. Настройте Nginx (см. DEPLOYMENT.md)"
echo ""
echo "3. Настройте SSL:"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "4. Проверьте работу:"
echo "   curl http://localhost:3000/health"
echo ""
echo "📚 Документация:"
echo "   - DEPLOYMENT.md - подробная инструкция"
echo "   - QUICKSTART.md - быстрый старт"
echo "   - COMMANDS.md - полезные команды"
echo ""
