const fetch = require('node-fetch');

async function testPix() {
    try {
        const res = await fetch('https://teste-m1kq.onrender.com/api/checkout/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: [{ id: 'ebook-doencas', title: 'Protocolo Elite', price: 97 }],
                customer: {
                    name: 'Joao Paulo',
                    email: 'teste@teste.com',
                    cpf: '12345678901',
                    phone: '38999999999'
                }
            })
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}

testPix();
