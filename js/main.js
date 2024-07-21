d3.json("data/exports-by-country-2024.json").then(data => {
    const slides = createSlides(data);
    let currentSlide = 0;

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");

    function showSlide(index) {
        const slide = slides[index];
        const container = d3.select("#slide-container");

        container.html("");  // Clear previous content
        container.append("h2").text(`Slide ${index + 1}`);
        createBarChart(container, slide, tooltip);
    }

    document.getElementById("prev").addEventListener("click", () => {
        if (currentSlide > 0) {
            currentSlide--;
            showSlide(currentSlide);
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            showSlide(currentSlide);
        }
    });

    // Show the first slide
    showSlide(currentSlide);
});

function createSlides(data) {
    // Sort data by percGlobalExports2018
    data.sort((a, b) => a.exportsByCountry_percGlobalExports2018 - b.exportsByCountry_percGlobalExports2018);

    // Divide data into 5 equal groups
    const slides = [];
    const groupSize = Math.ceil(data.length / 5);
    for (let i = 0; i < 5; i++) {
        slides.push(data.slice(i * groupSize, (i + 1) * groupSize));
    }

    return slides;
}

function createBarChart(container, data, tooltip) {
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = container.node().clientHeight - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const groupColors = {
        "Energy Products": "#f7c435", // yellow
        "Minerals and Metals": "#85a993", // light green
        "Agricultural Products": "#818b2e", // olive green
        "Manufactured Goods": "#85a993", // dark pink ba4848
        "Food and Beverages": "#c75a1b", // dark orange
        "Luxury Items": "#dc8864", // peach
        "Miscellaneous": "#f0b6ad", // light pink
        "Unclassified": "#0b5227" // dark green
    };
    // X scale
    const x = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, width])
        .padding(0.1);

    // Y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.exportsByCountry_exports)])
        .nice()
        .range([height, 0]);

    // X axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Bars
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.country))
        .attr("y", d => y(d.exportsByCountry_exports))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.exportsByCountry_exports))
        .attr("fill", d => groupColors[d.group])
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`Country: ${d.country}<br>Exports: ${d.exportsByCountry_exports}<br>Main Export: ${d.exportsByCountry_mainExport2019}<br>Group: ${d.group}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}