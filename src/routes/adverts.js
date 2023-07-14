import express from 'express';

import { JSONError } from '../error.js';
import fileMulter from '../middleware/fileMulter.js';
import { advertStorage } from '../storage/advertisements/advertisementStorage.js';
import passport from 'passport';
import { chatStorage } from '../storage/chat/chatStorage.js';
import { userStorage } from '../storage/users/userStorage.js';


const advertsRouter = express.Router()

/** ОТОБРАЖЕНИЕ СПИСКА ВСЕХ ОБЪЯВЛЕНИЙ
 * URL:     /advert 
 * METHOD:  GET
 * @constructor
 * @returns code - 200
 * @returns body - список объявлений в EJS-шаблоне index.ejs
*/
advertsRouter.get('/', async (req, res) => {
    // получение данных
    try {
        const data = await advertStorage.getAll()
        // отправка кода ответа
        res.status(200)
        res.render('pages/adverts/index', {
            title: 'Список объявлений',
            data,
            user: req.user
        })
    } catch (e) {
        res.status(500)
        res.render('errors/index', {
            title: 'Ошибка 500',
            data: JSONError.make(500, 'Ошибка получения записей'),
            user: req.user
        })
    }
})


/** ДОБАВЛЕНИЕ НОВОГО ОБЪЯВЛЕНИЯ С ЗАГРУЗКОЙ ФАЙЛА - ФОРМА
 * URL:     /advert/add
 * METHOD:  GET
 * Метод доступен только после авторизации
 * @constructor
 * @returns code - 200
 * @returns body - форма добавления книги на базе шаблона pages/adverts/add_edit.ejs
*/
advertsRouter.get('/add',
    // middleware - проверка, что аутентифицирован
    (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/user/login')
        }
        next()
    },
    // основной обработчик
    (req, res) => {
        // отображение формы
        res.status(200)
        res.render('pages/adverts/add_edit', {
            title: 'Добавление объявления',
            action: 'Добавить',
            data: {},
            user: req.user
        })
    })


/** ДОБАВЛЕНИЕ НОВОГО ОБЪЯВЛЕНИЯ С ЗАГРУЗКОЙ ФАЙЛА - ОБРАБОТКА ФОРМЫ
 * URL:     /advert/add
 * METHOD:  POST
 * @constructor
 * @params {JSON} body - параметры нового объявления 
 *                {shortText,description,tags}
 * @params FILE  images[] - загружаемые на сервер файлы (элементы images типа FILE в форме)
 * @returns code - 201 или 403 (если ошибка)
 * @returns body - сам добавленный объект в формате JSON ({...}) 
 *                 или информация об ошибке в формате JSON {"errcode", "errmsg"}
*/
advertsRouter.post('/add',
    // middleware - проверка, что аутентифицирован
    (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/user/login')
        }
        next()
    },
    // обработка файлов
    fileMulter.array('images[]', 5),
    // основной обработчик
    async (req, res) => {
        // получение данных из тела POST-запроса
        const {
            shortText,
            description,
            tags
        } = req.body

        // загрузка файлов (path)
        // и сохранение оригинальных имен (name)
        var images = []
        if (req.files) {
            for (var f of req.files) {
                images.push({
                    path: f.path,
                    name: Buffer.from(f.originalname, 'latin1').toString('utf8')
                })
            }
        }

        // создание нового объекта - Объявление
        const newItem = {
            shortText,
            description,
            tags: tags?.replace(',', ' ').split(' '),
            images
        }

        // добавление информации об авторе
        newItem.userId = req.user._id

        try {
            //console.log(newItem)
            var addedData = await advertStorage.create(newItem)
            console.log('NEW ADVERT ', addedData)
            // перенаправляем на страницу каталока
            res.redirect('/advert')
        } catch (e) {
            // данные НЕ добавлены
            res.status(403)
            res.render('errors/index', {
                title: 'Ошибка добавления данных',
                data: JSONError.err403(e.message)
            })
        }
    })


/** РЕДАКТИРОВАНИЕ ИНФОРМАЦИИ ПО ОБЪЯВЛЕНИЮ - ФОРМА
 * URL:     /advert/edit/:id
 * METHOD:  GET
 * PARAMS:
 * @constructor
 * @params {String} id   - ID объявления
 * @returns code - 200 или 404 (если не найдена книга)
 * @returns none - форма редактирования в EJS-шаблоне form.ejs 
 *                 или страница с ошибкой на базе шаблона errors/index.ejs
*/
advertsRouter.get('/edit/:id',
    // middleware - проверка, что аутентифицирован
    (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/user/login')
        }
        next()
    },
    // основной обработчик
    async (req, res) => {
        // получение параметров запроса
        const { id } = req.params

        try {
            // получение информации об объявлении
            const data = await advertStorage.get(id)

            // проверка, что объявление есть
            if (!data) {
                throw new Error("Объявление не найдено")
            }
            // проверка, что это свое объявление
            if (!req.user || req.user._id != data.userId) {
                throw new Error("Требуется авторизация/неверный владелец объявления")
            }

            // если все в порядке - открываем форму редактирования
            res.status(200)
            res.render('pages/adverts/add_edit', {
                title: 'Изменение объявления',
                action: 'Сохранить',
                data: data,
                user: req.user
            })
        } catch (e) {
            res.status(404)
            res.render('errors/index', {
                title: '404 - ' + e.message,
                data: JSONError.err404(e.message),
                user: req.user
            })
        }
    })


