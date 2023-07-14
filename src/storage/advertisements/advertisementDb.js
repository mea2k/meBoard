
/////////////////////////////////////////////////
/////////////////////////////////////////////////

/** КЛАСС - СПИСОК ОБЪЯВЛЕНИЙ НА ОСНОВЕ БД
 * сохраняет всю информацию о пользователях в коллекции БД DBNAME
 * (конструктору передается модель-объект для работы с БД)
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
 */
class AdvertDb {
    constructor(dbModel) {
        this.dbModel = dbModel
    }

    _unique(array) {
        return array.filter((item, index, self) =>
            index === self.findIndex((t) =>
                t._id == item._id
            )
        )
    }


    async getAll() {
        let data = []
        try {
            data = await this.dbModel.find({ "isDeleted": false }).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async get(id) {
        let data = undefined
        try {
            data = await this.dbModel.findOne({ "_id": id, "isDeleted": false }).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getByText(text) {
        const regStr = new RegExp(text.trim().split().join("|"), "ig")
        let data = []
        try {
            data = await this.dbModel.find({
                    "shortText": regStr,
                    "isDeleted": false
                }).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getByDesc(text) {
        const regStr = new RegExp(text.trim().split().join("|"), "ig")
        let data = []
        try {
            data = await this.dbModel.find({
                    "description": regStr,
                    "isDeleted": false
                }).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getByTags(tagsArray) {
        let data = []
        try {
            data = await this.dbModel.find({ 
                "tags": { $all: tagsArray },
                "isDeleted": false 
            }).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getByUserId(userId) {
        let data = []
        try {
            data = await this.dbModel.find({ 
                "userId": userId,
                "isDeleted": false 
            }).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getByUsers(userArray) {
        let data = []
        try {
            data = await this.dbModel.find({ 
                "userId": { $in: userArray },
                "isDeleted": false 
            }).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getAllByUserId(userId) {
        let data = []
        try {
            data = await this.dbModel.find(
                { "userId": userId }
            ).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }


    async find(params) {
        //TODO: медленная реализация - нестрашно
        const resByText = params.shortText ? await this.getByText(params.shortText) : []
        const resByDesc = params.description ? await this.getByText(params.description) : []
        const resByTags = params.tags ? await this.getByTags(params.tags) : []
        const resByUser = params.userId ? await this.getByUserId(params.userId) : []
        const resByUsers = params.users ? await this.getByUsers(params.users) : []

        return this._unique([
            ...resByText,
            ...resByDesc,
            ...resByTags,
            ...resByUser,
            ...resByUsers
        ])
    }

    async add(item) {
        // формируем новый уникальный ID
        // и пытаемся добавить новый объект(пользователя)
        var cursor = await this.dbModel.collection.find({}, { _id: 1 }).sort({ _id: -1 }).limit(1)
        const lastItem = await cursor.next()
        // новый ID
        var nextId = lastItem ? +(lastItem._id) + 1 : 1;
        item._id = nextId.toString();
        try {
            var results = await this.dbModel.collection.insertOne(item);
        } catch (e) {
            console.log("ERROR - ", e.code, e)
            return undefined
        }
        return results
    }

    async modify(id, item) {
        let data = undefined
        try {
            // результат - уже обновленные данные
            const data = await this.dbModel.findByIdAndUpdate(id, item, {new: true})
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async markDeleted(id) {
        try {
            // удаление существующей книги
            const data = await this.dbModel.findByIdAndUpdate(id, { isDeleted: true })
            if (data)
                return 1

        } catch (e) {
            console.log("ERROR - ", e)
        }
        return 0
    }

    async delete(id) {
        try {
            // удаление существующей книги
            const data = await this.dbModel.findByIdAndDelete(id)
            if (data)
                return 1

        } catch (e) {
            console.log("ERROR - ", e)
        }
        return 0
    }
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// экспорт класса
export default AdvertDb