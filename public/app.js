const express = require("express");
const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const { promisify } = require("util");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const port = 3000;

var justOne = false;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

let contadorInterval;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/activar-timer", (req, res) => {
  if (!justOne) {
    iniciarContadorEnTiempoReal();
    res.send("Temporizador de 60 segundos iniciado");
    justOne = true;
  } else {
    res.send("Temporizador ya iniciado");
  }
});

app.get("/resetear-timer", (req, res) => {
  iniciarContadorEnTiempoReal();
  res.send("Temporizador reseteado");
});

async function enviarCorreo() {
  try {
    const archivoAdjunto = await fs.readFile(
      path.join(__dirname, "archivo.txt")
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.DESTINATARIOS,
      subject: "Asunto del correo",
      text: "Cuerpo del correo",
      attachments: [
        {
          filename: "archivo.txt",
          content: archivoAdjunto,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    console.log("Correo enviado con éxito");
  } catch (error) {
    console.error("Error al enviar el correo:", error);
  }
}

function iniciarContadorEnTiempoReal() {
  let segundosRestantes = 60;

  io.on("detener-contador", () => {
    clearInterval(contadorInterval);
  });

  contadorInterval = setInterval(() => {
    segundosRestantes -= 1;

    io.emit("tiempo-restante", segundosRestantes);

    console.log("Tiempo restante:", segundosRestantes);

    if (segundosRestantes <= 0) {
      enviarCorreo();
      clearInterval(contadorInterval);
    }
  }, 1000);
}

app.use(express.static(__dirname));

server.listen(port, () => {
  console.log(`La aplicación está escuchando en http://localhost:${port}`);
});
