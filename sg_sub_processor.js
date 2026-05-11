const mqtt = require('mqtt');

// Gunakan ID unik agar bisa dibedakan saat running bareng
const workerId = 'Worker-' + Math.random().toString(16).slice(2, 5).toUpperCase();
const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

client.on('connect', () => {
    console.log(`👷 [${workerId}] Active & Ready to Process Data`);

    // FITUR 9: Shared Subscriptions
    // Format: $share/<group_name>/<topic>
    // Broker akan membagi pesan (Round Robin) ke semua subscriber dalam group 'heavy-duty'
    const sharedTopic = '$share/heavy-duty/smartgarage/env';
    
    client.subscribe(sharedTopic, { qos: 1 }, (err) => {
        if (!err) {
            console.log(`🔗 Subscribed to Shared Topic: ${sharedTopic}`);
        }
    });
});

client.on('message', (topic, message) => {
    const data = JSON.parse(message.toString());
    console.log(`📦 [${workerId}] Processing data from ${topic}: Temp ${data.temp}°C`);
    
    // Simulasi proses berat (misal simpan ke DB)
    // Dengan shared sub, jika ada 2 worker, masing-masing hanya memproses 50% data.
});
