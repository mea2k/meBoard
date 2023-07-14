

/////////////////////////////////////////////////
/////////////////////////////////////////////////

/** КЛАСС - КОНТЕЙНЕР ЧАТОВ НА ОСНОВЕ БД
 * содержит список всех чатов и сообщений в коллекции БД DBNAME, а сообщения сохраняются в БД DBMESSAGES
 * (конструктору передается модель-объект для работы с БД)
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
 *   sendMessage(chatId, item) - добавление сообщения в чат с идентификатором chatId.
 *                      Возвращает JSON-объект с добавленным сообщением
 *                      или undefined, если чата с chatId нет
 *   markRead(chatId, userId, msgId, date = new Date()) - помечает дату прочтения (readAt) сообщения
 *                      с идентификатором msgId в чате chatId.
 *                      Сообщение не должно быть отправлено пользователем userId
 *                      При ошибке возвращает undefined
*/
class ChatDb {
    constructor(dbModel, dbMessages) {
        this.dbModel = dbModel
        this.dbMessages = dbMessages
    }

    async getAll() {
        let data = []
        try {
            data = await this.dbModel.find().select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async get(id) {
        let data = undefined
        try {
            data = await this.dbModel.findById(id).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getByUser(user) {
        let data = []
        try {
            data = await this.dbModel.find(
                { users: { $in: user } }
            ).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getByUsers(user1, user2) {
        let data = undefined
        const users = [user1, user2]
        try {
            data = await this.dbModel.findOne(
                { users: { $all: users } }
            ).select('-__v')
         } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getChatStatistic(user1, user2) {
        try {
            const chat = await this.getByUsers(user1, user2)
            if (chat) {
                // всего сообщений пользователю user1 в чате chat._id
                const TotalMyMsgs = await this.dbMessages.countDocuments({
                    "authorId": { $ne: user1 },
                    "chat": chat._id
                })

                 // прочитанных сообщений пользователем user1 в чате chat._id
                 // ( поле readAt содержит дату (тип DATE - 9) )
                 const TotalReadMyMsgs = await this.dbMessages.countDocuments({
                    "authorId": { $ne: user1 },
                    "chat": chat._id,
                    "readAt": { $type: 9 }      // 9 - тип поля DATE (null и '' - не DATE)
                })

                // число непрочитанных сообщений пользователем user1 в чате chat._id
                const newMsgs = TotalMyMsgs - TotalReadMyMsgs
                // const newMsgs = await this.dbMessages.countDocuments({
                //     "authorId": { $ne: user1 },
                //     "chat": chat._id,
                //     "readAt": { $type: {$ne: 9} }   // 9 - тип поля DATE (null и '' - не DATE)
                // })

                // всего сообщений в чате chat._id
                const totalMsgs = await this.dbMessages.countDocuments({
                    "chat": chat._id
                })
 
                return {
                    chatId: chat._id,
                    newMsgs,
                    totalMsgs
                }
            }
        }
        catch (e) {
            console.log("ERROR GET CHATSTAT - ", e)
            return undefined
        }
    }

    async find(users) {
        return users?.length === 2 ? this.getByUsers(users[0], users[1]) : undefined
    }

    async getHistory(id) {
        let data = []
        try {
            data = await this.dbMessages.find(
                { "chat": id }
            ).sort("sentAt")
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async add(item) {
        // проверка, что такого чата еще нет
        const chat = await this.getByUsers(item.users[0], item.users[1])
        // если чат есть, то возвращаем его ID
        if (chat)
            return chat._id

        // формируем новый уникальный ID
        // и пытаемся добавить новый объект(пользователя)
        var cursor = await this.dbModel.collection.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1)
        const lastItem = await cursor.next()
        // новый ID
        var nextId = lastItem ? +(lastItem._id) + 1 : 1;
        item._id = nextId.toString();
        // заполняем время создания, если оно не указано
        item.createdAt = item.createdAt ? item.createdAt : new Date()

        let data = undefined
        try {
            data = await this.dbModel.collection.insertOne(item);
        } catch (e) {
            console.log("ERROR - ", e.code, e)
            return undefined
        }
        return data?.insertedId
    }

    async sendMessage(chatId, item, markRead = true) {
        // добавляем привязку к чату
        item.chat = chatId
        item.sentAt = new Date(item.sentAt)
        try {
            // помечаем все предыдущие сообщения прочитанными
            // если передан флаг markRead
            if (markRead) {
                const date = new Date()
                const res = await this.dbMessages.updateMany({
                    "chat": chatId,
                    "authorId": item.authorId,
                    "readAt": { $exists: false }
                }, {
                    "readAt": date
                })
            }
            var results = await this.dbMessages.collection.insertOne(item);
        } catch (e) {
            console.log("ERROR - ", e.code, e)
            return undefined
        }
        return results
    }

    async markRead(chatId, userId, msgId, date) {
        const chat = await this.get(chatId)
        let data = []
        if (chat) {
            // если не тот чат
            if (chat._id != chatId)
                return undefined

            try {
                // user - должен быть получателем, а не автором
                data = await this.dbMessages.findOneAndUpdate({
                    "_id": msgId,
                    "authorId": { $ne: userId }
                }, {
                    "readAt": date
                }, { "new": true })
            } catch (e) {
                console.log("ERROR - ", e.code, e)
                return undefined
            }
            return data
        }

        // если чат не найден
        return undefined
    }

}

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// экспорт класса
export default ChatDb