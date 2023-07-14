import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const messageSchema = new Schema({
    _id: {
        type: String,
        //unique: true,     // не надо, _id и так unique
        required: true
    },
    chat: {
        type: String,
        ref: 'chat'
    },
    authorId: {
        type: String,
        required: true,
        ref: 'Users'
    },
    authorName: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    readAt: {
        type: Date
    },
},
{ _id: false }  // чтобы _id не создавалось автоматически, так как мы сами его прописали
)


export default model('messages', messageSchema);
