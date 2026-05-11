const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

const vehicles = [
    { id: 'Mobil SUV', type: 'Car', volt: 12.5, fuel: 80 },
    { id: 'Motor Sport', type: 'Motorcycle', volt: 13.0, fuel: 15 }
];

client.on('connect', () => {
    console.log("✅ [Publisher] Vehicle Telemetry Active");
    setInterval(() => {
        vehicles.forEach(v => {
            // Simulasi penurunan fuel dan tegangan aki
            v.volt -= (Math.random() * 0.1);
            v.fuel -= (Math.random() * 0.5);

            if (v.volt < 11.0) v.volt = 14.2; // Simulasi mesin nyala/ngecas
            if (v.fuel < 2) v.fuel = 100; // Simulasi isi bensin

            let status = 'healthy';
            if (v.fuel < 20 && v.volt >= 11.5) status = 'low fuel';
            if (v.volt < 11.5 && v.fuel >= 20) status = 'low batt';
            if (v.fuel < 20 && v.volt < 11.5) status = 'bad';

            const payload = JSON.stringify({ id: v.id, voltage: v.volt, fuel: v.fuel, status });

            // FITUR 4 = user properties
            const options = {
                qos: 1,
                properties: {
                    userProperties: {
                        'Vehicle-Type': v.type,
                        'Maintenance-Required': (status === 'bad').toString()
                    }
                }
            };

            client.publish(`smartgarage/vehicle/${v.id.replace(' ', '_')}`, payload, options);
        });
    }, 3000);
});
