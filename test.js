const API_URL = "https://hackatime.hackclub.com/api/hackatime/v1/users/current/heartbeats";
const API_KEY = "c31551b9-4b0f-493e-b05d-910b4a447604";
const RATE_LIMIT_MS = 30000;

let totalEnviados = 0;
let tempoTotalMinutos = 0;

async function sendHeartbeat() {
    const payload = {
        entity: "/home/joelmo/Área de trabalho/ /blog/modules/rssGen.js",
        type: "file",
        category: "coding",
        project: "blog",
        language: "JavaScript",
        time: Date.now() / 1000,
        is_write: true
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${API_KEY}`,
                'User-Agent': 'wakatime/v1.60.1'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            totalEnviados++;
            tempoTotalMinutos = (totalEnviados * (RATE_LIMIT_MS / 1000) / 60).toFixed(1);
            
            console.clear(); // Limpa o console para parecer um dashboard fixo
            console.log("=========================================");
            console.log("   🚀 HACKATIME SIMULATOR - WEBOS   ");
            console.log("=========================================");
            console.log(`📡 Status: [CONECTADO]`);
            console.log(`📦 Heartbeats Enviados: ${totalEnviados}`);
            console.log(`⏱️  Tempo Total Simulado: ${tempoTotalMinutos} min`);
            console.log(`📂 Projeto Atual: ${payload.project}`);
            console.log(`🕒 Último Envio: ${new Date().toLocaleTimeString()}`);
            console.log("=========================================");
            console.log("Pressione Ctrl+C para encerrar.");
        } else {
            console.log(`\n❌ Falha no envio (Status: ${response.status})`);
        }
    } catch (error) {
        console.log(`\n🚨 Erro de Rede: ${error.message}`);
    }
}

// Inicia o processo
console.log("Conectando ao Hackatime...");
sendHeartbeat();
setInterval(sendHeartbeat, RATE_LIMIT_MS);