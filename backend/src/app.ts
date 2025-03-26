import authRoutes from "./routes/authRoutes";

const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors());
app.use('/auth',authRoutes);

export default app