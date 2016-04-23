var mongoose = require('mongoose');

var repoSchema = new mongoose.Schema({
  id: {type: Number, unique: true},
  name: {type: String},
  owner: {type: String},
  full_name: {type: String, unique: true},
  activated: {type: Boolean, default: false},

  github: {
    hook_id: {type: Number, default :false}
  },

  _owner: {type: mongoose.Schema.ObjectId, ref: 'User' },
  created: {type: Date, default: Date.now()},
})

module.exports = mongoose.model('repo', repoSchema)