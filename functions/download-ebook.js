export async function onRequest(context) {
  // Em Cloudflare Pages, o arquivo estático está na raiz. 
  // Podemos redirecionar diretamente para o arquivo ou servir ele com os headers de download.
  const url = new URL(context.request.url);
  const ebookUrl = `${url.origin}/ebook_oratoria_masculina.html`;

  const response = await fetch(ebookUrl);
  const body = await response.arrayBuffer();

  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="O-Codigo-da-Voz-Ebook.html"',
    },
  });
}
