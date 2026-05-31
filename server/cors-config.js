import cors from "cors";

// Function to create appropriate CORS configuration based on environment
export const configureCors = (app) => {
  const allowedOrigins = [
    "https://raywit.vercel.app", // Production client on Vercel
    "http://localhost:3000", // Local development
  ];

  // Apply CORS middleware with configuration
  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
    }),
  );
};

// Configure Socket.IO CORS settings
export const socketCorsConfig = {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        "https://raywit.vercel.app", // Production client on Vercel
        "http://localhost:3000", // Local development
        "http://192.168.137.1:3000", // Local network development
      ];

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins for local dev
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
};
