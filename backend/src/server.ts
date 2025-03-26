import app from "./app";
import connectDB from "./config/db";
const port = 3000

connectDB()

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})