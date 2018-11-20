const express = require("express");
const app = express();
const BodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypt = require('./CryptLib');
const clear = require('clear');
const git = require('simple-git/promise')();

var call = 0;
var con = null;

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

//Routes
app.post("/connect", function(req, res) {
    if (mongoose.connection.readyState == 2) {
        console.log(">  Connection Request Recieved");
    }
    con = setInterval(function sendEmail() {
        if (mongoose.connection.readyState == 1) {
            var device = req.body.device;
            try {
                device = crypt.decryptCipherTextWithRandomIV(device, "sanrakshak");
            }
            catch (e) {
                console.log(">  Error occured while decrypting device name :\n>  " + e);
                res.send("1");
                clearInterval(con);
            }
            console.log("\n" + ++call + ") Device Connected");
            console.log(">  " + device);
            res.send("1");
            clearInterval(con);
        }
        else if (mongoose.connection.readyState == 0) {
            res.send("0");
            clearInterval(con);
        }
    }, 1000);
});

app.post("/check", function(req, res) {
    var email = req.body.email;
    console.log("\n" + ++call + ") Searching For Account");
    try {
        email = crypt.decryptCipherTextWithRandomIV(email, "sanrakshak");
    }
    catch (e) {
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
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

app.post("/login", function(req, res) {
    var email = req.body.email;
    var pass = req.body.pass;
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
                console.log(">  Authentication successfull");
            }
            else {
                res.send("0");
                console.log(">  Authentication Terminated: Invalid Password");
            }
        }
        else {
            res.send("0");
            console.log(">  Authentication Terminated: User doesn't exist");
        }
    });
});

app.post("/signup", function(req, res) {
    var email = req.body.email;
    var pass = req.body.pass;
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
    mongoose.connection.dropCollection("users", function(err, result) {
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

app.get("/git", function(req, res) {
    var m = req.query.m;
    console.log("\n" + ++call + ") Pushing to Github");
    git.add('.')
        .then(
            (addSuccess) => {
                console.log(">  Added Changes to Stack\n>  " + addSuccess);
            }, (failedAdd) => {
                console.log(">  Adding Files Failed\n>  " + failedAdd);
            });
    git.commit(m)
        .then(
            (successCommit) => {
                console.log(">   Changes Commited\n>  " + successCommit);
            }, (failed) => {
                console.log(">  Commit Failed\n>  " + failed);
            });
    git.push('origin', 'master')
        .then((success) => {
            console.log(">   Pushed to Origin Master\n>  " + success);
        }, (failed) => {
            console.log(">  Push Failed\n>  " + failed);
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
