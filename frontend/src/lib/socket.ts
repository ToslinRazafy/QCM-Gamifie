import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const getSocket = (token: string, userId?: string): Socket => {
  if (!socketInstance || !socketInstance.connected) {
    if (socketInstance) socketInstance.disconnect();

    socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_IO_URL || "http://localhost:3001",
      {
        auth: { token, userId }, // Ajout de userId dans auth pour faciliter l'identification
        query: userId ? { userId } : {},
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 500,
        reconnectionDelayMax: 2000,
        timeout: 10000,
      }
    );

    socketInstance.on("connect", () => {
      console.log("Connecté à Socket.io:", socketInstance?.id);
      if (userId) {
        socketInstance.emit("register", { userId });
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Erreur de connexion Socket.io:", error.message);
    });

    socketInstance.on("error", (data) => {
      console.error("Erreur Socket.io:", data);
    });
  }
  return socketInstance;
};

export const registerUser = (
  socket: Socket,
  userId: string,
  context: "challenges" | "friends" | "posts" = "challenges"
): void => {
  const privateUserRoom = `private-user-${userId}`;
  const contextRooms = {
    challenges: [`private-challenges.user.${userId}`],
    friends: [`private-friends.${userId}`],
    posts: ["posts"],
  };

  if (socket.connected) {
    socket.emit("register", { userId });
    const rooms = [privateUserRoom, ...contextRooms[context]];
    rooms.forEach((room) => {
      socket.emit("join", { room });
      console.log(`Joined room: ${room}`);
    });
  } else {
    socket.on("connect", () => {
      socket.emit("register", { userId });
      const rooms = [privateUserRoom, ...contextRooms[context]];
      rooms.forEach((room) => {
        socket.emit("join", { room });
        console.log(`Joined room on connect: ${room}`);
      });
    });
  }
};

export const listenToChallenge = (
  socket: Socket,
  challengeId: string,
  userId: string,
  callback: (event: string, data: any) => void
): void => {
  const challengeRoom = `private-challenges.${challengeId}`;
  socket.emit("join", { room: challengeRoom });
  console.log(`Joined challenge room: ${challengeRoom}`);

  socket.on("challenge.created", (data) => {
    console.log("Défi créé:", data);
    callback("challenge.created", data);
  });
  socket.on("challenge.accepted", (data) => {
    console.log("Défi accepté:", data);
    callback("challenge.accepted", data);
  });
  socket.on("challenge.started", (data) => {
    console.log("Défi démarré:", data);
    if (
      data.challenge.player1.id === userId ||
      data.challenge.player2_id === userId
    ) {
      console.log(`Redirection vers /platform/challenges/${challengeId}/play`);
      window.location.href = `/platform/challenges/${challengeId}/play`;
    }
    callback("challenge.started", data);
  });
  socket.on("challenge.declined", (data) => {
    console.log("Défi refusé:", data);
    callback("challenge.declined", data);
  });
  socket.on("challenge.cancelled", (data) => {
    console.log("Défi annulé:", data);
    callback("challenge.cancelled", data);
  });
  socket.on("question.answered", (data) => {
    console.log("Question répondue:", data);
    callback("question.answered", data);
  });
  socket.on("next.question", (data) => {
    console.log("Prochaine question:", data);
    callback("next.question", data);
  });
  socket.on("challenge.abandoned", (data) => {
    console.log("Défi abandonné:", data);
    callback("challenge.abandoned", data);
  });
  socket.on("challenge.completed", (data) => {
    console.log("Défi terminé:", data);
    callback("challenge.completed", data);
  });
};

export const listenToPosts = (
  socket: Socket,
  callback: (event: string, data: any) => void
): void => {
  const postsRoom = "posts";
  socket.emit("join", { room: postsRoom });
  console.log(`Joined posts room: ${postsRoom}`);

  socket.on("post.created", (data) => {
    console.log("Nouveau post créé:", data);
    callback("post.created", data);
  });
  socket.on("post.liked", (data) => {
    console.log("Post aimé:", data);
    callback("post.liked", data);
  });
  socket.on("post.unliked", (data) => {
    console.log("Post déliké:", data);
    callback("post.unliked", data);
  });
  socket.on("post.commented", (data) => {
    console.log("Nouveau commentaire:", data);
    callback("post.commented", data);
  });
  socket.on("comment.updated", (data) => {
    console.log("Commentaire modifié:", data);
    callback("comment.updated", data);
  });
  socket.on("comment.deleted", (data) => {
    console.log("Commentaire supprimé:", data);
    callback("comment.deleted", data);
  });
};

export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
