const mongoose = require('mongoose');

const stickerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  url: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pack: {
    type: String,
    default: 'default'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isAnimated: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for searching
stickerSchema.index({ name: 'text', tags: 'text' });

module.exports = mongoose.model('Sticker', stickerSchema);
