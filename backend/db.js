const sqlite3 = require("../frontend/node_modules/sqlite3/lib/sqlite3").verbose();

const db = new sqlite3.Database("./backend/hotel.db", (err) => {
    if (err) {
        console.log("Database connection failed");
    } else {
        console.log("SQLite database connected");
    }
});

db.serialize(() => {

    // Rooms table
    db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roomNo INTEGER UNIQUE NOT NULL,
            type TEXT NOT NULL,
            price REAL NOT NULL,
            status TEXT DEFAULT 'Available'
        )
    `);

    // Bookings table
    db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roomId INTEGER NOT NULL,
            guestName TEXT NOT NULL,
            checkIn TEXT NOT NULL,
            checkOut TEXT NOT NULL,
            FOREIGN KEY(roomId) REFERENCES rooms(id)
        )
    `);

});

module.exports = db;