module.exports = {
  sendVerificationMail: function(mailgun, email, message, res, user) {
    var data = {
      from: "Sanrakshak <verify@sanrakshak.in>",
      to: email,
      subject: "Verify Your Email",
      text: message
    };
    mailgun.messages().send(data, function(e, body) {
      if (e) {
        res.send("0");
        console.log(">  Couldn't Send Verification Email\n   >  " + e.message);
        user.remove({ email: email }, function(e, obj) {
          if (e) throw e;
        });
      }
      else {
        res.send("1");
        console.log(">  Verification Email Sent");
        //console.log(body);
      }
    });
  }
};
