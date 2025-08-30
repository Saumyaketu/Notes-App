import mongoose from 'mongoose';

const { Schema } = mongoose;

const VersionSchema = new Schema({
  title: String,
  content: String,
  savedAt: { type: Date, default: Date.now },
  savedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const NoteSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' }, // markdown
  isPublic: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false }, // Added for new feature
  isArchived: { type: Boolean, default: false }, // Added for new feature
  shareId: { type: String, index: true, sparse: true },
  collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  versions: [VersionSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Text index for search
NoteSchema.index({ title: 'text', content: 'text' });

// Pre-save timestamp
NoteSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

NoteSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    title: this.title,
    content: this.content,
    isPublic: this.isPublic,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export default mongoose.model('Note', NoteSchema);
