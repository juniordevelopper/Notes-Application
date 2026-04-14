import express from 'express';
import Note from '../models/Note.js';

const router = express.Router();

// 1. GET ALL & COUNTS
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find().sort({ updatedAt: -1 });
        const counts = {
            home: notes.filter(n => !n.isArchived && !n.isTrashed).length,
            archive: notes.filter(n => n.isArchived && !n.isTrashed).length,
            trash: notes.filter(n => n.isTrashed).length,
            reminders: notes.filter(n => n.isPinned).length // Demo mantiq
        };
        res.json({ notes, counts });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. CREATE (Autosave boshlanishi uchun bo'sh note)
router.post('/', async (req, res) => {
    try {
        const newNote = new Note(req.body);
        await newNote.save();
        res.status(201).json(newNote);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// 3. UPDATE (Universal Patch + lastAction)
router.patch('/:id', async (req, res) => {
    try {
        const updated = await Note.findByIdAndUpdate(req.params.id, 
            { ...req.body }, { new: true });
        res.json(updated);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// 4. PERMANENT DELETE
router.delete('/:id', async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

export default router;
