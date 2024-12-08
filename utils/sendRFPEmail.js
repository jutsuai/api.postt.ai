const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendRFPEmail = async (
  firstName,
  lastName,
  jobTitle,
  email,
  phone,
  country,
  state,
  city,
  companyName,
  industry,
  additionalInformation,
  files
) => {
  const msg = {
    to: process.env.FROM_EMAIL,
    from: process.env.FROM_EMAIL,
    templateId: "d-3126347661114f65874d3ac206355698",
    dynamic_template_data: {
      firstName: firstName,
      lastName: lastName,
      jobTitle: jobTitle,
      email: email,
      phone: phone,
      country: country,
      state: state,
      city: city,
      companyName: companyName,
      industry: industry,
      additionalInformation: additionalInformation,
      files: files,

      subject: `${firstName} ${lastName} - Request A Proposal`,
    },
  };

  console.log("MSG : ", msg);

  await sgMail
    .send(msg)
    .then(async () => {
      console.log("==> Message sent");
    })
    .catch(async (err) => {
      console.log("Error", err);
    });
};

module.exports = sendRFPEmail;
