const API_BASE_URL = 'http://localhost:8000/api'; // Sesuaikan dengan URL Laravel Anda

// Utility function to show/hide sections
function showSection(sectionId) {
    // console.log(`Showing section: ${sectionId}`); // Debug: Melacak section yang ditampilkan
    document.querySelectorAll('.form-container, #main-content, #my-reservations-section, #admin-dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        console.error(`Error: Section with ID "${sectionId}" not found.`);
    }
}

// Global variable for Bootstrap Modals
let fieldDetailModalInstance;
let fieldModalInstance;

// Helper function for API calls
async function callApi(url, method = 'GET', data = null, needsAuth = false) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const token = localStorage.getItem('authToken');
    if (needsAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
        body: data ? JSON.stringify(data) : null,
    };

    try {
        // console.log(`API Call: ${method} ${url}`, { options, data, needsAuth }); // Debug: Melacak panggilan API
        const response = await fetch(url, options);
        // console.log('API Response Status:', response.status); // Debug: Status respons API
        const responseData = await response.json(); // Always parse JSON
        // console.log('API Response Data:', responseData); // Debug: Data respons API

        if (!response.ok) {
            // Throw error with message from API if available
            throw new Error(responseData.message || JSON.stringify(responseData) || 'Something went wrong');
        }
        return responseData;
    } catch (error) {
        console.error('API Error:', error); // Debug: Error dari panggilan API
        throw error;
    }
}

// --- Authentication & UI Updates ---

function updateNavbar() {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    // console.log('Updating Navbar. Token:', token ? 'Exists' : 'Not Exists', 'Role:', role); // Debug: Status Navbar

    // Hide all authenticated links initially
    document.getElementById('nav-logout-container')?.classList.add('d-none');
    document.getElementById('nav-my-reservations')?.classList.add('d-none');
    document.getElementById('nav-admin-dashboard')?.classList.add('d-none');

    if (token) {
        document.getElementById('nav-login')?.classList.add('d-none');
        document.getElementById('nav-register')?.classList.add('d-none');
        document.getElementById('nav-logout-container')?.classList.remove('d-none');
        document.getElementById('nav-my-reservations')?.classList.remove('d-none');
        if (role === 'admin') {
            document.getElementById('nav-admin-dashboard')?.classList.remove('d-none');
        }
    } else {
        document.getElementById('nav-login')?.classList.remove('d-none');
        document.getElementById('nav-register')?.classList.remove('d-none');
    }
}

// --- Main Pages/Sections Loading ---

async function loadFields() {
    // console.log('Loading fields...'); // Debug
    showSection('main-content');
    try {
        const fields = await callApi(`${API_BASE_URL}/fields`);
        const fieldListDiv = document.getElementById('field-list');
        if (!fieldListDiv) {
            console.error("Error: Element with ID 'field-list' not found.");
            return;
        }
        fieldListDiv.innerHTML = '';
        if (fields.length === 0) {
            fieldListDiv.innerHTML = '<p class="text-center">Tidak ada lapangan yang tersedia saat ini.</p>';
            return;
        }
        fields.forEach(field => {
            const fieldCard = `
                <div class="col-md-4">
                    <div class="card mb-4 shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${field.name}</h5>
                            <p class="card-text"><strong>Jenis Olahraga:</strong> ${field.sport_type}</p>
                            <p class="card-text"><strong>Alamat:</strong> ${field.address}</p>
                            <p class="card-text"><strong>Harga/Jam:</strong> Rp${field.price_per_hour}</p>
                            <button class="btn btn-primary btn-sm view-field-btn" data-id="${field.id}">Lihat Detail & Reservasi</button>
                        </div>
                    </div>
                </div>
            `;
            fieldListDiv.innerHTML += fieldCard;
        });

        document.querySelectorAll('.view-field-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const fieldId = e.target.dataset.id;
                showFieldDetailModal(fieldId);
            });
        });

    } catch (error) {
        alert('Gagal memuat daftar lapangan: ' + error.message);
    }
}

