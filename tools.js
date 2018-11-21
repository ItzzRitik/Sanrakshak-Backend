module.exports = {
  sendVerificationMail: function(nodemailer, senderemail, senderpass, email) {
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
    transporter.sendMail(mailOptions, function(err, info) {
      if (err)
        console.log(err)
      else
        console.log(info);
    });
  },
  bar: function() {
    // whatever
  }
};
