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

// Get Organization List
management.post("/organizationList", protect, (c) =>
  linkedinManagementController.getOrganizationList(c)
);

export default management;
