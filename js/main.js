let slides;
let currentSlide = 0;

d3.json("data/updated-exports-by-country-2024.json").then(data => {
    currentSlide = 0;
    slides = createSlides(data);

    const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


    function showSlide(index) {
        const slide = slides[index];
        const container = d3.select("#slide-container");

        container.html("");  // Clear previous content
        updateSlideTitle(slide, index+1);
        createBarChart(container, slide, tooltip);
    }

    document.getElementById("prev").addEventListener("click", () => {
        if (currentSlide > 1) {
            currentSlide--;
            updateSlideTitle(slides[currentSlide], currentSlide);
            showSlide(currentSlide);
            console.log(currentSlide)
        } else {
            currentSlide--;
            const container = d3.select("#slide-container");
            container.html("");
            updateSlideTitle(slides[1], 1);
            createBarChart(container, slides[0], tooltip);
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            updateSlideTitle(slides[currentSlide], currentSlide);
            showSlide(currentSlide);
            console.log(currentSlide)
        }
    });

    // Show the first slide
    updateSlideTitle(slides[1], 1);
    const container = d3.select("#slide-container");
    createBarChart(container, slides[0], tooltip);
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

function updateSlideTitle(slideData, slideNumber) {
    // Calculate the min and max percGlobalExports2018 for the current slide
    const minPerc = d3.min(slideData, d => d.exportsByCountry_percGlobalExports2018);
    const maxPerc = d3.max(slideData, d => d.exportsByCountry_percGlobalExports2018);

    // Update the slide title with the range
    d3.select("#slide-title").text(`Slide ${slideNumber}: Global Exports ${minPerc.toFixed(4)} - ${maxPerc.toFixed(4)}%`);
}

function createBarChart(container, data, tooltip) {
    const margin = { top: 10, right: 10, bottom:50, left: 40 };
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = container.node().clientHeight - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const groupColors = {
        "Energy": "#f7c435", // yellow
        "Minerals and Metals": "#85a993", // light green
        "Crops and Livestock": "#818b2e", // olive green
        "Manufactured": "#ba4848", // dark pink 
        "Food and Beverages": "#c75a1b", // dark orange
        "Luxury Items": "#dc8864", // peach
        "Miscellaneous": "#f0b6ad", // light pink
        "Unclassified": "#0b5227" // dark green
    };

    // Group data by region
    const regionGroups = d3.group(data, d => d.region);
    const regions = Array.from(regionGroups.keys());

    // X scale for regions
    const x0 = d3.scaleBand()
        .domain(regions)
        .range([0, width])
        .padding(0.1);

    // X scale for countries within each region
    const x1 = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, x0.bandwidth()])
        .padding(-5);

    // Y scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(0, d.exportsByCountry_exports))])
        .nice()
        .range([height, 0]);

    // X axis for regions
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    svg.append("g")
        .call(d3.axisLeft(y));

    
    // Bars
    const bars = svg.selectAll(".region-group")
        .data(regions)
        .enter().append("g")
        .attr("class", "region-group")
        .attr("transform", d => `translate(${x0(d)},0)`)
        .selectAll(".bar")
        .data(d => regionGroups.get(d))
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x1(d.country))
        .attr("y", height) // Start at the bottom of the chart
        .attr("width", x1.bandwidth())
        .attr("height", 0) // Start with height 0
        .attr("fill", d => groupColors[d.group])
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`Country: ${d.country}<br>Exports: ${d.exportsByCountry_exports}<br>Main Export: ${d.exportsByCountry_mainExport2019}<br>Group: ${d.group}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Apply transition to bars
    bars.transition()
        .duration(750) // Duration of the transition in milliseconds
        .attr("y", d => y(d.exportsByCountry_exports))
        .attr("height", d => height - y(d.exportsByCountry_exports));

    createLegend(svg, groupColors, width);
}

function createLegend(svg, groupColors, width) {
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 300}, ${20})`); // Shifted to the left by 250 pixels

    const legendKeys = Object.keys(groupColors);

    const legendItemHeight = 8;
    const legendItemWidth = 10;
    const legendSpacing = 10;
    const legendPadding = 10;

    // Add legend title
    legend.append("text")
    .attr("class", "legend-title")
    .attr("x", 140)
    .attr("y", -legendItemHeight - legendPadding)
    .attr("font-size", "10px")
    .attr("font-weight", "bold")
    .text("Legend");

    // Calculate the number of items per row
    const itemsPerRow = Math.ceil(legendKeys.length / 2);
    const rowWidth = legendItemWidth + legendSpacing + 60; // Width of a row item

    // Append legend items
    legendKeys.forEach((key, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;

        // Append legend color box
        legend.append("rect")
            .attr("class", "legend-item")
            .attr("x", col * rowWidth)
            .attr("y", row * (legendItemHeight + legendSpacing))
            .attr("width", legendItemWidth)
            .attr("height", legendItemHeight)
            .style("fill", groupColors[key])
            .style("cursor", "pointer")
            .on("click", () => handleLegendClick(key));
        // Append legend text
        legend.append("text")
            .attr("x", col * rowWidth + legendItemWidth + legendSpacing - 7)
            .attr("y", row * (legendItemHeight + legendSpacing) + legendItemHeight / 2)
            .attr("dy", ".35em")
            .attr("font-size", "8px")
            .text(key);
});

