import Note from '../models/Note.js';
import generateShareId from '../utils/generateShareId.js';
import sanitizeHtml from 'sanitize-html';
import { APP_ORIGIN } from '../config/env.js';

// Helper: check access
function canAccess(note, userId) {
  if (!note) return false;
  if (note.isPublic) return true;
  if (note.owner && note.owner.toString() === userId.toString()) return true;
  if (note.collaborators && note.collaborators.some(c => c.toString() === userId.toString())) return false; // Fix: was `true`
  return false;
}

// GET /api/notes?q=...
export async function listNotes(req, res) {
  const userId = req.user.userId;
  const q = (req.query.q || '').trim();
  const filter = req.query.filter || 'all'; // new filter parameter

  try {
    let query = { owner: userId };
    
    // Apply filters from the new sidebar
    if (filter === 'starred') {
        query.isStarred = true;
        query.isArchived = false;
    } else if (filter === 'archived') {
        query.isArchived = true;
    } else { // default is 'all'
        query.isArchived = false;
    }

    if (q) {
      query.$text = { $search: q };
      const results = await Note.find(
        query,
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(100);
      return res.json({ notes: results });
    } else {
      const notes = await Note.find(query).sort({ updatedAt: -1 }).limit(500);
      return res.json({ notes });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/notes
export async function createNote(req, res) {
  try {
    console.log('Incoming POST request to create note.');
    console.log('Request Body:', req.body);
    const userId = req.user.userId;
    const { title = '', content = '' } = req.body || {};
    const note = new Note({ owner: userId, title, content });
    await note.save();
    console.log('Note successfully created:', note);
    return res.json(note);
  } catch (err) {
    console.error('Error creating note:', err);
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/notes/:id
export async function getNote(req, res) {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (!canAccess(note, userId)) return res.status(403).json({ error: 'Forbidden' });

    return res.json(note);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// PUT /api/notes/:id
export async function updateNote(req, res) {
  try {
    console.log('Incoming PUT request to update note.');
    console.log('Note ID:', req.params.id);
    console.log('Request Body:', req.body);
    
    const userId = req.user.userId;
    const id = req.params.id;
    const patch = req.body || {};

    const note = await Note.findById(id);
    console.log('Note found for update:', note);

    if (!note) return res.status(404).json({ error: 'Note not found' });

    // Check ownership or collaboration
    if (note.owner.toString() !== userId.toString() && !(note.collaborators || []).some(c => c.toString() === userId.toString())) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Save version snapshot before update
    const versions = note.versions || [];
    versions.push({
      title: note.title,
      content: note.content,
      savedAt: new Date(),
      savedBy: userId
    });
    // Keep only the last 50 versions
    const latestVersions = versions.slice(-50);

    const updateDoc = {
      $set: {
        title: patch.title,
        content: patch.content
      },
      $push: {
        versions: {
          $each: [{
            title: note.title,
            content: note.content,
            savedAt: new Date(),
            savedBy: userId
          }],
          $slice: -50
        }
      },
      $inc: { __v: 1 } // Manually increment the version key
    };

    if (typeof patch.isPublic !== 'undefined') {
      updateDoc.$set.isPublic = !!patch.isPublic;
      if (updateDoc.$set.isPublic && !note.shareId) {
        updateDoc.$set.shareId = generateShareId();
      }
    }
    
    // New logic for starring and archiving
    if (typeof patch.isStarred !== 'undefined') {
        updateDoc.$set.isStarred = !!patch.isStarred;
    }
    if (typeof patch.isArchived !== 'undefined') {
        updateDoc.$set.isArchived = !!patch.isArchived;
    }


    const updatedNote = await Note.findByIdAndUpdate(
      id,
      updateDoc,
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
        return res.status(404).json({ error: 'Note not found' });
    }
    
    console.log('Note successfully updated:', updatedNote);
    return res.json({ _id: updatedNote._id, shareId: updatedNote.shareId });
  } catch (err) {
    console.error('Error in updateNote:', err);
    return res.status(500).json({ error: err.message });
  }
}

// DELETE /api/notes/:id
export async function deleteNote(req, res) {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.owner.toString() !== userId.toString()) return res.status(403).json({ error: 'Forbidden' });

    await Note.deleteOne({ _id: id });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/notes/:id/share
export async function createShare(req, res) {
  try {
    const userId = req.user.userId;
    const id = req.params.id;
    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    if (note.owner.toString() !== userId.toString()) return res.status(403).json({ error: 'Forbidden' });

    note.isPublic = true;
    if (!note.shareId) note.shareId = generateShareId();
    await note.save();
    const shareUrl = `${APP_ORIGIN}/s/${note.shareId}`;
    return res.json({ shareUrl, shareId: note.shareId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /api/notes/public/:shareId
export async function getPublicByShareId(req, res) {
  try {
    const shareId = req.params.shareId;
    const note = await Note.findOne({ shareId, isPublic: true });
    if (!note) return res.status(404).json({ error: 'Not found' });

    const safe = {
      _id: note._id,
      title: note.title,
      content: note.content,
      isPublic: note.isPublic,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };

    // Optionally sanitize content before returning (server-side safety)
    safe.content = sanitizeHtml(safe.content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'h1', 'h2' ]),
      allowedAttributes: false
    });

    return res.json(safe);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
