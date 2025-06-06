const pool = require('../database/db'); // Import the database connection pool
const bcrypt = require('bcryptjs'); // Use bcryptjs for consistency

const User = {
  // Find user by ID
  findById: async (id) => {
    const [rows] = await pool.query('SELECT id, username, email FROM users WHERE id = ?', [id]);
    return rows[0]; // Return the first user found
  },


  verifyPassword: async (id, password) => {
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [id]);
    if (!rows[0]) return false;
    return await bcrypt.compare(password, rows[0].password);
  },



  // Create a new user
  create: async ({ username, email, password }) => {
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user into the database
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())",
      [username, email, hashedPassword]
    );

    // Return the newly created user
    return {
      id: result.insertId,
      username,
      email,
    };
  },

  // Update user info
update: async (id, { username, email, password, oldPassword }) => {
  // If changing password, verify old password first
  if (password && oldPassword) {
    const isValidPassword = await User.verifyPassword(id, oldPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }
  }
  
  const params = [username, email, id];
  let query = 'UPDATE users SET username = ?, email = ? WHERE id = ?';
  
  if (password) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    query = 'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?';
    params.splice(2, 0, hashedPassword);
  }
  
  await pool.query(query, params);
  return User.findById(id);
  },
};

module.exports = User;