require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== CONFIG =====
const PRODUCT_PRICE = 47.00;
const ABANDONS_FILE = path.join(__dirname, 'abandons.json');

// Ensure abandons file exists
if (!fs.existsSync(ABANDONS_FILE)) {
    fs.writeFileSync(ABANDONS_FILE, JSON.stringify([]));
}

// ===== MERCADO PAGO CONFIG =====
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'SEU_ACCESS_TOKEN_AQUI',
});

// ===== MIDDLEWARE =====
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// ===== HELPERS =====
function getAbandons() {
    try {
        if (!fs.existsSync(ABANDONS_FILE)) return [];
        return JSON.parse(fs.readFileSync(ABANDONS_FILE, 'utf8'));
    } catch (e) { return []; }
}

function saveAbandons(data) {
    fs.writeFileSync(ABANDONS_FILE, JSON.stringify(data, null, 2));
}

// ===== API ENDPOINTS =====

app.get('/health', (req, res) => {
    res.json({ status: 'O Código da Voz Server Online 🎙️' });
});

app.get('/api/config', (req, res) => {
    res.json({ price: PRODUCT_PRICE, currency: 'BRL' });
});

// ABANDONMENT CAPTURE
app.post('/api/abandon', (req, res) => {
    const { name, email, phone, pixGenerated, pixId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let abandons = getAbandons();
    let index = abandons.findIndex(a => a.email === email);

    const abandonData = {
        name,
        email,
        phone,
        pixGenerated: pixGenerated || false,
        pixId: pixId || null,
        paid: false,
        updatedAt: new Date().toISOString()
    };

    if (index !== -1) {
        abandons[index] = { ...abandons[index], ...abandonData };
    } else {
        abandonData.createdAt = new Date().toISOString();
        abandons.push(abandonData);
    }

    saveAbandons(abandons);
    res.json({ success: true });
});

// CREATE NATIVE PIX
app.post('/api/create-pix', async (req, res) => {
    const { name, email, cpf } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e e-mail obrigatórios.' });
    }

    try {
        const paymentData = {
            transaction_amount: PRODUCT_PRICE,
            description: "O Código da Voz — E-book Completo",
            payment_method_id: "pix",
            payer: {
                email: email,
                first_name: name.split(" ")[0],
                last_name: name.split(" ").slice(1).join(" ") || " ",
                identification: {
                    type: "CPF",
                    number: cpf ? cpf.replace(/\D/g, "") : "00000000000",
                },
            },
            notification_url: `${process.env.BASE_URL}/api/webhook`,
            statement_descriptor: "O CODIGO DA VOZ",
            external_reference: `${Date.now()}-${email}`,
        };

        const response = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                "X-Idempotency-Key": Date.now().toString(),
            },
            body: JSON.stringify(paymentData),
        });

        const data = await response.json();

        if (data.status === "rejected") {
            return res.status(400).json({ error: "Pagamento rejeitado.", details: data.status_detail });
        }

        res.json({
            id: data.id,
            status: data.status,
            qr_code: data.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64
        });

    } catch (err) {
        console.error('❌ Erro PIX:', err);
        res.status(500).json({ error: 'Erro ao gerar PIX.' });
    }
});

app.post('/api/create-preference', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Nome/Email obrigatórios' });

    try {
        const preference = new Preference(mpClient);
        const preferenceData = {
            items: [{
                title: 'O Código da Voz — E-book Completo',
                quantity: 1,
                unit_price: PRODUCT_PRICE,
                currency_id: 'BRL',
            }],
            payer: { email: email, name: name },
            back_urls: {
                success: `${process.env.BASE_URL}/sucesso.html`,
                failure: `${process.env.BASE_URL}/`,
            },
            auto_return: 'approved',
            notification_url: `${process.env.BASE_URL}/api/webhook`,
        };

        const response = await preference.create({ body: preferenceData });
        const paymentUrl = process.env.NODE_ENV === 'production' ? response.init_point : response.sandbox_init_point;
        res.json({ init_point: paymentUrl });
    } catch (err) {
        res.status(500).json({ error: 'Erro preference' });
    }
});

// DOWNLOAD DO EBOOK
app.get('/download-ebook', (req, res) => {
    const ebookPath = path.join(__dirname, 'ebook_oratoria_masculina.html');
    if (!fs.existsSync(ebookPath)) {
        return res.status(404).send('Arquivo não encontrado.');
    }
    res.setHeader('Content-Disposition', 'attachment; filename="O-Codigo-da-Voz-Ebook.html"');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(ebookPath);
});

// WEBHOOK
app.post('/api/webhook', async (req, res) => {
    const { type, data } = req.body;
    if (type === 'payment') {
        const paymentId = data.id;
        let abandons = getAbandons();
        let index = abandons.findIndex(a => a.pixId == paymentId);
        if (index !== -1) {
            abandons[index].paid = true;
            saveAbandons(abandons);
        }
    }
    res.sendStatus(200);
});

// SUCCESS PAGE
app.get('/sucesso.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'sucesso.html'));
});

app.listen(PORT, () => {
    console.log(`\n🎙️  O Código da Voz — Server rodando em http://localhost:${PORT}`);
    console.log(`💰  Preço configurado: R$ ${PRODUCT_PRICE}`);
});
