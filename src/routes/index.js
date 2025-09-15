import express from "express";
import empresasRoutes from "./empresas.js";
import pessoasRoutes from "./pessoas.js";
import execucoesRoutes from "./execucoes.js";
import tarefasRoutes from "./tarefas.js"
import authRoutes from "./auth.js"

const router = express.Router();

router.use("/empresas", empresasRoutes);
router.use("/pessoas", pessoasRoutes);
router.use("/execucoes", execucoesRoutes);
router.use("/tarefas", tarefasRoutes);
router.use("/auth", authRoutes);

export default router;
