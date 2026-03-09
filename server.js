require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== MERCADO PAGO CONFIG =====
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'SEU_ACCESS_TOKEN_AQUI',
});

// ===== MIDDLEWARE =====
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Serve static files (index.html, images, etc)
app.use(express.static(path.join(__dirname)));

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
    res.json({ status: 'O Código da Voz Server Online 🎙️' });
});

// ===== CREATE MERCADO PAGO PREFERENCE =====
app.post('/api/create-preference', async (req, res) => {
    // Destructure here so it's available in the catch block too
    const { name, email, cpf, method } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e e-mail obrigatórios.' });
    }

    try {
        const preference = new Preference(mpClient);

        const preferenceData = {
            items: [
                {
                    id: 'ebook-oratoria-001',
                    title: 'O Código da Voz — E-book Completo',
                    description: 'Método completo de oratória, voz grave e presença masculina. 6 módulos + exercícios práticos.',
                    quantity: 1,
                    unit_price: 49.90,
                    currency_id: 'BRL',
                    category_id: 'education',
                }
            ],
            payer: {
                name: name.split(' ')[0],
                surname: name.split(' ').slice(1).join(' ') || '',
                email: email,
                // CPF é obrigatório para PIX no Mercado Pago
                identification: cpf ? {
                    type: 'CPF',
                    number: cpf.replace(/\D/g, '')
                } : undefined,
            },
            payment_methods: {
                // Prioriza PIX se o usuário selecionou, senão aceita tudo
                default_payment_method_id: method === 'pix' ? 'pix' : null,
                excluded_payment_types: method === 'pix' ? [{ id: 'credit_card' }, { id: 'debit_card' }, { id: 'ticket' }] : [],
                installments: method === 'card' ? 3 : 1,
            },
            back_urls: {
                success: `${process.env.BASE_URL || 'http://localhost:' + PORT}/sucesso.html`,
                failure: `${process.env.BASE_URL || 'http://localhost:' + PORT}/`,
                pending: `${process.env.BASE_URL || 'http://localhost:' + PORT}/`,
            },
            auto_return: 'approved',
            statement_descriptor: 'O CODIGO DA VOZ',
            external_reference: `${Date.now()}-${email}`,
            notification_url: `${process.env.BASE_URL || ''}/api/webhook`,
        };

        const response = await preference.create({ body: preferenceData });

        // Em produção: init_point | em sandbox: sandbox_init_point
        const isProduction = process.env.NODE_ENV === 'production';
        const paymentUrl = isProduction ? response.init_point : response.sandbox_init_point;

        res.json({ init_point: paymentUrl });

    } catch (err) {
        console.error('❌ Erro ao criar preferência MP:', err);
        res.status(500).json({ error: 'Erro ao criar pagamento. Tente novamente.' });
    }
});

// ===== DOWNLOAD DO EBOOK =====
// Rota que serve o ebook como download após pagamento
app.get('/download-ebook', (req, res) => {
    const ebookPath = path.join(__dirname, 'ebook_oratoria_masculina.html');
    if (!require('fs').existsSync(ebookPath)) {
        return res.status(404).send('Arquivo não encontrado.');
    }
    res.setHeader('Content-Disposition', 'attachment; filename="O-Codigo-da-Voz-Ebook.html"');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(ebookPath);
});

// ===== WEBHOOK MERCADO PAGO (notificações de pagamento) =====
app.post('/api/webhook', async (req, res) => {
    const { type, data } = req.body;
    console.log(`📬 Webhook MP recebido: type=${type}, id=${data?.id}`);

    if (type === 'payment') {
        // Aqui você pode verificar o pagamento e liberar o acesso
        // Exemplo: enviar e-mail com link do ebook
        console.log(`✅ Pagamento ${data.id} — processar liberação de acesso`);
    }

    res.sendStatus(200);
});

// ===== SUCCESS PAGE =====
app.get('/sucesso.html', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pagamento Confirmado! — O Código da Voz</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        
        <!-- Meta Pixel Code -->
        <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '910522148156865');
        fbq('track', 'PageView');
        fbq('track', 'Purchase', { value: 49.90, currency: 'BRL' });
        </script>
        <noscript><img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=910522148156865&ev=PageView&noscript=1"
        /></noscript>
        <!-- End Meta Pixel Code -->

        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; background: #080E16; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
            .card { background: #0f1b29; border: 1px solid rgba(201,168,76,0.25); border-radius: 24px; padding: 50px 40px; max-width: 480px; width: 100%; text-align: center; }
            .icon { font-size: 4rem; margin-bottom: 20px; }
            h1 { font-family: 'Playfair Display', serif; font-size: 2rem; color: #C9A84C; margin-bottom: 12px; }
            p { color: rgba(255,255,255,0.6); font-size: 0.95rem; line-height: 1.65; }
            .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 24px 0; }
            .steps { text-align: left; display: flex; flex-direction: column; gap: 14px; margin: 20px 0; }
            .step { display: flex; align-items: flex-start; gap: 14px; }
            .step-num { width: 28px; height: 28px; background: linear-gradient(135deg, #C9A84C, #8B6914); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.8rem; color: #0D1B2A; flex-shrink: 0; margin-top: 1px; }
            .step-text { font-size: 0.88rem; color: rgba(255,255,255,0.7); line-height: 1.5; }
            .step-text strong { color: #fff; }
            .btn-download { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 30px; background: linear-gradient(135deg, #C9A84C, #8B6914); color: #0D1B2A; font-weight: 800; padding: 18px 30px; border-radius: 12px; text-decoration: none; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 6px 24px rgba(201,168,76,0.3); }
            .btn-download:hover { opacity: 0.9; }
            .note { margin-top: 16px; font-size: 0.75rem; color: rgba(255,255,255,0.25); }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">✅</div>
            <h1>Pagamento Confirmado!</h1>
            <p>Seu acesso a <strong style="color:#fff">O Código da Voz</strong> foi liberado. Baixe seu e-book agora:</p>

            <div class="divider"></div>

            <div class="steps">
                <div class="step">
                    <div class="step-num">1</div>
                    <div class="step-text"><strong>Baixe o e-book</strong> clicando no botão abaixo. Salve em um lugar seguro.</div>
                </div>
                <div class="step">
                    <div class="step-num">2</div>
                    <div class="step-text"><strong>Abra no Chrome ou Edge</strong> e use Ctrl+P → Salvar como PDF para ter uma cópia em PDF.</div>
                </div>
                <div class="step">
                    <div class="step-num">3</div>
                    <div class="step-text"><strong>Comece pelo Módulo 2</strong> — faça o exercício de respiração hoje mesmo e já sinta a diferença.</div>
                </div>
            </div>

            <a href="/download-ebook" class="btn-download">
                ⬇️ &nbsp;Baixar O Código da Voz
            </a>

            <p class="note">Um e-mail com o link de acesso também foi enviado para o endereço cadastrado.</p>
        </div>
    </body>
    </html>
    `);
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`\n🎙️  O Código da Voz — Server rodando em http://localhost:${PORT}`);
    console.log(`📦  Servindo arquivos estáticos da pasta: ${__dirname}`);
    console.log(`💰  Mercado Pago ACCESS_TOKEN: ${process.env.MP_ACCESS_TOKEN ? '✅ Configurado' : '❌ NÃO CONFIGURADO — defina no .env'}\n`);
});
