const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

let isFirst = true;
let temp = 28.0;
let hum = 50.0;

client.on('connect', () => {
    console.log("✅ [Publisher] Environment Sensor Active");
    setInterval(() => {

        temp += (Math.random() * 2 - 0.8);
        if (temp < 25) temp = 25;
        if (temp > 45) temp = 28;

        hum += (Math.random() * 5 - 2.5);
        if (hum < 30) hum = 30;
        if (hum > 90) hum = 90;

        let status = 'stable';
        if (temp > 40) status = 'fire alert';
        else if (temp > 34) status = 'hot';
        else if (hum > 80) status = 'rain';

        const payload = JSON.stringify({ temp: temp.toFixed(1), hum: hum.toFixed(1), status });
        const options = { qos: 0 };

        // FITUR 3 = topic alias
        if (isFirst) {
            options.properties = { topicAlias: 1 };
            client.publish('smartgarage/env', payload, options);
            isFirst = false;
        } else {
            options.properties = { topicAlias: 1 };
            client.publish('', payload, options); // topik dikosongkan
        }
    }, 2000);
});
