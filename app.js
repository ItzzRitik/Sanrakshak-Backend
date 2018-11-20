var express = require("express");
var app = express();
var BodyParser = require("body-parser");
var mongoose = require("mongoose");
var fs = require("fs");
var multer = require('multer');
var crypt = require('./CryptLib');
var clear = require('clear');

var db = mongoose.connection;
var call = 0;

const dbURI = "mongodb+srv://itzzritik:sanrakshak@sanrakshak-vjchw.mongodb.net/test?retryWrites=true";
const dbOptions = { useNewUrlParser: true, reconnectTries: Number.MAX_VALUE, poolSize: 10 };
mongoose.connect(dbURI, dbOptions).then(
    () => {
        console.log(">  Connection Established");
    },
    e => {
        console.log(">  Connection Failed \n>  " + e);
    }
);

app.set("view engine", "ejs");
app.use(BodyParser.urlencoded({ extended: true }));

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

app.get("/connect", function(req, res) {
    var device = req.query.device;
    try {
        device = crypt.decryptCipherTextWithRandomIV(device, "sanrakshak");
    }
    catch (e) {
        console.log(">  Error occured while decrypting device name :\n>  " + e);
        res.send("1");
        return;
    }

    console.log("\n" + ++call + ") Device Connected");
    console.log(">  " + device);
    res.send("1");
});

app.get("/check", function(req, res) {
    var email = req.query.email;
    console.log("\n" + ++call + ") Account Checkup");
    User.find({ email: email }, function(e, user) {
        if (e) { console.log(">  Error occured while checking for email :\n>  " + e); }
        else {
            if (user.length) {
                res.send("1");
                console.log(">  \"" + email + "\" exists in database");
                console.log(">  Login Initiated");
            }
            else {
                res.send("0");
                console.log(">  \"" + email + "\" doesn't exists in database");
                console.log(">  Account creation Initiated");
            }
        }
    });
});

app.get("/login", function(req, res) {
    var email = req.query.email;
    var pass = req.query.pass;
    console.log("\n" + ++call + ") Authentication Started");
    try {
        email = crypt.decryptCipherTextWithRandomIV(email, "sanrakshak");
        console.log("Email : " + email + "\nEncrypted Password : " + pass);
        pass = crypt.decryptCipherTextWithRandomIV(pass, "sanrakshak");
    }
    catch (e) {
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
    User.find({ email: email }, function(e, user) {
        if (e) {
            console.log(">  Error occured while logging in :\n>  " + e);
        }
        else if (user.length) {
            if (user[0].pass == pass) {
                res.send("1");
                console.log(">  Valid Password");
                console.log(">  Authentication successfull");
            }
            else {
                res.send("0");
                console.log(">  Invalid Password");
                console.log(">  Authentication Terminated");
            }
        }
        else {
            res.send("0");
            console.log(">  User doesn't exist");
        }
    });
});

app.get("/signup", function(req, res) {
    var email = req.query.email;
    var pass = req.query.pass;
    console.log("\n" + ++call + ") Account Creation Started");
    try {
        email = crypt.decryptCipherTextWithRandomIV(email, "sanrakshak");
        console.log("Email : " + email + "\nEncrypted Password : " + pass);
        pass = crypt.decryptCipherTextWithRandomIV(pass, "sanrakshak");
    }
    catch (e) {
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
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
            console.log(">  Error While Creating Account\n>  " + e);
        }
        else {
            res.send("1");
            console.log(">  Account Successfully Created");
        }
    });
});

app.get("/dropusers", function(req, res) {
    db.dropCollection("users", function(err, result) {
        if (err) {
            res.send("0");
            console.log("Error delete collection");
        }
        else {
            res.send("1");
            console.log("Delete collection success");
        }
    });
});

app.get("*", function(req, res) {
    res.send("Working!!!");
});

app.listen(8080, function() {
    clear();

    console.log("\n" + ++call + ") Starting Server");
    console.log(">  Server is Listening");
    console.log("\n" + ++call + ") Connection to MongoDB Atlas Server");
});
