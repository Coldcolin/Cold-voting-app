const mongoose = require("mongoose")

const candidateSchema= mongoose.Schema({
    name: { type: String, required: true},
    voters:[],
    picture:{ type: String, required: true},
    imagePath:{
        type: String,
        required: true,
    },
    cloudinaryPath:{
        type: String,
        required: true,
    },
    Position: []
})

const candidateModel = mongoose.model("candidateModel", candidateSchema)

module.exports = candidateModel