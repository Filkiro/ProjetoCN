async function carregarProjeto() {
  
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  try {
    // --- Carrega informações do projeto local ---
    const response = await fetch("/src/projetos.json");
    const projetos = await response.json();
    const projeto = projetos[id];

    if (!projeto) {
      document.body.innerHTML = "<h2>Projeto não encontrado.</h2>";
      return;
    }

    // --- Exibe nome e descrição ---
    document.getElementById("titulo").textContent = projeto.nome;
    document.getElementById("descricao").textContent = projeto.descricao;
    const iframe = document.querySelector(".code iframe");

    
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Remove o iframe, se existir
      if (iframe) iframe.remove();
    
      // Cria um link substituto
      if (projeto.link) {
        const link = document.createElement("a");
        link.href = projeto.link;
        link.textContent = "Acesse o projeto aqui";
        link.target = "_blank";
      
        // Estiliza o link
        link.style.display = "inline-block";
        link.style.padding = "12px 18px";
        link.style.background = "#2B54D2";
        link.style.color = "#fff";
        link.style.borderRadius = "8px";
        link.style.textDecoration = "none";
        link.style.fontWeight = "bold";
        link.style.textAlign = "center";
        link.style.marginTop = "10px";
      
        // Insere o link no mesmo container onde o iframe estaria
        const codeContainer = document.querySelector(".code");
        codeContainer.appendChild(link);
      }
    } else {
      // No desktop, mostra o iframe normalmente
      if (projeto.link) {
        iframe.src = projeto.link;
      } else {
        iframe.style.display = "none";
      }
    }


    // --- Remove o trecho do Prism.js ---
    // Antes havia:
    // const codeContainer = document.querySelector(".code-container");
    // const codeBlock = document.getElementById("projectCode");
    // if (projeto.code) {
    //   codeBlock.textContent = projeto.code.trim();
    //   Prism.highlightElement(codeBlock);
    //   codeContainer.style.display = "block";
    // } else {
    //   codeContainer.style.display = "none";
    // }

    // --- Função auxiliar para buscar dados do ThingSpeak ---
    async function obterDadosThingSpeak() {
      const apiResponse = await fetch(projeto.api);
      return await apiResponse.json();
    }

    // --- Configuração do gráfico ---
    const ctx = document.getElementById("grafico").getContext("2d");
    let grafico;

    async function atualizarGrafico() {
  const dadosApi = await obterDadosThingSpeak();
  const feeds = dadosApi.feeds;
  if (!feeds.length) return;

  const fields = Object.keys(feeds[0]).filter(
    (f) => f.startsWith("field") && f !== "field8"
  );
  const labels = feeds.map((f) =>
    new Date(f.created_at).toLocaleTimeString()
  );

  const cores = [
    "#2B54D2",
    "#D24E2B",
    "#2BD259",
    "#D22BC4",
    "#FFD22B",
    "#2BD2C4",
    "#A62BD2",
  ];

  function capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  const conjuntos = fields.map((field, index) => {
    const nomeCampoOriginal = dadosApi.channel[field] || field;
    const nomeCampo = capitalizar(nomeCampoOriginal);

    // 🔹 Ignora valores nulos ou vazios
    const dadosLimpos = feeds.map((f) => {
      const valor = f[field];
      return valor !== null && valor !== "" ? Number(valor) : null;
    });

    return {
      label: nomeCampo,
      data: dadosLimpos,
      borderColor: cores[index % cores.length],
      backgroundColor: `${cores[index % cores.length]}33`,
      spanGaps: true, // 🔹 Faz o gráfico “pular” os pontos nulos suavemente
      fill: false,
    };
  });

  if (grafico) {
    // 🔹 Salva o estado de visibilidade atual antes de atualizar
    const visibilidade = grafico.data.datasets.map((_, i) =>
      grafico.isDatasetVisible(i)
    );

    grafico.data.labels = labels;
    grafico.data.datasets = conjuntos;

    // 🔹 Restaura a visibilidade anterior
    visibilidade.forEach((visivel, i) => {
      grafico.setDatasetVisibility(i, visivel);
    });

    grafico.update();
  } else {
    grafico = new Chart(ctx, {
      type: "line",
      data: { labels, datasets: conjuntos },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            onClick: (e, legendItem, legend) => {
              const ci = legend.chart;
              const index = legendItem.datasetIndex;

              const onlyOneVisible = ci.data.datasets.some((ds, i) =>
                ci.isDatasetVisible(i) && i !== index
              );

              if (!onlyOneVisible && ci.isDatasetVisible(index)) {
                ci.data.datasets.forEach((ds, i) => {
                  ci.setDatasetVisibility(i, true);
                });
              } else {
                ci.data.datasets.forEach((ds, i) => {
                  ci.setDatasetVisibility(i, i === index);
                });
              }

              ci.update();
            },
          },
        },
        elements: {
          line: { tension: 0.3 }, // suaviza linhas
        },
      },
    });
  }
}


    await atualizarGrafico();

    // --- Cria o formulário de envio dinâmico ---
    const dadosApi = await obterDadosThingSpeak();
    const campos = Object.keys(dadosApi.feeds[0] || {}).filter(
      (f) => f.startsWith("field") && f !== "field8"
    );

    const formContainer = document.createElement("div");
    formContainer.id = "form-container";
    formContainer.style.display = "flex";
    formContainer.style.flexDirection = "column";
    formContainer.style.gap = "10px";

    campos.forEach((field) => {
      const input = document.createElement("input");
      input.type = "number";
      input.placeholder = `Campo ${field.replace("field", "")}`;
      input.id = field;
      input.required = true;
      input.style.cssText = `
        padding: 8px;
        border-radius: 8px;
        border: 1px solid #ccc;
      `;
      formContainer.appendChild(input);
    });

    const botaoEnviar = document.createElement("button");
    botaoEnviar.textContent = "Enviar";
    botaoEnviar.style.cssText = `
      padding: 10px;
      border-radius: 8px;
      border: none;
      background-color: #2B54D2;
      color: #fff;
      font-weight: bold;
      cursor: pointer;
    `;
    formContainer.appendChild(botaoEnviar);


    document.getElementById("menu-lateral").appendChild(formContainer);

    // --- Função auxiliar de envio ---
    async function enviarCamposNormais() {
      const writeKey = projeto.apiWrite;
      if (!writeKey) {
        alert("API de escrita não encontrada!");
        return;
      }

      const params = new URLSearchParams();
      campos.forEach((campo) => {
        const valor = document.getElementById(campo).value;
        if (valor) params.append(campo, valor);
      });

      const url = `https://api.thingspeak.com/update?api_key=${writeKey}&${params.toString()}`;
      const resposta = await fetch(url);
      console.log("Enviado:", await resposta.text());
      await atualizarGrafico();
    }

    botaoEnviar.addEventListener("click", async () => {
      if (botaoEnviar.disabled) return;

      botaoEnviar.disabled = true;
      let tempoRestante = 16;
      const textoOriginal = botaoEnviar.textContent;

      // Mostra contagem regressiva
      botaoEnviar.textContent = `Aguarde ${tempoRestante}s...`;

      const intervalo = setInterval(() => {
        tempoRestante--;
        botaoEnviar.textContent = `Aguarde ${tempoRestante}s...`;
        if (tempoRestante <= 0) {
          clearInterval(intervalo);
          botaoEnviar.disabled = false;
          botaoEnviar.textContent = textoOriginal;
        }
      }, 1000);
    
      await enviarCamposNormais();
    });


    setInterval(atualizarGrafico, 15000);
  } catch (erro) {
    console.error("Erro ao carregar projeto:", erro);
  }
}

carregarProjeto();
