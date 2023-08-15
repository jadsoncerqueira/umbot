import { Server as SocketIO } from "socket.io";
import { Server } from "http";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import User from "../models/User";
import { Identifier } from "sequelize";

let io: SocketIO;

export const initIO = (httpServer: Server): SocketIO => {
  io = new SocketIO(httpServer, {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
      exposedHeaders: ["Set-Cookie", "Date", "ETag"]
    }
  });

  io.on("connection", async socket => {
    logger.info("Client Connected");
    const { userId } = socket.handshake.query;

    if (userId && userId !== "undefined" && userId !== "null") {
      const aux = userId as unknown as Identifier;
      const user = await User.findByPk(aux);
      if (user) {
        user.online = true;
        await user.save();
      }
    }

    socket.on("joinChatBox", (ticketId: string) => {
      logger.info("A client joined a ticket channel");
      socket.join(ticketId);
    });

    socket.on("joinNotification", () => {
      logger.info("A client joined notification channel");
      socket.join("notification");
    });

    socket.on("joinTickets", (status: string) => {
      logger.info(`A client joined to ${status} tickets channel.`);
      socket.join(status);
    });
  });
  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket IO not initialized");
  }
  return io;
};
