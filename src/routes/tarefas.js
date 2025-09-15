import express from "express";
import pool from "../db/pool.js";
import authMiddleware from "../middlewares/requireAuth.js";

const router = express.Router();

router.use(authMiddleware);

// GET /api/tarefas?mesAtual=yyyy-mm-01
router.get("/", async (req, res, next) => {
  try {
    const { mesAtual } = req.query;

    if (!mesAtual) {
      return res.status(400).json({ success: false, message: "mesAtual é obrigatório" });
    }

    const { rows } = await pool.query(`
      SELECT DISTINCT COALESCE(e.tarefa_nome, t.nome) AS nome
      FROM execucoes e
      LEFT JOIN empresa_tarefas et ON e.empresa_tarefa_id = et.id
      LEFT JOIN tarefas t ON et.tarefa_id = t.id
      WHERE 
        (e.status != 'Concluído')
        OR (e.status = 'Concluído' AND e.mes_ref >= ($1::date - interval '2 months'))
      ORDER BY nome
    `, [mesAtual]);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
