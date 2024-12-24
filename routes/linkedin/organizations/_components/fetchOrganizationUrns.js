const { default: axios } = require("axios");

const fetchOrganizationUrns = async (accessToken) => {
  // console.log(
  //   "=--- - -- - - -  -- - fetchOrganizationUrns: ",
  //   // response.data,
  //   " -  accessToken - ",
  //   accessToken
  // );

  //
  //
  //

  const url = "https://api.linkedin.com/v2/organizationAcls";
  const params = {
    q: "roleAssignee",
    state: "APPROVED",
  };
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  //
  //
  //
  //
  //
  //

  try {
    const response = await axios.get(url, { params, headers });

    // console.log(
    //   "=--- - -- - - -  -- - fetchOrganizationUrns: ",
    //   response.data,
    //   " -  accessToken - ",
    //   accessToken
    // );

    return response.data.elements.map((element) => element.organization);
  } catch (error) {
    console.error(
      "Error fetching organization URNs:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Failed to fetch organization URNs");
  }
};

module.exports = fetchOrganizationUrns;
