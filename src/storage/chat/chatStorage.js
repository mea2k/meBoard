import fs from 'fs'
import { Message } from './message.js';

import CONFIG from "../../config.js";
import ChatFile from './chatFile.js';
import ChatDb from './chatDb.js';
import chat from '../../models/chat.js';
import messages from '../../models/message.js';

/////////////////////////////////////////////////
/////////////////////////////////////////////////

const defaultFilename = CONFIG.DATA_PATH + CONFIG.CHAT_FILE

/////////////////////////////////////////////////
/////////////////////////////////////////////////

/** КЛАСС - КОНТЕЙНЕР ЧАТОВ 
 * сохраняет всю информацию о чатах и сообщениях в файле FILENAME или в БД DBMODEL+DBMESSAGES
 * (имена передаются конструктору, если имен нет - то просто в памяти)
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
 *                      если markRead==true, то все предыдущие сообщения чата помечаются прочитанными
 *   markRead(chatId, userId, msgId, date = new Date()) - помечает дату прочтения (readAt) сообщения
 *                      с идентификатором msgId в чате chatId.
 *                      Сообщение не должно быть отправлено пользователем userId
 *                      При ошибке возвращает undefined
 * 
*/
class ChatStorage {
    constructor(dbModel = undefined, dbMessages = undefined, filename = undefined) {
        this.dbModel = dbModel
        this.dbMessages = dbMessages
        // если не указана модель БД и не указано имя файла,
        // то берется имя файла по умолчанию (defaultFilename)
        this.fileName = (dbModel || filename) ? filename : defaultFilename

        // если работает с файлом - создаем объект CHATFILE
        if (this.fileName) {
            this.storage = new ChatFile(this.fileName)
        }

        // если работаем с БД - создаем объект BOOKDB
        if (this.dbModel && this.dbMessages) {
            this.storage = new ChatDb(this.dbModel, this.dbMessages)
        }
    }

    async getAll() {
        return this.storage.getAll();
    }

    async get(id) {
        return this.storage.get(id)
    }

    async getByUser(user) {
        return this.storage.getByUser(user) 
    }

    async getByUsers(user1, user2) {
        return this.storage.getByUsers(user1, user2) 
    }

    async getChatStatistic(user1, user2) {
        return this.storage.getChatStatistic(user1, user2) 
    }

    async find(users) {
        return this.storage.find(users) 
    }

    async getHistory(id) {
        return this.storage.getHistory(id) 
    }

    async add(item) {
         // добавление времени создания, если его нет
         item.createdAt = item.createdAt ? item.createdAt : new Date()
         return this.storage.add(item) 
     }

    async sendMessage(chatId, item, markRead = true) {
        const msg = new Message(item.authorName, item.authorId, item.text, item.sentAt)
        return this.storage.sendMessage(chatId, msg.JSON(), markRead) 
     }

    async markRead(chatId, userId, msgId, date = new Date()) {
        return this.storage.markRead(chatId, userId, msgId, date)
   }

}

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// Создание глобального объекта "СПИСОК ЧАТОВ"
var chatStorage
switch (CONFIG.STORAGE_TYPE) {
    case "file":
        chatStorage = new ChatStorage()
        break
    case "mongo":
        chatStorage = new ChatStorage(chat, messages)
        break
}

// экспорт не класса, а объекта
export { chatStorage }