async function loadMyReservations() {
    // console.log('Loading my reservations...'); // Debug
    showSection('my-reservations-section');
    const reservationsListDiv = document.getElementById('my-reservations-list');
    const messageDiv = document.getElementById('my-reservations-message');

    if (!reservationsListDiv || !messageDiv) {
        console.error("Error: Elements for 'my-reservations' not found.");
        return;
    }

    reservationsListDiv.innerHTML = '';
    messageDiv.textContent = '';

    if (!localStorage.getItem('authToken')) {
        messageDiv.textContent = 'Silakan login untuk melihat reservasi Anda.';
        return;
    }

    try {
        const reservations = await callApi(`${API_BASE_URL}/my-reservations`, 'GET', null, true);
        if (reservations.length === 0) {
            messageDiv.textContent = 'Anda belum memiliki reservasi.';
            return;
        }

        let html = '<table class="table table-bordered table-striped"><thead><tr><th>Lapangan</th><th>Tanggal</th><th>Jam Mulai</th><th>Jam Selesai</th><th>Status</th><th>Aksi</th></tr></thead><tbody>';
        reservations.forEach(res => {
            const statusClass = {
                'pending': 'text-warning',
                'confirmed': 'text-success',
                'canceled': 'text-danger',
                'completed': 'text-secondary'
            }[res.status] || '';

            const canCancel = (res.status === 'pending' || res.status === 'confirmed') && new Date(res.reservation_date) >= new Date(); // Can cancel if not in past
            html += `
                <tr>
                    <td>${res.field.name}</td>
                    <td>${res.reservation_date}</td>
                    <td>${res.start_time ? res.start_time.substring(0, 5) : ''}</td>
                    <td>${res.end_time ? res.end_time.substring(0, 5) : ''}</td>
                    <td class="${statusClass}">${res.status.charAt(0).toUpperCase() + res.status.slice(1)}</td>
                    <td>
                        ${canCancel ? `<button class="btn btn-danger btn-sm cancel-reservation-btn" data-id="${res.id}">Batalkan</button>` : `<button class="btn btn-secondary btn-sm" disabled>Tidak Dapat Dibatalkan</button>`}
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        reservationsListDiv.innerHTML = html;

        document.querySelectorAll('.cancel-reservation-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const reservationId = e.target.dataset.id;
                if (confirm('Apakah Anda yakin ingin membatalkan reservasi ini?')) {
                    try {
                        await callApi(`${API_BASE_URL}/reservations/${reservationId}`, 'DELETE', null, true);
                        alert('Reservasi berhasil dibatalkan!');
                        loadMyReservations(); // Reload list
                    } catch (error) {
                        alert('Gagal membatalkan reservasi: ' + error.message);
                    }
                }
            });
        });

    } catch (error) {
        alert('Gagal memuat reservasi Anda: ' + error.message);
    }
}

async function loadAdminDashboard() {
    // console.log('Loading Admin Dashboard...'); // Debug
    showSection('admin-dashboard-section');
    loadAdminFields();
    loadAdminReservations();

    // Event listeners for tab switching - ensure they are only added once or safely.
    // If adding multiple times, it creates duplicate listeners. Best to manage outside or check.
    // For simplicity, we'll keep them here assuming this function isn't called rapidly.
    document.getElementById('admin-fields-tab')?.addEventListener('click', loadAdminFields);
    document.getElementById('admin-reservations-tab')?.addEventListener('click', loadAdminReservations);
}

// --- Admin Dashboard Functions ---
async function loadAdminFields() {
    const fieldsTableBody = document.getElementById('admin-fields-table-body');
    const messageDiv = document.getElementById('admin-fields-message');

    if (!fieldsTableBody || !messageDiv) {
        console.error("Error: Elements for 'admin-fields' not found.");
        return;
    }

    fieldsTableBody.innerHTML = '';
    messageDiv.textContent = '';

    try {
        const fields = await callApi(`${API_BASE_URL}/fields`, 'GET', null, true); // Admin can view all fields via this endpoint
        if (fields.length === 0) {
            messageDiv.textContent = 'Tidak ada lapangan terdaftar.';
            return;
        }

        fields.forEach(field => {
            const row = `
                <tr>
                    <td>${field.name}</td>
                    <td>${field.sport_type}</td>
                    <td>${field.address}</td>
                    <td>Rp${field.price_per_hour}</td>
                    <td>
                        <button class="btn btn-sm btn-info edit-field-btn me-2" data-id="${field.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-field-btn" data-id="${field.id}">Hapus</button>
                    </td>
                </tr>
            `;
            fieldsTableBody.innerHTML += row;
        });

        document.querySelectorAll('.edit-field-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const fieldId = e.target.dataset.id;
                editField(fieldId);
            });
        });

        document.querySelectorAll('.delete-field-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const fieldId = e.target.dataset.id;
                if (confirm('Apakah Anda yakin ingin menghapus lapangan ini?')) {
                    try {
                        await callApi(`${API_BASE_URL}/fields/${fieldId}`, 'DELETE', null, true);
                        alert('Lapangan berhasil dihapus!');
                        loadAdminFields();
                    } catch (error) {
                        alert('Gagal menghapus lapangan: ' + error.message);
                    }
                }
            });
        });
    } catch (error) {
        alert('Gagal memuat daftar lapangan admin: ' + error.message);
    }
}

async function editField(fieldId) {
    try {
        const field = await callApi(`${API_BASE_URL}/fields/${fieldId}`, 'GET', null, true);
        document.getElementById('fieldModalLabel').textContent = 'Edit Field';
        document.getElementById('field-id').value = field.id;
        document.getElementById('field-name').value = field.name;
        document.getElementById('field-sport-type').value = field.sport_type;
        document.getElementById('field-address').value = field.address;
        document.getElementById('field-description').value = field.description || '';
        document.getElementById('field-price').value = field.price_per_hour;
        fieldModalInstance.show();
    } catch (error) {
        alert('Gagal memuat data lapangan untuk diedit: ' + error.message);
    }
}

document.getElementById('add-field-btn')?.addEventListener('click', () => {
    document.getElementById('fieldModalLabel').textContent = 'Add New Field';
    document.getElementById('field-form').reset();
    document.getElementById('field-id').value = ''; // Clear ID for new field
    document.getElementById('field-form-message').textContent = '';
    fieldModalInstance.show();
});

document.getElementById('field-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fieldId = document.getElementById('field-id').value;
    const name = document.getElementById('field-name').value;
    const sport_type = document.getElementById('field-sport-type').value;
    const address = document.getElementById('field-address').value;
    const description = document.getElementById('field-description').value;
    const price_per_hour = document.getElementById('field-price').value;
    const messageDiv = document.getElementById('field-form-message');

    const data = { name, sport_type, address, description, price_per_hour };
    let url = `${API_BASE_URL}/fields`;
    let method = 'POST';

    if (fieldId) {
        url = `${API_BASE_URL}/fields/${fieldId}`;
        method = 'PUT';
    }

    try {
        await callApi(url, method, data, true);
        alert(`Lapangan berhasil ${fieldId ? 'diperbarui' : 'ditambahkan'}!`);
        fieldModalInstance.hide();
        loadAdminFields();
    } catch (error) {
        messageDiv.textContent = 'Gagal menyimpan lapangan: ' + error.message;
    }
});


async function loadAdminReservations() {
    const reservationsTableBody = document.getElementById('admin-reservations-table-body');
    const messageDiv = document.getElementById('admin-reservations-message');

    if (!reservationsTableBody || !messageDiv) {
        console.error("Error: Elements for 'admin-reservations' not found.");
        return;
    }

    reservationsTableBody.innerHTML = '';
    messageDiv.textContent = '';

    try {
        const reservations = await callApi(`${API_BASE_URL}/reservations`, 'GET', null, true); // Get all reservations
        if (reservations.length === 0) {
            messageDiv.textContent = 'Tidak ada reservasi yang tercatat.';
            return;
        }

        reservations.forEach(res => {
            const statusClass = {
                'pending': 'text-warning',
                'confirmed': 'text-success',
                'canceled': 'text-danger',
                'completed': 'text-secondary'
            }[res.status] || '';

            const row = `
                <tr>
                    <td>${res.field.name}</td>
                    <td>${res.user.name} (${res.user.email})</td>
                    <td>${res.reservation_date}</td>
                    <td>${res.start_time ? res.start_time.substring(0, 5) : ''} - ${res.end_time ? res.end_time.substring(0, 5) : ''}</td>
                    <td><span class="${statusClass}">${res.status.charAt(0).toUpperCase() + res.status.slice(1)}</span></td>
                    <td>
                        <select class="form-select form-select-sm reservation-status-select" data-id="${res.id}">
                            <option value="pending" ${res.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${res.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="canceled" ${res.status === 'canceled' ? 'selected' : ''}>Canceled</option>
                            <option value="completed" ${res.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                        <button class="btn btn-danger btn-sm delete-reservation-admin-btn mt-1" data-id="${res.id}">Hapus</button>
                    </td>
                </tr>
            `;
            reservationsTableBody.innerHTML += row;
        });

        document.querySelectorAll('.reservation-status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const reservationId = e.target.dataset.id;
                const newStatus = e.target.value;
                try {
                    await callApi(`${API_BASE_URL}/reservations/${reservationId}/status`, 'PUT', { status: newStatus }, true);
                    alert('Status reservasi berhasil diperbarui!');
                    loadAdminReservations(); // Reload list
                } catch (error) {
                    alert('Gagal memperbarui status: ' + error.message);
                }
            });
        });

        document.querySelectorAll('.delete-reservation-admin-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const reservationId = e.target.dataset.id;
                if (confirm('Apakah Anda yakin ingin menghapus reservasi ini secara permanen?')) {
                    try {
                        await callApi(`${API_BASE_URL}/reservations/${reservationId}`, 'DELETE', null, true);
                        alert('Reservasi berhasil dihapus secara permanen!');
                        loadAdminReservations(); // Reload list
                    } catch (error) {
                        alert('Gagal menghapus reservasi: ' + error.message);
                    }
                }
            });
        });

    } catch (error) {
        alert('Gagal memuat reservasi admin: ' + error.message);
    }
}


// --- Field Detail & Reservation Modal Functions ---
async function showFieldDetailModal(fieldId) {
    // console.log(`Showing detail for field ID: ${fieldId}`); // Debug
    const isUserLoggedIn = localStorage.getItem('authToken');
    const reservationFormContainer = document.getElementById('reservation-form-container');
    const bookingLoginRequiredMessage = document.getElementById('booking-login-required-message');
    const reservationMessageDiv = document.getElementById('reservation-message');

    // Reset form and messages
    document.getElementById('reserve-field-form')?.reset(); // Use optional chaining
    if(reservationMessageDiv) reservationMessageDiv.textContent = '';
    if(document.getElementById('available-slots')) document.getElementById('available-slots').innerHTML = '<option value="">Select a date first</option>';

    try {
        const field = await callApi(`${API_BASE_URL}/fields/${fieldId}`);
        // console.log('Field data for modal:', field); // Debug

        document.getElementById('modal-field-name').textContent = field.name;
        document.getElementById('modal-field-sport-type').textContent = field.sport_type;
        document.getElementById('modal-field-address').textContent = field.address;
        document.getElementById('modal-field-description').textContent = field.description || 'No description available.';
        document.getElementById('modal-field-price').textContent = field.price_per_hour;
        document.getElementById('reserve-field-id').value = field.id;

        if (isUserLoggedIn) {
            if (reservationFormContainer) reservationFormContainer.style.display = 'block';
            if (bookingLoginRequiredMessage) bookingLoginRequiredMessage.style.display = 'none';
        } else {
            if (reservationFormContainer) reservationFormContainer.style.display = 'none';
            if (bookingLoginRequiredMessage) bookingLoginRequiredMessage.style.display = 'block';
        }

        fieldDetailModalInstance.show();
    } catch (error) {
        alert('Gagal memuat detail lapangan: ' + error.message);
    }
}

document.getElementById('reservation-date')?.addEventListener('change', async (e) => { // Optional chaining
    const fieldId = document.getElementById('reserve-field-id')?.value; // Optional chaining
    const selectedDate = e.target.value;
    const slotsSelect = document.getElementById('available-slots');
    const reservationMessageDiv = document.getElementById('reservation-message');

    if (!fieldId) {
        console.error("Error: Field ID not found for reservation date change.");
        return;
    }

    if (!slotsSelect) {
        console.error("Error: Element with ID 'available-slots' not found.");
        return;
    }

    slotsSelect.innerHTML = '<option value="">Loading slots...</option>';
    if (reservationMessageDiv) reservationMessageDiv.textContent = ''; // Clear previous messages

    try {
        const response = await callApi(`${API_BASE_URL}/fields/${fieldId}/available-slots?date=${selectedDate}`);
        // console.log('Available slots response:', response); // Debug
        slotsSelect.innerHTML = '';
        if (response.length === 0) {
            slotsSelect.innerHTML = '<option value="">No slots available for this date</option>';
        } else {
            response.forEach(slot => {
                const disabled = slot.is_booked ? 'disabled' : '';
                const text = slot.is_booked ? `${slot.start} - ${slot.end} (Booked)` : `${slot.start} - ${slot.end}`;
                slotsSelect.innerHTML += `<option value="${slot.start}-${slot.end}" ${disabled}>${text}</option>`;
            });
            if (slotsSelect.options.length === 0) {
                slotsSelect.innerHTML = '<option value="">No available slots</option>';
            }
        }
    } catch (error) {
        slotsSelect.innerHTML = '<option value="">Error loading slots</option>';
        alert('Gagal memuat slot waktu: ' + error.message);
    }
});

document.getElementById('reserve-field-form')?.addEventListener('submit', async (e) => { // Optional chaining
    e.preventDefault();
    const fieldId = document.getElementById('reserve-field-id')?.value; // Optional chaining
    const reservationDate = document.getElementById('reservation-date')?.value; // Optional chaining
    const selectedSlot = document.getElementById('available-slots')?.value; // Optional chaining
    const reservationMessageDiv = document.getElementById('reservation-message');

    if (!fieldId || !reservationDate || !selectedSlot || !reservationMessageDiv) {
        console.error("Error: Missing form elements for reservation submission.");
        if (reservationMessageDiv) reservationMessageDiv.textContent = 'Missing form data. Please check console.';
        return;
    }

    if (!selectedSlot) {
        reservationMessageDiv.textContent = 'Pilih slot waktu terlebih dahulu.';
        return;
    }

    const [start_time, end_time] = selectedSlot.split('-');

    const data = {
        field_id: fieldId,
        reservation_date: reservationDate,
        start_time: start_time,
        end_time: end_time,
    };

    try {
        await callApi(`${API_BASE_URL}/reservations`, 'POST', data, true);
        alert('Reservasi berhasil dibuat! Menunggu konfirmasi.');
        fieldDetailModalInstance.hide();
        loadMyReservations(); // Refresh my reservations list
    } catch (error) {
        reservationMessageDiv.textContent = 'Gagal membuat reservasi: ' + error.message;
    }
});


// --- Event Listeners for Navbar Navigation ---
document.getElementById('nav-home')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadFields();
});

document.getElementById('nav-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('login-form-container');
});

document.getElementById('nav-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSection('register-form-container');
});

document.getElementById('show-my-reservations')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadMyReservations();
});

document.getElementById('show-admin-dashboard')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadAdminDashboard();
});

document.getElementById('nav-logout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await callApi(`${API_BASE_URL}/logout`, 'POST', null, true);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        alert('Logout berhasil!');
        updateNavbar();
        loadFields(); // Go back to field list
    } catch (error) {
        alert('Logout gagal: ' + error.message);
    }
});

// --- Authentication Forms Handler ---
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorDiv = document.getElementById('login-error');

    if (!emailInput || !passwordInput || !errorDiv) {
        console.error("Error: Login form elements not found.");
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;
    errorDiv.textContent = ''; // Clear previous errors

    try {
        const response = await callApi(`${API_BASE_URL}/login`, 'POST', { email, password });
        console.log('Login API Response (Frontend):', response); // Debug: Respons API di frontend
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.user.role);
        alert('Login berhasil!');
        errorDiv.textContent = ''; // Clear again on success
        updateNavbar();
        loadFields(); // Load fields after successful login
    } catch (error) {
        console.error('Frontend Login Error:', error); // Debug: Error yang ditangkap di frontend
        errorDiv.textContent = 'Login gagal: ' + error.message;
    }
});

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');
    const passwordConfirmInput = document.getElementById('register-password-confirm');
    const errorDiv = document.getElementById('register-error');

    if (!nameInput || !emailInput || !passwordInput || !passwordConfirmInput || !errorDiv) {
        console.error("Error: Register form elements not found.");
        return;
    }

    const name = nameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;
    errorDiv.textContent = ''; // Clear previous errors

    if (password !== passwordConfirm) {
        errorDiv.textContent = 'Konfirmasi password tidak cocok.';
        return;
    }

    try {
        const response = await callApi(`${API_BASE_URL}/register`, 'POST', { name, email, password, password_confirmation: passwordConfirm });
        console.log('Register API Response (Frontend):', response); // Debug
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userRole', response.user.role);
        alert('Registrasi berhasil!');
        errorDiv.textContent = ''; // Clear again on success
        updateNavbar();
        loadFields(); // Load fields after successful registration
    } catch (error) {
        console.error('Frontend Register Error:', error); // Debug
        errorDiv.textContent = 'Registrasi gagal: ' + error.message;
    }
});


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap Modals
    fieldDetailModalInstance = new bootstrap.Modal(document.getElementById('fieldDetailModal'));
    fieldModalInstance = new bootstrap.Modal(document.getElementById('fieldModal'));

    updateNavbar();
    // Decide which section to show on initial load based on auth token
    if (!localStorage.getItem('authToken')) {
        showSection('login-form-container'); // Show login by default if not logged in
    } else {
        loadFields(); // Show fields if logged in
    }
});