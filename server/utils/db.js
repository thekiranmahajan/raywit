import { connectMongoose } from "./mongoose.js";
import ChatMessage from "../models/ChatMessage.js";

export async function getMessagesByRoom(roomId, limit = 100) {
  await connectMongoose();
  const rows = await ChatMessage.find({ roomId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean()
    .exec();

  return rows.map((r) => ({
    encryptedData: r.encryptedData,
    userId: r.userId,
    userName: r.userName,
    messageId: r.messageId,
    replyToMessageId: r.replyToMessageId,
    replyToSender: r.replyToSender,
    replyToEncryptedData: r.replyToEncryptedData,
    timestamp: r.timestamp,
  }));
}

export async function saveMessage(message) {
  await connectMongoose();
  const doc = await ChatMessage.create({
    roomId: message.roomId,
    userId: message.userId,
    userName: message.userName,
    messageId: message.messageId,
    encryptedData: message.encryptedData,
    replyToMessageId: message.replyToMessageId || null,
    replyToSender: message.replyToSender || null,
    replyToEncryptedData: message.replyToEncryptedData || null,
    createdAt: message.timestamp ? new Date(message.timestamp) : new Date(),
    timestamp: message.timestamp || Date.now(),
  });

  return doc;
}

export async function deleteMessagesByRoom(roomId) {
  await connectMongoose();
  const res = await ChatMessage.deleteMany({ roomId });
  return res.deletedCount || 0;
}
