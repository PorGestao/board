/* =====================================================================
   cartilha.js — monta a página a partir de window.CARTILHA.
   Os dados chegam prontos do build.mjs (seções comuns já incluídas).
   Não é preciso mexer aqui para atualizar conteúdo.
   ===================================================================== */
(function () {
  "use strict";
  var C = window.CARTILHA;
  var ARQ = window.ARQUIVOS || {};
  var SLUG = window.SLUG || "cartilha";
  if (!C) return;

  // ---------- auxiliares ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  // [colchetes] = campo a preencher; *texto* = negrito
  function txt(s) {
    return esc(s)
      .replace(/\[([^\]]+)\]/g, '<mark class="ph">[$1]</mark>')
      .replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
  }
  function semAcento(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function pendente(s) { return !s || String(s).indexOf("[") !== -1; }
  function digitos(s) { return String(s || "").replace(/\D/g, ""); }
  function dois(n) { return (n < 10 ? "0" : "") + n; }
  function icone(nome) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + esc(nome) + '"></use></svg>'; }
  // números que começam com 0 (0800, 0300) são discados como estão; os outros ganham +55 (Brasil)
  function linkTel(tel) {
    if (pendente(tel)) return null;
    var d = digitos(tel);
    return d.charAt(0) === "0" ? "tel:" + d : "tel:+55" + d;
  }
  function linkWhats(w) { return pendente(w) ? null : /^https?:/.test(w) ? w : "https://wa.me/55" + digitos(w); }
  function tamanho(bytes) {
    if (!bytes) return "";
    var mb = bytes / 1048576;
    return mb >= 1 ? mb.toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
  }
  function guardar(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) {} }
  function ler(chave, padrao) { try { return JSON.parse(localStorage.getItem(chave)) || padrao; } catch (e) { return padrao; } }

  // ---------- aviso "em implantação" ----------
  // aparece sozinho enquanto houver [colchetes]; some quando tudo estiver preenchido.
  // Para forçar: emImplantacao: true (sempre mostra) ou false (nunca mostra) no dados.js.
  var implantando = C.emImplantacao != null ? C.emImplantacao : C.pendentes > 0;
  if (implantando) {
    $("implantacao").hidden = false;
    $("implantacao-texto").innerHTML = icone("triangle-alert") +
      "<p><strong>Guia em implantação.</strong> Estamos completando as informações. " +
      'Os trechos destacados assim, <mark class="ph">[em vermelho]</mark>, ainda serão preenchidos e devem ser desconsiderados.</p>';
  }

  // ---------- capa ----------
  $("saudacao").textContent = C.saudacao || "Boas-vindas";
  $("chamada").innerHTML = txt(C.chamada || C.predio);
  $("endereco").innerHTML = icone("map-pin") + "<span>" + txt(C.endereco) + "</span>";
  $("atualizado").innerHTML = txt(C.atualizadoEm);

  var secoes = C.secoes || [];
  var porId = {};
  secoes.forEach(function (s, i) { s.numero = dois(i + 1); porId[s.id] = s; });

  var sindico = (C.contatos || [])[0] || {};
  var manut = porId.manutencao;
  var linkChamado = manut && manut.links && manut.links[0] && !pendente(manut.links[0].url) ? manut.links[0].url : null;
  var a = "";
  if (linkWhats(sindico.whatsapp)) a += '<a class="acao principal" href="' + esc(linkWhats(sindico.whatsapp)) + '" target="_blank" rel="noopener">' + icone("message-circle") + "Falar com o síndico</a>";
  if (linkTel(sindico.telefone)) a += '<a class="acao" href="' + linkTel(sindico.telefone) + '">' + icone("phone") + "Ligar</a>";
  if (linkChamado) a += '<a class="acao" href="' + esc(linkChamado) + '" target="_blank" rel="noopener">' + icone("wrench") + "Abrir chamado</a>";
  else if (manut) a += '<a class="acao" href="#manutencao" data-abrir="manutencao">' + icone("wrench") + "Manutenção</a>";
  a += '<a class="acao" href="#emergencia-titulo">' + icone("siren") + "Emergência</a>";
  $("acoes").innerHTML = a;

  // ---------- guia (índice + folha de detalhe) ----------
  // todos os links da seção: os soltos + os de cada gaveta
  function todosLinks(s) {
    var l = (s.links || []).slice();
    (s.grupos || []).forEach(function (g) { l = l.concat(g.links || []); });
    return l;
  }
  function contagem(s) {
    var n = (s.itens || []).length, d = todosLinks(s).length, p = [];
    if (n) p.push(n + (n === 1 ? " orientação" : " orientações"));
    var nome = s.grupos ? ["documento", "documentos"] : ["link", "links"];   // seção com gavetas = documentos
    if (d) p.push(d + " " + (d === 1 ? nome[0] : nome[1]));
    return p.join(" · ");
  }
  function itemHTML(s, trecho) {
    return '<button type="button" class="item-guia" data-abrir="' + esc(s.id) + '">' +
      '<span class="item-num">' + s.numero + "</span>" +
      '<span class="item-ic">' + icone(s.icone) + "</span>" +
      '<span><span class="item-titulo">' + esc(s.titulo) + '</span><span class="item-info">' + contagem(s) + "</span>" +
      (trecho ? '<span class="item-trecho">' + trecho + "</span>" : "") + "</span>" +
      icone("arrow-right") + "</button>";
  }
  function desenhar(lista) {
    $("grade").innerHTML = lista.map(function (x) { return itemHTML(x.s, x.trecho); }).join("");
    $("vazio").hidden = lista.length > 0;
  }
  var todas = secoes.map(function (s) { return { s: s }; });
  desenhar(todas);

  function linkDoc(l) {
    var arq = ARQ[l.url];
    if (pendente(l.url)) {
      return '<div class="link-doc pendente"><span class="doc-ic">' + icone("file-text") + "</span><span><strong>" + esc(l.texto) +
        '</strong><small><mark class="ph">[link a definir]</mark></small></span></div>';
    }
    return '<a class="link-doc" href="' + (arq ? "#" : esc(l.url)) + '" target="_blank" rel="noopener"' + (arq ? ' data-arquivo="' + esc(l.url) + '"' : "") + ">" +
      '<span class="doc-ic">' + icone(arq ? "file-text" : "arrow-up-right") + "</span><span><strong>" + esc(l.texto) + "</strong>" +
      (arq ? "<small>PDF · " + tamanho(l.tamanho) + "</small>" : "") + "</span>" + icone("arrow-right") + "</a>";
  }

  var folha = $("folha");
  function abrir(id) {
    var s = porId[id];
    if (!s) return;
    $("folha-rotulo").innerHTML = icone(s.icone) + "<span>" + s.numero + " · Guia do prédio</span>";
    $("folha-titulo").textContent = s.titulo;
    var corpo = "";
    if (s.itens && s.itens.length) corpo += '<ol class="itens">' + s.itens.map(function (i) { return "<li>" + txt(i) + "</li>"; }).join("") + "</ol>";
    if (s.aviso) corpo += '<div class="aviso">' + icone("triangle-alert") + "<div>" + txt(s.aviso) + "</div></div>";
    if (s.links && s.links.length) corpo += '<div class="links">' + s.links.map(linkDoc).join("") + "</div>";
    // gavetas: menus que abrem e fecham (<details>), cada uma com sua lista de links
    if (s.grupos && s.grupos.length) {
      corpo += '<div class="gavetas">' + s.grupos.map(function (g) {
        var lista = g.links || [];
        return '<details class="gaveta"><summary>' + icone("folder-open") + "<span>" + txt(g.titulo) + "</span>" +
          '<span class="gaveta-qtd">' + lista.length + "</span>" + icone("chevron-down") + "</summary>" +
          (lista.length ? '<div class="links">' + lista.map(linkDoc).join("") + "</div>"
                        : '<p class="gaveta-vazia">Nenhum documento por enquanto.</p>') + "</details>";
      }).join("") + "</div>";
    }
    $("folha-corpo").innerHTML = corpo;
    $("folha-corpo").scrollTop = 0;
    if (!folha.open) folha.showModal();
    history.replaceState(null, "", "#" + id);
  }
  folha.addEventListener("close", function () { history.replaceState(null, "", location.pathname); });
  $("fechar").addEventListener("click", function () { folha.close(); });
  folha.addEventListener("click", function (e) { if (e.target === folha) folha.close(); });

  document.addEventListener("click", function (e) {
    var alvo = e.target.closest("[data-abrir]");
    if (alvo) { e.preventDefault(); abrir(alvo.getAttribute("data-abrir")); return; }
    // PDF embutido: montado só na hora do clique; trocar o href antes da ação padrão faz o navegador abri-lo
    var doc = e.target.closest("[data-arquivo]");
    if (doc && doc.getAttribute("href") === "#") {
      var arq = ARQ[doc.getAttribute("data-arquivo")];
      if (arq.remoto) { e.preventDefault(); abrirRemoto(doc, arq); return; }
      var bin = atob(arq.base64), bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      doc.href = URL.createObjectURL(new Blob([bytes], { type: arq.tipo }));
    }
  });

  // PDF das gavetas: baixa o arquivo criptografado (docs/xxxx.bin), descriptografa no celular e abre.
  // Formato do arquivo: 12 bytes de IV + conteúdo cifrado (AES-256-GCM) + 16 bytes de verificação.
  function base64ParaBytes(b64) {
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function abrirRemoto(doc, arq) {
    var aviso = doc.querySelector("small");
    var original = aviso ? aviso.textContent : "";
    if (aviso) aviso.textContent = "Abrindo…";
    // a janela é aberta JÁ, no clique; abrir depois do download seria bloqueado como pop-up
    var janela = window.open("", "_blank");
    fetch(arq.remoto, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
      .then(function (buf) {
        var tudo = new Uint8Array(buf);
        return crypto.subtle.importKey("raw", base64ParaBytes(window.CHAVE_ARQUIVOS), "AES-GCM", false, ["decrypt"])
          .then(function (chave) {
            return crypto.subtle.decrypt({ name: "AES-GCM", iv: tudo.slice(0, 12) }, chave, tudo.slice(12));
          });
      })
      .then(function (pdf) {
        var url = URL.createObjectURL(new Blob([pdf], { type: arq.tipo }));
        if (janela) janela.location.href = url; else location.href = url;
        if (aviso) aviso.textContent = original;
      })
      .catch(function () {
        if (janela) janela.close();
        if (aviso) aviso.textContent = "Não foi possível abrir. Tente de novo.";
      });
  }
  if (location.hash && porId[location.hash.slice(1)]) abrir(location.hash.slice(1));

  // ---------- busca ----------
  $("busca").addEventListener("input", function () {
    var q = semAcento(this.value.trim());
    if (!q) { desenhar(todas); return; }
    var achados = [];
    secoes.forEach(function (s) {
      var textos = [s.titulo].concat(s.itens || [], s.aviso ? [s.aviso] : [], todosLinks(s).map(function (l) { return l.texto; }), (s.grupos || []).map(function (g) { return g.titulo; }));
      var trecho = null, achou = false;
      textos.forEach(function (t, n) {
        if (semAcento(t).indexOf(q) === -1) return;
        achou = true;
        if (n > 0 && !trecho) {
          var limpo = String(t).replace(/[*\[\]]/g, ""), p = semAcento(limpo).indexOf(q), ini = Math.max(0, p - 30);
          trecho = (ini > 0 ? "…" : "") + esc(limpo.slice(ini, p)) + "<mark>" + esc(limpo.slice(p, p + q.length)) + "</mark>" +
            esc(limpo.slice(p + q.length, p + q.length + 50)) + (p + q.length + 50 < limpo.length ? "…" : "");
        }
      });
      if (achou) achados.push({ s: s, trecho: trecho });
    });
    desenhar(achados);
  });

  // ---------- primeiros passos ----------
  var PP = C.primeirosPassos || [];
  if (Array.isArray(PP)) PP = { itens: PP };   // formato antigo: só a lista
  var passos = PP.itens || [];
  var blocoN = 1;
  if (passos.length) {
    $("passos-bloco").hidden = false;
    blocoN = 2;
    $("passos-rotulo").innerHTML = "01 · " + txt(PP.rotulo || "Para quem chegou");
    $("passos-titulo").innerHTML = txt(PP.titulo || "Primeiros passos");
    $("passos-sub").innerHTML = txt(PP.subtitulo || "");
    $("passos-sub").hidden = !PP.subtitulo;
    var chave = "cartilha:" + SLUG + ":passos";
    var feitos = ler(chave, []);
    $("passos").innerHTML = passos.map(function (p, i) {
      var ver = p.secao && porId[p.secao] ? '<button type="button" class="passo-ver" data-abrir="' + esc(p.secao) + '">Como fazer ' + icone("arrow-right") + "</button>" : "";
      return '<li class="passo"><label><span><span class="passo-num">' + dois(i + 1) + '</span><span class="passo-texto">' + txt(p.texto) + "</span></span>" +
        '<input type="checkbox" data-passo="' + i + '"' + (feitos.indexOf(i) !== -1 ? " checked" : "") + ' aria-label="' + esc(String(p.texto).replace(/[*\[\]]/g, "")) + '">' +
        '<span class="caixa" aria-hidden="true">' + icone("check") + "</span></label>" + ver + "</li>";
    }).join("");
    var atualizar = function () {
      var m = [].slice.call(document.querySelectorAll("[data-passo]:checked")).map(function (c) { return +c.getAttribute("data-passo"); });
      guardar(chave, m);
      $("progresso").textContent = m.length === passos.length ? "Tudo pronto" : m.length + " de " + passos.length;
      $("barra").style.width = (100 * m.length / passos.length) + "%";
    };
    $("passos").addEventListener("change", atualizar);
    atualizar();
  }
  // numeração dos blocos (01, 02, 03) conforme o que aparece
  $("guia-rotulo").textContent = dois(blocoN) + " · Regras e rotinas";
  $("contatos-rotulo").textContent = dois(blocoN + 1) + " · Quem procurar";

  // ---------- contatos ----------
  $("lista-contatos").innerHTML = (C.contatos || []).map(function (c) {
    var b = "";
    if (linkWhats(c.whatsapp)) b += '<a class="btn" href="' + esc(linkWhats(c.whatsapp)) + '" target="_blank" rel="noopener">' + icone("message-circle") + "WhatsApp</a>";
    if (linkTel(c.telefone)) b += '<a class="btn contorno" href="' + linkTel(c.telefone) + '">' + icone("phone") + "Ligar</a>";
    if (c.email && !pendente(c.email)) b += '<a class="btn contorno" href="mailto:' + esc(c.email) + '">' + icone("mail") + "E-mail</a>";
    var tel = c.telefone || (c.whatsapp && !/^https?:/.test(c.whatsapp) ? c.whatsapp : "");
    var det = (tel ? '<p class="detalhe">' + icone("phone") + "<span>" + txt(tel) + "</span></p>" : "") +
      (c.email ? '<p class="detalhe">' + icone("mail") + "<span>" + txt(c.email) + "</span></p>" : "") +
      (c.horario ? '<p class="detalhe">' + icone("clock") + "<span>" + txt(c.horario) + "</span></p>" : "");
    return '<article class="contato"><div><p class="rotulo funcao">' + txt(c.funcao) + '</p><h3 class="nome">' + txt(c.nome) + "</h3>" +
      (det ? '<div class="detalhes">' + det + "</div>" : "") + "</div>" +
      (b ? '<div class="botoes">' + b + "</div>" : "") + "</article>";
  }).join("");

  // números de emergência: só texto (sem link de ligação)
  $("emergencia").innerHTML = (C.emergencia || []).map(function (e) {
    return '<div class="emergencia-item"><strong>' + esc(e.numero) + "</strong><span>" + esc(e.nome) + "</span></div>";
  }).join("");

  // emergências do prédio (ex.: plantão do elevador, síndico): metade da largura cada
  var ep = C.emergenciaPredio || [];
  if (ep.length) {
    $("emergencia-predio").hidden = false;
    $("emergencia-predio").innerHTML = ep.map(function (e) {
      return '<div class="emergencia-item"><span class="rotulo">' + txt(e.nome) + "</span><strong>" + txt(e.numero) + "</strong>" +
        (e.detalhe ? "<span>" + txt(e.detalhe) + "</span>" : "") + "</div>";
    }).join("");
  }
})();
