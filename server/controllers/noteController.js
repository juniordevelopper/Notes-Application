import Note from '../models/Note.js';

// 1. GET ALL & COUNTS (Barcha eslatmalar va hisoblagichlar)
export const getNotes = async (req, res) => {
    try {
        // Oxirgi o'zgarish vaqti bo'yicha saralaymiz (Recent logs uchun ham kerak)
        const notes = await Note.find().sort({ updatedAt: -1 });

        // Sidebar hisoblagichlarini bazadagi real holatga qarab hisoblaymiz
        const counts = {
            home: notes.filter(n => !n.isArchived && !n.isTrashed).length,
            archive: notes.filter(n => n.isArchived && !n.isTrashed).length,
            trash: notes.filter(n => n.isTrashed).length,
            reminders: notes.filter(n => n.isPinned).length // Pinned bo'lganlar xotira kabi
        };

        res.status(200).json({ counts, notes });
    } catch (err) {
        res.status(500).json({ message: "Xatolik!", error: err.message });
    }
};

// 2. CREATE NOTE (Yangi eslatma - Autosave boshlanishi uchun)
export const createNote = async (req, res) => {
    try {
        // Front-endda "New Note" bosilganda orqa fonda bo'sh model yaratiladi
        const newNote = new Note(req.body);
        await newNote.save();
        res.status(201).json(newNote);
    } catch (err) {
        res.status(400).json({ message: "Yaratishda xato!", error: err.message });
    }
};

// 3. UPDATE NOTE (Universal Patch - Autosave va holat o'zgartirish)
export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Bu funksiya orqali ham matn yangilanadi (autosave), ham Pin/Archive/Trash amallari bajariladi
        // lastAction maydoni front-enddan keladi (masalan: "Arxivlandi")
        const updatedNote = await Note.findByIdAndUpdate(
            id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!updatedNote) return res.status(404).json({ message: "Topilmadi!" });

        res.status(200).json(updatedNote);
    } catch (err) {
        res.status(400).json({ message: "Yangilashda xato!", error: err.message });
    }
};

// 4. PERMANENT DELETE (Bazadan butunlay o'chirish)
export const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        await Note.findByIdAndDelete(id);
        res.status(200).json({ message: "Eslatma butunlay o'chirildi" });
    } catch (err) {
        res.status(400).json({ message: "O'chirishda xato!", error: err.message });
    }
};
