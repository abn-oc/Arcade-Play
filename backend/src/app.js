"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use('/auth', authRoutes_1.default);
exports.default = app;
