#!/bin/bash

# Скрипт для экспорта данных из БД

DB_NAME="registration_db"
OUTPUT_DIR="./exports"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# Создаем папку для экспорта
mkdir -p "$OUTPUT_DIR"

echo "📊 Экспорт данных из базы данных..."

# Экспорт всех подтвержденных регистраций
sudo -u postgres psql -d "$DB_NAME" -c "\\copy (SELECT first_name AS \"Имя\", last_name AS \"Фамилия\", email AS \"Email\", verified_at AS \"Дата регистрации\" FROM registrations WHERE is_verified = true ORDER BY verified_at DESC) TO '$OUTPUT_DIR/registrations_$DATE.csv' CSV HEADER ENCODING 'UTF8';"

# Экспорт статистики
sudo -u postgres psql -d "$DB_NAME" -c "\\copy (SELECT COUNT(*) as \"Всего зарегистрировано\", (SELECT COUNT(*) FROM registrations WHERE is_verified = false) as \"Ожидают подтверждения\", MIN(verified_at) as \"Первая регистрация\", MAX(verified_at) as \"Последняя регистрация\" FROM registrations WHERE is_verified = true) TO '$OUTPUT_DIR/stats_$DATE.csv' CSV HEADER ENCODING 'UTF8';"

echo "✅ Экспорт завершен!"
echo "📁 Файлы сохранены в: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/*_$DATE.csv
