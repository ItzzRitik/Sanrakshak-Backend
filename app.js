const app = require("express")();
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const clear = require('clear');
const git = require('simple-git/promise')();
const aws = require("aws-sdk");
const tools = require("./tools");
const request = require("request");

var call = 0;
var con = null;

app.set("view engine", "ejs");

aws.config.update(require("./ses"));
const ses = new aws.SES({ apiVersion: "2010-12-01" });

const dbURI = "mongodb+srv://itzzritik:sanrakshak@sanrakshak-vjchw.mongodb.net/test?retryWrites=true";
const dbOptions = { useNewUrlParser: true, reconnectTries: Number.MAX_VALUE, poolSize: 10 };
mongoose.connect(dbURI, dbOptions).then(
    () => { console.log(">  Connection Established"); },
    e => { console.log(">  Connection Failed \n>  " + e); }
);

app.use(bodyparser.urlencoded({ extended: true }));
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
    dob: String,
    aadhaar: String,
    profile: String,
    verified: String
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
                device = tools.decryptCipherTextWithRandomIV(device, "sanrakshak");
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
        email = tools.decryptCipherTextWithRandomIV(email, "sanrakshak");
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
                console.log("\"" + email + "\" exists in database");
                console.log(">  Login Initiated");
            }
            else {
                res.send("0");
                console.log("\"" + email + "\" doesn't exists in database");
                console.log(">  Account creation Initiated");
            }
        }
    });
});

