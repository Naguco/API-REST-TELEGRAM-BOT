const mqtt = require('mqtt');
const { Client } = require('@elastic/elasticsearch');
const devices = require('./devices.json');

const eClient = new Client(
    {
        node: 'https://15c39a4c758e45eabc6234aeaf5adc3d.eu-west-1.aws.found.io:9243',
        auth: { username: 'elastic', password: 'uCOMg205evb8SIoWMUQvwl70' }
    });

const mClient = mqtt.connect('franciscogubbins.me', {
    port: 1883,
    protocol: 'mqtt',
    host: 'franciscogubbins.me'
});

async function restartDevice(mac) {
    if (mac !== '98CDAC5144F0') {
        return { error: true, message: "Dispositivo no encontrado" };
    }
    mClient.publish(mac + '/Sub/restart', '1');
    return { ok: true };
}

async function publishValue(mac, value, registry) {
    if (mac !== '98CDAC5144F0') {
        return { error: true, message: "Dispositivo no encontrado" };
    }
    mClient.publish(mac + `/Sub/${registry}`, String(value));
    return { ok: true };
}

async function getSingleRegistry(mac, registry) {
    if (mac !== "98CDAC5144F0") {
        return { error: true, message: "Dispositivo no encontrado" };
    }
    const { body } = await eClient.search({
        index: 'mqtt-index-2',
        body: {
            query: {
                term: {
                    topic: `${mac}/Pub/${registry}`
                }
            },
            size: 1,
            sort: [
              {
                "date": {
                  "order": "desc"
                }
              }
            ]
        }
    });
    return body;
}


module.exports = {
    restartDevice,
    publishValue,
    getSingleRegistry
};