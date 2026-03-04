import mysql from 'mysql2/promise'

// Global connection pool to avoid creating new connections constantly
const pool = mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASS ?? '',
    database: process.env.DB_NAME ?? 'datacenter',
    charset: 'UTF8MB4_GENERAL_CI',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})

export default pool
