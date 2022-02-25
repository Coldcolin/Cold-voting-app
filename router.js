const express = require("express")
const router = express.Router()
const userModel = require("./model")
const candidateModel = require("./candidatesModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const multer = require("multer")
const path = require("path")
// const multer = require("multer")
const fs = require ('fs')
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: 'coldcolin', 
    api_key: '294911175644673', 
    api_secret: '2HLHt9dU-ltj82-NjftTpIAdj-M' 
});

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, 'uploads')
    },

    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

const fileFilter = (req, file, cb) =>{
    const ext = path.extname(file.originalname);
    if (ext !== '.jpg' || ext !== '.jpeg' || ext !== '.png'){
        cb(null, new Error('File format not supported'), false);
    }else{
        cb(null, true);
    }
}

const imageUploader = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 20
    }
}).single('picture');

/**
 * @swagger
 * /api/register:
 *      post:
 *          summary: To Add new voters
 *          description: To Add new Voters
 *          produces: 
 *              - application/json
 *          consumes:
 *              -application/json
 *          parameters:
 *              -   in: body
 *                  name: create
 *                  schema:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string
 *          responses:
 *              200:
 *                  description: success
 *                  schema:
 *                      type: object
 *                      properties:
 *                          name:
 *                              type: string
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string
 */

//Voters Sign Up
router.post("/register",imageUploader, async (req, res) =>{
    try{
        const picture = await cloudinary.uploader.upload(req.file.path)
        // console.log(picture)
        const { name, email, password} = req.body
        const hSalt = await bcrypt.genSalt(10)
        const hPassword = await bcrypt.hash(password, hSalt)
        const createUser = await userModel.create({
            name,
            email,
            password: hPassword,
            picture: picture.secure_url,
            imagePath: req.file.path,
            cloudinaryPath: picture.public_id
        })
        res.status(200).json({message: "User successfully created", data: createUser})
    }catch(error){
        res.status(401).json({error: error.message})
    }
})

/**
 * @swagger
 * /api/voters:
*      get:
*          summary: Returns the list of registered voters
*          responses:
*              200: 
*                  description: The list of the voters
*                  schema:
*                       type: string              
*/

//To get All Signed Up Voters
router.get("/voters", async(req, res)=>{
    try{
        const voters = await userModel.find()
        res.status(200).json({message: "These are all the Current Users", totalUsers: voters.length, data: voters})
    }catch(error){
        res.status(400).json({message: error.message})
    }
})

/**
 * @swagger
 * /api/voters/{userId}:
 *      get:
 *          summary: "Shows a single voter"
 *          description: "To get a single voter"
 *          parameters:
 *              -   in: path
 *                  name: userId
 *                  required: true
 *                  schema:
 *                      type: string
 *          responses:
 *              200:
 *                  description: success
 *                  schema:
 *                      type: object
 */

//To get Single voter
router.get("/voters/:id", async (req, res)=>{
    try{
        const oneVoter = await userModel.findById(req.params.id, req.body)
        res.status(200).json({message: "This User is:", data: oneVoter})
    }catch(error){
        res.status(400).json({message: error.message})
    }
})


/**
 * @swagger
 * /api/voters/{id}:
 *      delete:
 *          summary: Remove the voter by id
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: To delete voters
 *          responses:
 *              200:
 *                  description: deleted successfully
 *                  
 */

//To delete Voter
router.delete("/voters/:id", async(req, res)=>{
    const id = req.params.id
    try{
        const voterData = await userModel.findById(id)
        await cloudinary.uploader.destroy(voterData.cloudinaryPath)
        fs.unlinkSync(voterData.imagePath)
        const remove = await voterData.remove()
        res.status(200).json({message: "Removed Successfully:", data: remove})
    }catch(error){
        res.status(200).json({message: error.massage})
    }
})


/**
 * @swagger
 * /api/voters/{id}:
 *      patch:
 *          summary: Returns updated voter
 *          parameters:
 *              -   in: path
 *                  name: id
 *                  schema:
 *                      type: string
 *                  required: true
 *                  description: The voters can update
 *          requestBody:
 *              required: true
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                          name:
 *                              type: string
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string  
 *          responses:
 *              200:
 *                  description: success 
 *                  schema:
 *                      type: object     
 */

//To Update Voter
router.patch("/voters/:id", imageUploader, async (req, res) =>{
    try{
        const { name, email, password} = req.body
        const id = req.params.id
        const hSalt = await bcrypt.genSalt(10)
        const hPassword = await bcrypt.hash(password, hSalt)
        const voterData = await userModel.findById(id)
        await cloudinary.uploader.destroy(voterData.cloudinaryPath)
        fs.unlinkSync(voterData.imagePath)
        const picture = await cloudinary.uploader.upload(req.file.path)
        const updateUser = await voterData.updateOne({
            name,
            email,
            password: hPassword,
            picture: picture.secure_url,
            imagePath: req.file.path,
            cloudinaryPath: picture.public_id
        }, {new: true})
        res.json({message:'updated successfully', data: updateUser})
    }catch(error){
        res.json({message: error.message})
    }
})


