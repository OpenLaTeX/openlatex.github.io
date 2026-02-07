const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT),
});

pool.on('connect', () => {
    console.log('connexion a PostgreSQL reussie');
});

pool.on('error', (err) => {
    console.error('erreur postgres:', err);
    process.exit(-1);
});

const SQLquery = (text, params) => pool.query(text, params);

module.exports = { SQLquery };
