const crypto = require('crypto');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        res.status(401);
        throw new Error('Định dạng Token không hợp lệ');
      }

      const [header, payload, signature] = parts;
      const secret = process.env.JWT_SECRET || 'english-learning-app-secret-key-2026';
      
      // Calculate signature to verify
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        res.status(401);
        throw new Error('Chữ ký Token không hợp lệ');
      }

      // Parse payload
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      
      // Check expiration
      if (decoded.exp < Math.floor(Date.now() / 1000)) {
        res.status(401);
        throw new Error('Token đăng nhập đã hết hạn');
      }

      // Attach user to request
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('Không tìm thấy tài khoản người dùng tương ứng với Token');
      }

      next();
    } catch (error) {
      res.status(401);
      next(error.message ? error : new Error('Không được phân quyền truy cập, token không hợp lệ'));
    }
  } else {
    res.status(401);
    next(new Error('Không được phân quyền truy cập, thiếu token đăng nhập'));
  }
};

module.exports = { protect };
