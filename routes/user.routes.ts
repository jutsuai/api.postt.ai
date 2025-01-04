import { Hono } from "hono";
import { userController } from "../controllers";
import { isAdmin, protect } from "../middlewares";

const users = new Hono();

// Get All Users
users.get("/", protect, isAdmin, (c) => userController.getUsers(c));

// Get Single User
users.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ message: `User ${id}` });
});

// Get User Profile
users.get("/profile", (c) => {
  return c.json({ message: "User Profile" });
});

export default users;
