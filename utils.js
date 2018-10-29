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

exports.getHash = getHash;
exports.getRand = getRand;
