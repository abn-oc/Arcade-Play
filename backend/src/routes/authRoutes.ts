import express from "express";

const authRoutes = express.Router();

authRoutes.get('/', (req, res) => {
  res.send('Hello World!')
})

export default authRoutes;
