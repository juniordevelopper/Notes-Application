import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import noteRoutes from './routes/noteRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/luminous_v2')
    .then(() => console.log('✅ Luminous V2 DB Connected'))
    .catch(err => console.log('❌ DB Error:', err));

app.use('/api/v1/notes', noteRoutes);

app.listen(5000, () => console.log('🚀 Server running on port 5000'));
