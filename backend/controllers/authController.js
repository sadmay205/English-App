const crypto = require('crypto');
const User = require('../models/User');

// Helper to hash password using SHA256
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Helper to generate a lightweight manual JWT token
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'english-learning-app-secret-key-2026';
  
  // Header: HS256 algorithm
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  // Payload: Expires in 30 days
  const payload = Buffer.from(JSON.stringify({
    id: userId,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
  })).toString('base64url');
  
  // Signature
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
    
  return `${header}.${payload}.${signature}`;
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error('Vui lòng điền đầy đủ thông tin đăng ký');
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      res.status(400);
      throw new Error('Tên đăng nhập hoặc email đã tồn tại');
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 */
const loginUser = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400);
      throw new Error('Vui lòng điền tên đăng nhập/email và mật khẩu');
    }

    // Hash the input password to match database format
    const hashedPassword = hashPassword(password);

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    });

    if (user && user.password === hashedPassword) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401);
      throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser
};
