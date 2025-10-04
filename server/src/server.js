import app from "./app.js";
import { PORT } from "./config.js";
import { seedDemoUser } from "./storage/users.js";

async function bootstrap() {
  try {
    await seedDemoUser();
    app.listen(PORT, () => {
      console.log(`BeFree API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();
