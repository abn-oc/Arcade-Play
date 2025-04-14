import authRoutes from "./routes/authRoutes";
import gameRoutes from "./routes/gameRoutes"

const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors());
app.use(express.json())
app.use('/auth',authRoutes);
app.use('/games',gameRoutes);

export default app