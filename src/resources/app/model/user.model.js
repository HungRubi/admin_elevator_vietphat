const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employees = new Schema(
    {
        account: { type: String, unique: true },
        password: { type: String, require: true},
        avatar: { 
            type: String, 
            require: true,
            default: 'https://www.dropbox.com/scl/fi/896n7adhufqiu2hlt94u5/default.png?rlkey=gk9thmq6u1grzss8o0c3os39f&st=n7o9qljw&dl=1'
        },
        name : { type: String, require: true},
        address: { type: String, require: true},
        phone: { type: String, require: true},
        email: { type: String, require: true},
        birth: { type: Date, default: Date.now},
        authour:  {
            type: String,
            enum:['customer','employee','admin'],
            default: 'customer',
        },
        lastLogin: {type: Date, default: Date.now},
    },
    {
        timestamps: true,
    },
)

module.exports = mongoose.model('employees', employees);