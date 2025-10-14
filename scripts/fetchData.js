async function carregarProjeto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  try {
    const response = await fetch("/src/projetos.json");
    const projetos = await response.json();
    const projeto = projetos[id];
    if (!projeto) {
      document.body.innerHTML = "<h2>Projeto não encontrado.</h2>";
      return;
    }

    document.getElementById("titulo").textContent = projeto.nome;
    document.getElementById("descricao").textContent = projeto.descricao;

    // Função para puxar dados do ThingSpeak
    async function getApiData() {
      const apiResponse = await fetch(projeto.api);
      const apiData = await apiResponse.json();
      return apiData;
    }

    // Inicializa gráfico
    const ctx = document.getElementById("grafico").getContext("2d");
    let chart;

    async function atualizarChart() {
      const apiData = await getApiData();
      const feeds = apiData.feeds;
      if (!feeds.length) return;

      const fields = Object.keys(feeds[0]).filter(f => f.includes("field"));
      const labels = feeds.map(f => new Date(f.created_at).toLocaleTimeString());
      const datasets = fields.map((field, i) => ({
        label: field,
        data: feeds.map(f => Number(f[field])),
        borderColor: "#2B54D2",
        backgroundColor: "rgba(43,84,210,0.2)",
        fill: false,
      }));

      if(chart) {
        chart.data.labels = labels;
        chart.data.datasets = datasets;
        chart.update();
      } else {
        chart = new Chart(ctx, {
          type: "line",
          data: { labels, datasets },
          options: { responsive: true, maintainAspectRatio: false }
        });
      }
    }

    await atualizarChart();

    // Cria form dinamicamente baseado nos fields
    const formContainer = document.createElement("div");
    formContainer.id = "form-container";
    formContainer.style.display = "flex";
    formContainer.style.flexDirection = "column";
    formContainer.style.gap = "10px";

    const apiData = await getApiData();
    const fields = Object.keys(apiData.feeds[0] || {}).filter(f => f.includes("field"));

    fields.forEach(field => {
      const input = document.createElement("input");
      input.type = "number";
      input.placeholder = field;
      input.id = field;
      input.style.padding = "8px";
      input.style.borderRadius = "8px";
      input.style.border = "1px solid #ccc";
      formContainer.appendChild(input);
    });

    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Enviar";
    submitBtn.style.padding = "10px";
    submitBtn.style.borderRadius = "8px";
    submitBtn.style.border = "none";
    submitBtn.style.backgroundColor = "#2B54D2";
    submitBtn.style.color = "#fff";
    submitBtn.style.fontWeight = "bold";
    submitBtn.style.cursor = "pointer";

    formContainer.appendChild(submitBtn);

    // Adiciona o form no menu-lateral
    const menu = document.getElementById("menu-lateral");
    menu.appendChild(formContainer);

    submitBtn.addEventListener("click", async () => {
      const writeKey = projeto.apiWrite;
      const params = new URLSearchParams();
      fields.forEach(f => {
        const val = document.getElementById(f).value;
        if(val) params.append(f, val);
      });

      const url = `https://api.thingspeak.com/update?api_key=${writeKey}&${params.toString()}`;

      try {
        const res = await fetch(url);
        const text = await res.text();
        console.log("Resposta ThingSpeak:", text);

        // Atualiza gráfico após envio
        await atualizarChart();
      } catch(err) {
        console.error("Erro ao enviar dados:", err);
      }
    });

    // Atualização automática a cada 15 segundos
    setInterval(atualizarChart, 15000);

  } catch(err) {
    console.error("Erro ao carregar projeto:", err);
  }
}

carregarProjeto();
