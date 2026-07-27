import dotenv from "dotenv"
dotenv.config({
    path: './.env'
});

import { app } from "./app.js";
// Force Node.js to use reliable public DNS servers
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import connectDB from "./db/index.js"
connectDB().then(() => {

    app.on("error", (error) => {
        console.log("error : ", error);
        throw error
    })
    const port = process.env.PORT || 8000
    app.listen(port, () => {
        console.log(`server is running at port ${port}`)
    })
})
    .catch((err) => {
        console.log(`mongo DB connection failed !!! ${err}`);

    })