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
  sendMail2: function(mailgun, email, message, res, user) {
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
  },
  sendVerificationMail: function(ses, email, mail, res, user) {
    const params = {
      Destination: { ToAddresses: [email] },
      ConfigurationSetName: "sanrakshak",
      Message: {
        Body: {
          Html: {
            Data: "Hello"
          }
        },
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
