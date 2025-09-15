import express from "express";
import pool from "../db/pool.js";
import authMiddleware from "../middlewares/requireAuth.js";

const router = express.Router();

router.use(authMiddleware);

// 1. PATCH em execuções
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, vencimento, obs, responsavel_id } = req.body;

    const { rows } = await pool.query(
      `UPDATE execucoes
       SET status = COALESCE($1, status),
           vencimento = COALESCE($2, vencimento),
           obs = COALESCE($3, obs),
           responsavel_id = COALESCE($4, responsavel_id),
           updated_at = now()
       WHERE id = $5
       RETURNING *`,
      [status, vencimento, obs, responsavel_id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Execução não encontrada" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// 2. POST de renderização (com filtro de histórico)
router.post("/render", async (req, res, next) => {
  try {
    const { mesAtual } = req.body; // yyyy-mm-01

    if (!mesAtual) {
      return res.status(400).json({ success: false, message: "mesAtual é obrigatório" });
    }

    const { rows } = await pool.query(
      `
      SELECT 
        e.id,
        e.mes_ref,
        e.vencimento,
        e.status,
        e.obs,
        COALESCE(e.empresa_nome, emp.nome) AS empresa,
        COALESCE(e.tarefa_nome, t.nome) AS tarefa,
        p.nome AS responsavel
      FROM execucoes e
      LEFT JOIN empresa_tarefas et ON e.empresa_tarefa_id = et.id
      LEFT JOIN empresas emp ON et.empresa_id = emp.id
      LEFT JOIN tarefas t ON et.tarefa_id = t.id
      LEFT JOIN pessoas p ON e.responsavel_id = p.id
      WHERE 
        e.status != 'Concluído'
        OR (
          e.status = 'Concluído' 
          AND date_trunc('month', e.mes_ref) >= date_trunc('month', $1::date) - interval '2 months'
        )
      ORDER BY e.vencimento ASC
      `,
      [mesAtual]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});


// 3. POST tarefa avulsa
router.post("/avulsa", async (req, res, next) => {
  try {
    const {
      empresa_tarefa_id,   // opcional se for vinculada a uma tarefa existente
      responsavel_id,      // opcional
      empresa_nome,        // usado se for avulsa
      tarefa_nome,         // usado se for avulsa
      mes_ref,
      vencimento,
      obs
    } = req.body;

    if (!mes_ref || !vencimento) {
      return res.status(400).json({ success: false, message: "mes_ref e vencimento são obrigatórios" });
    }

    const { rows } = await pool.query(
      `INSERT INTO execucoes 
       (empresa_tarefa_id, responsavel_id, empresa_nome, tarefa_nome, mes_ref, vencimento, status, obs)
       VALUES ($1, $2, $3, $4, $5, $6, 'Em aberto', $7)
       RETURNING *`,
      [empresa_tarefa_id || null, responsavel_id || null, empresa_nome || null, tarefa_nome || null, mes_ref, vencimento, obs || null]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// 4. POST mensal: gera execuções do novo mês
router.post("/mensal", async (req, res, next) => {
  try {
    const { mesNovo } = req.body; // yyyy-mm-01

    if (!mesNovo) {
      return res.status(400).json({ success: false, message: "mesNovo é obrigatório" });
    }

    // Cria execuções apenas para tarefas válidas no mês
    await pool.query(
      `
      INSERT INTO execucoes (empresa_tarefa_id, responsavel_id, mes_ref, vencimento, status)
      SELECT 
        et.id,
        et.responsavel_id,
        $1::date,
        CASE
          WHEN d_text = 'last' THEN (date_trunc('month', $1::date) + interval '1 month - 1 day')::date
          ELSE (date_trunc('month', $1::date) + (d_text::int - 1) * interval '1 day')::date
        END,
        'Em aberto'
      FROM empresa_tarefas et
      JOIN tarefas t ON et.tarefa_id = t.id,
           unnest(t.dias::text[]) AS d_text
      WHERE et.is_deleted = false
        AND (EXTRACT(MONTH FROM $1::date)) = ANY(t.meses);
      `,
      [mesNovo]
    );

    res.json({ success: true, message: "Execuções do mês criadas com sucesso" });
  } catch (err) {
    next(err);
  }
});


export default router;
