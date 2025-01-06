const { default: axios } = require("axios");

const fetchOrganizationDetails = async (id: string, headers: any) => {
  const orgUrl = `https://api.linkedin.com/v2/organizations/${id}`;
  try {
    const response = await axios.get(orgUrl, { headers });
    return { data: response.data, error: null };
  } catch (error: any) {
    console.log(
      `============================Error fetching details for organization ID ${id}:`,
      error.response?.data || error.message
    );
    return { data: null, error: error.response?.data || error.message };
  }
};

export default fetchOrganizationDetails;
