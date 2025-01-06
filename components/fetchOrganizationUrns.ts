const { default: axios } = require("axios");

const fetchOrganizationUrns = async (accessToken: string) => {
  const url = "https://api.linkedin.com/v2/organizationAcls";
  const params = { q: "roleAssignee", state: "APPROVED" };
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  try {
    const response = await axios.get(url, { params, headers });
    const data = response.data.elements.map(
      (element: any) => element.organization
    );
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.response?.data || error.message };
  }
};

export default fetchOrganizationUrns;
