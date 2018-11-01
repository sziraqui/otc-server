const crypto = require("crypto");

function getHash(message, algo) {
  const hash = crypto
    .createHash(algo)
    .update(message, "utf16")
    .digest("hex");
  return hash;
}

function getRand(lenBytes) {
  var buffer = Buffer.alloc(lenBytes);
  crypto.randomFillSync(buffer);
  return buffer.toString("hex");
}
function encrypt(text, key) {
  const crypto = require("crypto");
  const cipher = crypto.createCipher("aes192", key);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  console.log(encrypted);
  return encrypted;
}

function decrypt(text, key) {
  const crypto = require("crypto");
  const decipher = crypto.createDecipher("aes192", key);

  let decrypted = decipher.update(text, "hex", "utf8");
  decrypted += decipher.final("utf8");
  console.log(decrypted);
  return decrypted;
}

exports.getHash = getHash;
exports.getRand = getRand;
exports.decrypt = decrypt;
exports.encrypt = encrypt;
