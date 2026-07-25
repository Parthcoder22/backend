import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {

        console.log("Checking URI:", process.env.MONGODB_URI); // Add this line
        console.log("Checking URI:", process.env.PORT); // Add this line
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MONGODB is connected !! ${connectionInstance} `);

    } catch (error) {
        console.error("error : ", error);
    }
}

export default connectDB;