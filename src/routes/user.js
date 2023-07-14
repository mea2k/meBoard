import express from 'express'
import passport from 'passport'
import { userStorage } from '../storage/users/userStorage.js'
import { JSONError } from '../error.js'
import { advertStorage } from '../storage/advertisements/advertisementStorage.js'
import { chatStorage } from '../storage/chat/chatStorage.js'


const usersRouter = express.Router()


/** СТРАНИЦА ФОРМЫ ВХОДА ПОЛЬЗОВАТЕЛЯ
 * URL:     /user/login
 * METHOD:  GET
 * @constructor 
 * @returns code - 200
 * @returns body - форма регистрации/входа на базе шаблона pages/logreg_form.ejs
*/
usersRouter.get('/login',
    // middleware - проверка, что уже зарегистрирован
    (req, res, next) => {
        if (req.isAuthenticated()) {
            return res.redirect('/user/me')
        }
        next()
    },
    // основной обработчик
    (req, res) => {
        // отображение формы
        res.status(200)
        res.render('pages/users/logreg_form', {
            title: 'Авторизация',
            action: 'Войти',
            user: req.user,
            data: {},
            errors: {
                login: req.session.messages,
                password: req.session.messages
            }
        })
    })


/** АУТЕНТИФИКАЦИЯ ПОЛЬЗОВАТЕЛЯ
 * URL:     /user/login
 * METHOD:  POST
 * @constructor
 * @params {JSON} body - параметры входа ({login, password})
 * @returns code - 202 или 403 (если ошибка)
 * @returns none - перенаправляет на главную страницу ('/') 
 *                 или страница с ошибкой на базе шаблона errors/index.ejs
*/
usersRouter.post('/login',
    // middleware - проверка аутентификации
    passport.authenticate('local', {
        /* successRedirect: '/',*/
        failureRedirect: '/user/login',
        failureMessage: 'Неверное имя пользователя или пароль'
    }),
    // основной обработчик
    (req, res) => {
        const data = req.body
        const user = req.user
        console.log('AUTH LOGIN: ', user)
        res.status(202)
        res.redirect('/')
    })


/** СТРАНИЦА ФОРМЫ РЕГИСТРАЦИИ ПОЛЬЗОВАТЕЛЯ
 * URL:     /user/signup
 * METHOD:  GET
 * @constructor 
 * @returns code - 200
 * @returns body - форма регистрации/входа на базе шаблона pages/logreg_form.ejs
*/
usersRouter.get('/signup',
    // middleware - проверка, что уже зарегистрирован
    (req, res, next) => {
        if (req.isAuthenticated()) {
            return res.redirect('/user/me')
        }
        next()
    },
    // основной обработчик
    (req, res) => {
        // отображение формы
        res.status(200)
        res.render('pages/users/logreg_form', {
            title: 'Регистрация',
            action: 'Зарегистрироваться',
            user: {},
            data: {
                newUser: true
            }
        })
    })


/** РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ
 * URL:     /user/signup
 * METHOD:  POST
 * @constructor
 * @params {JSON} body - параметры нового пользователя 
 *                      ({login, password, password2, name, email})
 * @returns code - 201 или 403 (если ошибка)
 * @returns none - перенаправляет на главную страницу ('/') 
 *                 или страница с ошибкой на базе шаблона errors/index.ejs
*/
usersRouter.post('/signup',
    // middleware - проверка, что уже зарегистрирован
    (req, res, next) => {
        if (req.isAuthenticated()) {
            return res.redirect('/user/me')
        }
        next()
    },
    // основной обработчик
    (req, res) => {
        const { login, name, email, password, password2, contactPhone } = req.body
        var errors = {}
        // проверка, что все поля заполнены
        if (!login)
            errors.login = "Логин не может быть пустым"
        if (!name)
            errors.name = "Имя не может быть пустым"
        if (!email)
            errors.email = "Email не может быть пустым"
        if (!password || !password2 || !password.length || !password2.length)
            errors.password = "Пароль не может быть пустым"
        // проверка, что пароли совпадают
        if (password && password2 && (password !== password2))
            errors.password = "Пароли не совпадают"

        // если есть ошибки - перенаправляем обратно на форму регистрации
        if (Object.entries(errors).length) {
            res.render('pages/users/logreg_form', {
                title: 'Регистрация',
                action: 'Зарегистрироваться',
                user: { login, name, email, password, password2, contactPhone },
                data: {
                    newUser: true
                },
                errors
            })
        }
        // нет ошибок - добавляем пользователя
        else {
            const newUser = {
                login,
                name,
                email,
                password,
                contactPhone
            }
            // вызов метода хранилища
            userStorage.create(newUser).then((data) => {
                if (data) {
                    console.log('NEW USER - ', data)
                    res.status(201)
                    res.redirect('/')
                }
                else {
                    res.status(403)
                    res.render('errors/index', {
                        title: 'Ошибка регистрации',
                        data: JSONError.err403('Ошибка регистрации')
                    })
                }
            })
        }
    })


