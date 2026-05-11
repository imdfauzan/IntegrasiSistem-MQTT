// Koneksi ke public EMQX broker via secure WebSocket
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', { protocolVersion: 5 });

const RESPONSE_TOPIC_GATE = 'smartgarage/gate/response';

const vehiclesData = {};
const systemHealth = {};

client.on('connect', () => {
    console.log('Connected to MQTT via WebSocket');
    document.getElementById('conn-status').classList.add('connected');
    document.querySelector('.profile-pill span:last-child').innerText = 'Connected';
    
    // Subscribe ke semua topik smartgarage (Fitur 2: Wildcard)
    client.subscribe('smartgarage/#', { qos: 1 });
    // Subscribe ke response topic untuk gate
    client.subscribe(RESPONSE_TOPIC_GATE);
});

client.on('message', (topic, message, packet) => {
    try {
        const payload = JSON.parse(message.toString());
        
        // --- SYSTEM STATUS (Fitur 7: LWT) ---
        if (topic === 'smartgarage/status') {
            systemHealth[payload.id] = payload.online;
            renderHealth();
            if (!payload.online) {
                addAlert('⚠️ SYSTEM', `Perangkat ${payload.id} terputus (OFFLINE)!`);
            }
        }
        
        // --- RESPONSE GATE (Fitur 8) ---
        else if (topic === RESPONSE_TOPIC_GATE) {
            const corrData = packet.properties.correlationData.toString();
            console.log(`✅ Received Response for ${corrData}`);
            addAlert('✅ REMOTE', payload.message);
        }
        
        // --- LINGKUNGAN (Fitur 3: Topic Alias) ---
        if (topic.includes('env') || (packet.properties && packet.properties.topicAlias === 1)) {
            document.getElementById('temp-val').innerText = `${payload.temp}°C`;
            document.getElementById('hum-val').innerText = `${payload.hum}%`;
            
            const badge = document.getElementById('temp-status');
            badge.innerText = payload.status.toUpperCase();
            badge.className = 'badge'; // Reset classes
            
            if (payload.status === 'hot' || payload.status === 'rain') badge.classList.add('warn');
            if (payload.status === 'fire alert') badge.classList.add('danger');
            
            if(payload.status === 'fire alert') addAlert('🔥 FIRE ALERT', 'Suhu ekstrem terdeteksi di area garasi!');
        }
        
        // --- GERBANG (Fitur 5: Retain Message) ---
        else if (topic.includes('gate') || (packet.properties && packet.properties.topicAlias === 2)) {
            const gateEl = document.getElementById('gate-card');
            const gateVal = document.getElementById('gate-val');
            gateVal.innerText = payload.status === 'opened' ? 'TERBUKA' : 'TERTUTUP';
            gateEl.className = `gate-status ${payload.status}`;
            
            if(payload.status === 'opened') addAlert('🚪 SECURITY', 'Gerbang utama baru saja dibuka.');
        }
        
        // --- LISTRIK ---
        else if (topic.includes('electric')) {
            document.getElementById('elec-val').innerText = `${payload.load} W`;
            document.getElementById('elec-status').innerText = payload.status.toUpperCase();
            
            const card = document.querySelector('.electric-card');
            if(payload.status === 'overload') {
                // Berubah merah saat bahaya
                card.style.background = 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
                document.getElementById('elec-desc').innerText = 'Overload Detected!';
                addAlert('⚡ ELECTRICAL WARNING', `Beban melebihi batas aman (${payload.load}W)`);
            } else {
                // Warna aksen normal (Orange)
                card.style.background = 'linear-gradient(135deg, #ff6b4a 0%, #ff8f75 100%)';
                document.getElementById('elec-desc').innerText = 'Kapasitas Normal';
            }
        }
        
        // --- KENDARAAN (Fitur 4: User Properties) ---
        else if (topic.includes('vehicle')) {
            vehiclesData[payload.id] = payload;
            
            // Ekstrak metadata tanpa membebani JSON parse
            if(packet.properties && packet.properties.userProperties) {
                vehiclesData[payload.id].type = packet.properties.userProperties['Vehicle-Type'];
                vehiclesData[payload.id].maintenance = packet.properties.userProperties['Maintenance-Required'] === 'true';
                
                if(vehiclesData[payload.id].maintenance && payload.status === 'bad') {
                    addAlert('🔧 MAINTENANCE', `Kendaraan ${payload.id} butuh perbaikan baterai/BBM.`);
                }
            }
            renderVehicles();
        }

    } catch(e) {
        console.error("Payload error", e);
    }
});

function renderVehicles() {
    const list = document.getElementById('vehicle-list');
    list.innerHTML = ''; // Clear
    
    Object.values(vehiclesData).forEach(v => {
        let badgeClass = 'badge';
        if(v.status.includes('low')) badgeClass += ' warn';
        if(v.status === 'bad') badgeClass += ' danger';
        
        const fuelClass = v.fuel < 20 ? 'progress-fill low' : 'progress-fill';
        const icon = v.type === 'Motorcycle' ? '🏍️' : '🚘';

        list.innerHTML += `
            <div class="vehicle-item">
                <div class="v-header">
                    <h4>${icon} ${v.id}</h4>
                    <span class="${badgeClass}">${v.status.toUpperCase()}</span>
                </div>
                <div class="v-stats">
                    <div class="stat">
                        <div class="stat-label">Baterai (Aki)</div>
                        <div class="stat-val">${v.voltage.toFixed(1)} V</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Bahan Bakar (${v.fuel.toFixed(0)}%)</div>
                        <div class="progress-bar">
                            <div class="${fuelClass}" style="width: ${Math.max(0, Math.min(100, v.fuel))}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Mencegah duplicate alerts beruntun
let lastAlertMessage = "";

function addAlert(title, desc) {
    if(desc === lastAlertMessage) return; // simple debouncing
    lastAlertMessage = desc;
    setTimeout(() => { lastAlertMessage = "" }, 5000);

    const list = document.getElementById('alert-list');
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    
    const isInfo = title.includes('SECURITY');
    const itemClass = isInfo ? 'alert-item info' : 'alert-item';
    const timeColor = isInfo ? '#60a5fa' : '#f87171';

    const html = `
        <div class="${itemClass}">
            <div style="display:flex; flex-direction:column; gap:4px;">
                <strong>${title}</strong>
                <span>${desc}</span>
            </div>
            <span style="color:${timeColor}; font-weight:600;">${time}</span>
        </div>
    `;
    list.insertAdjacentHTML('afterbegin', html);
    
    if(list.children.length > 6) {
        list.removeChild(list.lastChild);
    }
}

function renderHealth() {
    const list = document.getElementById('health-list');
    list.innerHTML = '';
    
    Object.entries(systemHealth).forEach(([id, online]) => {
        const statusText = online ? 'ONLINE' : 'OFFLINE';
        const dotClass = online ? 'dot online' : 'dot offline';
        const textColor = online ? '#10b981' : '#ef4444';

        list.innerHTML += `
            <div class="health-item">
                <span>${id}</span>
                <div class="health-status" style="color: ${textColor}">
                    <div class="${dotClass}"></div>
                    ${statusText}
                </div>
            </div>
        `;
    });
}

function controlGate(action) {
    const correlationId = 'CMD_' + Date.now();
    const payload = JSON.stringify({ action: action });

    const options = {
        qos: 1,
        properties: {
            responseTopic: RESPONSE_TOPIC_GATE,
            correlationData: correlationId
        }
    };

    console.log(`📡 Sending Command: ${action} (${correlationId})`);
    client.publish('smartgarage/gate/control', payload, options);
}
