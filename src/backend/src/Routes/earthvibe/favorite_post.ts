import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../Models/User';
import Logger from '../../Utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export default {
  name: 'Favorite Post',
  path: '/earthvibe/post/favorite',
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

      // Verificar si ya está en favoritos
      const favoriteIndex = post.favorites.findIndex(
        (id: any) => id.toString() === userId
      );
      let action: 'favorited' | 'unfavorited';

      if (favoriteIndex > -1) {
        // Ya existe en favoritos, removerlo
        post.favorites.splice(favoriteIndex, 1);
        action = 'unfavorited';
      } else {
        // No existe en favoritos, agregarlo
        post.favorites.push(userId as any);
        action = 'favorited';
      }

      await userWithPost.save();

      return res.status(200).json({
        status: true,
        msg: action === 'favorited' ? 'Agregado a favoritos' : 'Removido de favoritos',
        data: {
          action,
          favoritesCount: post.favorites.length,
        },
      });
    } catch (error) {
      Logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error en favorite_post:');
      return res.status(500).json({
        status: false,
        msg: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
};
