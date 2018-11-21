module.exports = {
  sendVerificationMail: function(nodemailer, senderemail, senderpass, email, res, user) {
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
        console.log(">  Couldn't Send Verification Email\n   >  " + e);
        user.remove({ email: email }, function(err, obj) {
          if (err) throw err;
        });
      }
      else {
        res.send("1");
        console.log(">  Verification Email Sent");
      }
    });
  }
};
