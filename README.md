# Starter REST API using Bun + Hono + MongoDB + TypeScript

## Table of Contents

- [Getting Started](#getting-started)
  - [Installations](#installations)
  - [Configuration](#configuration)
  - [Routes](#routes)
  - [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Getting Started

Before you begin, make sure you have the following installed:

- [Bun](https://bun.sh)
- [MongoDB](mongodb.com) or [MongoCompass](mongodb.com/products/compass)

### Installations:

1. Clone this repository to your local machine

```bash
git clone https://github.com/ProMehedi/bun-hono-rest-api.git
```

2. Navigate to the project directory

```bash
cd bun-hono-rest-api
```

3. Install dependencies

```bash
bun install
```

To run:

```bash
bun run dev
```

### Configuration

Create a .env file in the root directory of your project. Add environment-specific variables on new lines in the form of NAME=VALUE. For example:

```
PORT=9000
MONGO_URI=mongodb://localhost:27017/bun-hono-rest-api
JWT_SECRET=secret
```

### Routes

```
POST /api/v1/users (Create User)
POST /api/v1/users/login (Login User)
GET /api/v1/users/profile (Get User Profile)
GET /api/v1/useres (Get All Users)
GET /api/v1/users/:id (Get User By Id)
```

### Usage

```
POST /api/v1/users (Create User)
```

```json
{
  "name": "John Doe",
  "email": "joh@jutsu.ai",
  "password": "123456"
}
```

```
POST /api/v1/users/login (Login User)
```

```json
{
  "email": "joh@jutsu.ai",
  "password": "123456"
}
```

```
GET /api/v1/users/profile (Get User Profile)
Authorisation Header (Bearer Token)
```

```
GET /api/v1/useres (Get All Users)
Authorisation Header (Bearer Token)
```

```
GET /api/v1/users/:id (Get User By Id)
Authorisation Header (Bearer Token)
```

## Project Structure

```

├── .vscode
│ ├── settings.json
├── config
│ ├── db.ts
├── controllers
│ ├── user.ts
├── middlewares
│ ├── authMiddlewares.ts
│ ├── errorMiddlewares.ts
├── models
│ ├── userModels.ts
├── routes
│ ├── userRoutes.ts
├── utils
│ ├── getToken.ts
├── server.ts
├── .env
├── .gitignore
├── bun.lockb
├── README.md
├── package.json
├── tsconfig.ts

```

STATUS_CODES: {
"100": "Continue",
"101": "Switching Protocols",
"102": "Processing",
"103": "Early Hints",
"200": "OK",
"201": "Created",
"202": "Accepted",
"203": "Non-Authoritative Information",
"204": "No Content",
"205": "Reset Content",
"206": "Partial Content",
"207": "Multi-Status",
"208": "Already Reported",
"226": "IM Used",
"300": "Multiple Choices",
"301": "Moved Permanently",
"302": "Found",
"303": "See Other",
"304": "Not Modified",
"305": "Use Proxy",
"307": "Temporary Redirect",
"308": "Permanent Redirect",
"400": "Bad Request",
"401": "Unauthorized",
"402": "Payment Required",
"403": "Forbidden",
"404": "Not Found",
"405": "Method Not Allowed",
"406": "Not Acceptable",
"407": "Proxy Authentication Required",
"408": "Request Timeout",
"409": "Conflict",
"410": "Gone",
"411": "Length Required",
"412": "Precondition Failed",
"413": "Payload Too Large",
"414": "URI Too Long",
"415": "Unsupported Media Type",
"416": "Range Not Satisfiable",
"417": "Expectation Failed",
"418": "I'm a Teapot",
"421": "Misdirected Request",
"422": "Unprocessable Entity",
"423": "Locked",
"424": "Failed Dependency",
"425": "Too Early",
"426": "Upgrade Required",
"428": "Precondition Required",
"429": "Too Many Requests",
"431": "Request Header Fields Too Large",
"451": "Unavailable For Legal Reasons",
"500": "Internal Server Error",
"501": "Not Implemented",
"502": "Bad Gateway",
"503": "Service Unavailable",
"504": "Gateway Timeout",
"505": "HTTP Version Not Supported",
"506": "Variant Also Negotiates",
"507": "Insufficient Storage",
"508": "Loop Detected",
"509": "Bandwidth Limit Exceeded",
"510": "Not Extended",
"511": "Network Authentication Required",
},
