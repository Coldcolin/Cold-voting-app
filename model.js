const mongoose = require("mongoose")

const userSchema = mongoose.Schema({ 
    name:{ type: String, required: true},
    email: {type: String, required: true, unique: true},
    picture: {type: String},
    password: { type: String, required: true},
    imagePath:{
        type: String,
        required: true,
    },
    cloudinaryPath:{
        type: String,
        required: true,
    },
    isAdmin: { type: Boolean, default: false}
})

const userModel = mongoose.model("userModel", userSchema)

module.exports = userModel