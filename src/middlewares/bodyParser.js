import express from "express";

export default function bodyParserMiddleware(app) {
  app.use(express.json()); // para JSON
  app.use(express.urlencoded({ extended: true })); // para x-www-form-urlencoded
}
