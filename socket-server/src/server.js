require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://192.168.43.49:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"],
  pingInterval: 25000,
  pingTimeout: 60000,
});

app.use(
  cors({ origin: process.env.FRONTEND_URL || "http://192.168.43.49:3000" })
);
app.use(express.json());

const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("Utilisateur connecté:", socket.id);

  socket.on("register", async ({ userId }) => {
    if (!userId) {
      console.error("userId manquant");
      return socket.emit("error", { message: "userId requis" });
    }

    socket.join(`private-user-${userId}`);
    connectedUsers.set(userId, socket.id);

    try {
      await axios.post(`${process.env.LARAVEL_API_URL}/api/update-status`, {
        userId,
        status: "online",
      });
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour du statut online:",
        error.message
      );
    }
  });

  // Nouveau gestionnaire pour rejoindre des rooms dynamiquement
  socket.on("join", ({ room }) => {
    socket.join(room);
    console.log(`Utilisateur ${socket.id} a rejoint la room: ${room}`);
  });

  socket.on("disconnect", async () => {
    for (const [userId, socketId] of connectedUsers) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);

        try {
          await axios.post(`${process.env.LARAVEL_API_URL}/api/update-status`, {
            userId,
            status: "offline",
          });
        } catch (error) {
          console.error(
            "Erreur lors de la mise à jour du statut offline:",
            error.message
          );
        }
        break;
      }
    }
    console.log("Utilisateur déconnecté:", socket.id);
  });
});

app.post("/broadcast", (req, res) => {
  const { event, payload, channel } = req.body;
  if (!event || !payload || !channel) {
    return res.status(400).json({ message: "Données manquantes" });
  }

  console.log("Événement reçu de Laravel:", { event, channel });
  io.to(channel).emit(event, payload);
  res.status(200).json({ message: `Événement ${event} diffusé à ${channel}` });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serveur Socket.io démarré sur le port ${PORT}`);
});
