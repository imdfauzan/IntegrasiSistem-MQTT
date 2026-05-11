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

    // FITUR 1 5 = QoS 2 dan Retain: true
    const publishGate = (status) => {
        const payload = JSON.stringify({ status });
        client.publish('smartgarage/gate', payload, { qos: 2, retain: true });
    };

    // FITUR 8: Request-Response (Responder) untuk Remote Control
    client.subscribe('smartgarage/gate/control');
    
    client.on('message', (topic, message, packet) => {
        if (topic === 'smartgarage/gate/control') {
            const req = JSON.parse(message.toString());
            console.log(`🎮 [Remote] Command Received: ${req.action}`);
            
            if (req.action === 'OPEN') isOpen = true;
            else if (req.action === 'CLOSE') isOpen = false;

            const status = isOpen ? 'opened' : 'closed';
            publishGate(status);

            // Balas ke dashboard bahwa perintah sukses
            if (packet.properties && packet.properties.responseTopic) {
                const responsePayload = JSON.stringify({
                    success: true,
                    status: status,
                    message: `Gate successfully ${status}`
                });

                client.publish(packet.properties.responseTopic, responsePayload, {
                    properties: {
                        correlationData: packet.properties.correlationData
                    }
                });
            }
        }
    });

    publishGate('closed'); // status awal
});
