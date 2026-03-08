# O Código da Voz — Landing Page

Landing page de vendas para o e-book de oratória e presença masculina.

## 📁 Arquivos da Pasta

| Arquivo | Descrição |
|---|---|
| `index.html` | Landing page principal (abre automaticamente) |
| `ebook_oratoria_masculina.html` | O e-book completo para exportar como PDF |
| `capa.png` | Imagem hero (homem no palco) |
| `aura_poder.png` | Imagem de status/poder |
| `respiracao.png` | Diagrama de respiração |
| `postura.png` | Comparação de postura |
| `palco.png` | Homem com microfone |

---

## 🚀 Como Colocar No Ar (Cloudflare Pages)

### 1. Criar Repositório no GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

### 2. Conectar ao Cloudflare Pages
1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. Clique em **"Create a project"** → **"Connect to Git"**
3. Selecione o repositório
4. **Build settings**: deixe tudo em branco (é HTML estático, não precisa de build)
5. Clique em **"Save and Deploy"**

### 3. Adicionar Domínio Customizado
1. No projeto do Cloudflare Pages → aba **"Custom Domains"**
2. Clique em **"Set up a custom domain"**
3. Digite seu domínio (ex: `ocodigodavoz.com.br`)
4. O Cloudflare configura os DNS automaticamente se o domínio já estiver lá

---

## 💡 Dicas

- **Botões de compra**: troque o `href="#"` pelo link do checkout (Hotmart, Kiwify, etc.)
- **Para gerar o PDF do e-book**: abra `ebook_oratoria_masculina.html` no Chrome → `Ctrl+P` → "Salvar como PDF"
- **Deploy automático**: todo `git push` atualiza a página automaticamente no Cloudflare
