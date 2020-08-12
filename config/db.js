//connect to mongo db
const mongoose = require('mongoose');
const config = require('config');

//get connection string
const db = config.get('mongoURI');

//when using async/await, wrap in trycatch
const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
        }); //adding second argument gets rid of depricationErrors

        console.log('MongoDB Connected...');
    } catch (error) {
        console.error(error.message);
        
        //exit proecess with failiure
        process.exit(1);
    }
}

module.exports = connectDB;