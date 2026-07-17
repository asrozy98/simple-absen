const bcrypt = require("bcryptjs");

const password = process.argv[2];

if (!password) {
  console.log("Cara pakai: node scripts/hash-password.js <password>");
  console.log("Contoh: node scripts/hash-password.js admin123");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("Password:", password);
console.log("Hash:   ", hash);
