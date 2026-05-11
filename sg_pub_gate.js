const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io', { 
    protocolVersion: 5,
    will: {
        topic: 'smartgarage/status',
        payload: JSON.stringify({ id: 'Gate-System', online: false }),
        qos: 1,
        retain: true
    }
});

let isOpen = false;

client.on('connect', () => {
    console.log("✅ [Publisher] Garage Gate Active");

    // Kirim status online
    client.publish('smartgarage/status', JSON.stringify({ id: 'Gate-System', online: true }), { qos: 1, retain: true });

    // FITUR 1 5 = QoS 2 dan Retain: true (simpan status terakhir)
    const publishGate = (status) => {
        const payload = JSON.stringify({ status });
        client.publish('smartgarage/gate', payload, { qos: 2, retain: true });
    };

    publishGate('closed'); // status awal

    setInterval(() => {
        isOpen = !isOpen;
        publishGate(isOpen ? 'opened' : 'closed');
    }, 10000);
});
