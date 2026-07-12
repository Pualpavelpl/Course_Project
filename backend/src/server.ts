import express from "express";
import cors from "cors";

import helloRouter from "./routes/hello.routes.js";

const app = express();

const PORT = process.env.PORT ?? 5000;

app.use(cors());
app.use(express.json());

app.use("/api/hello", helloRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
