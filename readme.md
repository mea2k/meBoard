# meBoard: объявления и общение

## Описание

meBoard - сервис объявлений и общения в режиме реального времени на основе технологии WebSocket,  ExpressJS и NodeJS предоставляет следующие возможности:
1. Регистрация пользователя (`/user/signup`).
2. Авторизация пользователя (`/user/login`).
3. Просмотр профиля пользователя (`/user/me`).
4. Выход из системы (`/user/logout`).
5. Добавление/редактирование/удаление своих объявлений (`/advert`) _(доступно только после авторизации)_.
6. Поиск объявлений (`/search`).
7. Чат с другими пользователями (`/chat`) _(доступен только после авторизации)_.

Хранение информации реализовано с использованием _(определяется параметрами запуска)_
- БД Mongo
- файлов `*.json`.

Конкретный вариант задается в конфигурационном файле [config.json](config.json) или в переменной окружения `STORAGE_TYPE` в файле [.env](.env).


## Хранилище

Реализованы следующие хранилища:
- хранилище объявлений ([src/storage/advertisements/advertisementStorage.js](src/storage/advertisements/advertisementStorage.js))

- хранилище пользователей ([src/storage/users/userStorage.js](src/storage/users/userStorage.js))

- хранилище чатов + хранилище сообщений ([src/storage/chat/chatStorage.js](src/storage/chat/chatStorage.js))

### Хранилище объявлений
Основной класс по использованию хрнилища `AdvertStorage` реализован в файле [src/storage/advertisements/advertisementStorage.js](src/storage/advertisements/advertisementStorage.js). Поддерживаемые методы:

- `getAll()`  - возвращает все содержимое контейнера

- `get(id)`   - возвращает один объект (объявление) по идентификатору ID или `undefined`, если не найден 

- `getByText(text)` - возвращает множество объектов (объявлений), в которых в поле `'shortText'` встречается искомый текст TEXT или пустой массив `[]`, если ничего не найдено

- `getByDesc(text)` - возвращает множество объектов (объявлений), в которых в поле `'description'` встречается искомый текст TEXT или пустой массив `[]`, если ничего не найдено

- `getByTags(tagsArray)` - возвращает множество объектов (объявлений), в которых в поле `'tags'` встречаются все теги из массива TAGSARRAY или пустой массив `[]`, если ничего не найдено 

- `getByUser(userId)` - возвращает множество объектов (объявлений), в которых поле `'userId'` равно параметру USERID или `[]`, если ничего не найдено

- `getAllByUser(userId)` - возвращает множество объектов (объявлений), в которых поле `'userId'` равно параметру USERID, включая удаленные, или `[]`, если ничего не найдено

- `find(params)` - возвращает множество объектов (объявлений) в соответствии с параметрами поиска PARAMS (`{shortText, description, userId, tags}`) или пустой массив `[]`, если ничего не найдено

- `create(item)` - добавление нового объявления в хранилище. возвращает добавленный объект или `undefined`. ID объекта формируется автоматически

- `modify(id, item)` - изменение содержимого полей объекта(объявления) с идентификатором ID.  Возвращает измененный объект или `undefined`, если объекта с ID нет

- `remove(id)` - помечает, что объект удален (`{ ..., isDeleted: true}`). Физически объект НЕ удаляется.
Возвращает 1 в случае успеха или 0, если объект не найден.

- `delete(id)` - удаление объекта(объявления) с идентификатором ID. Возвращает 1 в случае успеха или 0, если объект не найден.
 
### Хранилище пользователей

Основной класс по использованию хрнилища `UserStorage` реализован в файле [src/storage/users/userStorage.js](src/storage/users/userStorage.js). Поддерживаемые методы:

- `getAll()`  - возвращает все содержимое контейнера

- `get(id)`   - возвращает один объект (пользователя) по идентификатору ID или `undefined`, если не найден 

- `getLogin(id)` - возвращает `'login'` пользователя с идентификатором id или `undefined`, если не найден 

- `getByLogin(login)` - возвращает один объект (пользователя) по идентификатору ID или `undefined`, если не найден

- `getByEmail(email)` - возвращает один объект (пользователя) по EMAIL или `undefined`, если не найден

- `create(item)` - добавление нового пользователя в хранилище. Возвращает добавленный объект или `undefined`. ID объекта формируется автоматически

- `modify(id, item)` - изменение содержимого полей объекта(пользователя) с идентификатором ID. Возвращает измененный объект или `undefined`, если объекта с ID нет

- `delete(id)` - удаление объекта(пользователя) с идентификатором ID. Возвращает 1 в случае успеха или 0, если объект не найден.

- `verify(login, password)` - проверка корректности пароля password для указанного объекта(пользователя) с логином LOGIN. Возвращает `true` или `false`.

- `_hashPassword(item, rounds = 10)` - получение hash-строки от пароля с использованием сгенерированной "соли". Возвращает `{salt, password}`

