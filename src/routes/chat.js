import express from 'express';

import { JSONError } from '../error.js';
import { chatStorage } from '../storage/chat/chatStorage.js';
import { userStorage } from '../storage/users/userStorage.js';


const chatRouter = express.Router()

/** ОТОБРАЖЕНИЕ СТРАНИЦЫ ЧАТА
 * URL:     /chat
 * METHOD:  GET
 * @constructor
 * @returns code - 200
 * @returns body - страница чата в EJS-шаблоне chat/index.ejs
*/
chatRouter.get('/',
    // middleware - проверка, что уже аутентифицирован
    (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/user/login')
        }
        next()
    },
    // основной обработчик
    async (req, res) => {
        // авторизованный пользователь
        const user = req.user
        // получение списка его чатов
        var data = await chatStorage.getByUser(user._id)
        for (let i = 0; i < data.length; i++) {
            data[i].login = await userStorage.getLogin(data[i].users[0] == user._id ? data[i].users[1] : data[i].users[0])
            data[i].chatStat = await chatStorage.getChatStatistic(user._id, data[i].users[0] == user._id ? data[i].users[1] : data[i].users[0])
        }
        res.status(200)
        res.render('pages/chat/index', {
            title: 'Пользовательский чат',
            data,
            user,
            search_data: {}
        })
    })


/** ОТОБРАЖЕНИЕ СТРАНИЦЫ ЧАТА - РЕЗУЛЬТАТЫ ПОИСКА
 * URL:     /chat
 * METHOD:  POST
 * @constructor
 * @params {JSON} body - параметры поиска 
 *                {userEmail}
 * @returns code - 200
 * @returns body - страница чата в EJS-шаблоне chat/index.ejs
*/
chatRouter.post('/',
    // middleware - проверка, что уже аутентифицирован
    (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/user/login')
        }
        next()
    },
    // основной обработчик
    async (req, res) => {
        // авторизованный пользователь
        const user = req.user
        // получение данных из тела POST-запроса
        const { userEmail } = req.body

        //поиск пользователей
        const usersFound = await userStorage.getByEmail(userEmail)

        var data = []

        // получение списка чатов текущего полььзователя и всех найденных
        for (let i = 0; i < usersFound.length; i++) {
            // пропускаем чат с собой
            if (user._id == usersFound[i]._id)
                continue

            let chatItem = {}
            chatItem.login = usersFound[i].login
            chatItem.userId = usersFound[i]._id
            chatItem.chat = await chatStorage.getByUsers(user._id, usersFound[i]._id)
            if (chatItem.chat) {
                chatItem.chatStat = await chatStorage.getChatStatistic(user._id, usersFound[i]._id)
                chatItem._id = chatItem.chat._id
            }
            data.push(chatItem)
        }
         res.status(200)
        res.render('pages/chat/index', {
            title: 'Пользовательский чат',
            data,
            user,
            search_data: { userEmail }
        })
    })


/** СОЗДАНИЕ ЧАТА
 * URL:     /chat/add/:userId
 * METHOD:  GET
 * @constructor
 * @returns code - 200 или 404 если неуспех
 * @returns body - страница чата в EJS-шаблоне chat/index.ejs
*/
chatRouter.get('/add/:userId',
    // middleware - проверка, что уже аутентифицирован
    (req, res, next) => {
        if (!req.isAuthenticated()) {
            return res.redirect('/user/login')
        }
        next()
    },
    // основной обработчик
    async (req, res) => {
        // получение параметров запроса
        const { userId } = req.params
        // получение информации о авторизованном пользователе
        const curUserId = req.user?._id.toString()
        const newChatItem = {
            users: [curUserId, userId]
        }

        try {
            // добавление нового чата
            var newChatId = await chatStorage.add(newChatItem)
            // проверка, что добавилось
            if (!newChatId) {
                throw new Error("Ошибка создания чата")
            }
            // если все в порядке - перенаправляем на страницу чата
            res.redirect('/chat/' + newChatId)
        } catch (e) {
            res.status(404)
            res.render('errors/index', {
                title: '404 - ' + e.message,
                data: JSONError.err404(e.message),
                user: req.user
            })
        }

    })


/** ПРОСМОТР СОДЕРЖИМОГО ВЫБРАННОГО ЧАТА
 * URL:     /chat/:id
 * METHOD:  GET
 * @constructor
 * @returns code - 200 или 404 если неуспех
 * @returns body - страница чата в EJS-шаблоне chat/view.ejs
*/
chatRouter.get('/:id',
    // middleware - проверка, что уже аутентифицирован
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
        const user = req.user
        // получение информации о авторизованном пользователе
        const curUserId = user?._id.toString()

        try {
            // поиск чата
            const data = await chatStorage.get(id)

            // проверка, что чат нашелся
            if (!data) {
                throw new Error("Искомый чат не найден")
            }
            // проверка, что чат с авторизованным пользователем
            if (!data.users.includes(curUserId)) {
                throw new Error("Данный чат вам недоступен")
            }

            // получаем историю чата
            const chatHistory = await chatStorage.getHistory(id)

            // помечаем ообщения прочитанными
            for (let i = 0; i < chatHistory.length; i++) {
                if (chatHistory[i].authorId != user._id && !chatHistory[i].readAt) {
                    chatHistory[i] = await chatStorage.markRead(id, user._id, chatHistory[i]._id)
                }
            }

            // если все в порядке - формируем ответ
            res.status(200)
            res.render('pages/chat/view', {
                title: 'Пользовательский чат',
                data,
                chatHistory: chatHistory,
                user,
                search_data: {}
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
export default chatRouter

