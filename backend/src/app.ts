import authRoutes from "./routes/authRoutes";
import friendRoutes from "./routes/friendRoutes";
import gameRoutes from "./routes/gameRoutes";
import leaderboardRoutes from "./routes/leaderboardRoutes";
import globalChatRoute from './routes/globalChatRoute';
import requestRoutes from "./routes/requestRoutes";


const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/games", gameRoutes);
app.use("/friends", friendRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use('/globalchat', globalChatRoute);
app.use('/requests', requestRoutes);


export default app;
