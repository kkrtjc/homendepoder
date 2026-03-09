export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { name, email, cpf, method } = await request.json();

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

    // Mercado Pago Preference Data
    const preferenceData = {
      items: [
        {
          id: "ebook-oratoria-001",
          title: "O Código da Voz — E-book Completo",
          description: "Método completo de oratória, voz grave e presença masculina. 6 módulos + exercícios práticos.",
          quantity: 1,
          unit_price: productPrice,
          currency_id: "BRL",
          category_id: "education",
        },
      ],
      payer: {
        name: name.split(" ")[0],
        surname: name.split(" ").slice(1).join(" ") || "",
        email: email,
        identification: cpf ? {
          type: "CPF",
          number: cpf.replace(/\D/g, ""),
        } : undefined,
      },
      payment_methods: {
        default_payment_method_id: method === "pix" ? "pix" : null,
        excluded_payment_types: method === "pix" ? [{ id: "credit_card" }, { id: "debit_card" }, { id: "ticket" }] : [],
        installments: method === "card" ? 3 : 1,
      },
      back_urls: {
        success: `${env.BASE_URL}/sucesso`, 
        failure: `${env.BASE_URL}/`,
        pending: `${env.BASE_URL}/`,
      },
      auto_return: "approved",
      statement_descriptor: "O CODIGO DA VOZ",
      external_reference: `${Date.now()}-${email}`,
      notification_url: `${env.BASE_URL}/api/webhook`,
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferenceData),
    });

    const data = await response.json();
    
    // In Workers, we usually use init_point directly. Mercado Pago handles sandbox based on token.
    const paymentUrl = env.NODE_ENV === "production" ? data.init_point : data.sandbox_init_point;

    return new Response(JSON.stringify({ init_point: paymentUrl || data.init_point }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro ao processar pagamento: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
