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

    // --- Exibe o código-fonte, se existir ---
    const codeContainer = document.querySelector(".code-container");
    const codeBlock = document.getElementById("projectCode");

    if (projeto.code) {
      codeBlock.textContent = projeto.code.trim();
      Prism.highlightElement(codeBlock); // aplica sintaxe colorida
      codeContainer.style.display = "block";
    } else {
      codeContainer.style.display = "none";
    }

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

      const fields = Object.keys(feeds[0]).filter(f => f.startsWith("field"));
      const labels = feeds.map(f => new Date(f.created_at).toLocaleTimeString());

      const conjuntos = fields.map(field => ({
        label: field,
        data: feeds.map(f => Number(f[field])),
        borderColor: "#2B54D2",
        backgroundColor: "rgba(43,84,210,0.2)",
        fill: false,
      }));

      if (grafico) {
        grafico.data.labels = labels;
        grafico.data.datasets = conjuntos;
        grafico.update();
      } else {
        grafico = new Chart(ctx, {
          type: "line",
          data: { labels, datasets: conjuntos },
          options: { responsive: true, maintainAspectRatio: false },
        });
      }
    }

    // Renderiza o gráfico pela primeira vez
    await atualizarGrafico();

    // --- Cria o formulário de envio dinâmico ---
    const dadosApi = await obterDadosThingSpeak();
    const campos = Object.keys(dadosApi.feeds[0] || {}).filter(f => f.startsWith("field"));

    const formContainer = document.createElement("div");
    formContainer.id = "form-container";
    formContainer.style.display = "flex";
    formContainer.style.flexDirection = "column";
    formContainer.style.gap = "10px";

    // Cria um input para cada campo disponível no canal
    campos.forEach(field => {
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

    // Botão de envio
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

    // Adiciona o formulário ao menu lateral
    const menuLateral = document.getElementById("menu-lateral");
    menuLateral.appendChild(formContainer);

    // --- Lógica de envio para o ThingSpeak ---
    botaoEnviar.addEventListener("click", async () => {
      const writeKey = projeto.apiWrite;
      if (!writeKey) {
        alert("API de escrita não encontrada para este projeto!");
        return;
      }

      // Monta os parâmetros de envio com todos os campos
      const params = new URLSearchParams();
      campos.forEach(campo => {
        const valor = document.getElementById(campo).value;
        if (valor) params.append(campo, valor);
      });

      const url = `https://api.thingspeak.com/update?api_key=${writeKey}&${params.toString()}`;

      try {
        const resposta = await fetch(url);
        const texto = await resposta.text();
        console.log("Resposta ThingSpeak:", texto);

        // Atualiza o gráfico após envio
        await atualizarGrafico();
      } catch (erro) {
        console.error("Erro ao enviar dados:", erro);
      }
    });

    // --- Atualização automática do gráfico ---
    setInterval(atualizarGrafico, 15000);

  } catch (erro) {
    console.error("Erro ao carregar projeto:", erro);
  }
}

// Inicia o carregamento
carregarProjeto();
