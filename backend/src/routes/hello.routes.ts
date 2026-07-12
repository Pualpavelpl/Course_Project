import { Router } from "express";

const helloRouter = Router();

helloRouter.get("/", (_req, res) => {
  res.json({
    message: "Hello world!",
  });
});

export default helloRouter;
