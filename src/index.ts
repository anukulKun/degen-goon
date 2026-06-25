import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { DegenAgent } from "./agent";
import { startProvider } from "./provider";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;
const agent = new DegenAgent(process.env.CAP_API_KEY ?? "demo-key");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.post("/api/roast", async (req, res) => {
  const { address } = req.body;

  if (!address) {
    res.status(400).json({ success: false, error: "Address is required" });
    return;
  }

  const result = await agent.handle({ address, action: "roast" });
  res.json(result);
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", agent: "degen-goon" });
});

app.listen(PORT, () => {
  console.log(`🫡 degens assemble — http://localhost:${PORT}`);
});

startProvider();
