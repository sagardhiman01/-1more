const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const db = require('./database');
const fs = require('fs');
const sharp = require('sharp');
const convert = require('heic-convert');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'dmic-group-secret-key-1982',
    resave: false,
    saveUninitialized: true
}));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

// --- Global Data Middleware ---
// Fetches all site_settings and makes them available to every template
app.use((req, res, next) => {
    db.all("SELECT * FROM site_settings", (err, rows) => {
        if (err) {
            console.error(err.message);
            res.locals.settings = {};
        } else {
            const settings = {};
            if (rows) {
                rows.forEach(row => {
                    settings[row.key] = row.value;
                });
            }
            res.locals.settings = settings;
        }
        next();
    });
});

// --- Auth Middleware ---
const isAuthenticated = (req, res, next) => {
    if (req.session.loggedIn) {
        return next();
    }
    res.redirect('/dmic-portal-login');
};

// --- Routes ---

// Home Page
app.get('/', (req, res) => {
    db.all("SELECT * FROM notices ORDER BY id DESC", (err, notices) => {
        db.all("SELECT * FROM section_features WHERE section = 'achievements'", (err_ach, achievements) => {
            db.all("SELECT * FROM section_features WHERE section = 'why_choose_us'", (err_why, features) => {
                res.render('index', { 
                    notices: notices || [],
                    achievements: achievements || [],
                    features: features || []
                });
            });
        });
    });
});

// About Us
app.get('/about', (req, res) => {
    res.render('about');
});

// Our Wings
app.get('/wings', (req, res) => {
    db.all("SELECT * FROM campus_wings", (err, wings) => {
        const processedWings = wings.map(w => ({
            ...w,
            features: JSON.parse(w.features || '[]')
        }));
        res.render('wings', { wings: processedWings });
    });
});

// Admission Page (GET)
app.get('/admission', (req, res) => {
    res.render('admission', { msg: null });
});

// Admission Submission (POST)
app.post('/admission', (req, res) => {
    const { student_name, father_name, apply_class, phone, address } = req.body;
    const query = "INSERT INTO admissions (student_name, father_name, apply_class, phone, address) VALUES (?, ?, ?, ?, ?)";
    db.run(query, [student_name, father_name, apply_class, phone, address], (err) => {
        if (err) {
            console.error(err.message);
            res.render('admission', { msg: "Error submitting admission request." });
        } else {
            res.render('admission', { msg: "Admission request submitted successfully!" });
        }
    });
});

// Contact Page (GET)
app.get('/contact', (req, res) => {
    res.render('contact', { msg: null });
});

// Contact Submission (POST)
app.post('/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    const query = "INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)";
    db.run(query, [name, email, subject, message], (err) => {
        if (err) {
            console.error(err.message);
            res.render('contact', { msg: "Error sending message." });
        } else {
            res.render('contact', { msg: "Your message has been sent!" });
        }
    });
});

// Gallery Page
app.get('/gallery', (req, res) => {
    const { category } = req.query;
    
    if (category) {
        // Show images for specific category
        db.all("SELECT * FROM gallery WHERE category = ? ORDER BY created_at DESC", [category], (err, gallery) => {
            res.render('gallery', { gallery: gallery || [], selectedCategory: category });
        });
    } else {
        // Show category cards
        db.all("SELECT DISTINCT category FROM gallery WHERE category IS NOT NULL", (err, existingCats) => {
            db.all("SELECT * FROM gallery_categories ORDER BY name ASC", (err2, allCategories) => {
                // We want to show only categories that have at least one image OR all seeded ones
                res.render('gallery', { 
                    gallery: null, 
                    categories: allCategories || [], 
                    selectedCategory: null 
                });
            });
        });
    }
});

// --- Secure Admin Portal ---

// Login Page
app.get('/dmic-portal-login', (req, res) => {
    res.render('admin/login', { error: null });
});

// Login Handing
app.post('/dmic-portal-login', (req, res) => {
    const { password } = req.body;
    db.get("SELECT value FROM site_settings WHERE key = 'admin_password'", (err, row) => {
        if (row && row.value === password) {
            req.session.loggedIn = true;
            res.redirect('/dmic-portal-dashboard');
        } else {
            res.render('admin/login', { error: "Invalid password." });
        }
    });
});

