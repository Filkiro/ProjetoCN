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

    const apiResponse = await fetch(projeto.api);
    const apiData = await apiResponse.json();

    const feeds = apiData.feeds.map(f => f.field1);
    const labels = apiData.feeds.map(f => new Date(f.created_at).toLocaleTimeString());

    const ctx = document.getElementById("grafico").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Leituras",
          data: feeds,
          borderColor: "#2B54D2",
          backgroundColor: "rgba(43,84,210,0.2)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });

  } catch (err) {
    console.error("Erro ao carregar projeto:", err);
  }
}

carregarProjeto();
