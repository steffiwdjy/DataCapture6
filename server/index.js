const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");

const { DatabaseManager } = require("./config/DatabaseManager");

const app = express();
dotenv.config({ path: "./config/.env" });

new DatabaseManager(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    process.env.DB_HOSTNAME,
    process.env.DB_PORT,
    process.env.DB_DIALECT
);

// Load all models after DatabaseManager is initialized
require("./database/models");

DatabaseManager.authenticate(process.env.DB_NAME); // Call authenticate on the instance

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json()); //untuk server dapat menerima req body/params/query dari client menjadi format json
app.use(express.urlencoded({ extended: true })); //agar server bisa membaca req dsri client
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        methods: ["POST", "GET", "DELETE", "PUT", "PATCH", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "authorization"],
        exposedHeaders: ["authorization"],
    })
);

// Initialize database after a short delay to ensure authentication completes
// setTimeout(async () => {
//     await DatabaseManager.synchronize(process.env.DB_NAME, false);
//     await DatabaseManager.seedData(process.env.DB_NAME, false);
// }, 1000);

const { router } = require("./routes");
app.use("/api", router);

const port = 3000;
app.listen(port, () => {
    console.log(`>> Server is running on http://localhost:${port}`);
});
