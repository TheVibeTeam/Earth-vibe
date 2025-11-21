import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../Models/User';
import Logger from '../../Utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
  name: 'Add Comment',
  path: '/earthvibe/post/comment',
  method: 'post',
  category: 'earthvibe',
  example: {},
  parameter: ['postId', 'content'],
  premium: false,
  error: false,
  logger: true,
  requires: (req: Request, res: Response, next: Function) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        status: false, 
        msg: 'Token no proporcionado' 
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ 
        status: false, 
        msg: 'Token inválido o expirado' 
      });
    }
  },
  execution: async (req: Request, res: Response) => {
    try {
      const { postId, content } = req.body;
      const userId = (req as any).user.userId;

      if (!postId || !content) {
        return res.status(400).json({
          status: false,
          msg: 'postId y content son requeridos',
        });
      }

      if (content.trim().length === 0) {
        return res.status(400).json({
          status: false,
          msg: 'El comentario no puede estar vacío',
        });
      }

        // Buscar el usuario que hace el comentario
        const commentUser = await User.findById(userId).select('username name profilePicture verified');

      if (!commentUser) {
        return res.status(404).json({
          status: false,
          msg: 'Usuario no encontrado',
        });
      }

      // Buscar el usuario que tiene la publicación
      const userWithPost = await User.findOne({ 'posts._id': postId });

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

        // Agregar el comentario
        const newComment = {
          userId: userId as any,
          username: commentUser.username,
          name: commentUser.name,
          profilePicture: commentUser.profilePicture,
          verified: commentUser.verified,
          content: content.trim(),
          createdAt: new Date(),
        };

      post.comments.push(newComment);
      await userWithPost.save();

      return res.status(201).json({
        status: true,
        msg: 'Comentario agregado',
        data: {
          comment: newComment,
          commentsCount: post.comments.length,
        },
      });
    } catch (error) {
      Logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error en add_comment:');
      return res.status(500).json({
        status: false,
        msg: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};