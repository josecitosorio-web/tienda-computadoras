const mongoose = require('mongoose');

// Verifica que un valor sea un ObjectId válido de MongoDB.
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
}

module.exports = { isValidObjectId };
