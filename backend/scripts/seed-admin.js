import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        const adminUserId = process.env.ADMIN_USER_ID || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Glassbox2026!';
        
        const existingAdmin = await User.findOne({ userId: adminUserId });
        if (existingAdmin) {
            console.log(`Admin user "${adminUserId}" already exists. Skipping seed.`);
            process.exit(0);
        }

        const admin = new User({
            userId: adminUserId,
            name: 'System Administrator',
            email: 'admin@glassbox.forensics',
            password: adminPassword,
            role: 'admin',
            isActive: true,
            createdBy: 'system'
        });

        await admin.save();
        console.log(`Successfully seeded admin user: ${adminUserId}`);
        console.log('Password set from .env or default: ' + adminPassword);
        
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedAdmin();
