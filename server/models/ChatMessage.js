import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: false,
      trim: true,
    },
    messageId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    encryptedData: {
      type: String,
      required: true,
    },
    replyToMessageId: {
      type: String,
      default: null,
    },
    replyToSender: {
      type: String,
      default: null,
    },
    replyToEncryptedData: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Number,
      required: true,
      default: () => Date.now(),
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  },
);

chatMessageSchema.index({ roomId: 1, createdAt: 1 });
chatMessageSchema.index({ messageId: 1 }, { unique: true });

const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;
