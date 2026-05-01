const fs = require('fs');
const path = require('path');
const db = require('../../config/db');
require('dotenv').config();

async function migrate() {
    try {
        console.log('Starting migrations...');
        
        const migrationPath = path.join(__dirname, '01_init.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        await db.query(sql);
        
        console.log('Migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrate();
