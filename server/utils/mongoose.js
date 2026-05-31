import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set in environment variables");
}

const DB_NAME = process.env.MONGODB_DBNAME;
const connectionOptions = {
  dbName: DB_NAME,
  autoIndex: true,
  maxPoolSize: 10,
};

let isConnected = false;

export async function connectMongoose() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose;
  }

  await mongoose.connect(uri, connectionOptions);
  isConnected = true;
  return mongoose;
}

export function getMongoose() {
  return mongoose;
}
