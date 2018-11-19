var express = require("express");
var app = express();
var BodyParser = require("body-parser");
var mongoose = require("mongoose");
var fs = require("fs");
var multer = require('multer');

app.set("view engine", "ejs");
app.use(BodyParser.urlencoded({ extended: true }))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/", function(req, res) {
    res.send("home");
});

app.listen(8080, function() {
    console.log("Server is Listening!!!");
});
