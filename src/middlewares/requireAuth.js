// src/middlewares/requireAuth.js
import jwt from "jsonwebtoken";
import pool from "../db/pool.js";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "Não autorizado" });

    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);

    // opcional: buscar usuário no DB para garantir que ainda existe
    const result = await pool.query("SELECT id, email, role FROM usuarios WHERE id = $1", [payload.userId]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: "Usuário não encontrado" });

    req.user = user; // agora suas rotas podem usar req.user
    return next();
  } catch (err) {
    console.error("requireAuth error:", err);
    return res.status(401).json({ message: "Token inválido" });
  }
}
