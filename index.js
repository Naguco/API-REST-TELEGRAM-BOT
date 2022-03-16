const express = require('express');
const services = require('./services');
const basicAuth = require('express-basic-auth');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const token = '5289990111:AAHNkZQkFY9uj6bUemB8kiIcCdxWc7-H_c4';

const bot = new TelegramBot(token, {polling: true});

const app = express();

app.use(express.json());


// Get del último estado de un solo registro
app.get('/devices/:mac/:registry', async (req, res) => {
    try {
        const { mac, registry } = req.params;
        let response = await services.getSingleRegistry(mac, registry);
        return res.status(200).json({ response: response.hits.hits[0]._source });
    } catch(err) {
        console.error(err);
        return res.status(500).json({ error: err });
    }
});

// Reiniciar dispositivo - con contraseña (Válido para iniciar rutina de reinicio de dispositivo)
app.put('/restart/:mac', basicAuth({ users: { 'admin': 'adminUPM2022' } }), async (req, res) => {
    try {
        const { mac } = req.params;
        let response = await services.publishValue(mac, '0', 'restart');
        return res.status(200).json({ response });
    } catch(err) {
        console.error(err);
        return res.status(500).json({ error: err });
    }
});

// Modificar registro - con contraseña
app.put('/devices/:mac/:registry', basicAuth({ users: { 'admin': 'adminUPM2022' } }), async (req, res) => {
    try {
        const { mac, registry } = req.params;
        const { value } = req.body;
        let response = await services.publishValue(mac, String(value), registry);
        return res.status(200).json({ response });
    } catch(err) {
        console.error(err);
        return res.status(500).json({ error: err });
    }
});

// Generar excel
app.put('toExcel/:mac', async(req, res) => {
    try {
        const { mac } = req.params;
        const buffer = req.body;
        fs.appendFileSync(`${mac}.csv`, buffer);
        return res.status(201);
    } catch(err) {
        console.error(err);
        return res.status(500).json({ error: err });
    }
});

app.listen(3001, () => {
    console.log("Servidor iniciado correctamente");
});

bot.on('message', async (msg) => {
    var hi = "hola";

    if (msg.text.toString().toLowerCase().indexOf(hi) === 0) {
        bot.sendMessage(msg.chat.id,"Hola, ¿qué dispositivo quieres comprobar?");
        bot.sendMessage(msg.chat.id, "Selecciona uno de los dispositivos que aparece en tu teclado", {
            "reply_markup": {
                "keyboard": [["98CDAC5144F0 - Entrada"], ["98CDAC5144F2 - Pasillo"], ["98CDAC5144F3 - Fábrica"]]
                }
            });
    } else if (msg.text.toString() === "98CDAC5144F0 - Entrada") {
        bot.sendMessage(msg.chat.id,"Aquí tienes toda la información relacionada con el dispositivo " + msg.text.toString());

        let response = await services.getSingleRegistry("98CDAC5144F0", 4);
        let humedadRelativa = response.hits.hits[0]._source;
        response = await services.getSingleRegistry("98CDAC5144F0", 5);
        let tempAmb = response.hits.hits[0]._source;
        response = await services.getSingleRegistry("98CDAC5144F0", 6);
        let indboch = response.hits.hits[0]._source;
        response = await services.getSingleRegistry("98CDAC5144F0", 20);
        let alarms = response.hits.hits[0]._source;
        response = await services.getSingleRegistry("98CDAC5144F0", 1);
        let humedadTierra = response.hits.hits[0]._source;
        response = await services.getSingleRegistry("98CDAC5144F0", 3);
        let estadoTanque = response.hits.hits[0]._source;
        response = await services.getSingleRegistry("98CDAC5144F0", 10);
        let rele = response.hits.hits[0]._source;

        let buffer = `- Humedad relativa: ${ humedadRelativa.value }%\n- Temperatura: ${ tempAmb.value } ºC\n- Índice de bochorno: ${ indboch.value }\n- Humedad de la tierra: ${ humedadTierra.value }%\n- Estado del tanque: ${ estadoTanque.value }%\n`;

        if (rele.value == 1) {
            console.log("Entro");
            buffer = buffer.concat("El macetero se está regando\n");
        }
        if (alarms.value != 0) {
            buffer = buffer.concat("Existen alarmas en el sistema, por favor, revísalas.");
        }

        bot.sendMessage(msg.chat.id, buffer.toString());
        bot.sendMessage(msg.chat.id, "Ten en cuenta que los datos del equipo se actualizan cada 5 minutos. Vuelve aquí pasado un tiempo si es que has realizado cambios en el sistema");

    } else if (msg.text.toString() === "98CDAC5144F2 - Pasillo") {
        bot.sendMessage(msg.chat.id,"El dispositivo no se encuentra conectado actualmente y no puedo procesar su información :(" + msg.text.toString());
    } else if (msg.text.toString() === "98CDAC5144F3 - Fábrica") {
        bot.sendMessage(msg.chat.id,"El dispositivo no se encuentra conectado actualmente y no puedo procesar su información :(" + msg.text.toString());
    } else {
        bot.sendMessage(msg.chat.id, "Por el momento no conozco ese comando.");
    }

});