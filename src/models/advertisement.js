import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const advertSchema = new Schema({
    _id: {
        type: String,
        //unique: true,     // не надо, _id и так unique
        required: true
    },
    shortText: {
        type: String,
        required: true
    },
    description: String,
    images: [{
        name: {
            type: String
        },
        path: {
            type: String
        }
    }],
    userId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        required: true
    },
    tags: [{
        type: String
    }],
    isDeleted: {
        type: Boolean,
        required: true
    }
},
    { _id: false }  // чтобы _id не создавалось автоматически, так как мы сами его прописали
)



advertSchema.pre('save', function (next) {
    var innerObject = this
    innerObject.isDeleted = innerObject.isDeleted ? innerObject.isDeleted : false
    innerObject.createdAt = innerObject.createdAt ? innerObject.createdAt : new Date()
    innerObject.updatedAt = innerObject.updatedAt ? innerObject.updatedAt : null
})



export default model('advertisements', advertSchema);
