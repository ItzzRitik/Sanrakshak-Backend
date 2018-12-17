const app = require("express")();
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const clear = require('clear');
const git = require('simple-git/promise')();
const aws = require("aws-sdk");
const tools = require("./tools");
const request = require("request");
const passgen = require('generate-password');

var call = 0;
var con = null;

app.set("view engine", "ejs");

aws.config.update(require("./ses"));
const ses = new aws.SES({ apiVersion: "2010-12-01" });

const dbOptions = { useNewUrlParser: true, reconnectTries: Number.MAX_VALUE, poolSize: 10 };
mongoose.connect(require("./mongo"), dbOptions).then(
    () => { console.log(">  Connection Established"); },
    e => { console.log(">  Connection Failed \n>  " + e); }
);

app.use(bodyparser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var User = mongoose.model("users", new mongoose.Schema({
    email: String,
    pass: String,
    fname: String,
    lname: String,
    gender: String,
    dob: String,
    aadhaar: String,
    profile: String,
    cover: String,
    verified: String
}));
var Crack = mongoose.model("cracks", new mongoose.Schema({
    x: String,
    y: String,
    intensity: String,
    date: String
}));

//Routes
app.post("/connect", function(req, res) {
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

    // if (mongoose.connection.readyState == 2) {
    //     console.log(">  Connection Request Recieved");
    // }
    // con = setInterval(function sendEmail() {
    //     if (mongoose.connection.readyState == 1) {
    // var device = req.body.device;
    // try {
    //     device = tools.decryptCipherTextWithRandomIV(device, "sanrakshak");
    // }
    // catch (e) {
    //     console.log(">  Error occured while decrypting device name :\n>  " + e);
    //     res.send("1");
    //     clearInterval(con);
    // }
    // console.log("\n" + ++call + ") Device Connected");
    // console.log(">  " + device);
    // res.send("1");
    //         clearInterval(con);
    //     }
    //     else if (mongoose.connection.readyState == 0) {
    //         res.send("0");
    //         clearInterval(con);
    //     }
    // }, 1000);
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
    var verified = req.body.verified;
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
        cover: "",
        verified: verified
    }, function(e, user) {
        if (e) {
            res.send("0");
            console.log(">  Error While Creating Account\n>  " + e);
        }
        else {
            if (verified == 0) {
                console.log("Token Generated: " + token.replace(/\r?\n|\r/g, ""));
                var message = req.protocol + '://' + req.get('host') + "/verify?landing=yes&token=" + encodeURIComponent(token);
                tools.sendVerificationMail(ses, request, email, message, res, user, "1");
            }
            else {
                console.log(">  Account Created Successfuly\n>  Account Verification Not Required");
                res.send("1");
            }
        }
    });
});
app.post("/profile", function(req, res) {
    var email = req.body.email,
        fname = req.body.fname,
        lname = req.body.lname,
        gender = req.body.gender,
        dob = req.body.dob,
        aadhaar = req.body.aadhaar,
        profile = req.body.profile,
        cover = req.body.cover;
    console.log("\n" + ++call + ") Profile Creation Started");
    try {
        (email == null) ? "" : email = tools.decryptCipherTextWithRandomIV(email, "sanrakshak");
        (fname == null) ? "" : fname = tools.decryptCipherTextWithRandomIV(fname, "sanrakshak");
        (lname == null) ? "" : lname = tools.decryptCipherTextWithRandomIV(lname, "sanrakshak");
        (gender == null) ? "" : gender = tools.decryptCipherTextWithRandomIV(gender, "sanrakshak");
        (dob == null) ? "" : dob = tools.decryptCipherTextWithRandomIV(dob, "sanrakshak");
        (aadhaar == null) ? "" : aadhaar = tools.decryptCipherTextWithRandomIV(aadhaar, "sanrakshak");
        (profile == null) ? "" : profile = tools.decryptCipherTextWithRandomIV(profile, "sanrakshak");
        (cover == null) ? "" : cover = tools.decryptCipherTextWithRandomIV(cover, "sanrakshak");
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
                        profile: profile,
                        cover: cover
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

app.post("/social", function(req, res) {
    var email = req.body.email,
        fname = req.body.fname,
        lname = req.body.lname,
        gender = req.body.gender,
        dob = req.body.dob,
        profile = req.body.profile,
        cover = req.body.cover,
        pass = "";
    console.log("\n" + ++call + ") Profile Creation Started");
    try {
        (email == null) ? "" : email = tools.decryptCipherTextWithRandomIV(email, "sanrakshak");
        (fname == null) ? "" : fname = tools.decryptCipherTextWithRandomIV(fname, "sanrakshak");
        (lname == null) ? "" : lname = tools.decryptCipherTextWithRandomIV(lname, "sanrakshak");
        (gender == null) ? "" : gender = tools.decryptCipherTextWithRandomIV(gender, "sanrakshak");
        (dob == null) ? "" : dob = tools.decryptCipherTextWithRandomIV(dob, "sanrakshak");
        (profile == null) ? "" : profile = tools.decryptCipherTextWithRandomIV(profile, "sanrakshak");
        (cover == null) ? "" : cover = tools.decryptCipherTextWithRandomIV(cover, "sanrakshak");

        pass = passgen.generate({
            length: 10,
            numbers: true,
            uppercase: true,
            excludeSimilarCharacters: true,
            strict: true
        });
    }
    catch (e) {
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
    User.create({
        email: email,
        pass: pass,
        fname: fname,
        lname: lname,
        gender: gender,
        dob: dob,
        profile: profile,
        cover: cover,
        verified: "1"
    }, function(e, user) {
        if (e) {
            res.send("0");
            console.log(">  Error While Creating Account\n>  " + e);
        }
        else {
            console.log(">  Profile Created Successfuly");
            console.log("  >  Email : " + email);
            console.log("  >  First Name : " + fname);
            console.log("  >  Last Name : " + lname);
            console.log("  >  Gender : " + gender);
            console.log("  >  Date of Birth : " + dob);
            console.log("  >  Profile URL : " + profile);
            console.log("  >  Cover URL : " + cover);
            tools.sendPasswordMail(ses, request, email, pass, res, user, "1");
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

app.post("/getprofile", function(req, res) {
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

app.post("/addcrack", function(req, res) {
    var data = req.body.dataFrame;
    data = Buffer.from("" + data, 'base64').toString('ascii');
    data = data.split('-');
    var intensity = data[3];
    var date = data[4];
    console.log("\n" + ++call + ") Adding a New Crack");
    Crack.create({
        x: data[1],
        y: data[2],
        intensity: (intensity != null) ? intensity : Math.floor((Math.random() * 10) + 1),
        date: (date != null) ? date : new Date().toLocaleString('en-IN')
    }, function(e, crack) {
        if (e) {
            res.send("0");
            console.log(">  Failed");
        }
        else {
            res.send("1");
            console.log(">  Success\n" + crack);
        }
    });

});
app.get("/addcrack", function(req, res) {
    var x = req.query.x;
    var y = req.query.y;
    var intensity = req.query.i;
    var date = req.query.date;
    console.log("\n" + ++call + ") Adding a New Crack");

    if (x == 0 || y == 0) {
        res.send("0");
        console.log("Empty or Zero(0) Value Received");
        console.log(">  Can't add these values");
    }
    else
        Crack.find({ x: x, y: y }, function(e, crack) {
            if (e) { console.log(">  Error occured while checking for crack :\n>  " + e); }
            else {
                if (crack.length) {
                    res.send("0");
                    console.log("Requested data already exists in database");
                    console.log(">  Can't add duplicate cracks");
                    return;
                }
                else {
                    console.log("New Crack Detected");
                    Crack.create({
                        x: x,
                        y: y,
                        intensity: (intensity != null) ? intensity : Math.floor((Math.random() * 100) + 1),
                        date: (date != null) ? date : new Date().toLocaleString('en-IN')
                    }, function(e, crack) {
                        if (e) {
                            res.send("0");
                            console.log(">  Failed");
                        }
                        else {
                            res.send("1");
                            console.log(">  Crack added sucessfully :\n" + crack);
                        }
                    });
                }
            }
        });
});

app.post("/getcrack", function(req, res) {
    var email = req.body.email;
    console.log("\n" + ++call + ") Cracks Requested");
    try {
        email = tools.decryptCipherTextWithRandomIV(email, "sanrakshak");
    }
    catch (e) {
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
    Crack.find({}, function(e, cracks) {
        if (e) {
            console.log(">  Collection \"cracks\" Doesn't exist");
            res.send("0");
        }
        else {
            res.json(cracks);
            console.log(">  Cracks List Sent Sucessfully.");
        }
    });
});

app.get("/encrypt", function(req, res) {
    var text = req.query.text;
    try {
        text = tools.encryptPlainTextWithRandomIV(text, "sanrakshak");
        text = tools.encryptPlainTextWithRandomIV(text, "sanrakshak");
    }
    catch (e) {
        console.log(">  Error occured while decrypting data :\n>  " + e);
        res.send("0");
        return;
    }
    res.send(text);
});

app.get("/dropusers", function(req, res) {
    console.log("\n" + ++call + ") Deleting Collection \"Users\"");
    mongoose.connection.dropCollection("cracks", function(err, result) {
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
