const express = require('express');
    const jwt = require('jsonwebtoken');
    const Notification = require('../models/notification');

    const router = express.Router();
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Replace with your secret in .env

    // Authentication Middleware
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      try {
        const user = jwt.verify(token, JWT_SECRET);
        req.user = user;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Token expired or invalid' });
      }
    };

    // Admin Middleware
    const isAdmin = (req, res, next) => {
      if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Access restricted: Admins only' });
      }
      next();
    };

    // Notification Routes
    router.get('/notifications', authenticateToken, isAdmin, async (req, res) => {
      try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.json(notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.post('/notifications', authenticateToken, isAdmin, async (req, res) => {
      try {
        const { type, title, message, time } = req.body;
        const notification = new Notification({
          type,
          title,
          message,
          time,
          read: false,
        });
        await notification.save();
        res.status(201).json(notification);
      } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.patch('/notifications/:id/read', authenticateToken, isAdmin, async (req, res) => {
      try {
        const notification = await Notification.findByIdAndUpdate(
          req.params.id,
          { read: true },
          { new: true }
        );
        if (!notification) {
          return res.status(404).json({ error: 'Notification not found' });
        }
        res.json(notification);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.patch('/notifications/read-all', authenticateToken, isAdmin, async (req, res) => {
      try {
        await Notification.updateMany({ read: false }, { read: true });
        res.json({ message: 'All notifications marked as read' });
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.delete('/notifications/:id', authenticateToken, isAdmin, async (req, res) => {
      try {
        const notification = await Notification.findByIdAndDelete(req.params.id);
        if (!notification) {
          return res.status(404).json({ error: 'Notification not found' });
        }
        res.json({ message: 'Notification deleted' });
      } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.delete('/notifications', authenticateToken, isAdmin, async (req, res) => {
      try {
        await Notification.deleteMany({});
        res.json({ message: 'All notifications deleted' });
      } catch (error) {
        console.error('Error deleting all notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    module.exports = router;