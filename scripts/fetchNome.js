const apiUrls = {
  1: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  2: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  3: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  4: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  5: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  6: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  7: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  8: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  9: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  10: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10",
  11: "https://api.thingspeak.com/channels/3035666/fields/1.json?api_key=QC6JQEJXRZR8AFOB&results=10"
};

const container = document.getElementById("lista-projetos");

async function carregarProjetos() {
  const entradas = Object.entries(apiUrls);

  const promessas = entradas.map(([id, url]) =>
    fetch(url)
      .then(res => res.json())
      .then(data => ({ id, nome: data.channel.name }))
      .catch(err => ({ id, nome: "Erro", err }))
  );

  const resultados = await Promise.all(promessas);

  resultados.sort((a, b) => a.id - b.id);

  resultados.forEach(item => {
    const link = document.createElement("a");
    link.href = `/html/projs.html?id=${item.id}`;
    link.textContent = item.nome;
    link.style.display = "block";
    container.appendChild(link);
  });
}

carregarProjetos();
