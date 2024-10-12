// helper/authHelper.js
const crypto = require("crypto");

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex"); // Generate a random salt
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) return reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
};

const comparePassword = (password, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const [salt, key] = hashedPassword.split(":");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) return reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
};

module.exports = { hashPassword, comparePassword };
