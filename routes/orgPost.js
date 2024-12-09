const express = require("express");
const { default: axios } = require("axios");
const router = express.Router();

router.post("/", async (req, res, next) => {
  const { accessToken } = req.body;

  const response = await axios.get(
    "https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-RestLi-Protocol-Version": "2.0.0",
      },
    }
  );

  console.log("response : ", response);

  return res.send({
    message: "Post created successfully",
  });
});

module.exports = router;
