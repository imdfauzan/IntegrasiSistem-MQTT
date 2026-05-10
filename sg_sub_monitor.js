const mqtt = require('mqtt');
const Table = require('cli-table3');

const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

const state = {
    vehicles: {},
    gate: 'Waiting...',
    env: { temp: 0, hum: 0, status: 'Waiting...' },
    electric: { load: 0, status: 'Waiting...' }
};

function getColorStatus(status) {
    if (['healthy', 'closed', 'stable', 'idle', 'normal'].includes(status)) return `\x1b[32m${status}\x1b[0m`; 
    if (['low fuel', 'low batt', 'hot', 'rain', 'opened'].includes(status)) return `\x1b[33m${status}\x1b[0m`; 
    if (['bad', 'fire alert', 'overload'].includes(status)) return `\x1b[31m\x1b[1m${status}\x1b[0m`; 
    return status;
}

client.on('connect', () => {
    // FITUR 2: Topic Wildcard (#) - Subscribe ke semua topik smartgarage
    client.subscribe('smartgarage/#', { qos: 2 });
});

client.on('message', (topic, message, packet) => {
    try {
        const payload = JSON.parse(message.toString());

        // Routing data ke state object
        if (topic.includes('vehicle')) {
            state.vehicles[payload.id] = payload;
        } else if (topic.includes('gate') || (packet.properties && packet.properties.topicAlias === 2)) {
            state.gate = payload.status;
        } else if (topic.includes('env') || (packet.properties && packet.properties.topicAlias === 1)) {
            state.env = payload;
        } else if (topic.includes('electric')) {
            state.electric = payload;
        }

        renderTable();
    } catch(e) {}
});

function renderTable() {
    process.stdout.write('\x1B[2J\x1B[0f'); // Clear screen & reset cursor (live update tanpa print ulang ke bawah)
    console.log(`\x1b[36m\x1b[1m=== 🛡️ SMART GARAGE LIVE MONITOR (${new Date().toLocaleTimeString()}) ===\x1b[0m\n`);
    
    // Tabel Kendaraan
    const tableVehicles = new Table({ head: ['Kendaraan', 'Baterai (V)', 'BBM (%)', 'Status'] });
    Object.values(state.vehicles).forEach(v => {
        tableVehicles.push([v.id, v.voltage.toFixed(1), v.fuel.toFixed(1), getColorStatus(v.status)]);
    });
    console.log(tableVehicles.toString());

    // Tabel Fasilitas
    const tableFacility = new Table({ head: ['Sensor / Modul', 'Nilai Saat Ini', 'Status'] });
    tableFacility.push(
        ['🚪 Gerbang Utama', '-', getColorStatus(state.gate)],
        ['🌡️ Lingkungan', `${state.env.temp}°C | ${state.env.hum}%`, getColorStatus(state.env.status)],
        ['⚡ Panel Listrik', `${state.electric.load} W`, getColorStatus(state.electric.status)]
    );
    console.log(tableFacility.toString());
}
