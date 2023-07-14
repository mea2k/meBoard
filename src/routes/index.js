import express from 'express';

const indexRouter = express.Router()

/** ГЛАВНАЯ СТРАНИЦА
 * URL:     /
 * METHOD:  GET
 * @constructor 
 * @returns code - 200
 * @returns body - текст (заглушка)
*/
indexRouter.get('/', (req, res) => {
    res.render('pages/index', {
        title: 'Главная',
        user: req.user
    })
})







// экспорт
export default indexRouter