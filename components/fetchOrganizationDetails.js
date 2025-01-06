const { default: axios } = require("axios");

const fetchOrganizationDetails = async (id, headers) => {
  const orgUrl = `https://api.linkedin.com/v2/organizations/${id}`;
  try {
    const orgResponse = await axios.get(orgUrl, { headers });
    return orgResponse.data;
  } catch (error) {
    console.error(
      `Error fetching details for organization ID ${id}:`,
      error.response ? error.response.data : error.message
    );
    throw new Error(`Failed to fetch details for organization ID ${id}`);
  }
};

module.exports = fetchOrganizationDetails;
