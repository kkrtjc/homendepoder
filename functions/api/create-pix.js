export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { name, email, cpf } = await request.json();

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Nome e e-mail obrigatórios." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mpAccessToken = env.MP_ACCESS_TOKEN;
    const productPrice = parseFloat(env.PRODUCT_PRICE) || 49.90;

    if (!mpAccessToken) {
      return new Response(JSON.stringify({ error: "Configuração do Mercado Pago ausente (Token)." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare Payment Data for Native PIX
    const paymentData = {
      transaction_amount: productPrice,
      description: "O Código da Voz — E-book Completo",
      payment_method_id: "pix",
      payer: {
        email: email,
        first_name: name.split(" ")[0],
        last_name: name.split(" ").slice(1).join(" ") || " ",
        identification: {
          type: "CPF",
          number: cpf ? cpf.replace(/\D/g, "") : "00000000000", // CPF is mandatory for PIX in MP
        },
      },
      notification_url: `${env.BASE_URL}/api/webhook`,
      statement_descriptor: "O CODIGO DA VOZ",
      external_reference: `${Date.now()}-${email}`,
    };

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": Date.now().toString(),
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (data.status === "rejected") {
        return new Response(JSON.stringify({ error: "Pagamento rejeitado pelo Mercado Pago.", details: data.status_detail }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Extract QR Code data
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCodeText = data.point_of_interaction?.transaction_data?.qr_code;

    if (!qrCodeText) {
        return new Response(JSON.stringify({ error: "Erro ao gerar QR Code PIX.", details: data }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({
        id: data.id,
        status: data.status,
        qr_code: qrCodeText,
        qr_code_base64: qrCodeBase64
    }), {
        headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
