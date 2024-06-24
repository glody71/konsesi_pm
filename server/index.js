// server/index.js

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.message);
        return;
    }
    console.log('Connected to MySQL');
});

// Root route
app.get('/', (req, res) => {
    res.send('Hello, World! Welcome to the Vite React Authentication API');
});

// Other routes...
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, results) => {
        if (err) {
            console.error('Error during registration:', err.message);
            return res.status(500).send('Server error');
        }
        res.status(201).send('User registered');
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error during login:', err.message);
            return res.status(500).send('Server error');
        }
        if (results.length === 0) return res.status(404).send('User not found');

        const user = results[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).send('Invalid password');

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).send({ auth: true, token });
    });
});

app.get('/me', (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) return res.status(403).send('No token provided');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(500).send('Failed to authenticate token');

        db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (err, results) => {
            if (err) {
                console.error('Error fetching user data:', err.message);
                return res.status(500).send('Server error');
            }
            if (results.length === 0) return res.status(404).send('User not found');
            res.status(200).send(results[0]);
        });
    });
});

app.get('/api/data', (req, res) => {
    db.query('SELECT * FROM konsesi', (error, results) => {
        if (error) throw error;
        res.json(results);
    });
});


app.post('/upload', (req, res) => {
    const data = req.body.data;

    if (!data || !data.length) {
        return res.status(400).send('No data to insert.');
    }

    // Extract columns and construct placeholders for each column
    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');

    // Constructing the query with multiple sets of placeholders for each row
    const rowsPlaceholder = data.map(() => `(${placeholders})`).join(', ');

    // Prepare the full SQL query
    const sql = `INSERT INTO konsesi (${columns.join(', ')}) VALUES ${rowsPlaceholder}`;

    // Flattening the array of row values into a single array
    const values = data.reduce((acc, row) => {
        columns.forEach(column => {
            acc.push(row[column] === null || row[column] === undefined ? null : row[column]);
        });
        return acc;
    }, []);

    // Execute the query
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).send('Error saving data');
        }
        res.send('Data inserted successfully.');
    });
});

app.put('/api/data/:id', (req, res) => {
    const id = req.params.id;
    const {
        no_jo,
        no_wo,
        nama_project,
        nama_panel,
        unit,
        jenis,
        konsesi,
        jml_konsesi,
        kode_material,
        tgl_material_diterima,
        jml_material_diterima,
        no_stdl,
        tgl_pasang,
        jml_dipasang,
        no_lkpj,
        status
    } = req.body;

    const query = `
        UPDATE konsesi SET
        no_jo = ?,
        no_wo = ?,
        nama_project = ?,
        nama_panel = ?,
        unit = ?,
        jenis = ?,
        konsesi = ?,
        jml_konsesi = ?,
        kode_material = ?,
        tgl_material_diterima = ?,
        jml_material_diterima = ?,
        no_stdl = ?,
        tgl_pasang = ?,
        jml_dipasang = ?,
        no_lkpj = ?,
        status = ?
        WHERE id = ?
    `;

    db.query(query, [
        no_jo,
        no_wo,
        nama_project,
        nama_panel,
        unit,
        jenis,
        konsesi,
        jml_konsesi,
        kode_material,
        tgl_material_diterima,
        jml_material_diterima,
        no_stdl,
        tgl_pasang,
        jml_dipasang,
        no_lkpj,
        status,
        id
    ], (error, results) => {
        if (error) return res.status(500).send(error);
        res.send({ message: 'Data updated successfully', results });
    });
});

app.get('/api/konsesi-status', (req, res) => {
    const query = 'SELECT status, COUNT(*) as count FROM konsesi GROUP BY status';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

app.post('/api/konsesi', (req, res) => {
    const {
        no_jo,
        no_wo,
        nama_project,
        nama_panel,
        unit,
        jenis,
        kode_material,
        konsesi,
        jml_konsesi,
        no_lkpj,
        tgl_material_diterima,
        jml_material_diterima,
        no_stdl,
        tgl_pasang,
        jml_dipasang
        
    } = req.body;

    // Validation can be added here if necessary

    // SQL query to insert data
    const query = `
        INSERT INTO konsesi (
            no_jo,
            no_wo,
            nama_project,
            nama_panel,
            unit,
            jenis,
            kode_material,
            konsesi,
            jml_konsesi,
            no_lkpj,
            tgl_material_diterima,
            jml_material_diterima,
            no_stdl,
            tgl_pasang,
            jml_dipasang
            
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        no_jo,
        no_wo,
        nama_project,
        nama_panel,
        unit,
        jenis,
        kode_material,
        konsesi,
        jml_konsesi,
        no_lkpj,
        tgl_material_diterima,
        jml_material_diterima,
        no_stdl,
        tgl_pasang,
        jml_dipasang
        
    ];

    // Execute the query
    db.query(query, values, (error, results) => {
        if (error) {
            console.error('Error inserting data:', error);
            return res.status(500).send('Server error while inserting data');
        }
        res.status(201).send({ message: 'Data inserted successfully', id: results.insertId });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