app.post("/login", function(req, res) {
    var email = req.body.email;
    var token = email;
    var pass = req.body.pass;
    console.log("\n" + ++call + ") Authentication Started");
    try {
        email = tools.decryptCipherTextWithRandomIV(email, "sanrakshak");
        console.log("Email : " + email + "\nEncrypted Password : " + pass.replace(/\r?\n|\r/g, ""));
        pass = tools.decryptCipherTextWithRandomIV(pass, "sanrakshak");
    }
    catch (e) {
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
    User.find({ email: email }, function(e, user) {
        if (e) {
            console.log(">  Error occured while logging in :\n>  " + e);
            res.send("0");
        }
        else if (user.length > 0) {
            if (user[0].pass == pass) {
                if (user[0].verified == "1") {
                    if (user[0].fname == "" || user[0].lname == "" || user[0].gender == "" || user[0].dob == "" || user[0].aadhaar == "") {
                        res.send("3");
                        console.log(">  Authentication Pending : Launching Profile Creation");
                    }
                    else {
                        res.send("1");
                        console.log(">  Authentication Successfull");
                    }
                }
                else {
                    var message = req.protocol + '://' + req.get('host') + "/verify?landing=yes&token=" + encodeURIComponent(token);
                    tools.sendVerificationMail(ses, request, email, message, res, user, "2");
                    console.log(">  Authentication Pending : Launching Email Verification");
                }
            }
            else {
                res.send("0");
                console.log(">  Authentication Terminated : Invalid Password");
            }
        }
        else if (user.length <= 0) {
            res.send("0");
            console.log(">  Authentication Terminated : User doesn't exist");
        }
    });
});

app.post("/signup", function(req, res) {
    var email = req.body.email;
    var token = email;
    var pass = req.body.pass;
    console.log("\n" + ++call + ") Account Creation Started");
    try {
        email = tools.decryptCipherTextWithRandomIV(email, "sanrakshak");
        console.log("Email : " + email + "\nEncrypted Password : " + pass.replace(/\r?\n|\r/g, ""));
        pass = tools.decryptCipherTextWithRandomIV(pass, "sanrakshak");
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
        dob: "",
        aadhaar: "",
        profile: "",
        verified: "0"
    }, function(e, user) {
        if (e) {
            res.send("0");
            console.log(">  Error While Creating Account\n>  " + e);
        }
        else {
            console.log("Token Generated: " + token.replace(/\r?\n|\r/g, ""));
            var message = req.protocol + '://' + req.get('host') + "/verify?landing=yes&token=" + encodeURIComponent(token);
            tools.sendVerificationMail(ses, request, email, message, res, user, "1");
        }
    });
});
app.post("/profile", function(req, res) {
    var email, fname, lname, gender, dob, aadhaar, profile;
    console.log("\n" + ++call + ") Profile Creation Started");
    try {
        email = tools.decryptCipherTextWithRandomIV(req.body.email, "sanrakshak");
        fname = tools.decryptCipherTextWithRandomIV(req.body.fname, "sanrakshak");
        lname = tools.decryptCipherTextWithRandomIV(req.body.lname, "sanrakshak");
        gender = tools.decryptCipherTextWithRandomIV(req.body.gender, "sanrakshak");
        dob = tools.decryptCipherTextWithRandomIV(req.body.dob, "sanrakshak");
        aadhaar = tools.decryptCipherTextWithRandomIV(req.body.aadhaar, "sanrakshak");
        profile = tools.decryptCipherTextWithRandomIV(req.body.profile, "sanrakshak");
    }
    catch (e) {
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
    User.find({ email: email }, function(e, user) {
        if (e) { res.send("0"); }
        else if (user.length > 0) {
            User.updateMany({ email: email }, {
                    $set: {
                        fname: fname,
                        lname: lname,
                        gender: gender,
                        dob: dob,
                        aadhaar: aadhaar,
                        profile: profile
                    }
                },
                function(err, user) {
                    if (err) {
                        console.log(">  Profile Creation Failed");
                        res.send("0");
                    }
                    else {
                        console.log(">  Profile Created Successfuly");
                        console.log("  >  Email : " + email);
                        console.log("  >  First Name : " + fname);
                        console.log("  >  Last Name : " + lname);
                        console.log("  >  Gender : " + gender);
                        console.log("  >  Date of Birth : " + dob);
                        console.log("  >  Aadhaar Number : " + aadhaar);
                        console.log("  >  Profile URL : " + profile);
                        res.send("1");
                    }
                });
        }
        else {
            res.send("0");
        }
    });
});

app.get("/verify", function(req, res) {
    var landing = req.query.landing;
    var token = req.query.token;
    var email, verified = "0";
    try {
        email = tools.decryptCipherTextWithRandomIV(token, "sanrakshak");
    }
    catch (e) {
        console.log("\n" + ++call + ") Verification Initiated");
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
    User.find({ email: email }, function(e, user) {
        if (e) {}
        else if (user.length > 0) {
            verified = user[0].verified;
        }
        if (landing == "yes") {
            res.render("verify", {
                protocol: req.protocol,
                host: req.get('host'),
                token: encodeURIComponent(token),
                verified: verified
            });
        }
        else if (landing == "no" && verified == "0") {
            console.log("\n" + ++call + ") Verification Initiated");
            console.log("Token Received : " + token.replace(/\r?\n|\r/g, ""));
            console.log("Email Linked : " + email);
            if (verified == "0") {
                User.find({ email: email }, function(e, user) {
                    if (e) { res.send("0"); }
                    else if (user.length > 0) {
                        User.updateMany({ email: email }, { $set: { verified: "1" } },
                            function(err, user) {
                                if (err) {
                                    console.log(">  Verification Failed");
                                    res.send("0");
                                }
                                else {
                                    console.log(">  Account Has Been Verified");
                                    res.send("1");
                                }
                            });
                    }
                    else {
                        res.send("0");
                    }
                });
            }
        }
    });
});

app.post("/checkverification", function(req, res) {
    var email = req.body.email;
    try {
        email = tools.decryptCipherTextWithRandomIV(email, "sanrakshak");
    }
    catch (e) {
        res.send("0");
        return;
    }
    User.find({ email: email }, function(e, user) {
        if (e) { res.send("0"); }
        else if (user.length) {
            if (user[0].verified == "1") {
                res.send("1");
            }
            else {
                res.send("0");
            }
        }
        else {
            res.send("0");
        }
    });
});

app.get("/getuser", function(req, res) {
    var email = req.body.email;
    console.log("\n" + ++call + ") Profile Details Requested");
    try {
        email = tools.decryptCipherTextWithRandomIV(email, "sanrakshak");
    }
    catch (e) {
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
    User.find({ email: email }, function(e, user) {
        if (e) {
            console.log(">  \"" + email + "\" Doesn't Exist in Database");
            res.send("0");
        }
        else {
            res.json(user);
            console.log(">  Profile Details Sent Sucessfully.");
        }
    });
});

app.get("/dropusers", function(req, res) {
    console.log("\n" + ++call + ") Deleting Collection \"Users\"");
    mongoose.connection.dropCollection("users", function(err, result) {
        if (err) {
            res.send("0");
            console.log(">  Failed");
        }
        else {
            res.send("1");
            console.log(">  Success");
        }
    });
});

app.get("/git", function(req, res) {
    var m = req.query.m;
    console.log("\n" + ++call + ") Pushing to Github");
    git.add('.')
        .then(
            (addSuccess) => {
                console.log(">  Changes Successfully Added to Stack");
            }, (failedAdd) => {
                console.log(">  Changes Adding Failed\n>  " + failedAdd);
            });
    git.commit(m)
        .then(
            (successCommit) => {
                console.log(">  Changes Successfully Commited\n   >  Message : \"" + m + "\"");
            }, (failed) => {
                console.log(">  Changes Commit Failed\n>  " + failed);
            });
    git.push('origin', 'master')
        .then((success) => {
            console.log(">  Changes Successfully Pushed to Origin Master");
        }, (failed) => {
            console.log(">  Changes Push Failed\n>  " + failed);
        });
    res.send("1");
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