/** ОТОБРАЖЕНИЕ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
 * URL:     /user/me
 * METHOD:  GET
 * @constructor
 * @params {string} id - ID пользователя (берется из сессии)
 * @returns code - 200 или 404 (если не тот пользователь)
 * @returns body - информация о пользователе в EJS-шаблоне profile.ejs 
 *                 или страница с ошибкой на базе шаблона errors/index.ejs
*/
usersRouter.get('/me',
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
        const id = req.user._id.toString()
        // получение данных из хранилища
        userStorage.get(id).then((user) => {
            if (user) {
                // объявления пользователя
                advertStorage.getAllByUser(user._id).then(async (data) => {
                    // пролучение списка его чатов
                    var chatData = await chatStorage.getByUser(user._id)
                    for (let i = 0; i < chatData.length; i++) {
                        chatData[i].login = await userStorage.getLogin(chatData[i].users[0] == user._id ? chatData[i].users[1] : chatData[i].users[0])
                        chatData[i].chatStat = await chatStorage.getChatStatistic(user._id, chatData[i].users[0] == user._id ? chatData[i].users[1] : chatData[i].users[0])
                    }

                    res.status(200)
                    res.render('pages/users/profile', {
                        title: 'Информация о пользователе ' + user.login,
                        data: user,
                        user: req.user,
                        adverts: data,
                        chat: chatData
                    })
                })
            } else {
                res.status(404)
                res.render('errors/index', {
                    title: "Пользователь не найден",
                    data: JSONError.err404("Пользователь не найден")
                })
            }
        })
    })


/** ВЫХОД ИЗ СИСТЕМЫ
* URL:     /user/logout
* METHOD:  GET
* @constructor
* @returns REDIRECT на главную страницу ('/')
*/
usersRouter.get('/logout',
    (req, res) => {
        // обнуляем cookie-сессию
        req.session = null
        res.redirect('/');
        
        // не работает с 'cookie-seccion'
        // req.logout((err, next) => {
        //     // обнуляем cookie-сессию
        //     req.session = null
        //     if (err) { return next(err); }
        //     res.redirect('/');
        // })
    })



/** ОТОБРАЖЕНИЕ ПРОФИЛЯ ДРУГОГО ПОЛЬЗОВАТЕЛЯ
 * URL:     /user/profile/:id
 * METHOD:  GET
 * @constructor
 * @params {string} ID - ID пользователя 
 * @returns code - 200 или 404 (если не пользователь не найден)
 * @returns body - информация о пользователе в EJS-шаблоне profile.ejs 
 *                 или страница с ошибкой на базе шаблона errors/index.ejs
*/
usersRouter.get('/profile/:id',
    // основной обработчик
    (req, res) => {
        // получение параметров запроса
        const { id } = req.params
        // получение информации о авторизованном пользователе
        const userId = req.user?._id.toString()

        // если пользователь совпадает с авторизованным
        // перенаправляем на user/me
        if (userId && id == userId)
            res.redirect('/user/me')

        // получение данных из хранилища
        userStorage.get(id).then((user) => {
            if (user) {
                // объявления пользователя
                advertStorage.getByUser(user._id).then(async (data) => {
                    // получение информации о чате с владельцем объявления
                    var chat = await chatStorage.getByUsers(userId, user._id)
                    if (chat) {
                        chat.login = await userStorage.getLogin(user._id)
                        chat.chatStat = await chatStorage.getChatStatistic(userId, user._id)
                    }
                    // отрисовываем шаблон
                    res.status(200)
                    res.render('pages/users/profile', {
                        title: 'Информация о пользователе ' + user.login,
                        data: user,
                        user: req.user,
                        adverts: data,
                        chat: chat ? [chat] : []    // так нужно, потому что в profile.ejs передается список чатов
                        // например, при просмотре своей страницы (user/me)
                    })
                })
            } else {
                res.status(404)
                res.render('errors/index', {
                    title: "Пользователь не найден",
                    data: JSONError.err404("Пользователь не найден")
                })
            }
        })
    })




// экспорт
export default usersRouter

