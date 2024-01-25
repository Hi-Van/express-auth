import express, { Express, Request, Response } from "express";
import v1Router from "./routes/v1/index.js";

const port = 8000;
const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/v1", v1Router);

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello world");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
