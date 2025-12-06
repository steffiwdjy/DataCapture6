const mysql = require('mysql2/promise');
const { faker } = require('@faker-js/faker');

// CONFIGURATION
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hotel_booking_2'
};

// --- HELPER: SUSPICIOUS COMMENTS ---
const suspiciousComments = [
    "Ditemukan alat suntik di tempat sampah",
    "Ditemukan kondom dalam jumlah banyak",
    "Kerusakan parah pada fasilitas",
    "Kebisingan berlebihan di malam hari",
    "Penyalahgunaan alkohol/narkoba",
    "Kekerasan atau ancaman kepada penghuni lain",
    "Merokok di area terlarang",
    "Tidak menjaga kebersihan unit",
    "Terpantau adanya tamu yang keluar masuk pada malam hari",
    "Menyewakan kembali unit yang disewa"
];

// --- HELPER: GENERATE REALISTIC NIK ---
function generateNIK(sex, birthDate) {
    const province = faker.helpers.arrayElement(['31', '32', '33', '34', '35', '36', '51']);
    const city = faker.string.numeric(2);
    const district = faker.string.numeric(2);
    const regionCode = `${province}${city}${district}`;

    let day = birthDate.getDate();
    const month = (birthDate.getMonth() + 1).toString().padStart(2, '0');
    const year = birthDate.getFullYear().toString().slice(-2);

    if (sex === 'female') {
        day += 40;
    }
    const dayCode = day.toString().padStart(2, '0');
    const serial = faker.string.numeric(4);

    return `${regionCode}${dayCode}${month}${year}${serial}`;
}

