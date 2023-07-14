import { chatStorage } from "../storage/chat/chatStorage.js";

const socketHandler = (socket) => {
    const { id } = socket;
    console.log(`Socket connected: ${id}`);

    // сообщение себе
    socket.on('message-to-me', (msg) => {
        msg.type = 'me';
        socket.emit('message-to-me', msg);
        //console.log('MSG-TO-ME: ',msg)
    });

    // сообщение для всех
    socket.on('message-to-all', (msg) => {
        msg.type = 'all';
        socket.broadcast.emit('message-to-all', msg);
        socket.emit('message-to-all', msg);
        //console.log('MSG-TO-ALL: ',msg)
    });

    // работа с комнатами
    const { chatId } = socket.handshake.query;
    console.log(`ChatId: ${chatId}`);
    socket.join(chatId);
    socket.on('message-to-chat', (msg) => {
        //msg.chatId = chatId
        console.log('New MSG to chat ', chatId, msg)
        socket.to(chatId).emit('message-to-chat', msg);
        socket.emit('message-to-chat', msg);
        // добавляем в базу
        chatStorage.sendMessage(chatId, msg);

    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${id}`);
    });
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////

export default socketHandler