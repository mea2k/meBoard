class JSONError {

    static make(errcode, errmsg = '') {
        return {
            errcode, errmsg
        }
    }

    static err403(errmsg = '') {
        return this.make(403, errmsg ? errmsg : 'Ошибка добавления')
    }

    static err404(errmsg = '') {
        return this.make(404, errmsg ? errmsg : 'Объект не найден')
    }

}

const err404 = (req, res, next) => {
    const { url } = req
    res.status(404)
    const errStr = 
    res.json(JSONError.err404(`Страница ${url} не найдена`))

    // вызов следующего обработчика
    next()
}



export {JSONError, err404}