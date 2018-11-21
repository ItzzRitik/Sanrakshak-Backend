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
  sendMail: function() {
    var api_key = "key-00515078af3ab1f28f2ecc9ba40ea4a3";
    var domain = "www.sanrakshak.in";
  }
};
