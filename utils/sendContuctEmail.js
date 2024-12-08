const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendContuctEmail = async (
  firstName,
  lastName,
  email,
  phone,
  subject,
  message,
  newsletter
) => {
  const msg = {
    to: process.env.FROM_EMAIL,
    from: process.env.FROM_EMAIL,
    templateId: "d-9ffc281e3d0c4683b8dd78592d81928c",
    dynamic_template_data: {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      subject: `${firstName} ${lastName} - ${subject}`,
      message: message,
      newsletter: newsletter,
    },
  };

  await sgMail
    .send(msg)
    .then(async () => {
      console.log("==> Message sent");
    })
    .catch(async (err) => {
      console.log("Error", err);
    });
};

module.exports = sendContuctEmail;
