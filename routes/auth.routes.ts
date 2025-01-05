import { Hono } from "hono";
import { authController } from "../controllers";

const auth = new Hono();

// Signup
auth.post("/signup", (c) => authController.signupUser(c));

// Login
auth.post("/login", (c) => authController.loginUser(c));

// Linkedin Login
auth.get("/linkedin", (c) => authController.linkedinLogin(c));

// Linkedin Callback
auth.post("/linkedin/callback", (c) => authController.linkedinCallback(c));

// // Linkedin Refresh Token
// auth.post("/linkedin/refresh", (c) => authController.linkedinRefreshToken(c));

// Logout
auth.get("/logout", (c) => authController.logoutUser(c));

export default auth;
