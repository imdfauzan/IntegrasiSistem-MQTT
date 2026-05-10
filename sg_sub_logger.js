const mqtt = require('mqtt');
const fs = require('fs');
const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

const buffer = new Map();

client.on('connect', () => {
    client.subscribe('smartgarage/#', { qos: 1 });
    console.log("📝 [Data Logger] Aktif. Menyimpan data ke garage_history.log (tiap 5 detik)");
    
    // Simpan data batch setiap 5 detik agar tidak membludak
    setInterval(() => {
        if (buffer.size > 0) {
            let logBatch = `\n--- LOG BATCH [${new Date().toISOString()}] ---\n`;
            buffer.forEach((message, topic) => {
                logBatch += `TOPIC: ${topic} | PAYLOAD: ${message}\n`;
            });
            fs.appendFileSync('garage_history.log', logBatch);
            buffer.clear(); // Kosongkan buffer setelah ditulis
        }
    }, 5000);
});

client.on('message', (topic, message) => {
    // Selalu simpan pesan terbaru untuk setiap topik
    buffer.set(topic, message.toString());
});
