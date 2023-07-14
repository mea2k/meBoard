import fs from 'fs'

/////////////////////////////////////////////////
/////////////////////////////////////////////////

/** КЛАСС - СПИСОК ОБЪЯВЛЕНИЦ НА ОСНОВЕ ФАЙЛА
 * сохраняет всю информацию об объявлениях в файле FILENAME
 * (имя передается конструктору, если имени нет - то просто в памяти)
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
 *   getByUserId(userId) - возвращает множество объектов (объявлений), в которых
 *               поле userId равно параметру USERID 
 *               или [], если ничего не найдено
 *   getByUsers(userArray) - возвращает множество объектов (объявлений), в которых
 *               поле userId содержится в массиве userArray 
 *               или [], если ничего не найдено
 *   getAllByUser(userId) - возвращает множество объектов (объявлений), в которых
 *               поле userId равно параметру USERID, включая удаленные 
 *               или [], если ничего не найдено
 *   find(params) - возвращает множество объектов (объявлений) в соответствии
 *               с параметрами поиска PARAMS ({shortText, description, userId, tags})
 *               или пустой массив [], если ничего не найдено
 *   add(item) - добавление объекта(объявление) в хранилище.
 *               возвращает добавленный объект или undefined. ID объекта формируется автоматически
 *   modify(id, item) - изменение содержимого полей объекта(объявления) с идентификатором ID.
 *                      Возвращает измененный объект или undefined, если объекта с ID нет
 *   markDeleted(id) - помечает, что объект удален (isDeleted = true).
 *                Физически объект НЕ удаляется.
 *                Возвращает 1 в случае успеха или 0, если объект не найден.
 *   delete(id) - удаление объекта(объявление) с идентификатором ID.
 *                Возвращает 1 в случае успеха или 0, если объект не найден.
 *   _dumpToFile() - сохранение содержимого списка в файле FILENAME
 * 
*/
class AdvertFile {
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

    _unique(array) {
        return array.filter((item, index, self) =>
            index === self.findIndex((t) =>
                t._id == item._id
            )
        )
    }


    getAll() {
        return this.storage.filter((e) => !e.isDeleted)
    }

    async get(id) {
        return this.storage.find((e) => e._id == id && !e.isDeleted)
    }

    async getByText(text) {
        const regStr = new RegExp(text.trim().split(' ').join("|"), "ig")
        return this.storage.filter((e) => regStr.test(e.shortText) && !e.isDeleted)
    }

    async getByDesc(text) {
        const regStr = new RegExp(text.trim().split(' ').join("|"), "ig")
        return this.storage.filter((e) => regStr.test(e.description) && !e.isDeleted)
    }

    async getByTags(tagsArray) {
        return this.storage.filter((e) => {
            for (var tag of tagsArray) {
                if (!e.tags || !e.tags.includes(tag))
                    return false
            }
            return !e.isDeleted
        })
    }

    async getByUserId(userId) {
        return this.storage.filter((e) => e.userId == userId && !e.isDeleted)
    }

    async getByUsers(userArray) {
        return this.storage.filter((e) => userArray.includes(e.userId) && !e.isDeleted)
    }

    async getAllByUserId(userId) {
        return this.storage.filter((e) => e.userId == userId)
    }

    async find(params) {
        //TODO: медленная реализация - нестрашно
        const resByText = params.shortText ? await this.getByText(params.shortText) : []
        //console.log('TEXT - ', resByText)
        const resByDesc = params.description ? await this.getByDesc(params.description) : []
        //console.log('DESC - ', resByDesc)
        const resByTags = params.tags?.length ? await this.getByTags(params.tags) : []
        //console.log('TAGS - ', resByTags)
        const resByUserId = params.userId ? await this.getByUserId(params.userId) : []
        //console.log('USER - ', resByUser)
        const resByUsers = params.users ? await this.getByUsers(params.users) : []

        return this._unique([
            ...resByText,
            ...resByDesc,
            ...resByTags,
            ...resByUserId,
            ...resByUsers
        ])
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
        try {
            // сохранение объекта
            this.storage.push(item)
            // запись в файл
            this._dumpToFile()
            // проверка успешности записи
            if (this.storage.length > oldSize)
                return item
            else
                return undefined
        } catch (e) {
            console.log("ERROR - ", e)
            return undefined
        }
    }

    modify(id, item) {
        const idx = this.storage.findIndex((e) => e._id == id)
        if (idx !== -1) {
            this.storage[idx] = {
                ...this.storage[idx],
                ...item,
                _id: id
            }
            this._dumpToFile()
            return this.storage[idx]
        }
        return undefined
    }

    markDeleted(id) {
        const idx = this.storage.findIndex((e) => e._id == id)
        if (idx !== -1) {
            this.storage[idx].isDeleted = true
            this._dumpToFile()
            return 1
        }
        return 0
    }

    delete(id) {
        const idx = this.storage.findIndex((e) => e._id == id)
        if (idx !== -1) {
            this.storage.splice(idx, 1)
            this._dumpToFile()
            return 1
        }
        return 0
    }
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// экспорт класса
export default AdvertFile