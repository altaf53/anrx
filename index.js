const express = require('express');
const app = express();
const port = 3000;
const initRoutes = require('./routes');
bodyParser = require("body-parser");  

app.use(express.json()); 
app.use(bodyParser.urlencoded({ extended: false }));    //for form post
app.use(express.urlencoded({ extended: true })); 

initRoutes(app);
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});


module.exports = { app }