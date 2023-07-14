import express from 'express'
import session from 'cookie-session'
import passport from 'passport'
import LocalStrategy from 'passport-local'
import { Server } from 'socket.io'
import { createServer } from 'http'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

import { userStorage } from './storage/users/userStorage.js'
import verify from './auth/verify.js'
import socketHandler from './sockets/index.js'
import chatStat from './middleware/chatStat.js'

import usersRouter from './routes/user.js'
import indexRouter from './routes/index.js'
import advertsRouter from './routes/adverts.js'
import searchRouter from './routes/search.js'
import chatRouter from './routes/chat.js'
import { err404 } from './error.js'

import CONFIG from './config.js'



/////////////////////////////////////////////////
/////////////////////////////////////////////////

// Создание объекта Express.JS
const app = express()
// Создание объекта для исползьзования Socket.IO
const server = createServer(app);
const io = new Server(server);

// настройка параметров ExpressJS
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));
/////////////////////////////////////////////////
/////////////////////////////////////////////////

// Описание авторизации
const options = {
    usernameField: 'login',
    passwordField: 'password',
    passReqToCallback: true // передача функции аутентификации req 
    // для доступа и очистки сообщений (req.session.messages)
}

passport.use('local', new LocalStrategy(options, verify))

passport.serializeUser((user, cb) => {
    cb(null, user._id);
});

passport.deserializeUser(async (id, cb) => {
    try {
        const user = await userStorage.get(id)
        if (user)
            return cb(null, user)
        return cb(null, null)
    } catch (err) {
        return cb(err)
    }
});

// подключаем модули авторизации
app.use(session({
    secret: 'SECRET',
    resave: true,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// используем шаблонизатор EJS
app.set('view engine', 'ejs');
// настройка папки views
const views_path = path.join(__dirname, 'views')
app.set('views', views_path)

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// добавляем middleware - подсчет новых сообщений в чатах
// (отображается в меню на всех страницах)
// используется app.locals для хранения и передачи данных в EJS
app.use(chatStat)

// обработчики URL-путей
app.use('/user', usersRouter)
app.use('/advert', advertsRouter)
app.use('/search', searchRouter)
app.use('/chat', chatRouter)
app.use('/', indexRouter)

// обрабока всех остальных путей - ошибка 404
app.use(err404)

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// Подключаем Socket.IO
io.on('connection', socketHandler);

/////////////////////////////////////////////////
/////////////////////////////////////////////////

// запуск сервера на прослушивание
function serverStart(dbUrl = "", port = CONFIG.PORT) {
    switch (CONFIG.STORAGE_TYPE) {
        case "mongo":
            // ПОДКЛЮЧЕНИЕ К БД
            try {
                const connString = dbUrl || CONFIG.MONGO_URL + CONFIG.MONGO_DATABASE + '?authSource=admin'
                //console.log('Connecting to', connString, CONFIG.MONGO_USERNAME, CONFIG.MONGO_PASSWORD)
                mongoose.connect(connString, {
                    "auth": {
                        "username": CONFIG.MONGO_USERNAME,
                        "password": CONFIG.MONGO_PASSWORD,
                        "useNewUrlParser": true
                    }
                }).then(runApp(port))

                // Connected handler
                mongoose.connection.on('connected', (err) => {
                    console.log("Connected to DB: " + connString);
                });

                // Error handler
                mongoose.connection.on('error', (err) => {
                    console.log(err);
                });

            } catch (e) {
                console.log('Error connection to database: ' + connString + '!')
                console.log(e)
            }
            break
        case "file":
            // ИСПОЛЬЗУЕМ ФАЙЛЫ
            runApp(port)
            break
    }
}

function runApp(port) {
    //app.listen(port, () => {
    server.listen(port, () => {
        console.log('Server started at port ' + port + '.')
    })
}


/////////////////////////////////////////////////
/////////////////////////////////////////////////


serverStart();
