const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

client.on('connect', () => {
    // FITUR 2: Wildcard (Subscribe semua, kita saring manual di logic)
    client.subscribe('smartgarage/#', { qos: 2 });
    console.log("🚨 [Alert Engine] Aktif. Memantau anomali...");
});

client.on('message', (topic, message, packet) => {
    try {
        const payload = JSON.parse(message.toString());
        
        // Memanfaatkan Fitur 4 (User Properties) tanpa perlu membaca payload JSON
        let isMaintenance = false;
        if (packet.properties && packet.properties.userProperties) {
             if (packet.properties.userProperties['Maintenance-Required'] === 'true') {
                 isMaintenance = true;
             }
        }

        const time = new Date().toLocaleTimeString();

        if (payload.status === 'fire alert') {
            console.log(`\x1b[41m\x1b[37m [${time}] FIRE ALERT \x1b[0m Suhu ekstrem terdeteksi!`);
        } else if (payload.status === 'overload') {
            console.log(`\x1b[45m\x1b[37m [${time}] ELECTRICAL WARNING \x1b[0m Listrik overload (${payload.load}W)!`);
        } else if (isMaintenance) {
            console.log(`\x1b[43m\x1b[30m [${time}] MAINTENANCE \x1b[0m Kendaraan butuh perbaikan: ${topic}`);
        }
        
        if (topic.includes('gate') && payload.status === 'opened') {
            console.log(`\x1b[44m\x1b[37m [${time}] SECURITY \x1b[0m Gerbang dibuka!`);
        }
    } catch(e) {}
});
