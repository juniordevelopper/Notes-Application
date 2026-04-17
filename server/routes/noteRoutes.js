import express from 'express';
import Note from '../models/Note.js';

const router = express.Router();
router.use((req, res, next) => {
    const time = new Date().toLocaleTimeString();
    next();
});

router.get('/', async (req, res) => {
    try {
        const notes = await Note.find().sort({ updatedAt: -1 });
        const counts = {
            home: notes.filter(n => !n.isArchived && !n.isTrashed).length,
            archive: notes.filter(n => n.isArchived && !n.isTrashed).length,
            trash: notes.filter(n => n.isTrashed).length,
            reminders: notes.filter(n => n.isPinned).length 
        };
        return res.status(200).json({notes: notes, counts: counts});
    } catch (err) {
        console.error("GET_NOTES_ERROR:", err.message);
        return res.status(500).json({ error: "Ma'lumot olishda server xatosi yuz berdi." });
    }
});

router.post('/', async (req, res) => {
    try {
        const { title, content, lastAction } = req.body;
        const newNote = new Note({title: title || "", content: content || "", lastAction: lastAction || "Yaratildi", isPinned: false, isArchived: false, isTrashed: false});
        const savedNote = await newNote.save();
        return res.status(201).json(savedNote);
    } catch (err) {
        return res.status(400).json({ error: "Eslatmani saqlashda xatolik yuz berdi." });
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: "Noto'g'ri ID formati" });
        }
        const updatedNote = await Note.findByIdAndUpdate(
            id, 
            { ...updates, updatedAt: Date.now() }, 
            { new: true, runValidators: true }
        );
        if (!updatedNote) {
            return res.status(404).json({ error: "Eslatma topilmadi" });
        }
        const action = updates.lastAction || "Tahrirlandi";
        return res.status(200).json(updatedNote);
    } catch (err) {
        return res.status(400).json({ error: "Yangilashda xatolik yuz berdi." });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: "Noto'g'ri ID formati" });
        }
        const result = await Note.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: "O'chirish uchun eslatma topilmadi." });
        }
        return res.status(200).json({ message: "Deleted", deletedId: id });
    } catch (err) {
        return res.status(400).json({ error: "O'chirishda xatolik yuz berdi." });
    }
});

export default router;
