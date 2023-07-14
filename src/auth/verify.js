import { sha256Sync } from '../hash.js'
import { userStorage } from '../storage/users/userStorage.js'


const verify = async (req, login, password, cb) => {
    try {
        // очищаем предыдущие сообщения
        req.session.messages = []
        const user = await userStorage.getByLogin(login)
        // не найден пользователь
        if (!user)
            return cb(null, false, { message: "Неверное имя пользователя" })
        // пароли не совпадаюь
        const passw = await sha256Sync(password, user.salt)
        if (passw !== user.passwordHash)
            return cb(null, false, { message: "Неверный пароль" })
        // все ОК
        else
            return cb(null, user)
    } catch (e) {
        // если какая-то ошибка
        return cb(e, false, { message: "Ошибка аутентификации!" })
    }
}


// function verify(login, password, cb) {
//     switch (CONFIG.STORAGE_TYPE) {
//         case "file":
//             return verifyFile(login, password, cb)
//         case "mongo":
//             return verifyDB(login, password, cb)
//     }
// }


export default verify