function handleLegendClick(group) {
    const slide = slides[currentSlide];

    // Find the country with the maximum exports for the clicked group
    const maxExportCountry = slide
        .filter(d => d.group === group)
        .reduce((max, d) => d.exportsByCountry_exports > max.exportsByCountry_exports ? d : max, { exportsByCountry_exports: -Infinity });

    // Zoom to the selected bar (you may need to adjust this part based on your actual chart layout)
    zoomToBar(maxExportCountry);
}


function zoomToBar(country) {
    const svg = d3.select("#slide-container svg");

    // Select all bars, tweak opacity
    svg.selectAll(".bar")
        .transition()
        .duration(750)
        .style("opacity", d => d.country === country.country ? 1 : 0); // Make other bars not visible

    // Highlight corresponding label
    svg.selectAll(".x-axis text")
        .transition()
        .duration(750)
        .style("fill", d => d === country.country ? "red" : "black")
        .style("font-weight", d => d === country.country ? "bold" : "normal");

         // Add an annotation for the selected country
    const annotation = svg.selectAll(".annotation")
    .data([country]);

    // Update existing annotation
    annotation.enter()
    
        .append("foreignObject")
        .attr("class", "annotation")
        .attr("x", svg.node().clientWidth / 2 - 150)
        .attr("y", 30)
        .attr("width", 300)
        .attr("height", 150)
        .append("xhtml:div")
        .style("font-size", "12px")
        .html(d => `
        <div style="border: 1px solid #ccc; padding: 5px; background: white; border-radius: 5px;">
            <strong>Country:</strong> ${d.country} <br>
            <strong>Exports:</strong> ${d.exportsByCountry_exports} <br>
            <strong>Main Export:</strong> ${d.exportsByCountry_mainExport2019} <br>
            <a href="https://oec.world/en/profile/bilateral-product/gold/reporter/mrt">Product Link</a>
        </div>
        `)
        .transition()
        .duration(750)
        .style("opacity", 1); // Fade in

    // Remove previous annotations on slide change
    svg.selectAll(".annotation").exit().remove();
}

// Calculate legend box dimensions
const legendBoxHeight = 2 * (legendItemHeight + legendSpacing) - legendSpacing + 2 * legendPadding;
const legendBoxWidth = itemsPerRow * rowWidth - legendSpacing + 2 * legendPadding;

// Append legend box
legend.append("rect")
    .attr("x", -legendPadding)
    .attr("y", -legendPadding)
    .attr("width", legendBoxWidth)
    .attr("height", legendBoxHeight)
    .style("fill", "none")
    .style("stroke", "black")
    .style("stroke-width", "1px");

    // Append legend items
    legend.selectAll("rect.legend-item")
        .data(legendKeys)
        .enter().append("rect")
        .attr("class", "legend-item")
        .attr("x", 0)
        .attr("y", (d, i) => i * (legendItemHeight + legendSpacing))
        .attr("width", legendItemWidth)
        .attr("height", legendItemHeight)
        .style("fill", d => groupColors[d]);

    legend.selectAll("text")
        .data(legendKeys)
        .enter().append("text")
        .attr("x", legendItemWidth + legendSpacing)
        .attr("y", (d, i) => i * (legendItemHeight + legendSpacing) + legendItemHeight / 2)
        .attr("dy", ".35em")
        .attr("font-size", "8px")
        .text(d => d);
}