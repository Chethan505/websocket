const mongoose =require('mongoose')
// connection
const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("DATABASE connected")
    }
    catch(err){
        console.error("DATABASE error")
        console.log(err)
        
    }
}
module.exports=connectDB