"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Toaster } from "sonner";
import {
  Heart,
  MessageCircle,
  Send,
  Edit,
  Trash,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { getSocket, listenToPosts } from "@/lib/socket";
import { useAuth } from "@/components/AuthProvider";

interface Comment {
  id: number;
  user_id: string;
  user: { pseudo: string };
  content: string;
  created_at: string;
}

interface ExtendedUser {
  id: string;
  pseudo: string;
  avatar?: string;
  firstname: string;
  friendshipStatus: "none" | "pending_sent" | "pending_received" | "accepted";
  status: "online" | "offline";
}

interface Post {
  id: number;
  user_id: string;
  user: ExtendedUser;
  content: string;
  type: string;
  related_id?: number;
  likes: { user_id: string }[];
  comments: Comment[];
  created_at: string;
}

const URL_IMG_BACKEND =
  process.env.NEXT_PUBLIC_IMG_BACKEND_URL || "http://localhost:8000";

export default function PostsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>(
    {}
  );
  const [editingComment, setEditingComment] = useState<{
    postId: number;
    commentId: number;
    content: string;
  } | null>(null);
  const [expandedComments, setExpandedComments] = useState<{
    [key: number]: boolean;
  }>({});
  const socketRef = useRef<any>(null);

  const fetchPosts = async () => {
    try {
      const res = await api.get("/posts");
      setPosts(res.data);
    } catch (error) {
      toast.error("Erreur", { description: "Impossible de charger les posts" });
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      window.location.href = "/login";
      return;
    }

    if (!user) return;

    fetchPosts();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Erreur d'authentification. Veuillez vous reconnecter.");
      return;
    }

    socketRef.current = getSocket(token, user.id);
    socketRef.current.on("connect", () => {
      console.log("Socket connecté pour les posts:", socketRef.current.id);
      listenToPosts(socketRef.current, (event, data) => {
        console.log(`Événement Socket.IO reçu: ${event}`, data);
        switch (event) {
          case "post.created":
            setPosts((prev) => [data.post, ...prev]);
            toast.info("Nouveau post", {
              description: `${data.post.user.pseudo} a publié !`,
            });
            break;
          case "post.liked":
            setPosts((prev) =>
              prev.map((post) =>
                post.id === data.post_id &&
                !post.likes.some((like) => like.user_id === data.user_id)
                  ? {
                      ...post,
                      likes: [...post.likes, { user_id: data.user_id }],
                    }
                  : post
              )
            );
            break;
          case "post.unliked":
            setPosts((prev) =>
              prev.map((post) =>
                post.id === data.post_id
                  ? {
                      ...post,
                      likes: post.likes.filter(
                        (like) => like.user_id !== data.user_id
                      ),
                    }
                  : post
              )
            );
            break;
          case "post.commented":
            setPosts((prev) =>
              prev.map((post) =>
                post.id === data.post_id &&
                !post.comments.some((c) => c.id === data.comment.id)
                  ? { ...post, comments: [...post.comments, data.comment] }
                  : post
              )
            );
            break;
          case "comment.updated":
            setPosts((prev) =>
              prev.map((post) =>
                post.id === data.comment.post_id
                  ? {
                      ...post,
                      comments: post.comments.map((c) =>
                        c.id === data.comment.id
                          ? { ...c, content: data.comment.content }
                          : c
                      ),
                    }
                  : post
              )
            );
            setEditingComment(null);
            break;
          case "comment.deleted":
            setPosts((prev) =>
              prev.map((post) =>
                post.id === data.post_id
                  ? {
                      ...post,
                      comments: post.comments.filter(
                        (c) => c.id !== data.comment_id
                      ),
                    }
                  : post
              )
            );
            break;
          case "user.status.changed":
            setPosts((prev) =>
              prev.map((post) =>
                post.user.id === data.user_id
                  ? { ...post, user: { ...post.user, status: data.status } }
                  : post
              )
            );
            break;
        }
      });
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Erreur de connexion Socket:", error);
      toast.error("Erreur de connexion", {
        description: "Impossible de se connecter.",
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.disconnect();
      }
    };
  }, [user, isAuthenticated, isLoading]);

  const handleLike = async (postId: number) => {
    try {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId &&
          !post.likes.some((like) => like.user_id === user.id)
            ? { ...post, likes: [...post.likes, { user_id: user.id }] }
            : post
        )
      );
      await api.post(`/posts/${postId}/like`);
      toast.success("Liked", { description: "Post aimé !" });
    } catch (error) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: post.likes.filter((like) => like.user_id !== user.id),
              }
            : post
        )
      );
      toast.error("Erreur", { description: "Erreur lors du like" });
    }
  };

  const handleUnlike = async (postId: number) => {
    try {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: post.likes.filter((like) => like.user_id !== user.id),
              }
            : post
        )
      );
      await api.delete(`/posts/${postId}/unlike`);
      toast.success("Unliked", { description: "Like retiré !" });
    } catch (error) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId &&
          !post.likes.some((like) => like.user_id === user.id)
            ? { ...post, likes: [...post.likes, { user_id: user.id }] }
            : post
        )
      );
      toast.error("Erreur", { description: "Erreur lors du dislike" });
    }
  };

  const handleCommentChange = (postId: number, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const handleCommentSubmit = async (postId: number) => {
    const content = commentInputs[postId]?.trim();
    if (!content) {
      toast.error("Erreur", {
        description: "Le commentaire ne peut pas être vide",
      });
      return;
    }
    try {
      const tempComment = {
        id: Date.now(),
        user_id: user.id,
        user: { pseudo: user.pseudo },
        content,
        created_at: new Date().toISOString(),
      };
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, tempComment] }
            : post
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      const response = await api.post(`/posts/${postId}/comment`, { content });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((c) =>
                  c.id === tempComment.id ? response.data : c
                ),
              }
            : post
        )
      );
      toast.success("Commentaire ajouté", { description: "Publié !" });
    } catch (error) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.filter((c) => c.id !== Date.now()),
              }
            : post
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: content }));
      toast.error("Erreur", { description: "Erreur lors de l'ajout" });
    }
  };

  const handleEditComment = (
    postId: number,
    commentId: number,
    currentContent: string
  ) => {
    setEditingComment({ postId, commentId, content: currentContent });
  };

  const handleUpdateComment = async (postId: number, commentId: number) => {
    const content = editingComment?.content.trim();
    if (!content) {
      toast.error("Erreur", {
        description: "Le commentaire ne peut pas être vide",
      });
      return;
    }
    try {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((c) =>
                  c.id === commentId ? { ...c, content } : c
                ),
              }
            : post
        )
      );
      await api.put(`/posts/${postId}/comment/${commentId}`, { content });
      toast.success("Commentaire modifié", { description: "Mis à jour !" });
    } catch (error) {
      toast.error("Erreur", { description: "Erreur lors de la modification" });
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    try {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.filter((c) => c.id !== commentId),
              }
            : post
        )
      );
      await api.delete(`/posts/${postId}/comment/${commentId}`);
      toast.success("Commentaire supprimé", { description: "Supprimé !" });
    } catch (error) {
      toast.error("Erreur", { description: "Erreur lors de la suppression" });
    }
  };

  const toggleComments = (postId: number) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Chargement...
      </div>
    );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] py-10">
      <Toaster position="top-right" richColors />
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-extrabold text-[hsl(var(--primary))]">
            Flux Social
          </h1>
        </motion.div>
        <div className="space-y-6">
          {posts.length === 0 ? (
            <p className="text-center text-[hsl(var(--muted-foreground))]">
              Aucun post pour le moment.
            </p>
          ) : (
            posts.map((post) => {
              const isLiked = post.likes.some(
                (like) => like.user_id === user.id
              );
              const visibleComments = expandedComments[post.id]
                ? post.comments
                : post.comments.slice(0, 3);
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Link href={`/platform/friends/${post.user_id}`}>
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage
                                src={
                                  post.user.avatar
                                    ? `${URL_IMG_BACKEND}/${post.user.avatar}`
                                    : `https://api.dicebear.com/9.x/initials/svg?seed=${post.user.pseudo}`
                                }
                              />
                              <AvatarFallback>
                                {post.user.pseudo[0]}
                              </AvatarFallback>
                            </Avatar>
                            {post.user.status === "online" && (
                              <span className="absolute top-0 right-0 w-3 h-3 bg-[hsl(var(--primary))] rounded-full border-2 border-[hsl(var(--card))]" />
                            )}
                          </div>
                        </Link>
                        <div>
                          <Link href={`/platform/friends/${post.user_id}`}>
                            <span className="font-semibold text-lg text-[hsl(var(--primary))] hover:underline">
                              {post.user.pseudo}
                            </span>
                          </Link>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {post.user.status === "online"
                              ? "En ligne"
                              : "Hors ligne"}
                            {post.user.friendshipStatus === "accepted" &&
                              " • Ami"}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            {new Date(post.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-[hsl(var(--foreground))] mb-6">
                        {post.content}
                      </p>
                      <div className="flex items-center space-x-6 mb-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            isLiked
                              ? handleUnlike(post.id)
                              : handleLike(post.id)
                          }
                          className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))] transition-all"
                        >
                          <motion.div
                            whileTap={{ scale: 1.2 }}
                            className="flex items-center space-x-2"
                          >
                            <Heart
                              className={`h-5 w-5 ${
                                isLiked
                                  ? "text-[hsl(var(--primary))] fill-[hsl(var(--primary))]"
                                  : ""
                              }`}
                            />
                            <span>{post.likes.length}</span>
                          </motion.div>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))] transition-all"
                        >
                          <motion.div
                            whileTap={{ scale: 1.2 }}
                            className="flex items-center space-x-2"
                          >
                            <MessageCircle className="h-5 w-5" />
                            <span>{post.comments.length}</span>
                          </motion.div>
                        </Button>
                      </div>
                      {/* Commentaires */}
                      <div className="space-y-3 mb-6">
                        <AnimatePresence>
                          {visibleComments.map((comment) => (
                            <motion.div
                              key={comment.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center justify-between bg-[hsl(var(--muted))] p-3 rounded-lg"
                            >
                              {editingComment?.commentId === comment.id ? (
                                <div className="flex items-center space-x-2 w-full">
                                  <Input
                                    value={editingComment.content}
                                    onChange={(e) =>
                                      setEditingComment({
                                        ...editingComment,
                                        content: e.target.value,
                                      })
                                    }
                                    className="flex-1 bg-[hsl(var(--input))] border-none text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]"
                                  />
                                  <Button
                                    onClick={() =>
                                      handleUpdateComment(post.id, comment.id)
                                    }
                                    size="sm"
                                    className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary), 0.8))]"
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <Link
                                      href={`/platform/friends/${comment.user_id}`}
                                    >
                                      <span className="font-medium text-[hsl(var(--primary))] hover:underline">
                                        {comment.user.pseudo}:
                                      </span>
                                    </Link>
                                    <span className="text-[hsl(var(--foreground))]">
                                      {comment.content}
                                    </span>
                                  </div>
                                  {comment.user_id === user.id && (
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleEditComment(
                                            post.id,
                                            comment.id,
                                            comment.content
                                          )
                                        }
                                        className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteComment(
                                            post.id,
                                            comment.id
                                          )
                                        }
                                        className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {post.comments.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComments(post.id)}
                            className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary), 0.8))] flex items-center space-x-1 mx-auto mt-2"
                          >
                            <span>
                              {expandedComments[post.id]
                                ? "Voir moins"
                                : "Voir plus"}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedComments[post.id] ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        )}
                      </div>
                      {/* Ajout de commentaire */}
                      <div className="flex items-center space-x-2">
                        <Input
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            handleCommentChange(post.id, e.target.value)
                          }
                          placeholder="Ton commentaire..."
                          className="flex-1 bg-[hsl(var(--input))] border-none text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))]"
                        />
                        <Button
                          onClick={() => handleCommentSubmit(post.id)}
                          size="sm"
                          className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary), 0.8))] transition-all"
                        >
                          <motion.div
                            whileTap={{ scale: 1.1 }}
                            className="flex items-center space-x-1"
                          >
                            <Send className="h-4 w-4" />
                            <span>Envoyer</span>
                          </motion.div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
