import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const chatSchema = new Schema({
    _id: {
        type: String,
        //unique: true,     // не надо, _id и так unique
        required: true
    },
    users: [{
        type: String,
        ref: 'Users'
    }],
    createdAt: {
        type: Date,
        required: true
    },
    messages: [{
        type: String,
        ref: 'Messages'
    }]
},
{ _id: false }  // чтобы _id не создавалось автоматически, так как мы сами его прописали
)


export default model('chats', chatSchema);
