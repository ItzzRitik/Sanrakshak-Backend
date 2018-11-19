var express = require("express");
var app = express();
var BodyParser = require("body-parser");
var mongoose = require("mongoose");
var fs = require("fs");
var multer = require('multer');

mongoose.connect("mongodb://localhost/users");
app.set("view engine", "ejs");
app.use(BodyParser.urlencoded({ extended: true }))

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var UserSchema = new mongoose.Schema({
    email: String,
    pass: String,
    fname: String,
    lname: String,
    gender: String,
    dob: String
});
var User = mongoose.model("User", UserSchema);

app.get("/check", function(req, res) {
    var email = req.query.email;
    User.find({ email: email }, function(err, user) {
        if (err) { console.log("Error occured while checking for email.\n" + err); }
        else {
            if (user.length) { res.send("1"); }
            else { res.send("0"); }
        }
    });
});
app.get("*", function(req, res) {
    res.send("Working!!!");
});

app.listen(8080, function() {
    console.log("Server is Listening!!!");
});
