const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dmic_school.db');
const db = new sqlite3.Database(dbPath);

const settings = [
    { key: 'principal_name', value: 'Mrs. Deepa Sharma' },
    { key: 'principal_desig', value: 'Director, DMIC Group Mangalore' },
    { key: 'chairman_name', value: 'Mr. Manoj Sharma' },
    { key: 'chairman_desig', value: 'Chairman, DMIC Group Mangalore' },
    { key: 'founder_name', value: 'Mr. Dhan Prakash Sharma' },
    { key: 'founder_desig', value: 'Founder of DMIC Group, Mangalore' },
    { key: 'about_summary_desc', value: 'Founded in 1982, the DMIC Group has been a beacon of knowledge in the Mangalore region. Managed under the visionary leadership of Mr. Manoj Sharma (Chairman) and team, we offer excellence in English medium education.' }
];

db.serialize(() => {
    // Upsert settings
    const stmt = db.prepare("INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
    settings.forEach(s => stmt.run(s.key, s.value));
    stmt.finalize();

    // Update Wings
    db.run("UPDATE campus_wings SET name = 'Senior Wing (Mangalore)', subtitle = 'Mudlana Road', description = 'The classes are running in senior wing 6 to 12. Modern infrastructure with advanced labs.', features = ? WHERE subtitle LIKE '%Mundlana%'", 
        ['["Classes 6th to 12th", "Advanced Science & Commerce Streams", "Modern Robotics Lab", "English Medium"]']);

    db.run("UPDATE campus_wings SET name = 'Junior Wing (Mangalore)', subtitle = 'Sarafa Bazar', description = 'The classes are running in junior wing nursery to 8th. Nurturing young minds in a safe environment.', features = ? WHERE subtitle LIKE '%Sarafa%'", 
        ['["Nursery to 8th Class", "Smart Classrooms", "Creative Activity Zone", "English Medium"]']);
});

db.close(() => {
    console.log('Database updated successfully.');
});
