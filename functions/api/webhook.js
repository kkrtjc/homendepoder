export async function onRequestPost(context) {
  const { request } = context;

  try {
    const payload = await request.json();
    console.log("📬 Webhook MP recebido:", payload);

    // Lógica simples de log — em Cloudflare, você pode usar KV ou D1 para persistir vendas
    // Ou integrar com um serviço de e-mail (Resend, SendGrid) para entrega automática.
    
    return new Response("OK", { status: 200 });
  } catch (err) {
    return new Response("Error", { status: 400 });
  }
}
