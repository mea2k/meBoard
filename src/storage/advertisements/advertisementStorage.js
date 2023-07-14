import advertisement from '../../models/advertisement.js';
import AdvertDb from "./advertisementDb.js";
import AdvertFile from "./advertisementFile.js";

import CONFIG from "../../config.js";

/////////////////////////////////////////////////
/////////////////////////////////////////////////

const defaultFilename = CONFIG.DATA_PATH + CONFIG.ADVERT_FILE


/** КЛАСС - КОНТЕЙНЕР ОБЪЯВЛЕНИЙ
 * сохраняет всю информацию об объявлениях в файле FILENAME или в БД DBMODEL
 * (имена передаются конструктору, если имен нет - то просто в памяти)
 * МЕТОДЫ КЛАССА:
 *   getAll()  - возвращает все содержимое контейнера
 *   get(id)   - возвращает один объект (объявление) по идентификатору ID 
 *               или undefined, если не найден 
 *   getByText(text) - возвращает множество объектов (объявлений), в которых
 *               в поле 'shortText' встречается искомый текст TEXT 
 *               или пустой массив [], если ничего не найдено
 *   getByDesc(text) - возвращает множество объектов (объявлений), в которых
 *               в поле 'description' встречается искомый текст TEXT 
 *               или пустой массив [], если ничего не найдено
 *   getByTags(tagsArray) - возвращает множество объектов (объявлений), в которых
 *               в поле 'tags' встречаются все теги из массива TAGSARRAY 
 *               или пустой массив [], если ничего не найдено 
 *   getByUser(userId) - возвращает множество объектов (объявлений), в которых
 *               поле 'userId' равно параметру USERID 
 *               или [], если ничего не найдено
 *   getAllByUser(userId) - возвращает множество объектов (объявлений), в которых
 *               поле 'userId' равно параметру USERID, включая удаленные, 
 *               или [], если ничего не найдено
 *   find(params) - возвращает множество объектов (объявлений) в соответствии
 *               с параметрами поиска PARAMS ({shortText, description, userId, tags})
 *               или пустой массив [], если ничего не найдено
 *   create(item) - добавление нового объявления в хранилище
 *               возвращает добавленный объект или undefined. ID объекта формируется автоматически
 *   modify(id, item) - изменение содержимого полей объекта(объявления) с идентификатором ID.
 *                      Возвращает измененный объект или undefined, если объекта с ID нет
 *   remove(id) - помечает, что объект удален (isDeleted = true).
 *                Физически объект НЕ удаляется.
 *                Возвращает 1 в случае успеха или 0, если объект не найден.
 *   delete(id) - удаление объекта(объявления) с идентификатором ID.
 *                Возвращает 1 в случае успеха или 0, если объект не найден.
 */
class AdvertStorage {
    constructor(dbModel = undefined, filename = undefined) {
        this.dbModel = dbModel
        // если не указана модель БД и не указано имя файла,
        // то берется имя файла по умолчанию (defaultFilename)
        this.fileName = (dbModel || filename) ? filename : defaultFilename

        // если работает с файлом - создаем объект BOOKFILE
        if (this.fileName) {
            this.storage = new AdvertFile(this.fileName)
        }

        // если работаем с БД - создаем объект BOOKDB
        if (this.dbModel) {
            this.storage = new AdvertDb(this.dbModel)
        }
    }

    async getAll() {
        return this.storage.getAll();
    }

    async get(id) {
        return this.storage.get(id)
    }
    
    async getByText(text) {
        return this.storage.getByText(text)
    }

    async getByDesc(text) {
        return this.storage.getByDesc(text)
    }

    async getByTags(tagsArray) {
        return this.storage.getByTags(tagsArray)
    }

    async getByUser(userId) {
        return this.storage.getByUserId(userId)
    }

    async getAllByUser(userId) {
        return this.storage.getAllByUserId(userId)
    }

    async find(params) {
        return this.storage.find(params)
    }

    async create(item) {
        // добавление времени создания, если его нет
        item.createdAt = item.createdAt ? item.createdAt : new Date()
        item.updatedAt = item.updatedAt ? item.updatedAt : ''
        // добавление флага isDeleted
        item.isDeleted = false
        return this.storage.add(item)
    }

    async modify(id, item) {
        // добавление времени модификации, если его нет
        item.updatedAt = item.updatedAt ? item.updatedAt : new Date()
        return this.storage.modify(id, item)
    }

    async remove(id) {
        return this.storage.markDeleted(id)
    }

    async delete(id) {
        return this.storage.delete(id)
    }
}


/////////////////////////////////////////////////
/////////////////////////////////////////////////

// Создание глобального объекта "СПИСОК ПОЛЬЗОВАТЕЛЕЙ"
var advertStorage
switch (CONFIG.STORAGE_TYPE) {
    case "file":
        advertStorage = new AdvertStorage()
        break
    case "mongo":
        advertStorage = new AdvertStorage(advertisement)
        break
}

// экспорт не класса, а объекта
export { advertStorage }