const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

client.on('connect', () => {
    console.log("✅ [Publisher] Electrical Panel Active");
    setInterval(() => {
        const load = Math.floor(400 + Math.random() * 2500); // 400W to 2900W
        let status = 'idle';
        if (load > 2000) status = 'overload';
        else if (load > 800) status = 'normal';

        const payload = JSON.stringify({ load, status });
        
        client.publish('smartgarage/electric', payload, { qos: 1 });
    }, 2500);
});
