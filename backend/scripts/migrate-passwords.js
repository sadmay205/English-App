/**
 * Migration Script: SHA-256 passwords → bcrypt
 * 
 * Dùng khi: Đã có users trong DB lưu mật khẩu dạng SHA-256 cũ.
 * Script này KHÔNG thể tự động chuyển đổi (vì SHA-256 là one-way hash).
 * 
 * Giải pháp: Reset tất cả passwords về một giá trị mặc định.
 * Sau đó yêu cầu users đổi mật khẩu lần đầu đăng nhập.
 * 
 * Cách chạy: node scripts/migrate-passwords.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  const dbUri = process.env.MONGO_URI || process.env.DATABASE_API_KEY;
  await mongoose.connect(dbUri);
  console.log('✅ Connected to MongoDB');
};

const migratePasswords = async () => {
  await connectDB();

  const User = require('../models/User');

  // Find all users (we check if password looks like SHA-256: 64 hex chars)
  const sha256Pattern = /^[a-f0-9]{64}$/;
  const users = await User.find({});
  
  let migrated = 0;
  const DEFAULT_TEMP_PASSWORD = 'ChangeMe123!';
  const hashedDefault = await bcrypt.hash(DEFAULT_TEMP_PASSWORD, 12);

  for (const user of users) {
    if (sha256Pattern.test(user.password)) {
      // Reset to temp password — user must change on next login
      user.password = hashedDefault;
      await user.save();
      console.log(`🔄 Migrated: ${user.username} (${user.email})`);
      migrated++;
    } else {
      console.log(`⏭️  Skipped (already bcrypt): ${user.username}`);
    }
  }

  console.log(`\n✅ Migration complete. ${migrated} account(s) reset to temp password: "${DEFAULT_TEMP_PASSWORD}"`);
  console.log('⚠️  Please notify users to change their password on next login!');
  
  await mongoose.disconnect();
  process.exit(0);
};

migratePasswords().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
