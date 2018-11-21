module.exports = {
  sendMail: function(nodemailer, senderemail, senderpass, email, res, user) {
    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderemail,
        pass: senderpass
      }
    });
    const mailOptions = {
      from: senderemail,
      to: email,
      subject: "Email Verification",
      html: "<p>Your html here</p>"
    };
    transporter.sendMail(mailOptions, function(e, info) {
      if (e) {
        res.send("0");
        console.log(">  Couldn't Send Verification Email\n   >  " + e.message.substring(0, 13));
        user.deleteMany({ email: email }, function(e, obj) {
          if (e) throw e;
        });
      }
      else {
        res.send("1");
        console.log(">  Verification Email Sent");
      }
    });
  },
  sendVerificationMail: function(mailgun, email, res, user) {
    var data = {
      from: "Sanrakshak <verify@sanrakshak.in>",
      to: email,
      subject: "Verify Your Email",
      text: ""
    };
    mailgun.messages().send(data, function(e, body) {
      if (e) {
        res.send("0");
        console.log(">  Couldn't Send Verification Email\n   >  " + e.message.substring(0, 13));
        user.deleteMany({ email: email }, function(e, obj) {
          if (e) throw e;
        });
      }
      else {
        res.send("1");
        console.log(">  Verification Email Sent");
      }
    });
  }
};
