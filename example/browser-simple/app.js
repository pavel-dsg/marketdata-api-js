
const path = require('path');
const express = require('express')
const app = express()
// compress all responses
// app.use(compression())
// static files
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/marketdata.html')
})

app.listen(8080,() => {
    console.log("Market Data API Client");   
})
