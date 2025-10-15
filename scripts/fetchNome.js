const container = document.getElementById("lista-projetos");

async function carregarProjetos() {
  const loading = document.createElement("div");
  loading.id = "loading";
  loading.textContent = "Carregando projetos...";
  loading.style.textAlign = "center";
  loading.style.padding = "20px";
  loading.style.fontSize = "18px";
  container.appendChild(loading);

  try {
    // Carrega o JSON local
    const resposta = await fetch("../src/projetos.json");
    const projetos = await resposta.json();

    const entradas = Object.entries(projetos).sort(
      ([a], [b]) => Number(a) - Number(b)
    );

    const resultados = await Promise.all(
      entradas.map(async ([id, projeto]) => {
        const sala = projeto.sala || "N/A";
        const nome = projeto.nome || "Sem nome";
        let resultado = "Sem dados";
        let ativo = false;

        try {
          const apiResponse = await fetch(projeto.api);
          const apiData = await apiResponse.json();

          if (apiData.feeds && apiData.feeds.length > 0) {
            const ultimoFeed = apiData.feeds.at(-1);
            resultado = ultimoFeed.field1 || "N/A";

            // Verifica o tempo desde o último envio
            const ultimaData = new Date(ultimoFeed.created_at);
            const agora = new Date();
            const diffDias = (agora - ultimaData) / (1000 * 60 * 60 * 24);

            // Se o último envio foi há menos de 14 dias → ativo
            ativo = diffDias <= 14;
          }
        } catch {
          resultado = "Erro ao obter dados";
        }

        return { id, sala, nome, resultado, ativo };
      })
    );

    loading.remove();

    const fragment = document.createDocumentFragment();

    resultados.forEach(({ id, sala, nome, resultado, ativo }) => {
      const div = document.createElement("div");
      div.classList.add("projeto-card");
      div.style.cursor = "pointer";

      const pSala = document.createElement("p");
      pSala.textContent = `Comôdo: ${sala}`;

      const pNome = document.createElement("p");
      pNome.textContent = `Projeto: ${nome}`;
      pNome.style.fontWeight = "bold";

      const pResultado = document.createElement("p");
      pResultado.textContent = `Último Resultado: ${resultado}`;

      const status = document.createElement("p");
      status.textContent = ativo ? "🟢 Ativo" : "🔴 Inativo";
      status.style.fontWeight = "bold";
      status.style.color = ativo ? "green" : "red";

      div.appendChild(pSala);
      div.appendChild(pNome);
      div.appendChild(pResultado);
      div.appendChild(status);

      div.addEventListener("click", () => {
        window.location.href = `/html/projs.html?id=${id}`;
      });

      fragment.appendChild(div);
    });

    container.appendChild(fragment);

  } catch (erro) {
    console.error("Erro ao carregar projetos:", erro);
    loading.textContent = "Erro ao carregar projetos.";
  }
}

carregarProjetos();
