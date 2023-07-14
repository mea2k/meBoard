import express from 'express';

import { JSONError } from '../error.js';
import fileMulter from '../middleware/fileMulter.js';
import { advertStorage } from '../storage/advertisements/advertisementStorage.js';
import passport from 'passport';
import { userStorage } from '../storage/users/userStorage.js';


const searchRouter = express.Router()

/** ОТОБРАЖЕНИЕ ФОРМЫ ПОИСКА
 * URL:     /search 
 * METHOD:  GET
 * @constructor
 * @returns code - 200
 * @returns body - список объявлений в EJS-шаблоне index.ejs
*/
searchRouter.get('/',
    // основной обработчик
    async (req, res) => {
        // отправка кода ответа
        res.status(200)
        res.render('pages/search/index', {
            title: 'Поиск объявлений',
            data: {},
            search_data: {},
            user: req.user
        })
    })


/** ПОИСК - РЕЗУЛЬТАТЫ
 * URL:     /search
 * METHOD:  POST
 * @constructor
 * @params {JSON} body - параметры поиска 
 *                {searchText,tags, userEmail}
 * @returns code - 200 или 404 (если ошибка)
 * @returns body - результаты поиска (data) + значения формы поиска (search_data)
 *                 на базе шаблона pages/search/index.ejs
 *                 или информация об ошибке в формате JSON {"errcode", "errmsg"}
*/
searchRouter.post('/',
    // основной обработчик
    async (req, res) => {
        // получение данных из тела POST-запроса
        const {
            searchText,
            tags,
            userEmail,
            searchType
        } = req.body

        // создание параметров поиска
        const searchParams = {
            shortText: searchText,
            description: searchText,
            tags: tags?.length ? tags?.trim().split(' ') : [],
            // добавляем пользователей, если задано поле userEmail
            users: userEmail ? await userStorage.getByEmail(userEmail) : [],
        }
        //console.log("SEARCH - ", searchParams)
       
        try {
            // поиск
            var data = await advertStorage.find(searchParams)
            // отображение результатов поиска
            res.status(200)
            res.render('pages/search/index', {
                title: 'Поиск объявлений',
                data,
                search_data: {
                    searchText,
                    tags: searchParams.tags,
                    userEmail,
                    searchType
                },
                user: req.user
            })
        } catch (e) {
            // данные НЕ добавлены
            res.status(404)
            res.render('errors/index', {
                title: 'Ошибка поиска данных',
                data: JSONError.err404(e.message)
            })
        }
    })






// экспорт
export default searchRouter

