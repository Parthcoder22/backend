import dns from "dns";
// Force Node.js to use reliable public DNS servers
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config({
    path: "./.env"
})

connectDB().then(()=>{

    app.on("error",(error)=>{
        console.log("error : ",error);
        throw error
    })

    app.listen(`server is running at port ${process.env.PORT || 8000}`)
})
.catch((err)=>{
    console.log(`mongo DB connection failed !!! ${err}`);
    
})