// Dashboard (Protected)
app.get('/dmic-portal-dashboard', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM messages ORDER BY created_at DESC", (err_msg, messages) => {
        db.all("SELECT * FROM admissions ORDER BY created_at DESC", (err_adm, admissions) => {
            db.all("SELECT * FROM campus_wings", (err_wings, wings) => {
                db.all("SELECT * FROM site_settings", (err_set, rows) => {
                    db.all("SELECT * FROM section_features", (err_feat, features) => {
                        db.all("SELECT * FROM gallery ORDER BY created_at DESC", (err_gal, gallery) => {
                            db.all("SELECT * FROM gallery_categories ORDER BY name ASC", (err_cats, categories) => {
                                const settings = {};
                                rows.forEach(r => settings[r.key] = r.value);
                                res.render('admin/dashboard', { 
                                    messages: messages || [], 
                                    admissions: admissions || [],
                                    wings: wings || [],
                                    features: features || [],
                                    gallery: gallery || [],
                                    categories: categories || [],
                                    settings: settings
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// --- CMS Update Routes (Protected) ---

// Update Text Settings
app.post('/admin/update-settings', isAuthenticated, (req, res) => {
    const settings = req.body;
    const queries = Object.keys(settings).map(key => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE site_settings SET value = ? WHERE key = ?", [settings[key], key], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    Promise.all(queries)
        .then(() => res.redirect('/dmic-portal-dashboard?status=updated'))
        .catch(err => {
            console.error(err);
            res.redirect('/dmic-portal-dashboard?status=error');
        });
});

// Update Global Settings Images (Hero, Logo, etc)
app.post('/admin/update-image', isAuthenticated, upload.single('image'), (req, res) => {
    const { key } = req.body;
    if (!req.file) return res.redirect('/dmic-portal-dashboard?status=no-file');
    
    const imagePath = '/uploads/' + req.file.filename;
    db.run("UPDATE site_settings SET value = ? WHERE key = ?", [imagePath, key], (err) => {
        if (err) res.redirect('/dmic-portal-dashboard?status=error');
        else res.redirect('/dmic-portal-dashboard?status=image-updated');
    });
});

// Update Wing Image
app.post('/admin/update-wing-image', isAuthenticated, upload.single('image'), (req, res) => {
    const { id } = req.body;
    if (!req.file) return res.redirect('/dmic-portal-dashboard?status=no-file');
    
    const imagePath = '/uploads/' + req.file.filename;
    db.run("UPDATE campus_wings SET image_path = ? WHERE id = ?", [imagePath, id], (err) => {
        if (err) res.redirect('/dmic-portal-dashboard?status=error');
        else res.redirect('/dmic-portal-dashboard?status=wing-updated');
    });
});

// Delete Gallery Item (Improved with File Cleanup)
app.post('/admin/delete-gallery', isAuthenticated, (req, res) => {
    const { id } = req.body;
    
    // First get the image path to delete the physical file
    db.get("SELECT image_path FROM gallery WHERE id = ?", [id], (err, row) => {
        if (!err && row) {
            const fullPath = path.join(__dirname, 'public', row.image_path);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }
        
        // Then delete from database
        db.run("DELETE FROM gallery WHERE id = ?", [id], (err) => {
            if (err) res.redirect('/dmic-portal-dashboard?status=error');
            else res.redirect('/dmic-portal-dashboard?status=deleted');
        });
    });
});

// Manage Gallery Uploads
app.post('/admin/manage-gallery', isAuthenticated, upload.array('images', 20), async (req, res) => {
    const { title, category } = req.body;
    
    if (!req.files || req.files.length === 0) return res.redirect('/dmic-portal-dashboard?status=no-file');
        
        const finalTitle = title || 'Campus Memory';
        
        try {
            for (const file of req.files) {
                const inputPath = file.path;
                const outputFilename = `proc-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
                const outputPath = path.join(__dirname, 'public/uploads', outputFilename);
                
                let buffer = fs.readFileSync(inputPath);
                
                // Convert HEIC to JPG if needed
                if (file.originalname.toLowerCase().endsWith('.heic')) {
                    buffer = await convert({
                        buffer: buffer,
                        format: 'JPEG',
                        quality: 1
                    });
                }
                
                // Process with Sharp (Resize/Optimize to JPG)
                await sharp(buffer)
                    .jpeg({ quality: 80 })
                    .toFile(outputPath);
                
                // Save to DB
                await new Promise((resolve, reject) => {
                    db.run("INSERT INTO gallery (title, image_path, category) VALUES (?, ?, ?)", 
                        [finalTitle, '/uploads/' + outputFilename, category], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                });
                
                // Cleanup original file
                fs.unlinkSync(inputPath);
            }
            res.redirect('/dmic-portal-dashboard?status=added');
        } catch (err) {
            console.error('Image Processing Error:', err);
            res.redirect('/dmic-portal-dashboard?status=error');
        }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
