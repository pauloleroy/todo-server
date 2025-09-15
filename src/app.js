import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import bodyParserMiddleware from "./middlewares/bodyParser.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true
}));


app.use(morgan("dev")); // log básico no console

// Middleware de body parser (global)
bodyParserMiddleware(app);

// Rotas
app.use("/api", routes);

// Middleware global de erros
app.use(errorHandler);

export default app;
