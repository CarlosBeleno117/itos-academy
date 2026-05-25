const bcrypt = require("bcryptjs");
const connection = require("./db");

async function resetPasswords() {
  try {
    const passwordPlano = "123456";
    const passwordHash = await bcrypt.hash(passwordPlano, 10);

    const sql = `
      UPDATE usuarios
      SET password_hash = ?
    `;

    connection.query(sql, [passwordHash], (err, result) => {
      if (err) {
        console.log("Error actualizando contraseñas:", err);
        connection.end();
        return;
      }

      console.log("Contraseñas actualizadas correctamente.");
      console.log("Usuarios afectados:", result.affectedRows);
      console.log("Nueva contraseña para todos: 123456");

      connection.end();
    });
  } catch (error) {
    console.log("Error generando hash:", error);
    connection.end();
  }
}

resetPasswords();