async function seed() {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database...");

    try {
        // =================================================
        // STEP 0: CLEAN DATABASE
        // =================================================
        console.log("Cleaning old data...");
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE violations');
        await connection.query('TRUNCATE TABLE rental_logs');
        await connection.query('TRUNCATE TABLE rentals');
        await connection.query('TRUNCATE TABLE units');
        await connection.query('TRUNCATE TABLE users');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // =================================================
        // STEP 1: SEED USERS
        // =================================================
        console.log("Seeding Users...");
        const users = [];

        for (let i = 0; i < 50; i++) {
            users.push([
                faker.internet.email(),
                faker.internet.password(),
                faker.string.numeric(13),
                'agen',
                faker.person.fullName()
            ]);
        }
        // Add Admin
        users.push([faker.internet.email(), faker.internet.password(), faker.string.numeric(13), 'ketua agen', faker.person.fullName()]);

        await connection.query(`INSERT INTO users (email, password, nib, role, name) VALUES ?`, [users]);

        // Fetch emails for child tables
        const [userRows] = await connection.query('SELECT email FROM users');
        const allEmails = userRows.map(u => u.email);

        // =================================================
        // STEP 2: SEED UNITS
        // =================================================
        console.log(`Seeding Units (15 per user)...`);
        const units = [];
        const usedUnitNumbers = new Set();

        for (const email of allEmails) {
            for (let i = 0; i < 15; i++) {
                let isUnique = false;
                let formattedUnit = '';
                while (!isUnique) {
                    const tower = faker.helpers.arrayElement(['A', 'B', 'C', 'D']);
                    const lantai = faker.number.int({ min: 1, max: 25 });
                    const unitNum = faker.number.int({ min: 1, max: 30 });
                    formattedUnit = `${tower}-${lantai}-${unitNum}`;
                    if (!usedUnitNumbers.has(formattedUnit)) {
                        usedUnitNumbers.add(formattedUnit);
                        isUnique = true;
                        units.push([formattedUnit, email, tower, lantai, unitNum]);
                    }
                }
            }
        }

        const unitChunkSize = 1000;
        for (let i = 0; i < units.length; i += unitChunkSize) {
            await connection.query(`INSERT INTO units (unit_number, user_email, tower, lantai, unit) VALUES ?`, [units.slice(i, i + unitChunkSize)]);
        }

        // =================================================
        // STEP 3: SEED RENTALS (BATCHED INSERT)
        // =================================================
        console.log("Seeding Rentals (Generating data)...");
        const rentals = [];
        const rentalCount = 10000;

        // FIX: Fetch ID AND Email so we can match them
        const [unitObjects] = (await connection.query('SELECT id, user_email FROM units'));

        for (let i = 0; i < rentalCount; i++) {
            // A. Identity
            const sex = faker.person.sexType();
            const fullName = `${faker.person.firstName(sex)} ${faker.person.lastName(sex)}`;
            const birthDate = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
            const realNIK = generateNIK(sex, birthDate);

            // B. RENTAL TYPE & DURATION LOGIC
            const jenis_sewa = faker.helpers.arrayElement(['Harian', 'Mingguan', 'Bulanan']);
            let lama_menginap = 0;

            if (jenis_sewa === 'Harian') {
                lama_menginap = faker.number.int({ min: 0, max: 6 });
            } else if (jenis_sewa === 'Mingguan') {
                const weeks = faker.number.int({ min: 1, max: 3 });
                lama_menginap = weeks * 7;
            } else { // Bulanan
                const months = faker.number.int({ min: 1, max: 5 });
                lama_menginap = months * 30;
            }

            // C. CALCULATE DATES
            const checkinObj = faker.date.between({ from: '2010-01-01', to: new Date() });
            const checkoutObj = new Date(checkinObj);
            checkoutObj.setDate(checkoutObj.getDate() + lama_menginap);

            // Handle Times
            if (lama_menginap === 0) {
                const hoursToAdd = faker.number.int({ min: 3, max: 12 });
                checkoutObj.setHours(checkoutObj.getHours() + hoursToAdd);
            } else {
                checkinObj.setHours(faker.number.int({ min: 13, max: 20 }));
                checkinObj.setMinutes(faker.number.int({ min: 0, max: 59 }));
                checkoutObj.setHours(faker.number.int({ min: 7, max: 12 }));
                checkoutObj.setMinutes(faker.number.int({ min: 0, max: 59 }));
            }

            // D. FORMAT SQL
            const sqlCheckinDate = checkinObj.toISOString().slice(0, 10);
            const sqlCheckinTime = checkinObj.toTimeString().split(' ')[0];
            const sqlCheckoutDate = checkoutObj.toISOString().slice(0, 10);
            const sqlCheckoutTime = checkoutObj.toTimeString().split(' ')[0];

            const oneDay = 24 * 60 * 60 * 1000;
            const d1 = new Date(sqlCheckinDate);
            const d2 = new Date(sqlCheckoutDate);
            const finalDuration = Math.round(Math.abs((d2 - d1) / oneDay));

            // E. COMMENT LOGIC
            const paymentMethod = faker.helpers.arrayElement(['Cash', 'Kartu Kredit', 'Kartu Debit', 'QRIS', 'Others']);
            const checkoutHour = checkoutObj.getHours();

            let selectedKomentar = null;
            let shouldAddComment = false;

            if (finalDuration <= 1) {
                if (Math.random() < 0.80) shouldAddComment = true;
            }
            else if ((checkoutHour >= 0 && checkoutHour <= 5) && paymentMethod === 'Cash') {
                if (Math.random() < 0.75) shouldAddComment = true;
            }

            if (shouldAddComment) {
                selectedKomentar = faker.helpers.arrayElement(suspiciousComments);
            }

            // F. PICK RANDOM UNIT (AND MATCH OWNER)
            const randomUnit = faker.helpers.arrayElement(unitObjects);

            rentals.push([
                fullName,
                realNIK,
                faker.helpers.arrayElement(['Menikah', 'Belum Menikah']),
                faker.helpers.arrayElement(['WNI', 'WNA']),
                jenis_sewa,
                randomUnit.id, // Correct Unit ID
                paymentMethod,
                paymentMethod === 'Others' ? faker.helpers.arrayElement(['crypto', 'ovo', 'gopay', 'dana', 'paylater', 'shopeepay', 'linkaja']) : null,
                sqlCheckinDate,
                sqlCheckinTime,
                sqlCheckoutDate,
                sqlCheckoutTime,
                finalDuration,
                selectedKomentar,
                randomUnit.user_email, // FIX: Match the email to the unit owner
                null,
                selectedKomentar ? 'tidak normal' : 'normal'
            ]);
        }

        // --- BATCH INSERT FIX FOR 10,000 ROWS ---
        console.log("Inserting Rentals in batches...");
        const rentalChunkSize = 2000; // Insert 2000 at a time to prevent timeout
        for (let i = 0; i < rentals.length; i += rentalChunkSize) {
            const chunk = rentals.slice(i, i + rentalChunkSize);
            await connection.query(
                `INSERT INTO rentals (nama, nik, status_pasutri, status_kewarganegaraan, jenis_sewa, unit_id, metode_pembayaran, metode_lain, tanggal_checkin, waktu_checkin, tanggal_checkout, waktu_checkout, lama_menginap, komentar, user_email, diedit_oleh, classification) VALUES ?`,
                [chunk]
            );
            console.log(`Inserted rentals batch ${i} to ${i + chunk.length}`);
        }

        // =================================================
        // STEP 4: SEED LOGS & VIOLATIONS
        // =================================================
        console.log("Seeding Logs and Violations...");
        const [rentalRows] = await connection.query('SELECT id FROM rentals');
        const rentalIds = rentalRows.map(r => r.id);

        const logs = [];
        const fake = (type,old) => {
            let value = "";
            if (type === 'waktu_checkout') {
                value = faker.date.future().toISOString().slice(0, 19).replace('T', ' ');
            } else if (type === 'metode_pembayaran') {
                value = faker.helpers.arrayElement(['Cash', 'Kartu Kredit', 'Kartu Debit', 'QRIS']);
            } else if (type === 'jenis_sewa') {
                value = faker.helpers.arrayElement(['Harian', 'Mingguan', 'Bulanan']);
            } else if (type === 'komentar') {
                // add several susspicious comments randomly unique
                const size = Math.floor(Math.random() * 4) + 1;
                const randomizedComment = faker.helpers.shuffle(suspiciousComments);
                const comments = randomizedComment.slice(0, size).join(",");
                value = comments;
            }
            if (value == old) {
                return fake(type,old);
            }
            return value;
        }
        let rentaUpdate = [];
        for (let i = 0; i < 50; i++) {
            const field = faker.helpers.arrayElement(['waktu_checkout', 'metode_pembayaran', 'jenis_sewa', 'komentar']);
            const firstFieldValue = fake(field);
            const rentalId = faker.helpers.arrayElement(rentalIds);
            const email = faker.helpers.arrayElement(allEmails);
            logs.push([rentalId,
            faker.helpers.arrayElement(['create','update']),
            field,
            firstFieldValue,
            fake(field,firstFieldValue),
            email]);
            rentaUpdate.push([rentalId,email]);
        }
        await connection.query(`INSERT INTO rental_logs (rental_id, action, field_changed, old_value, new_value, email) VALUES ?`, [logs]);
        await connection.query(`UPDATE rentals FROM (rental_id, diedit_oleh) VALUES ?`, [rentaUpdate]);

        const violations = [];
        for (let i = 0; i < 20; i++) {
            violations.push([faker.helpers.arrayElement(rentalIds), faker.image.url(), faker.lorem.sentence(), faker.helpers.arrayElement(allEmails)]);
        }
        await connection.query(`INSERT INTO violations (rental_id, photo_url, description, uploaded_by) VALUES ?`, [violations]);

        console.log("Database seeded successfully!");
        process.exit();

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();