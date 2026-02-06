# Glassbox Backend

Node.js backend server for the Glassbox application built with Express.js.

## Features

- ✅ Express.js server setup
- ✅ CORS enabled for frontend communication
- ✅ Environment variable configuration
- ✅ Sample API routes
- ✅ Error handling middleware
- ✅ Hot reload with nodemon

## Getting Started

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the backend directory (already created) and configure your environment variables:

```env
PORT=5000
NODE_ENV=development
```

### Running the Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Root
- **GET** `/` - API information and available endpoints

### Health Check
- **GET** `/api/health` - Server health status

### Sample Data
- **GET** `/api/data` - Returns sample data array

### Echo
- **POST** `/api/echo` - Echoes back the message sent in request body
  ```json
  {
    "message": "Your message here"
  }
  ```

## Project Structure

```
backend/
├── server.js              # Main application entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
├── .gitignore            # Git ignore rules
├── routes/               # API route handlers
│   └── api.js           # Sample API routes
└── middleware/          # Custom middleware
    └── errorHandler.js  # Global error handling
```

## Testing the API

You can test the API using:
- Browser: Navigate to `http://localhost:5000/api/health`
- cURL: `curl http://localhost:5000/api/health`
- Postman or any API client
- Frontend fetch calls from React

## Next Steps

1. Add database connection (MongoDB, PostgreSQL, etc.)
2. Implement authentication/authorization
3. Create additional routes for your application
4. Add input validation
5. Implement logging
6. Set up testing framework
