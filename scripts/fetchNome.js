const container = document.getElementById("lista-projetos");

async function carregarProjetos() {
  // Cria o elemento de loading
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

    // Mapeia as promessas de API para cada projeto
    const resultados = await Promise.all(
      entradas.map(async ([id, projeto]) => {
        const sala = projeto.sala || "N/A";
        const nome = projeto.nome || "Sem nome";
        let resultado = "Sem dados";

        try {
          const apiResponse = await fetch(projeto.api);
          const apiData = await apiResponse.json();

          if (apiData.feeds && apiData.feeds.length > 0) {
            const ultimoFeed = apiData.feeds.at(-1);
            resultado = ultimoFeed.field1 || "N/A";
          }
        } catch {
          resultado = "Erro ao obter dados";
        }

        return { id, sala, nome, resultado };
      })
    );

    // Remove o loading
    loading.remove();

    // Adiciona os cards de uma só vez
    const fragment = document.createDocumentFragment();

    resultados.forEach(({ id, sala, nome, resultado }) => {
      const div = document.createElement("div");
      div.classList.add("projeto-card");
      div.style.cursor = "pointer";

      const pSala = document.createElement("p");
      pSala.textContent = `Comôdo: ${sala}`;
      const pNome = document.createElement("p");
      pNome.textContent = `Projeto: ${nome}`;
      pNome.style.fontWeight = "bold";
      const pResultado = document.createElement("p");
      pResultado.textContent = `Resultado: ${resultado}`;

      div.appendChild(pSala);
      div.appendChild(pNome);
      div.appendChild(pResultado);

      div.addEventListener("click", () => {
        window.location.href = `/html/projs.html?id=${id}`;
      });

      fragment.appendChild(div);
    });

    // Adiciona tudo de uma vez
    container.appendChild(fragment);

  } catch (erro) {
    console.error("Erro ao carregar projetos:", erro);
    loading.textContent = "Erro ao carregar projetos.";
  }
}

carregarProjetos();
