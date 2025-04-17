import authRoutes from "./routes/authRoutes";
import friendRoutes from "./routes/friendRoutes";
import gameRoutes from "./routes/gameRoutes"
import leaderboardRoutes from "./routes/leaderboardRoutes";

const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors());
app.use(express.json())
app.use('/auth',authRoutes);
app.use('/games',gameRoutes);
app.use('/friends',friendRoutes);
app.use('/leaderboard',leaderboardRoutes);

export default app