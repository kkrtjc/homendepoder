const fetch = require('node-fetch');
const { spawn } = require('child_process');
const path = require('path');

async function test() {
    console.log('--- Iniciando Auditoria Homem de Poder ---');
    
    // 1. Verificar se o ebook existe
    const fs = require('fs');
    const ebookPath = path.join(__dirname, 'ebook_oratoria_masculina.html');
    if (fs.existsSync(ebookPath)) {
        console.log('✅ Ebook encontrado na raiz.');
    } else {
        console.log('❌ Ebook NÃO ENCONTRADO na raiz.');
    }

    // 2. Tentar rodar o servidor brevemente
    const server = spawn('node', ['server.js'], { cwd: __dirname });
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        const configResp = await fetch('http://localhost:3001/api/config');
        const config = await configResp.json();
        if (config.price === 47) {
            console.log('✅ Preço sincronizado: R$ 47.00');
        } else {
            console.log('❌ Falha na sincronia de preço: ', config.price);
        }

        const healthResp = await fetch('http://localhost:3001/health');
        const health = await healthResp.json();
        console.log('✅ Status do Servidor:', health.status);

    } catch (e) {
        console.log('❌ Erro ao conectar no servidor local:', e.message);
    } finally {
        server.kill();
        console.log('--- Auditoria Concluída ---');
    }
}

test();
