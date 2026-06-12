const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'english-learning-app-secret-key-2026';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token using jsonwebtoken — handles signature + expiration automatically
      const decoded = jwt.verify(token, JWT_SECRET);

      // Attach user to request (exclude password field)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Không tìm thấy tài khoản người dùng tương ứng với Token');
      }

      next();
    } catch (error) {
      res.status(401);
      // Map jsonwebtoken error types to Vietnamese messages
      const message =
        error.name === 'TokenExpiredError'
          ? 'Token đăng nhập đã hết hạn'
          : error.name === 'JsonWebTokenError'
          ? 'Token không hợp lệ'
          : error.message || 'Không được phân quyền truy cập, token không hợp lệ';
      next(new Error(message));
    }
  } else {
    res.status(401);
    next(new Error('Không được phân quyền truy cập, thiếu token đăng nhập'));
  }
};

module.exports = { protect };
