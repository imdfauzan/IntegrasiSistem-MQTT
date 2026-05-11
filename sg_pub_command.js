const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

client.on('connect', () => {
    console.log("🚀 [Command Center] Connected to Broker");

    // FITUR 6: Message Expiry Interval
    // Kita mengirim perintah "Buka Pintu Darurat" yang HANYA valid selama 10 detik.
    // Jika sensor pintu sedang offline dan baru nyala setelah 10 detik, 
    // pesan ini akan otomatis dihapus oleh broker dan tidak akan diterima sensor.
    
    const sendCommand = (cmd) => {
        const payload = JSON.stringify({
            command: cmd,
            timestamp: new Date().toISOString(),
            note: "This command expires in 10s"
        });

        const options = {
            qos: 1,
            properties: {
                messageExpiryInterval: 10 // Pesan hangus dalam 10 detik jika tidak terkirim
            }
        };

        client.publish('smartgarage/command/gate', payload, options, () => {
            console.log(`📡 [Command] Sent: ${cmd} (Expires in 10s)`);
        });
    };

    // Simulasi pengiriman perintah setiap 15 detik
    setInterval(() => {
        sendCommand('OPEN_GATE_EMERGENCY');
    }, 15000);
});
