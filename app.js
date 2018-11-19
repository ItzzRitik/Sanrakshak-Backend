var express = require("express");
var app = express();
var BodyParser = require("body-parser");
var mongoose = require("mongoose");
var fs = require("fs");
var multer = require('multer');

mongoose.connect("mongodb://localhost/sanrakshak", { useNewUrlParser: true });
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
var User = mongoose.model("users", UserSchema);

app.get("/check", function(req, res) {
    var email = req.query.email;
    User.find({ email: email }, function(e, user) {
        if (e) { console.log("Error occured while checking for email.\n" + e); }
        else {
            if (user.length) { res.send("1"); }
            else { res.send("0"); }
        }
    });
});
app.get("/signup", function(req, res) {
    var email = req.query.email;
    var pass = req.query.pass;
    User.create({
        email: email,
        pass: pass,
        fname: "",
        lname: "",
        gender: "",
        dob: ""
    }, function(e, user) {
        if (e) {
            res.send("0");
            console.log("Error occured while creating user.\n" + e);
        }
        else {
            res.send("1");
            console.log("User created : ");
            console.log(user);
        }
    });
});


app.get("*", function(req, res) {
    res.send("Working!!!");
});

app.listen(8080, function() {
    console.log("Server is Listening!!!");
});
