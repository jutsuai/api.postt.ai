import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
//
import connectDB from "./config/db";
import { Users, Auth, LinkedinManagement } from "./routes";
import { errorHandler, notFound } from "./middlewares";

// Initialize the Hono app
const app = new Hono().basePath("/api/v1");

// Config MongoDB
connectDB();

// Initialize middlewares
app.use("*", logger(), prettyJSON());

// Cors
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Home Route
app.get("/", (c) => c.text("live!"));

// API Routes
app.route("/auth", Auth);
app.route("/users", Users);
app.route("/linkedin/management", LinkedinManagement);

// Error Handler
app.onError((err, c) => {
  const error = errorHandler(c);
  return error;
});

// Not Found Handler
app.notFound((c) => {
  const error = notFound(c);
  return error;
});

const port = Bun.env.PORT || 8000;

export default {
  port,
  fetch: app.fetch,
};
