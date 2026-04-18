const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'dmic_school.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the DMIC SQLite database.');
    }
});

db.serialize(() => {
    // --- Existing Tables ---
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_name TEXT NOT NULL,
        father_name TEXT NOT NULL,
        apply_class TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    // --- New CMS Tables ---
    
    // Global Site Settings (Key-Value)
    db.run(`CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )`);

    // Campus Wings Data
    db.run(`CREATE TABLE IF NOT EXISTS campus_wings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subtitle TEXT,
        description TEXT,
        phone TEXT,
        image_path TEXT,
        features TEXT -- JSON string
    )`);

    // Features/Achievements Grid
    db.run(`CREATE TABLE IF NOT EXISTS section_features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL, -- e.g., 'achievements', 'why_choose_us'
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        image_path TEXT
    )`);

    // --- Initial CMS Data Migration ---
    
    db.get("SELECT COUNT(*) as count FROM site_settings", (err, row) => {
        if (row && row.count === 0) {
            const settings = [
                ['school_name', 'Durga Modern Inter College Group'],
                ['school_short_name', 'DMIC Group'],
                ['motto', 'Discipline • Hard Work • Self-Confidence'],
                ['motto_en', 'Discipline • Hard Work • Self-Confidence'],
                ['founding_year', '1982'],
                ['admin_password', 'admin123'], // Default password
                ['contact_email', 'info@dmicgroup.com'],
                ['insta_url', 'https://www.instagram.com/dmic_group_manglour/'],
                ['youtube_url', 'https://www.youtube.com/@durgamodern1917'],
                ['hero_title', 'Empowering Minds'],
                ['hero_subtitle', 'Since 1982'],
                ['hero_description', 'Durga Modern Inter College Group Manglaur — Where legacy meets modern excellence.'],
                ['hero_image', '/img/hero.png'],
                ['about_summary_title', 'Holistic Education for a Brighter Future'],
                ['about_summary_desc', 'Founded in 1982, the DMIC Group has been a beacon of knowledge in the Manglaur region. Managed under the visionary leadership of Mr. Manoj Sharma (Chairman) and team, we offer excellence in English medium education.'],
                ['principal_message', 'Our goal at DMIC Group is to provide an environment where every student can achieve their full potential and grow into responsible citizens.'],
                ['principal_name', 'Mrs. Deepa Sharma'],
                ['principal_desig', 'Director, DMIC Group Mangalore'],
                ['chairman_name', 'Mr. Manoj Sharma'],
                ['chairman_desig', 'Chairman, DMIC Group Mangalore'],
                ['founder_name', 'Mr. Dhan Prakash Sharma'],
                ['founder_desig', 'Founder of DMIC Group, Mangalore'],
                ['stat_years', '43'],
                ['stat_students', '5000'],
                ['stat_posts', '651'],
                ['stat_followers', '6521']
            ];

            const stmt = db.prepare("INSERT INTO site_settings (key, value) VALUES (?, ?)");
            settings.forEach(s => stmt.run(s));
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM campus_wings", (err, row) => {
        if (row && row.count === 0) {
            const wings = [
                ['Senior Wing (Mangalore)', 'Mudlana Road', 'The classes are running in senior wing 6 to 12. Modern infrastructure with advanced labs.', '8126242572', '/img/hero.png', '["Classes 6th to 12th", "Advanced Science & Commerce Streams", "Modern Robotics Lab", "English Medium"]'],
                ['Junior Wing (Mangalore)', 'Sarafa Bazar', 'The classes are running in junior wing nursery to 8th. Nurturing young minds in a safe environment.', '6396201230', '/img/smart_class.png', '["Nursery to 8th Class", "Smart Classrooms", "Creative Activity Zone", "English Medium"]'],
                ['Moon Kingdom Public School', 'Landhaura Branch', 'Bringing excellence to Landhaura since 2002 with the motto "A Ray of Hope".', '8755431982', '/img/fest.png', '["Nursery to Class 12", "Holistic Development", "Dharohar Cultural Fest", "Modern Infrastructure"]']
            ];
            const stmt = db.prepare("INSERT INTO campus_wings (name, subtitle, description, phone, image_path, features) VALUES (?, ?, ?, ?, ?, ?)");
            wings.forEach(w => stmt.run(w));
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM section_features", (err, row) => {
        if (row && row.count === 0) {
            const features = [
                ['achievements', 'Board Merit Results', 'Consistent top results in UK Board examinations.', 'trophy', null],
                ['achievements', 'Dharohar 2025', 'Our signature annual cultural fest showcasing talent.', 'sparkles', null],
                ['why_choose_us', 'Smart Classrooms', 'Interactive digital learning environment.', 'monitor', null],
                ['why_choose_us', 'AI & Robotics', 'Preparing students for the tech-driven future.', 'cpu', '/img/robotics.png']
            ];
            const stmt = db.prepare("INSERT INTO section_features (section, title, description, icon, image_path) VALUES (?, ?, ?, ?, ?)");
            features.forEach(f => stmt.run(f));
            stmt.finalize();
        }
    });
});

module.exports = db;
