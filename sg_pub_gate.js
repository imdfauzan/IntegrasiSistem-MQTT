const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

let isOpen = false;

client.on('connect', () => {
    console.log("✅ [Publisher] Garage Gate Active");
    
    // FITUR 1 & 5: QoS 2 (Sangat penting) dan Retain: true (Simpan state terakhir)
    const publishGate = (status) => {
        const payload = JSON.stringify({ status });
        client.publish('smartgarage/gate', payload, { qos: 2, retain: true });
    };

    publishGate('closed'); // State awal tersimpan di broker

    // Simulasi gerbang terbuka tiap beberapa detik
    setInterval(() => {
        isOpen = !isOpen;
        publishGate(isOpen ? 'opened' : 'closed');
    }, 10000); // Tiap 10 detik gerbang buka/tutup
});
