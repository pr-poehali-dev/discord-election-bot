# Настройка Discord Bot для выборов

## 1. Создание Discord приложения

1. Перейдите на https://discord.com/developers/applications
2. Нажмите **New Application**
3. Дайте название (например, "VoteBot")
4. Перейдите в **General Information**
   - Скопируйте **Application ID**
   - Скопируйте **Public Key** и добавьте в секрет `DISCORD_PUBLIC_KEY` на poehali.dev

## 2. Создание бота

1. Перейдите в раздел **Bot**
2. Нажмите **Add Bot** → **Yes, do it!**
3. Нажмите **Reset Token** → **Copy**
4. Добавьте токен в секрет `DISCORD_BOT_TOKEN` на poehali.dev
5. Включите **Privileged Gateway Intents**:
   - ✅ **PRESENCE INTENT**
   - ✅ **SERVER MEMBERS INTENT**
   - ✅ **MESSAGE CONTENT INTENT**

## 3. Настройка Interactions Endpoint

1. Вернитесь в **General Information**
2. В поле **Interactions Endpoint URL** вставьте:
   ```
   https://functions.poehali.dev/97ae06e9-9c5e-49f5-baf2-e1e54dd0677d
   ```
3. Нажмите **Save Changes**

Discord автоматически проверит эндпоинт. Если все настроено правильно, URL будет сохранен.

## 4. Регистрация slash-команд

Выполните следующий запрос через Postman или curl (замените `YOUR_APPLICATION_ID` и `YOUR_BOT_TOKEN`):

```bash
curl -X POST \
  "https://discord.com/api/v10/applications/YOUR_APPLICATION_ID/commands" \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vote",
    "description": "Управление выборами на сервере",
    "options": [
      {
        "name": "info",
        "description": "Информация о текущих выборах",
        "type": 1
      },
      {
        "name": "register",
        "description": "Выдвинуть свою кандидатуру",
        "type": 1,
        "options": [
          {
            "name": "speech",
            "description": "Ваша предвыборная речь",
            "type": 3,
            "required": true
          }
        ]
      },
      {
        "name": "withdraw",
        "description": "Снять свою кандидатуру",
        "type": 1
      },
      {
        "name": "cast",
        "description": "Проголосовать за кандидата",
        "type": 1,
        "options": [
          {
            "name": "candidate",
            "description": "Выберите кандидата",
            "type": 6,
            "required": true
          }
        ]
      },
      {
        "name": "list",
        "description": "Список всех кандидатов",
        "type": 1
      }
    ]
  }'
```

## 5. Добавление бота на сервер

1. Перейдите в **OAuth2** → **URL Generator**
2. Выберите scopes:
   - ✅ **bot**
   - ✅ **applications.commands**
3. Выберите Bot Permissions:
   - ✅ **Manage Roles** (управление ролями)
   - ✅ **Manage Channels** (для уведомлений)
   - ✅ **Send Messages**
   - ✅ **Embed Links**
   - ✅ **Read Message History**
4. Скопируйте сгенерированную ссылку
5. Перейдите по ссылке и добавьте бота на ваш сервер

## 6. Команды бота

После добавления бота на сервер, участники могут использовать:

- `/vote info` - информация о текущих выборах
- `/vote register speech:"Ваша речь"` - выдвинуть кандидатуру
- `/vote withdraw` - снять кандидатуру
- `/vote cast candidate:@пользователь` - проголосовать
- `/vote list` - список кандидатов

## 7. Дашборд администратора

Дашборд доступен по адресу вашего проекта. Через него можно:

- Создавать новые выборы
- Управлять параметрами выборов
- Запускать регистрацию и голосование
- Просматривать результаты
- Управлять администраторами бота

## Структура базы данных

Бот автоматически создает записи для серверов при первом использовании команды. База данных содержит:

- **servers** - информация о Discord серверах
- **bot_admins** - администраторы бота на каждом сервере
- **elections** - выборы с полными настройками
- **candidates** - кандидаты в выборах
- **votes** - голоса участников

## Как работает система

1. **Администратор** создает выборы через дашборд
2. **Участники** выдвигают себя через `/vote register`
3. **Администратор** запускает голосование через дашборд
4. **Участники** голосуют через `/vote cast`
5. **Система** автоматически подсчитывает голоса
6. **При достижении порога** выборы завершаются, победитель получает роли
7. **Через заданное время** автоматически начинаются новые выборы

## URL функции

Backend function URL: `https://functions.poehali.dev/97ae06e9-9c5e-49f5-baf2-e1e54dd0677d`

Эта функция обрабатывает:
- Discord Interactions (slash-команды от бота)
- REST API запросы (от дашборда)

## Troubleshooting

**Команды не работают:**
- Проверьте, что Interactions Endpoint URL настроен правильно
- Убедитесь, что Public Key добавлен в секреты
- Проверьте, что команды зарегистрированы (шаг 4)

**Бот не отвечает:**
- Проверьте, что Bot Token добавлен в секреты
- Убедитесь, что все Privileged Intents включены
- Проверьте логи функции на poehali.dev

**Выборы не отображаются:**
- Убедитесь, что администратор создал выборы через дашборд
- Проверьте, что сервер добавлен в базу данных (происходит автоматически при первой команде)
