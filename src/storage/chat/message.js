import { v4 as uuidv4 } from 'uuid';

/////////////////////////////////////////////////
/////////////////////////////////////////////////

/** КЛАСС - СООБЩЕНИЕ ЧАТА
 * МЕТОДЫ КЛАССА:
 *   constructor(author, text, sentAt = now())  - создает новый объект типа Message
 *               поля _id, sentAt - заполняются автоматически 
 *   read(readAt = now())  - помечает ообщение как прочитанное с указанием времени доставки
 *               (по умолчанию, NOW()) 
 *   JSON() - возвращает объект формата JSON: {_id, author, sentAt, text, readAt}
 * 
*/
class Message {
    constructor(authorName, authorId,  text, sentAt = new Date(), id = uuidv4()) {
        this.authorName = authorName,
        this.authorId = authorId
        this.text = text.trim()
        this.sentAt = sentAt ? sentAt : new Date() 
        this.readAt = ''

        this._id = id
    }

    read(readAt = new Date()) {
        this.readAt = readAt
    }

    JSON() {
        return {
            _id: this._id,
            authorName: this.authorName,
            authorId: this.authorId,
            sentAt: this.sentAt,
            text: this.text,
            readAt: this.readAt
        }
    }
}


/////////////////////////////////////////////////
/////////////////////////////////////////////////

// экспорт класса
export { Message }