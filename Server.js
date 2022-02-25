const express = require("express")
const mongoose = require('mongoose')
const swaggerUI = require("swagger-ui-express")
const swaggerJsDoc = require('swagger-jsdoc')
const cors = require("cors")
const path = require("path")
const router = require("./router")
const PORT = process.env.PORT || 4400

const app= express()

app.use(express.json())
app.use(cors())
app.use("/uploads", express.static(path.join(__dirname, "uploads")))


const url = "mongodb://localhost:27017/ForVoting"
// console.log(url)
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() =>{
    console.log("Connected to data base Successfully")
});

const options ={
    definition: {
        openapi: "3.0.0",
        info: {
            title: 'Voting App Api',
            version: "1.0.0",
            description: "A simple arrangement for the API"
        }, 
        servers: [
            {url: "http://localhost:4400"}
        ],
    },
    apis: ["./router.js"]
}

const specs = swaggerJsDoc(options)

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs))

app.use("/api", router)
app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});