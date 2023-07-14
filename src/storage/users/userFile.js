import fs from 'fs'

/////////////////////////////////////////////////
/////////////////////////////////////////////////

/** КЛАСС - СПИСОК ПОЛЬЗОВАТЕЛЕЙ НА ОСНОВЕ ФАЙЛА
 * сохраняет всю информацию о пользователях в файле FILENAME
 * (имя передается конструктору, если имени нет - то просто в памяти)
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
 *   add(item) - добавление объекта(пользователя) в хранилище.
 *               возвращает добавленный объект или undefined. ID объекта формируется автоматически
 *   modify(id, item) - изменение содержимого полей объекта(польщователя) с идентификатором ID.
 *                      Возвращает измененный объект или undefined, если объекта с ID нет
 *   delete(id) - удаление объекта(пользователя) с идентификатором ID.
 *                Возвращает 1 в случае успеха или 0, если объект не найден.
 *   _dumpToFile() - сохранение содержимого списка в файле FILENAME
 * 
*/
class UserFile {
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
        return this.storage.find();
    }

    async get(id) {
        return this.storage.find((e) => e._id == id)
    }

    async getLogin(id) {
        return this.storage.find((e) => e._id == id)?.login
    }

    getByLogin(login) {
        return this.storage.find((e) => e.login === login)
    }

    getByEmail(email) {
        const regStr = new RegExp(email?.trim().split(' ').join("|"), "ig")
        return this.storage.filter((e) => regStr.test(e.email))
    }

    async add(item) {
        // проверка, что нет такого логина
        if (await this.getByLogin(item.login))
            return undefined

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
        } catch(e) {
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
export default UserFile