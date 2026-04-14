import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
    lastAction: { type: String, default: "Yaratildi" } // Recent logs uchun
}, { timestamps: true });

export default mongoose.model('Note', noteSchema);
