import fs from 'fs'

let CONFIG = {}


/////////////////////////////////////////////////
// КОНСТАНТЫ ПО УМОЛЧАНИЮ
/////////////////////////////////////////////////

// ТИП ХРАНИЛИЩА {"file", "mongo"}
CONFIG.STORAGE_TYPE = "file"

// ПОРТ приложения
CONFIG.PORT = 3000

// КОНСТАНТЫ ДЛЯ РАБОТЫ С БД MONGO
// строка подключения
CONFIG.MONGO_URL = "mongodb://localhost:27017/"
// имя БД
CONFIG.MONGO_DATABASE = "meBoard"
// пользователь и пароль для работы с БД
CONFIG.MONGO_USERNAME = "user"
CONFIG.MONGO_PASSWORD = "user"

// КОНСТАНТЫ ДЛЯ РАБОТЫ С ФАЙЛАМИ
CONFIG.DATA_PATH = "data/" 
CONFIG.ADVERT_FILE = "adverts.json"
CONFIG.USER_FILE = "users.json"
CONFIG.CHAT_FILE = "chats.json"
//CONFIG.MESSAGES_FILE = "messages.json"
CONFIG.UPLOAD_PATH = "public/upload" 


/////////////////////////////////////////////////
// ЗАГРУЗКА ДАННЫХ ИЗ КОНФИГУРАЦИОННОГО ФАЙЛА CONFIG.JSON
/////////////////////////////////////////////////
var data = {}
try {
    data = JSON.parse(fs.readFileSync('config.json', 'utf8')) || {};
} catch (e) {
    console.log("Error reading file 'config.json'")
}

// дополняем полями из файла
CONFIG = {
    ...CONFIG,
    ...data
}


/////////////////////////////////////////////////
// ЗАГРУЗКА ДАННЫХ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ PROCESS.ENV
/////////////////////////////////////////////////
CONFIG = {
    ...CONFIG,
    ...process.env
}


/////////////////////////////////////////////////
/////////////////////////////////////////////////

export default CONFIG;