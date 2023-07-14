
/////////////////////////////////////////////////
/////////////////////////////////////////////////

/** КЛАСС - СПИСОК ПОЛЬЗОВАТЕЛЕЙ НА ОСНОВЕ БД
 * сохраняет всю информацию о пользователях в коллекции БД DBNAME
 * (конструктору передается модель-объект для работы с БД)
 * МЕТОДЫ КЛАССА:
 *   getAll()  - возвращает все содержимое контейнера
 *   get(id)   - возвращает один объект(пользователя) по идентификатору ID 
 *               или undefined, если не найден 
 *   getLogin(id) - возвращает login пользователя с идентификатором id 
 *                       или undefined, если не найден 
 *   getByLogin(login) - возвращает один объект(пользователя) по логину 
 *                       или undefined, если не найден 
 *   getByEmail(email) - возвращает список объектов(пользователей) по email 
 *                       или [], если не найдены 
 *   add(item) - добавление объекта(пользователя) в хранилище
 *               возвращает добавленный объект. ID объекта формируется автоматически
 *   modify(id, item) - изменение содержимого полей объекта(пользователя) с идентификатором ID.
 *                      Возвращает измененный объект или undefined, если объекта с ID нет
 *   delete(id) - удаление объекта(пользователя) с идентификатором ID.
 *                Возвращает 1 в случае успеха или 0, если объект не найден.
 * 
*/
class UserDb {
    constructor(dbModel) {
        this.dbModel = dbModel
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

    async getLogin(id) {
        let data = undefined
        try {
            data = await this.dbModel.findById(id, 'login')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data?.login
    }

    async getByLogin(login) {
        let data = undefined
        try {
            data = await this.dbModel.findOne({ login }).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
    }

    async getByEmail(email) {
        const regStr = new RegExp(email.trim(), "ig")
        let data = []
        try {
            //data = await this.dbModel.find({ "email": { $regex: /{email/, $options: 'i' } }).select('-__v')
            data = await this.dbModel.find({
                "email": regStr
            }).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
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
            const res = await this.dbModel.findByIdAndUpdate(id, item)
            // получение обновленных данных
            data = this.get(id)
            //data = await this.dbModel.findById(id).select('-__v')
        } catch (e) {
            console.log("ERROR - ", e)
        }
        return data
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
export default UserDb