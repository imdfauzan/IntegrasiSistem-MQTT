const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.emqx.io', { protocolVersion: 5 });

const RESPONSE_TOPIC = 'smartgarage/diag/response';

client.on('connect', () => {
    console.log("🛠️ [Diag Requester] Connected to Broker");

    // Subscribe ke topic balasan
    client.subscribe(RESPONSE_TOPIC);

    // FITUR 8: Request-Response (Requester)
    const requestDiag = () => {
        const correlationId = 'REQ_' + Math.random().toString(16).slice(2, 8);
        const payload = JSON.stringify({ command: 'GET_STATUS', target: 'Env-Sensor' });

        const options = {
            qos: 1,
            properties: {
                responseTopic: RESPONSE_TOPIC,
                correlationData: Buffer.from(correlationId) // Harus Buffer atau String
            }
        };

        console.log(`\n❓ [Request] Asking for Diagnostics... (ID: ${correlationId})`);
        client.publish('smartgarage/diag/request', payload, options);
    };

    // Handle response
    client.on('message', (topic, message, packet) => {
        if (topic === RESPONSE_TOPIC) {
            const res = JSON.parse(message.toString());
            const corrData = packet.properties.correlationData.toString();
            
            console.log(`✅ [Response] Received for ID: ${corrData}`);
            console.table([res]);
        }
    });

    // Kirim request setiap 10 detik
    setInterval(requestDiag, 10000);
    requestDiag(); // Kirim pertama kali langsung
});