/** РЕДАКТИРОВАНИЕ ИНФОРМАЦИИ ПО ВЫБРАННОМУ ОБЪЯВЛЕНИЮ - СОХРАНЕНИЕ
 * URL:     /advert/edit/:id
 * METHOD:  POST
 * PARAMS:
 * @constructor
 * @params {String} id   - ID книги
 * @params {JSON}   body - новые параметры объявления (title,description,authors,favorite,fileCover,fileName)
 * @returns code - 200 или 404 (если не найдена книга)
 * @returns none - перенаправляет на страницу книги ('/books/:id') 
 *                 или страница с ошибкой на базе шаблона errors/index.ejs
*/
advertsRouter.post('/edit/:id',
    // middleware - проверка, что аутентифицирован
    (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/user/login')
        }
        next()
    },
    // обработка файлов
    fileMulter.array('images[]', 5),
    // основной обработчик
    async (req, res) => {
        // получение параметров запроса
        const { id } = req.params

        // получение данных из тела POST-запроса
        const {
            shortText,
            description,
            tags
        } = req.body

        // загрузка файлов (path)
        // и сохранение оригинальных имен (name)
        var images = []
        if (req.files) {
            for (var f of req.files) {
                images.push({
                    path: f.path,
                    name: Buffer.from(f.originalname, 'latin1').toString('utf8')
                })
            }
        }

        try {
            // получение информации об объявлении
            const data = await advertStorage.get(id)

            // проверка, что объявление есть
            if (!data) {
                throw new Error("Объявление не найдено")
            }

            // проверка, что это свое объявление
            if (!req.user || req.user._id != data.userId) {
                throw new Error("Требуется авторизация/неверный владелец объявления")
            }

            // создание нового объекта - Объявление
            // и замена модифицированных полей
            var newItem = data
            newItem.shortText = shortText ? shortText : newItem.shortText
            newItem.description = description ? description : newItem.description
            newItem.tags = tags ? tags.split(',') : newItem.tags
            newItem.images = newItem.images.concat(images)

            // добавление информации об авторе
            newItem.userId = req.user._id

            // сохранение изменений
            var addedData = await advertStorage.modify(id, newItem)
            //console.log(addedData)

            // перенаправляем на страницу каталока
            res.redirect('/advert')
        } catch (e) {
            // данные НЕ обновлены
            res.status(403)
            res.render('errors/index', {
                title: 'Ошибка обновления данных',
                data: JSONError.err403(e.message)
            })
        }
    })

/** УДАЛЕНИЕ ВЫБРАННОГО ОБЪЯВЛЕНИЯ
 * URL:     /advert/delete/:id
 * METHOD:  POST
 * @constructor
 * @params {String} id   - ID книги
 * @returns code - 200 или 404 (если не найдена книга)
 * @returns body - 'ok'
 *                 или информация об ошибке в формате JSON {"errcode", "errmsg"}
*/
advertsRouter.post('/delete/:id',
    // middleware - проверка, что аутентифицирован
    (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/user/login')
        }
        next()
    },
    // основной обработчик
    async (req, res) => {
        // получение параметров запроса
        const { id } = req.params

        try {
            // получение информации об объявлении
            const data = await advertStorage.get(id)

            // проверка, что объявление есть
            if (!data) {
                throw new Error("Объявление не найдено")
            }

            // проверка, что это свое объявление
            if (!req.user || req.user._id != data.userId) {
                throw new Error("Требуется авторизация/неверный владелец объявления")
            }

            // удаление существующего объявления
            const delResult = await advertStorage.remove(id)
            if (delResult) {
                // отправка кода ответа
                res.status(200)
                // перенаправляем на страницу каталока
                res.redirect('/advert')
            } else {
                throw new Error('Данные не найдены')
            }
        } catch (e) {
            res.status(404)
            res.render('errors/index', {
                title: 'Ошибка удаления данных',
                data: JSONError.err404(e.message)
            })
        }
    })


/** ПОЛУЧЕНИЕ ИНФОРМАЦИИ ПО ВЫБРАННОМУ ОБЪЯВЛЕНИЮ
 * URL:     /advert/:id
 * METHOD:  GET
 * @constructor
 * @params {string} id - ID объявления
 * @returns code - 200 или 404 (если не найдено объявление)
 * @returns body - информация об объявлении в формате JSON {...} 
 *                 или информация об ошибке в формате JSON {"errcode", "errmsg"}
*/
advertsRouter.get('/:id', async (req, res) => {
    // получение параметров запроса
    const { id } = req.params
    const user = req.user

    // получение данных
    try {
        const data = await advertStorage.get(id)
        if (data === undefined || data === null) {
            throw new Error('Данные не найдены')
        }

        // получение информации о чате с владельцем объявления
        var chat = await chatStorage.getByUsers(user?._id, data.userId)
        if (chat) {
            chat.login = await userStorage.getLogin(data.userId)
            chat.chatStat = await chatStorage.getChatStatistic(user?._id, data.userId)
        }
        // отправка кода ответа
        res.status(200)
        res.render('pages/adverts/view', {
            title: data.shortText,
            data,
            user: req.user,
            chat: chat
        })
    } catch (e) {
        res.status(404)
        res.render('errors/index', {
            title: '404 - ' + e.message,
            data: JSONError.err404(e.message),
            user: req.user
        })
    }
})




// экспорт
export default advertsRouter

