import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = path.resolve();
const DATA_FILE = path.join(__dirname, "data.json");

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Sert les fichiers du dossier courant (attention en prod)

// Route pour servir la page principale
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "budget.html"));
});

// Lecture des données
app.get("/api/budget", (req, res) => {
    fs.readFile(DATA_FILE, "utf-8", (err, data) => {
        if (err) {
            if (err.code === "ENOENT") {
                return res.json({ event: {}, expenses: [], categories: [] });
            }
            return res.status(500).json({ error: "Error reading data file" });
        }
        try {
            const json = JSON.parse(data || "{}");
            res.json({
                event: json.event || {},
                expenses: json.expenses || [],
                categories: json.categories || [],
            });
        } catch (e) {
            res.status(500).json({ error: "Invalid JSON format" });
        }
    });
});

// Sauvegarde des données complètes
app.post("/api/budget", (req, res) => {
    const { event, expenses, categories } = req.body;
    const payload = { 
        event: event || {}, 
        expenses: expenses || [], 
        categories: categories || [] 
    };

    fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8", (err) => {
        if (err) {
            return res.status(500).json({ error: "Error writing data file" });
        }
        res.json({ status: "ok" });
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});