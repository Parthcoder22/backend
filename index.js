require("dotenv").config()
const express = require("express")

const app = express()

const port = 3000

app.get("/", (req, res) => {
    res.send("I am at homepage")
})
app.get("/login", (req, res) => {
    res.send("I am at login page ")
})
app.get("/upskill", (req, res) => {
    res.send("<h1>let's upskilling myself</h1>")
})

app.listen(process.env.PORT, () => {
    console.log(`Example app listing on ${port}`);
})