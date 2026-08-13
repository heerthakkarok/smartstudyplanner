const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'smart_study_planner_super_secret_jwt_key_2026',
    {
      expiresIn: '30d',
    }
  );
};

module.exports = generateToken;
