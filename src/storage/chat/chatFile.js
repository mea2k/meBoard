import fs from 'fs'

/////////////////////////////////////////////////
/////////////////////////////////////////////////

/** КЛАСС - КОНТЕЙНЕР ЧАТОВ НА ОСНОВЕ ФАЙЛА
 * содержит список всех чатов и сообщений в файле FILENAME
 * (имя передается конструктору, если имени нет - то просто в памяти)
 * МЕТОДЫ КЛАССА:
 *   getAll()  - возвращает список всех чатов
 *   get(id)   - возвращает информацию об одном чате по идентификатору ID 
 *               или undefined, если не найден 
 *   getByUser(user) - возвращает список чатов, 
 *               в которые входит пользователь с идентификатором user 
 *               или [], если не найдены
 *   getByUsers(user1, user2) - возвращает информацию об одном чате 
 *               между пользователями с идентификаторами user1 и user2 
 *               или undefined, если не найден
 *   getChatStatistic(user1, user2) - возвращает статистику по чату между user1 и user2 
 *               или undefined, если не найден
 *               формат результата: {chatId, newMsgs, totalMsgs} или undefined
 *   find(users) - возвращает информацию об одном чате 
 *               между пользователями из массива users 
 *               или undefined, если не найден
 *   getHistory(id) - получение всех сообщения из чата ID
 *               или undefined, если не найден
 *   add(item) - добавление объекта(чат) в хранилище.
 *               возвращает ID добавленного объекта или undefined. ID объекта формируется автоматически
 *   sendMessage(chatId, item, markRead = true) - добавление сообщения в чат с идентификатором chatId.
 *                      Возвращает JSON-объект с добавленным сообщением
 *                      или undefined, если чата с chatId нет
 *                      если markRead==true, то все предыдущие соощения чата помечаются прочитанными
 *   markRead(chatId, userId, msgId, date = new Date()) - помечает дату прочтения (readAt) сообщения
 *                      с идентификатором msgId в чате chatId.
 *                      Сообщение не должно быть отправлено пользователем userId
 *                      При ошибке возвращает undefined
 *   _dumpToFile() - сохранение содержимого списка в файле FILENAME
 * 
*/
class ChatFile {
    constructor(filename = undefined) {
        this.fileName = filename
        // считываем содержимое файла и заполняем контейнер
        if (this.fileName) {
            try {
                this.storage = JSON.parse(fs.readFileSync(filename, 'utf8')) || [];
            } catch (e) {
                this.storage = [];
            }
        }
    }

    _dumpToFile() {
        // если файл настроен - сохраняем в него содержимое контейнера
        if (this.fileName) {
            let json = JSON.stringify(this.storage)
            try {
                fs.writeFileSync(this.fileName, json)
            } catch (e) {
                console.log("Error write to file ", this.fileName)
                console.log(e)
            }
        }
    }

    getAll() {
        return this.storage;
    }

    async get(id) {
        return this.storage.find((e) => e._id == id)
    }

    async getByUser(user) {
        return this.storage.filter((e) => e.users.includes(user.toString()))
    }

    async getByUsers(user1, user2) {
        const users = [user1, user2]        
        const idx = this.storage.findIndex((e) => e.users.length === 2 && e.users.includes(user1?.toString()) && e.users.includes(user2?.toString()))
        // если чат не найден
        if (idx === -1)
            return undefined
        
        return this.storage[idx]
    }

    async getChatStatistic(user1, user2) {
        const chat = await this.getByUsers(user1, user2)
        if (chat) {
            const newMsgs = chat.messages.filter((x) => !x.readAt && x.authorId != user1).length
            const totalMsgs = chat.messages.length
            return {
                chatId: chat._id,
                newMsgs,
                totalMsgs
            }
        }
        return undefined
    }

    async find(users) {
        return users?.length === 2 ? this.getByUsers(users[0], users[1]) : undefined
    }

    async getHistory(id) {
        const data = await this.get(id)
        return data ? data.messages : undefined
    }

    async add(item) {
        // сохранение старого размера контейнера
        const oldSize = this.storage.length
        // новый ID объекта
        item._id = +this.storage.length + 1
        // меняем ID объекта, если такая в коллекции уже есть
        while (await this.get(item._id)) {
            item._id++
        }
        // создаем пустой массив сообщений
        item.messages = []

        try {
            // сохранение объекта
            this.storage.push(item)
            // запись в файл
            this._dumpToFile()
            // проверка успешности записи
            if (this.storage.length > oldSize)
                return item._id
            else
                return undefined
        } catch (e) {
            console.log("ERROR - ", e)
            return undefined
        }
    }

    async sendMessage(chatId, item, markRead = true) {
        const idx = this.storage.findIndex((e) => e._id == chatId)
        // если чат не найден
        if (idx === -1)
            return undefined

        try {
            // помечаем все предыдущие сообщения прочитанными
            // если передан флаг markRead
            if (markRead) {
                for (let i = 0; i < this.storage[idx].messages.length; i++) {
                    if (this.storage[idx].messages[i].authorId != item.authorId && !this.storage[idx].messages[i].readAt) {
                        this.storage[idx].messages[i] = await this.markRead(chatId, item.authorId, this.storage[idx].messages[i]._id, new Date())
                    }
                }
            }
        }
        catch (e) {
            console.log("ERROR - ", e)
            return undefined
        }
        // основной блок - добавление сообщения
        try {
            const oldSize = this.storage[idx].messages.length
            this.storage[idx].messages.push(item)
            // запись в файл
            this._dumpToFile()
            // проверка успешности записи
            if (this.storage[idx].messages.length > oldSize)
                return this.storage[idx].messages[oldSize]
            else
                return undefined
        } catch (e) {
            console.log("ERROR - ", e)
            return undefined
        }
    }

    async markRead(chatId, userId, msgId, date) {
        const idx = this.storage.findIndex((e) => e._id == chatId)

        // если чат не найден
        if (idx === -1)
            return undefined

        // если не тот чат
        if (!this.storage[idx].users.includes(userId.toString()))
            return undefined

        try {
            const msgIdx = this.storage[idx].messages?.findIndex((e) => e?._id == msgId)
            // если нет такого сообщения
            if (msgIdx === -1)
                return undefined

            // user - должен быть получателем, а не автором
            if (this.storage[idx].messages[msgIdx].authorId == userId)
                return undefined


            // если поле readAt - пустое, заполняем его, иначе возвращаем без изменений
            if (!this.storage[idx].messages[msgIdx].readAt) {
                this.storage[idx].messages[msgIdx].readAt = date
                // запись в файл
                this._dumpToFile()
            }
            // возвращаем измепенное (если были изменения) сообщение
            return this.storage[idx].messages[msgIdx]
        } catch (e) {
            console.log("ERROR - ", e)
            return undefined
        }
    }


}

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// экспорт класса
export default ChatFile