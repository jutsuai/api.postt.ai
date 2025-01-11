import { LinkedinProfile } from "../models";

const saveOrganizationDetails = async (orgDetails: any, userId: string) => {
  try {
    const linkedinProfile = await LinkedinProfile.findOneAndUpdate(
      { linkedinId: orgDetails?.id },
      {
        createdBy: userId,
        type: "organization",
        linkedinId: orgDetails?.id,
        name: orgDetails?.localizedName,
        slug: orgDetails?.vanityName,
        logo: orgDetails?.logoV2?.original,
        cover: orgDetails?.coverV2?.original,
        description: orgDetails?.localizedDescription,
        websiteUrl: orgDetails?.websiteUrl,
        linkedinUrl: `https://www.linkedin.com/company/${orgDetails?.vanityName}`,
        tags: orgDetails?.tags,
        industries: orgDetails?.industries,
      },
      {
        upsert: true,
        new: true,
      }
    );

    return linkedinProfile;
  } catch (error) {
    console.error("Error saving organization details:", error);
    throw new Error("Failed to save organization details");
  }
};
export default saveOrganizationDetails;
