import { Hono } from "hono";
import { linkedinManagementController } from "../../controllers";
import { protect } from "../../middlewares";

const management = new Hono();

management.get("/", protect, (c) =>
  linkedinManagementController.linkedinLogin(c)
);

// Linkedin Callback
management.post("/callback", protect, (c) =>
  linkedinManagementController.linkedinCallback(c)
);

// Linkedin Refresh Token
management.post("/refresh", protect, (c) =>
  linkedinManagementController.linkedinRefreshToken(c)
);

// Get User Details
management.get("/user", protect, (c) =>
  linkedinManagementController.getUserDetails(c)
);

// Get Organization List for DB
management.get("/organizationList", protect, (c) =>
  linkedinManagementController.getOrganizationListFormDB(c)
);

// Get Organization List for Linkedin
management.post("/organizationList", protect, (c) =>
  linkedinManagementController.getOrganizationListFormLinkedin(c)
);

export default management;
