const API = "/api";


/* =====================================================
   LOAD ALL ROOMS
===================================================== */

async function loadRooms() {

    try {

        const response =
            await fetch(`${API}/rooms`);

        const rooms =
            await response.json();

        displayRooms(rooms);

    } catch (error) {

        console.log(error);

        document.getElementById(
            "roomsContainer"
        ).innerHTML =
            "<p>Failed to load rooms</p>";
    }
}


/* =====================================================
   DISPLAY ROOMS
===================================================== */

function displayRooms(rooms) {

    const container =
        document.getElementById("roomsContainer");

    container.innerHTML = "";

    if (rooms.length === 0) {

        container.innerHTML =
            "<p>No rooms available</p>";

        return;
    }


    rooms.forEach(room => {

        const div =
            document.createElement("div");

        div.className = "room";

        div.innerHTML = `

            <h3>Room ${room.roomNo}</h3>

            <p>
                <strong>Type:</strong>
                ${room.type}
            </p>

            <p>
                <strong>Price:</strong>
                ₹${room.price} / night
            </p>

            <p>
                <strong>Status:</strong>
                ${room.status}
            </p>

            <button
                class="book-button"
                onclick="selectRoom(${room.id}, ${room.roomNo})">

                Book Room

            </button>

            <button
                class="update-button"
                onclick="updateRoom(
                    ${room.id},
                    ${room.roomNo},
                    '${room.type}',
                    ${room.price}
                )">

                Update

            </button>

            <button
                class="delete-button"
                onclick="deleteRoom(${room.id})">

                Delete

            </button>

        `;

        container.appendChild(div);

    });
}


/* =====================================================
   ADD ROOM
===================================================== */

document
    .getElementById("roomForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const roomNo =
            document.getElementById("roomNo").value;

        const type =
            document.getElementById("roomType").value;

        const price =
            document.getElementById("roomPrice").value;


        const response = await fetch(
            `${API}/rooms`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    roomNo,
                    type,
                    price
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.error);

            return;
        }


        alert(data.message);

        document
            .getElementById("roomForm")
            .reset();

        loadRooms();

    });


/* =====================================================
   SEARCH ROOMS
===================================================== */

document
    .getElementById("searchForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const type =
            document.getElementById(
                "searchType"
            ).value;

        const checkIn =
            document.getElementById(
                "searchCheckIn"
            ).value;

        const checkOut =
            document.getElementById(
                "searchCheckOut"
            ).value;


        // Date validation
        if (checkIn && checkOut) {

            if (checkIn >= checkOut) {

                alert(
                    "Check-out date must be after check-in date"
                );

                return;
            }
        }


        let url = `${API}/rooms/search?`;


        if (type) {
            url += `type=${encodeURIComponent(type)}&`;
        }

        if (checkIn) {
            url += `checkIn=${checkIn}&`;
        }

        if (checkOut) {
            url += `checkOut=${checkOut}&`;
        }


        const response =
            await fetch(url);

        const rooms =
            await response.json();

        displayRooms(rooms);

    });


/* =====================================================
   SELECT ROOM FOR BOOKING
===================================================== */

function selectRoom(roomId, roomNo) {

    document.getElementById(
        "bookingRoomId"
    ).value = roomId;


    document.getElementById(
        "selectedRoom"
    ).innerText =
        `Selected Room: ${roomNo}`;


    window.scrollTo({
        top:
            document.getElementById(
                "bookingForm"
            ).offsetTop,

        behavior: "smooth"
    });
}


/* =====================================================
   BOOK ROOM
===================================================== */

document
    .getElementById("bookingForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        const roomId =
            document.getElementById(
                "bookingRoomId"
            ).value;

        const guestName =
            document.getElementById(
                "guestName"
            ).value;

        const checkIn =
            document.getElementById(
                "checkIn"
            ).value;

        const checkOut =
            document.getElementById(
                "checkOut"
            ).value;


        if (!roomId) {

            alert("Please select a room first");

            return;
        }


        if (checkIn >= checkOut) {

            alert(
                "Check-out date must be after check-in date"
            );

            return;
        }


        const response =
            await fetch(
                `${API}/bookings`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        roomId,
                        guestName,
                        checkIn,
                        checkOut

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(data.error);

            return;
        }


        alert(data.message);


        document
            .getElementById("bookingForm")
            .reset();


        document.getElementById(
            "selectedRoom"
        ).innerText =
            "No room selected";


        loadBookings();

        loadRooms();

    });


/* =====================================================
   LOAD BOOKINGS
===================================================== */

async function loadBookings() {

    try {

        const response =
            await fetch(
                `${API}/bookings`
            );

        const bookings =
            await response.json();


        displayBookings(bookings);

    } catch (error) {

        console.log(error);

    }
}


/* =====================================================
   DISPLAY BOOKINGS
===================================================== */

function displayBookings(bookings) {

    const container =
        document.getElementById(
            "bookingsContainer"
        );


    container.innerHTML = "";


    if (bookings.length === 0) {

        container.innerHTML =
            "<p>No bookings found</p>";

        return;
    }


    bookings.forEach(booking => {

        const div =
            document.createElement("div");

        div.className = "booking";


        div.innerHTML = `

            <h3>
                Booking #${booking.id}
            </h3>

            <p>
                <strong>Guest:</strong>
                ${booking.guestName}
            </p>

            <p>
                <strong>Room:</strong>
                ${booking.roomNo}
            </p>

            <p>
                <strong>Room Type:</strong>
                ${booking.type}
            </p>

            <p>
                <strong>Check-in:</strong>
                ${booking.checkIn}
            </p>

            <p>
                <strong>Check-out:</strong>
                ${booking.checkOut}
            </p>

            <button
                class="delete-button"
                onclick="cancelBooking(${booking.id})">

                Cancel Booking

            </button>

        `;


        container.appendChild(div);

    });
}


/* =====================================================
   CANCEL BOOKING
===================================================== */

async function cancelBooking(id) {

    const confirmCancel =
        confirm(
            "Are you sure you want to cancel this booking?"
        );


    if (!confirmCancel) {
        return;
    }


    const response =
        await fetch(
            `${API}/bookings/${id}`,
            {
                method: "DELETE"
            }
        );


    const data =
        await response.json();


    alert(data.message || data.error);


    loadBookings();

    loadRooms();

}


/* =====================================================
   DELETE ROOM
===================================================== */

async function deleteRoom(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this room?"
        );


    if (!confirmDelete) {
        return;
    }


    const response =
        await fetch(
            `${API}/rooms/${id}`,
            {
                method: "DELETE"
            }
        );


    const data =
        await response.json();


    alert(data.message || data.error);


    loadRooms();

}


/* =====================================================
   UPDATE ROOM
===================================================== */

async function updateRoom(
    id,
    roomNo,
    type,
    price
) {

    const newRoomNo =
        prompt(
            "Enter new room number:",
            roomNo
        );


    if (!newRoomNo) {
        return;
    }


    const newType =
        prompt(
            "Enter room type:",
            type
        );


    if (!newType) {
        return;
    }


    const newPrice =
        prompt(
            "Enter room price:",
            price
        );


    if (!newPrice) {
        return;
    }


    const response =
        await fetch(
            `${API}/rooms/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    roomNo: newRoomNo,
                    type: newType,
                    price: newPrice

                })
            }
        );


    const data =
        await response.json();


    alert(data.message || data.error);


    loadRooms();

}


/* =====================================================
   INITIAL LOAD
===================================================== */

loadRooms();

loadBookings();