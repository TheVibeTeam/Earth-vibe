import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../Models/User';
import Logger from '../../Utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
  name: 'Like Post',
  path: '/earthvibe/post/like',
  method: 'post',
  category: 'earthvibe',
  example: {},
  parameter: ['postId'],
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
      const { postId } = req.body;
      const userId = (req as any).user.userId;

      if (!postId) {
        return res.status(400).json({
          status: false,
          msg: 'postId es requerido',
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

      // Verificar si ya dio like
      const likeIndex = post.likes.findIndex(
        (id: any) => id.toString() === userId
      );
      let action: 'liked' | 'unliked';

      if (likeIndex > -1) {
        // Ya existe el like, removerlo
        post.likes.splice(likeIndex, 1);
        action = 'unliked';
      } else {
        // No existe el like, agregarlo
        post.likes.push(userId as any);
        action = 'liked';
      }

      await userWithPost.save();

      return res.status(200).json({
        status: true,
        msg: action === 'liked' ? 'Like agregado' : 'Like removido',
        data: {
          action,
          likesCount: post.likes.length,
        },
      });
    } catch (error) {
      Logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error en like_post:');
      return res.status(500).json({
        status: false,
        msg: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};