### Хранилище чатов и сообщений

Основной класс по использованию хрнилища `ChatStorage` реализован в файле [src/storage/chat/chatStorage.js](src/storage/chat/chatStorage.js). Поддерживаемые методы:

- `getAll()`  - возвращает список всех чатов

- `get(id)`   - возвращает информацию об одном чате по идентификатору ID или `undefined`, если не найден 

- `getByUser(user)` - возвращает список чатов, в которые входит пользователь с идентификатором USER или `[]`, если не найдены

- `getByUsers(user1, user2)` - возвращает информацию об одном чате между пользователями с идентификаторами user1 и user2 или `undefined`, если не найден

- `getChatStatistic(user1, user2)` - возвращает статистику по чату между USER1 и USER2 или `undefined`, если не найден. Формат результата: `{chatId, newMsgs, totalMsgs}` или `undefined`

- `find(users)` - возвращает информацию об одном чате между пользователями из массива USERS или `undefined`, если не найден

- `getHistory(id)` - получение всех сообщения из чата ID или `undefined`, если не найден

- `add(item)` - добавление объекта(чат) в хранилище. возвращает ID добавленного объекта или `undefined`. ID объекта формируется автоматически

- `sendMessage(chatId, item, markRead = true)` - добавление сообщения в чат с идентификатором chatId. Возвращает JSON-объект с добавленным сообщением или `undefined`, если чата с chatId нет. 
Если `markRead==true`, то все предыдущие сообщения чата помечаются прочитанными.

- `markRead(chatId, userId, msgId, date = new Date())` - помечает дату прочтения (`'readAt'`) сообщения с идентификатором msgId в чате chatId. Сообщение не должно быть отправлено пользователем userId. При ошибке возвращает `undefined`


## Основной файл ([index.js](src/index.js))

Основной код сервера реализован в файле [src/index.js](src/index.js). Используется библиотека `Express` для запуска сервера. Все параметры передаются в теле запросов в виде JSON-объектов, результат работы методов - JSON-данные.

Используется библиотека `Mongoose` для работы с БД MongoDB.

### Инициализация Mongo
В файле [mongo-init.js](mongo-init.js) содержится сценарий, создающий БД `meboard` и все необходимые коллекции (`[ "users", "chats", "advertisements", "messages" ]`) - задаются в переменной окружения `MONGO_DATABASE_COLLECTIONS` в файле [.env](.env). Также создается пользователь `user:user` для работы с БД `meboard`. Данный сценарий выполняется один раз при первом запуске контейнера mongo.



## Запуск

### Переменные окружения

Все необходимые параметры задаются в переменных окружения:
- [.env](.env) - полный формат всех переменных окружения
- [mongo.env](mongo.env) - настройки для работы с БД Mongo
- [file.env](file.env) - настройки для работы с JSON-файлами

Файл сборки всех контейнеров - [Docker-compose.yml](Docker-compose.yml).

Файл сборки контейнера сервера meBoard - [Dockerfile](Dockerfile).


### Контейнеры

Основной контейнер - [makevg/meBoard](https://hub.docker.com/repository/docker/makevg/meboard/general)

Контейнеры для СУБД Mongo:
- [mongo](https://hub.docker.com/_/mongo)
- [mongo-express](https://hub.docker.com/_/mongo-express)

### Запуск с использованием БД Mongo

1. Создать папку для хранения данных (например, `data`).
2. Задать значение параметра `STORAGE_TYPE: mongo` в файле переменных окружения (например, [mongo.env](mongo.env)). 
3. Задать пути до папки из п.1 в файле переменных окружения (например, [mongo.env](mongo.env)).
4. Задать другие необходимые параметры в файле переменных окружения (например, [mongo.env](mongo.env)).
5. Выполнить команду для запуска
```
docker compose  --env-file mongo.env up
```
Если в режиме сборки, то выполнить команду
```
docker compose  --env-file mongo.env up --build
```


### Запуск с использованием файлового хранилища

1. Создать папку для хранения данных (например, `data`).
2. Задать значение параметра `STORAGE_TYPE: file` в файле переменных окружения (например, [file.env](file.env)). 
3. Задать пути до папки из п.1 в файле переменных окружения (например, [file.env](file.env)).
4. Задать другие необходимые параметры в файле переменных окружения (например, [file.env](file.env)).
5. Выполнить команду для запуска
```
docker compose  --env-file file.env up
```
Если в режиме сборки, то выполнить команду
```
docker compose  --env-file file.env up --build
```

Запуск только контейнера meBoard (при работе с файлами):
```
docker run --name meboard --rm -it -v ~/data:/usr/src/app/data -v ~/public:/usr/src/app/public  --mount type=bind,source=d:/config.json,target=/usr/src/app/config.json -p 3000:3000 --privileged makevg/meboard npm start 
```