//For Voter to Login into App
router.post("/login", async (req, res)=>{
    try{
        const {email} = req.body
        const user = await userModel.findOne({email})
        if(user){
            const checkPassword = await bcrypt.compare(req.body.password, user.password)
            if(checkPassword){
                const { password, ...info } = user._doc
                const token = jwt.sign({
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isAdmin: user.isAdmin
                }, "IWoulDBEtHEBestComPuterPROgrMMERinTHEWorld", { expiresIn: "1d"})
                res.status(200).json({message:`Welcome ${user.name}`, data: {...info, token}})
            }else{
                res.status(400).json({ message: "Password is incorrect" });
            }
        }else{
            res.status(400).json({ message: "user not found" });
        }
    }catch(error){
        res.status(400).json({message: error.message})
    }
})


//Function to check if User is an Admin
const verified = async(req, res, next)=>{
    try{
        const authToken = req.headers.authorization
        if(authToken){
            const token = authToken.split(" ")[1]
            jwt.verify(token, "IWoulDBEtHEBestComPuterPROgrMMERinTHEWorld", (error, payload)=>{
                if(error){
                    res.status(400).json({message: "Please check your token"})
                }else{
                    req.user = payload
                    next()
                }
            })
        }else{
            res.status(400).json({message: "token incorrect"})
        }
    }catch(error){
        res.status(400).json({message: "You are not an Admin"})
    }
}


//To add new Candidate and make only Admin carry out this Operation
router.post("/add",verified, imageUploader, async (req, res)=>{
    const { name, Position, voters } = req.body
    const picture = await cloudinary.uploader.upload(req.file.path)
    try{
        if(req.user.isAdmin){
            const createCandidate = await candidateModel.create({
                name,
                Position,
                voters,
                picture: picture.secure_url,
                imagePath: req.file.path,
                cloudinaryPath: picture.public_id
            })
            res.status(200).json({message: "Item Created", data: createCandidate})
        }else{
            res.status(400).json({message: "You do not have Adequate permissions for this!"})
        }
    }catch(error){
        res.status(400).json({message: "Only Admins Can Create Users!"})
    }
})

//To get all Candidates
router.get("/candidates", async(req, res)=>{
    try{
        const candidateData = await candidateModel.find()
        res.status(200).json({message: "Candidate Contents are:", total: candidateData.length, data: candidateData})
    }catch(error){
        res.status(200).json({message: error.massage})
    }
})

//To get single Candidate
router.get("/candidates/:id", async(req, res)=>{
    const id = req.params.id
    try{
        const candidateData = await candidateModel.findById(id)
        res.status(200).json({message: "Candidate is:", data: candidateData})
    }catch(error){
        res.status(200).json({message: error.massage})
    }
})

//To delete Candidate
router.delete("/candidates/:id", async(req, res)=>{
    const id = req.params.id
    try{
        const candidateData = await candidateModel.findById(id)
        await cloudinary.uploader.destroy(candidateData.cloudinaryPath)
        fs.unlinkSync(candidateData.imagePath)
        const remove = await candidateData.remove()
        res.status(200).json({message: "Removed Successfully", data: remove})
    }catch(error){
        res.status(200).json({message: error.massage})
    }
})

//Update Candidate
router.patch("/candidate/:id",imageUploader, async (req, res) =>{
    try{
        const { name, Position, voters } = req.body
        const id = req.params.id
        const candidateData = await candidateModel.findById(id)
        await cloudinary.uploader.destroy(candidateData.cloudinaryPath)
        fs.unlinkSync(candidateData.imagePath)
        const result = await cloudinary.uploader.upload(req.file.path)
        const updateCandidate = await candidateData.updateOne({
            name,
            Position,
            voters,
            picture: result.secure_url,
            imagePath: req.file.path,
            cloudinaryPath: result.public_id
        }, {new: true})
        res.json({message:'updated successfully', data: updateCandidate})
    }catch(error){
        res.json({message: error.message})
    }
})


//Update Candidate voters
router.patch("/candidateVotes/:id", async (req, res) =>{
    try{
        const id = req.params.id
        const candidateData = await candidateModel.findById(id)
        const updateCandidate = await candidateData.updateOne({
            $push:{
                Position: req.body.Position,
                voters: req.body.voters
            }
        }, {new: true})
        res.json({message:'updated successfully', data: updateCandidate})
    }catch(error){
        res.json({message: error.message})
    }
})
module.exports= router