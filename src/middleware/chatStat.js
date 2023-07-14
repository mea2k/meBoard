import { chatStorage } from "../storage/chat/chatStorage.js"

const chatStat = async (req, res, next) => {
    const { user } = req

    try {
        if (user) {
            const chats = await chatStorage.getByUser(user._id)
            let chatStat = {
                newMsgs: 0,
                totalMsgs: 0
            }
            for (let chat of chats) {
                let curStat = await chatStorage.getChatStatistic(user._id, chat.users[0] == user._id ? chat.users[1] : chat.users[0])
                chatStat.newMsgs = chatStat.newMsgs + curStat?.newMsgs ? curStat.newMsgs : 0
                chatStat.totalMsgs = chatStat.totalMsgs + curStat?.totalMsgs ? curStat.totalMsgs : 0
            }
            req.app.locals.chatStat = chatStat;
        }
    }
    catch (e) {
        console.log('CHATSTAT_MIDDLEWARE - ERROR ', e)
    }

    // вызов следующего обработчика
    next()
}

// экспорт по умолчанию
export default chatStat