const { fork } = require('child_process');

console.log("🚀 Menjalankan semua simulasi Smart Garage Publishers...\n");

const files = ['sg_pub_env.js', 'sg_pub_gate.js', 'sg_pub_vehicle.js', 'sg_pub_electric.js', 'sg_pub_command.js'];

files.forEach(file => {
    const child = fork(file);
    child.on('error', (err) => console.error(`Gagal menjalankan ${file}:`, err));
});
