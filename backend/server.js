const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();

const PORT = 3000;

// Middleware
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));


/* =====================================================
   ROOM APIs
===================================================== */

// GET - View all rooms
app.get("/api/rooms", (req, res) => {

    const sql = "SELECT * FROM rooms";

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: "Failed to get rooms"
            });
        }

        res.json(rows);
    });
});


// POST - Add new room
app.post("/api/rooms", (req, res) => {

    const { roomNo, type, price } = req.body;

    // Validation
    if (!roomNo || !type || !price) {
        return res.status(400).json({
            error: "Please enter all room details"
        });
    }

    const sql = `
        INSERT INTO rooms (roomNo, type, price, status)
        VALUES (?, ?, ?, 'Available')
    `;

    db.run(
        sql,
        [roomNo, type, price],
        function (err) {

            if (err) {

                if (err.message.includes("UNIQUE")) {
                    return res.status(400).json({
                        error: "Room number already exists"
                    });
                }

                return res.status(500).json({
                    error: "Failed to add room"
                });
            }

            res.json({
                message: "Room added successfully",
                roomId: this.lastID
            });
        }
    );
});


// PUT - Update room
app.put("/api/rooms/:id", (req, res) => {

    const roomId = req.params.id;

    const { roomNo, type, price } = req.body;

    if (!roomNo || !type || !price) {
        return res.status(400).json({
            error: "Please enter all room details"
        });
    }

    const sql = `
        UPDATE rooms
        SET roomNo = ?, type = ?, price = ?
        WHERE id = ?
    `;

    db.run(
        sql,
        [roomNo, type, price, roomId],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: "Failed to update room"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Room not found"
                });
            }

            res.json({
                message: "Room updated successfully"
            });
        }
    );
});


// DELETE - Delete room
app.delete("/api/rooms/:id", (req, res) => {

    const roomId = req.params.id;

    // First check whether room has bookings
    db.get(
        "SELECT * FROM bookings WHERE roomId = ?",
        [roomId],
        (err, booking) => {

            if (err) {
                return res.status(500).json({
                    error: "Database error"
                });
            }

            if (booking) {
                return res.status(400).json({
                    error: "Cannot delete room because it has a booking"
                });
            }

            db.run(
                "DELETE FROM rooms WHERE id = ?",
                [roomId],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: "Failed to delete room"
                        });
                    }

                    res.json({
                        message: "Room deleted successfully"
                    });
                }
            );
        }
    );
});


/* =====================================================
   SEARCH AVAILABLE ROOMS
===================================================== */

app.get("/api/rooms/search", (req, res) => {

    const { type, checkIn, checkOut } = req.query;

    let sql = `
        SELECT * FROM rooms
        WHERE 1 = 1
    `;

    let params = [];

    // Search by room type
    if (type) {
        sql += " AND type = ?";
        params.push(type);
    }

    db.all(sql, params, (err, rooms) => {

        if (err) {
            return res.status(500).json({
                error: "Search failed"
            });
        }

        // If dates are not provided,
        // simply return rooms
        if (!checkIn || !checkOut) {
            return res.json(rooms);
        }

        // Find rooms that are already booked
        const bookingSql = `
            SELECT roomId
            FROM bookings
            WHERE checkIn < ?
            AND checkOut > ?
        `;

        db.all(
            bookingSql,
            [checkOut, checkIn],
            (err, bookings) => {

                if (err) {
                    return res.status(500).json({
                        error: "Booking search failed"
                    });
                }

                const bookedRoomIds =
                    bookings.map(booking => booking.roomId);

                const availableRooms =
                    rooms.filter(room =>
                        !bookedRoomIds.includes(room.id)
                    );

                res.json(availableRooms);
            }
        );
    });
});


/* =====================================================
   BOOKING APIs
===================================================== */

// GET - View all bookings
app.get("/api/bookings", (req, res) => {

    const sql = `
        SELECT
            bookings.id,
            bookings.guestName,
            bookings.checkIn,
            bookings.checkOut,
            rooms.roomNo,
            rooms.type,
            rooms.price
        FROM bookings
        JOIN rooms
        ON bookings.roomId = rooms.id
        ORDER BY bookings.id DESC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: "Failed to get bookings"
            });
        }

        res.json(rows);
    });
});


// POST - Book a room
app.post("/api/bookings", (req, res) => {

    const {
        roomId,
        guestName,
        checkIn,
        checkOut
    } = req.body;


    // Basic validation
    if (!roomId || !guestName || !checkIn || !checkOut) {

        return res.status(400).json({
            error: "Please enter all booking details"
        });
    }


    // Check date validity
    if (checkIn >= checkOut) {

        return res.status(400).json({
            error: "Check-out date must be after check-in date"
        });
    }


    // Check whether room exists
    db.get(
        "SELECT * FROM rooms WHERE id = ?",
        [roomId],
        (err, room) => {

            if (err) {
                return res.status(500).json({
                    error: "Database error"
                });
            }

            if (!room) {
                return res.status(404).json({
                    error: "Room not found"
                });
            }


            // IMPORTANT:
            // Check overlapping bookings
            const overlapSql = `
                SELECT *
                FROM bookings
                WHERE roomId = ?
                AND checkIn < ?
                AND checkOut > ?
            `;

            db.get(
                overlapSql,
                [roomId, checkOut, checkIn],
                (err, booking) => {

                    if (err) {
                        return res.status(500).json({
                            error: "Booking check failed"
                        });
                    }


                    // Already booked
                    if (booking) {

                        return res.status(400).json({
                            error:
                            "Room is already booked for these dates"
                        });
                    }


                    // Create booking
                    const insertSql = `
                        INSERT INTO bookings
                        (roomId, guestName, checkIn, checkOut)
                        VALUES (?, ?, ?, ?)
                    `;

                    db.run(
                        insertSql,
                        [
                            roomId,
                            guestName,
                            checkIn,
                            checkOut
                        ],
                        function (err) {

                            if (err) {
                                return res.status(500).json({
                                    error: "Booking failed"
                                });
                            }

                            res.json({
                                message: "Room booked successfully",
                                bookingId: this.lastID
                            });
                        }
                    );
                }
            );
        }
    );
});


// DELETE - Cancel booking
app.delete("/api/bookings/:id", (req, res) => {

    const bookingId = req.params.id;

    const sql = `
        DELETE FROM bookings
        WHERE id = ?
    `;

    db.run(
        sql,
        [bookingId],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: "Failed to cancel booking"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    error: "Booking not found"
                });
            }

            res.json({
                message: "Booking cancelled successfully"
            });
        }
    );
});


/* =====================================================
   START SERVER
===================================================== */

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});