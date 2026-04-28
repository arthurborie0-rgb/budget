import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";

import { kv } from "@vercel/kv";
const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = path.resolve();
const DATA_FILE = path.join(__dirname, "data.json");

// Utilisation de KV sur Vercel, sinon FileSystem en local
const useKV = process.env.KV_REST_API_URL !== undefined;

// Middleware
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Sert les fichiers du dossier courant (attention en prod)

// Route pour servir la page principale
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "budget.html"));
});

// Lecture des données
app.get("/api/budget", async (req, res) => {
    if (useKV) {
        try {
            const data = await kv.get("budget_data");
            return res.json(data || { event: {}, expenses: [], categories: [] });
        } catch (e) {
            return res.status(500).json({ error: "KV Read Error" });
        }
    }

    fs.readFile(DATA_FILE, "utf-8", (err, data) => {
        if (err) {
            if (err.code === "ENOENT") return res.json({ event: {}, expenses: [], categories: [] });
            return res.status(500).json({ error: "Error reading data file" });
        }
        try {
            res.json(JSON.parse(data || "{}"));
        } catch (e) {
            res.status(500).json({ error: "Invalid JSON format" });
        }
    });
});

// Sauvegarde des données
app.post("/api/budget", async (req, res) => {
    const payload = req.body;

    if (useKV) {
        try {
            await kv.set("budget_data", payload);
            return res.json({ status: "ok" });
        } catch (e) {
            return res.status(500).json({ error: "KV Write Error" });
        }
    }

    fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8", (err) => {
        if (err) return res.status(500).json({ error: "Error writing data file" });
        res.json({ status: "ok" });
    });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
