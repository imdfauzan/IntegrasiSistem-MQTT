const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io', { 
    protocolVersion: 5,
    will: {
        topic: 'smartgarage/status',
        payload: JSON.stringify({ id: 'Env-Sensor', online: false }),
        qos: 1,
        retain: true
    }
});

let isFirst = true;
let temp = 28.0;
let hum = 50.0;

client.on('connect', () => {
    console.log("✅ [Publisher] Environment Sensor Active");
    
    // Kirim status online
    client.publish('smartgarage/status', JSON.stringify({ id: 'Env-Sensor', online: true }), { qos: 1, retain: true });

    // FITUR 8: Request-Response (Responder)
    client.subscribe('smartgarage/diag/request');
    client.on('message', (topic, message, packet) => {
        if (topic === 'smartgarage/diag/request') {
            const req = JSON.parse(message.toString());
            console.log(`🔍 [Diag] Request received: ${req.command}`);
            
            const responsePayload = JSON.stringify({
                id: 'Env-Sensor',
                uptime: process.uptime().toFixed(1) + 's',
                memory: process.memoryUsage().heapUsed,
                status: 'OK'
            });

            // Kirim balik ke responseTopic dengan correlationData
            if (packet.properties && packet.properties.responseTopic) {
                client.publish(packet.properties.responseTopic, responsePayload, {
                    properties: {
                        correlationData: packet.properties.correlationData
                    }
                });
            }
        }
    });

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
