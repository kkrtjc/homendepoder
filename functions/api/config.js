export async function onRequest(context) {
  const { env } = context;
  
  // Preço padrão de segurança caso a variável não esteja no Cloudflare
  const price = parseFloat(env.PRODUCT_PRICE) || 49.90;

  return new Response(JSON.stringify({ 
    price: price,
    currency: "BRL",
    symbol: "R$"
  }), {
    headers: { "Content-Type": "application/json" },
  });
}
