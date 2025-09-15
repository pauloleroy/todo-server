// src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/pool.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Retorna: { token, user: { id, email, role } }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "email e password são obrigatórios" });

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM usuarios WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: "Email ou senha inválidos" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Email ou senha inválidos" });

    // atualiza last_login
    await pool.query("UPDATE usuarios SET last_login = NOW() WHERE id = $1", [user.id]);

    // gera token JWT (payload mínimo)
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Auth login error:", err);
    return res.status(500).json({ message: "Erro interno" });
  }
});

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Retorna info do usuário (verifica token)
 */
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: "Nenhum token fornecido" });
    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      "SELECT id, email, role, created_at, updated_at, last_login FROM usuarios WHERE id = $1",
      [payload.userId]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: "Usuário não existe" });

    return res.json({ user });
  } catch (err) {
    console.error("Auth /me error:", err);
    return res.status(401).json({ message: "Token inválido ou expirado" });
  }
});

export default router;
