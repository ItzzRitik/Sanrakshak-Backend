module.exports = {
  sendVerificationMail: function(ses, email, message, res, user) {
    const params = {
      Destination: { ToAddresses: [email] },
      ConfigurationSetName: "sanrakshak",
      Message: {
        Body: { Html: { Data: message } },
        Subject: { Data: "Verify Your Email" }
      },
      Source: "Sanrakshak <verify@mail.sanrakshak.in>"
    };
    const sendEmail = ses.sendEmail(params).promise();
    sendEmail
      .then(data => {
        res.send("1");
        console.log(">  Verification Email Sent");
      })
      .catch(e => {
        res.send("0");
        console.log(">  Couldn't Send Verification Email\n   >  " + e.message);
        user.remove({ email: email }, function(e, obj) {
          if (e) throw e;
        });
      });
  }
};
