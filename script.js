// script.js

document.addEventListener('DOMContentLoaded', () => {
  let mapInitialized = false;
  let map, geojsonLayer;
  let municipioData = [];

  const exploreBtn = document.getElementById("exploreBtn");
  const backBtn = document.getElementById("backBtn");
  const citySelectBtn = document.getElementById("citySelectBtn");
  const cityDropdown = document.getElementById("cityDropdown");
  const infoBox = document.getElementById("municipioInfo");

  const format = num => num.toLocaleString("es-ES");

  exploreBtn.addEventListener("click", () => {
    document.getElementById("intro").classList.add("hidden");
    document.getElementById("split-view").classList.remove("hidden");

    if (!mapInitialized) {
      setTimeout(() => {
        map = L.map('map').setView([28.3, -15.5], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        fetch("data/canarias_municipios.geojson")
          .then(res => res.json())
          .then(data => {
            municipioData = data.features.map(f => ({
              name: f.properties.ETIQUETA,
              vehiculos: parseInt(f.properties["VEHICULOS2022Total vehículos"]),
              feature: f
            }));

            const avgVehiculos = Math.round(
              municipioData.reduce((sum, m) => sum + m.vehiculos, 0) / municipioData.length
            );

            const sorted = [...municipioData].sort((a, b) => b.vehiculos - a.vehiculos);
            const chunkSize = Math.floor(sorted.length / 5);

            sorted.forEach((m, i) => {
              if (i < chunkSize) {
                m.rank = "🚗🚗🚗 ¡Vuestro municipio vive sobre ruedas! (20% más motorizado)";
              } else if (i < chunkSize * 2) {
                m.rank = "🚗🚗 Bastante motorizado... el coche es vuestro mejor amigo (40% más motorizado)";
              } else if (i < chunkSize * 3) {
                m.rank = "🚲 En la media, ni tanto ni tan poco. Un equilibrio digno.";
              } else if (i < chunkSize * 4) {
                m.rank = "🦶🚶 Poco motorizado... parece que os gusta andar o compartir coche (40% menos motorizado)";
              } else {
                m.rank = "🧘🚶‍♀️ ¡Zen total! ¿Vivís en bici o a lomos de una cabra? (20% menos motorizado)";
              }
            });

            municipioData = sorted;

            geojsonLayer = L.geoJSON(data, {
              style: {
                color: "#008060",
                weight: 1,
                fillColor: "#ccece6",
                fillOpacity: 0.5
              },
              onEachFeature: (feature, layer) => {
                if (feature.properties && feature.properties.ETIQUETA) {
                  layer.bindPopup(feature.properties.ETIQUETA);
                }
              }
            }).addTo(map);

            const etiquetas = municipioData.map(m => m.name).sort();
            etiquetas.forEach(name => {
              const option = document.createElement("option");
              option.value = name;
              option.textContent = name;
              cityDropdown.appendChild(option);
            });

            cityDropdown.addEventListener("change", () => {
              const selected = cityDropdown.value;
              const municipio = municipioData.find(m => m.name === selected);

              geojsonLayer.eachLayer(layer => {
                if (layer.feature.properties.ETIQUETA === selected) {
                  map.fitBounds(layer.getBounds());
                  layer.openPopup();
                }
              });

              infoBox.innerHTML = `
              <div class="info-data">
                <p>
                  ¿Sabías que tu <strong>'${municipio.name}'</strong> tiene
                  <strong>${format(municipio.vehiculos)}</strong> coches,
                  frente a los <strong>${format(avgVehiculos)}</strong> de media en Canarias?
                </p>
              </div>
              <div class="info-humor">
                <p>${municipio.rank}</p>
              </div>
              <div class="mini-chart">
                <div class="chart-labels">
                  <span>Más coches</span>
                  <span>Menos coches</span>
                </div>
                <div class="chart-bar">
                  <div class="chart-marker" id="chartMarker"></div>
                </div>
              </div>
              `;
              infoBox.classList.remove("hidden");

              const index = sorted.findIndex(m => m.name === municipio.name);
              const percentage = index / (sorted.length - 1);
              const marker = document.getElementById("chartMarker");
              marker.style.left = `${percentage * 100}%`;

              // Añadir botón siguiente
              if (!document.getElementById("nextBtn")) {
                const nextBtn = document.createElement("button");
                nextBtn.textContent = "Siguiente →";
                nextBtn.id = "nextBtn";
                nextBtn.classList.add("next-button");
                infoBox.appendChild(nextBtn);
              }

              currentMunicipio = municipio.name;
              currentVehiculos = municipio.vehiculos;
            });
          });

        mapInitialized = true;
      }, 50);
    }
  });

  backBtn.addEventListener("click", () => {
    document.getElementById("split-view").classList.add("hidden");
    document.getElementById("intro").classList.remove("hidden");
    document.getElementById("municipioInfo").classList.add("hidden");
  });

  citySelectBtn.addEventListener("click", () => {
    citySelectBtn.classList.add("hidden");
    cityDropdown.classList.remove("hidden");
    infoBox.classList.add("hidden");
  });;

  // ========== QUIZ LOGIC ========== //

  const quizContainer = document.getElementById("quizContainer");
  const quizResponse1 = document.getElementById("quizResponse");
  const quizResponse2 = document.getElementById("quizResponse2");
  const reflexionaBlock = document.getElementById("reflexiona");

  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "nextBtn") {
      document.getElementById("municipioInfo").classList.add("hidden");
      document.getElementById("cityDropdown").classList.add("hidden");
      quizContainer.classList.remove("hidden");
      document.querySelector(".icon")?.classList.add("hidden");
      document.querySelector(".split-left h2")?.classList.add("hidden");
      reflexionaBlock.classList.add("hidden");
      quizResponse.innerHTML = "";
    }
  });

  const quizOptions = document.querySelectorAll("#quizContainer .quiz-options button");

  quizOptions.forEach(btn => {
    btn.addEventListener("click", () => {
      const group = btn.closest('.quiz-options');
      group.querySelectorAll('button').forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      const answer = btn.dataset.answer;

      let response = "";

      switch (answer) {
        case "uso-diario":
          response = `🚘 ¡Conductor experto! En <strong>${currentMunicipio}</strong>, hay <strong>${format(currentVehiculos)}</strong> coches por cada 1.000 habitantes. Estás en buena compañía... ¿o no?`;
          break;
        case "uso-poco":
          response = `💤 Tu coche se echa más siestas que tú. ¿Sabías que en <strong>${currentMunicipio}</strong> hay <strong>${format(currentVehiculos)}</strong> coches por km²?`;
          break;
        case "no-tengo":
          const total = municipioData.length;
          const menores = municipioData.filter(m => m.vehiculos < currentVehiculos).length;
          const porcentaje = Math.round((menores / total) * 100);
          response = `🚶‍♀️ Caminante no hay coche. Solo un <strong>${porcentaje}%</strong> de las personas en <strong>${currentMunicipio}</strong> están contigo. ¡Eres la excepción sobre ruedas!`;
          break;
        case "ninguno":
          response = `🌱 ¡Cero emisiones en tu hogar! Eres parte de la resistencia.`;
          reflexionaBlock.classList.remove("hidden");
          break;
        case "uno":
          response = `⚖️ Estás dentro de la media. Muchos hogares canarios tienen uno, aunque el número varía por municipio.`;
          reflexionaBlock.classList.remove("hidden");
          break;
        case "dos-mas":
          response = `🏎️ Tu hogar está por encima de la media. Canarias tiene una alta dependencia del coche, y los municipios más pequeños superan los 800 vehículos por cada 1.000 habitantes.`;
          reflexionaBlock.classList.remove("hidden");
          break;
      }

      if (["uso-diario", "uso-poco", "no-tengo"].includes(answer)) {
        quizResponse1.innerHTML = `<p class='fade-in'>${response}</p>`;
        document.querySelector(".quiz-subquestion").classList.remove("hidden");
      } else {
        quizResponse2.innerHTML = `<p class='fade-in'>${response}</p>`;
      }

      if (["uso-diario", "uso-poco", "no-tengo"].includes(answer)) {
        document.querySelector(".quiz-subquestion").classList.remove("hidden");
      }
    });
  });

  let currentMunicipio = "";
  let currentVehiculos = 0;
});
