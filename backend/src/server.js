const env = require("./config/env");
const app = require("./app");
const { initDb } = require("./database/initDb");

initDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Servidor de Licorería Fun Full en http://localhost:${env.port}`);
    });
  })
  .catch((error) => {
    console.error("No se pudo inicializar PostgreSQL:", error.message);
    process.exit(1);
  });
