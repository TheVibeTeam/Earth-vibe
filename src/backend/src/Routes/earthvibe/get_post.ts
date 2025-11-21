import type { Request, Response } from 'express';
import User from '../../Models/User';
import Logger from '../../Utils/logger';

export default {
  name: 'Get Post',
  path: '/earthvibe/post/:postId',
  method: 'get',
  category: 'earthvibe',
  example: {},
  parameter: [],
  premium: false,
  error: false,
  logger: true,
  requires: null,
  execution: async (req: Request, res: Response) => {
    try {
      const { postId } = req.params;

      if (!postId) {
        return res.status(400).json({
          status: false,
          msg: 'postId es requerido',
        });
      }

      // Buscar el usuario que tiene la publicación
      const userWithPost = await User.findOne({ 'posts._id': postId })
        .select('username name university profilePicture verified posts');

      if (!userWithPost) {
        return res.status(404).json({
          status: false,
          msg: 'Publicación no encontrada',
        });
      }

      // Encontrar el post específico
      const post = (userWithPost.posts as any[]).find(
        (p: any) => p._id.toString() === postId
      );

      if (!post) {
        return res.status(404).json({
          status: false,
          msg: 'Publicación no encontrada',
        });
      }

      // Poblar información de los comentarios con datos de usuario
      const populatedComments = await Promise.all(
        post.comments.map(async (comment: any) => {
          const commentUser = await User.findById(comment.userId)
            .select('username name profilePicture verified');
          
          return {
            id: comment._id,
            userId: comment.userId,
            username: commentUser?.username || comment.username,
            name: commentUser?.name || 'Usuario',
            profilePicture: commentUser?.profilePicture,
            verified: commentUser?.verified || false,
            content: comment.content,
            createdAt: comment.createdAt,
          };
        })
      );

      // Construir la respuesta
      const response = {
        id: post._id,
        content: post.content,
        imageUrl: post.imageUrl,
        likes: post.likes,
        favorites: post.favorites,
        createdAt: post.createdAt,
        author: {
          id: userWithPost._id,
          username: userWithPost.username,
          name: userWithPost.name,
          university: userWithPost.university,
          profilePicture: userWithPost.profilePicture,
          verified: userWithPost.verified,
        },
        comments: populatedComments,
        commentsCount: populatedComments.length,
      };

      return res.status(200).json({
        status: true,
        data: response,
      });
    } catch (error) {
      Logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error en get_post:');
      return res.status(500).json({
        status: false,
        msg: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};
