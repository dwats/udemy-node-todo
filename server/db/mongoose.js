const mongoose = require('mongoose');

const db = process.env.MONGODB_URI;

mongoose.Promise = global.Promise;
mongoose.connect(db, { useMongoClient: true });

module.exports = { mongoose };
