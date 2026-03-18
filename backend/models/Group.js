const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  avatar: {
    type: String,
    default: null
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    }
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  inviteLink: {
    type: String,
    default: null
  },
  settings: {
    onlyAdminsCanPost: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanAddMembers: {
      type: Boolean,
      default: false
    }
  },
  lastMessage: {
    content: {
      type: String,
      default: null
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    timestamp: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Get public info method
groupSchema.methods.getPublicInfo = function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    avatar: this.avatar,
    creator: this.creator,
    memberCount: this.members.length,
    isPrivate: this.isPrivate,
    lastMessage: this.lastMessage,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Group', groupSchema);
