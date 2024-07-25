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
        createBarChart(container, slide, tooltip, index+1);
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

function createBarChart(container, data, tooltip, slideNumber) {
    const margin = { top: 10, right: 10, bottom: 50, left: 40 };
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = container.node().clientHeight - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const groupColors = {
        "Energy": "#f7c435",
        "Minerals and Metals": "#85a993",
        "Crops and Livestock": "#818b2e",
        "Manufactured": "#ba4848",
        "Food and Beverages": "#c75a1b",
        "Luxury Items": "#dc8864",
        "Miscellaneous": "#f0b6ad",
        "Unclassified": "#0b5227"
    };

    const regionGroups = d3.group(data, d => d.region);
    const regions = Array.from(regionGroups.keys());

    const x0 = d3.scaleBand()
        .domain(regions)
        .range([0, width])
        .padding(0.1);

    const x1 = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, x0.bandwidth()])
        .padding(-5);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => Math.max(0, d.exportsByCountry_exports))])
        .nice()
        .range([height, 0]);

    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));

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
        .attr("y", height)
        .attr("width", x1.bandwidth())
        .attr("height", 0)
        .attr("fill", d => groupColors[d.group])
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`Country: ${d.country}<br>Exports: ${d.exportsByCountry_exports}<br>Main Export: ${d.exportsByCountry_mainExport2019}<br>Group: ${d.group}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");

            showAnnotation(d);
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    bars.transition()
        .duration(750)
        .attr("y", d => y(d.exportsByCountry_exports))
        .attr("height", d => height - y(d.exportsByCountry_exports));

    createLegend(svg, groupColors, width, slideNumber);

    function showAnnotation(data) {
        const bar = svg.selectAll(".bar").filter(d => d.country === data.country).node();
        if (bar) {
            const barPosition = bar.getBoundingClientRect();
            const svgPosition = svg.node().getBoundingClientRect();

            const annotation = svg.append("g")
                .attr("class", "annotation")
                .attr("transform", `translate(${x1(data.country) + x0(data.region) + x1.bandwidth() / 2}, ${y(data.exportsByCountry_exports)})`);

            // annotation.append("line")
            //     .attr("x1", 0)
            //     .attr("y1", 0)
            //     .attr("x2", 0)
            //     .attr("y2", -20)
            //     .attr("stroke", "black")
            //     .attr("stroke-width", 1);

            // annotation.append("text")
            //     .attr("x", 5)
            //     .attr("y", -25)
            //     .attr("font-size", "10px")
            //     .attr("fill", "black")
            //     .text(`${data.country}: ${data.exportsByCountry_exports}`);
        }
    }

    data.forEach(d => showAnnotation(d));

    if (slideNumber === 5) { 
        circleRegion(x0("Eastern Asia"), x0.bandwidth(), height, margin)
    }
    function circleRegion(pos, width, height, margin) {
        svg.append("circle")
            .attr("cx", pos + width / 2 - 10)
            .attr("cy", height + margin.bottom / 2)
            .attr("r", 30) 
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("fill", "none");

        // Add the arrow marker
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "-0 -5 10 10")
            .attr("refX", 5)
            .attr("refY", 0)
            .attr("orient", "auto")
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("xoverflow", "visible")
            .append("svg:path")
            .attr("d", "M 0,-5 L 10,0 L 0,5")
            .attr("fill", "red")
            .style("stroke", "none");

            // Coordinates for the arrow and note
            const circleX = pos + width / 2;
            const circleY = height + margin.bottom / 2;
            const arrowX1 = circleX - 50;  // Starting X position (left of the circle)
            const arrowY1 = circleY - 50;  // Starting Y position
            const noteX = arrowX1 - 5;     // Note position (adjust as needed)
            const noteY = arrowY1 - 5;     // Note position (adjust as needed)
            const angle = Math.PI / 4;
            

            // Add the arrow line
            svg.append("line")
            .attr("x1", arrowX1)
            .attr("y1", arrowY1)
            .attr("x2", circleX)
            .attr("y2", circleY)
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrowhead)");

                // Calculate the edge of the circle based on the angle
        // const angle = Math.PI / 4; // Angle from the center to the edge (45 degrees, adjust as needed)
        // const arrowX1 = circleX - (radius + 20) * Math.cos(angle); // Adjust distance from circle edge
        // const arrowY1 = circleY - (radius + 20) * Math.sin(angle); // Adjust distance from circle edge

            // Add the note text
            svg.append("text")
                .attr("x", noteX)
                .attr("y", noteY)
                .attr("fill", "red")
                .attr("font-size", "12px")
                .text("Eastern Asia region");
    }
}



function createLegend(svg, groupColors, width, slideNumber) {
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
            .on("click", (event, d) => handleLegendItemClick(d, slideNumber));
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

    console.log("hie")
    // Find the country with the maximum exports for the clicked group
    const maxExportCountry = slide
        .filter(d => d.group === group)
        .reduce((max, d) => d.exportsByCountry_exports > max.exportsByCountry_exports ? d : max, { exportsByCountry_exports: -Infinity });

    // Zoom to the selected bar (you may need to adjust this part based on your actual chart layout)
    highlightBar(maxExportCountry);
}


function highlightBar(country) {
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
        </div>
        `)
        .transition()
        .duration(750)
        .style("opacity", 1); // Fade in

    // Remove previous annotations on slide change
    svg.selectAll(".annotation").exit().remove();

    const bar = svg.selectAll(".bar").filter(d => d.country === country.country).node();
    if (bar) {
        console.log("bar")
        console.log(bar)
        const barPosition = bar.getBoundingClientRect();
        const imagePath = `data/image_annotations/slide${currentSlide + 1}/${country.group.toLowerCase().replace(/ /g, "_")}.png`;
        showImage(imagePath, barPosition);
    }
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

    
        function showImage(imagePath, tooltipPosition) {
            const imgContainer = d3.select("#slide-container");
            imgContainer.selectAll("div.annotation-image-container").remove(); // Clear existing images
        
            if (tooltipPosition) {
                const imgWrapper = imgContainer.append("div")
                    .attr("class", "annotation-image-container")
                    .style("position", "absolute")
                    .style("left", `${tooltipPosition.left}px`)
                    .style("top", `${tooltipPosition.top}px`)
                    .style("z-index", "10");
        
                const zoomContainer = imgWrapper.append("div")
                    .attr("class", "zoom-container")
                    .style("position", "relative")
                    .style("display", "inline-block")
                    .style("width", "200px") // Initial width
                    .style("height", "auto");
        
                const img = zoomContainer.append("img")
                    .attr("src", imagePath)
                    .attr("class", "annotation-image")
                    .style("display", "block")
                    .style("width", "100%")
                    .style("height", "auto") // Maintain aspect ratio
                    .on("load", function () {
                        d3.select(this).transition()
                            .duration(500)
                            .style("display", "block");
                    })
                    .on("error", function () {
                        imgWrapper.remove(); // Remove the image container if not found
                        d3.select("#popup").style("display", "block");
                    });
        
                img.on("mouseover", function () {
                    d3.select(this).classed("hover-zoom", true);
                });
        
                img.on("mouseout", function () {
                    d3.select(this).classed("hover-zoom", false);
                });
        
                img.on("wheel", function (event) {
                    event.preventDefault();
        
                    const zoomFactor = 0.1;
                    const zoomContainer = d3.select(this.parentNode);
                    let transform = zoomContainer.style("transform");
                    let scaleMatch = transform.match(/scale\(([^)]+)\)/);
                    let currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        
                    const newScale = event.deltaY < 0 ? currentScale * (1 + zoomFactor) : currentScale / (1 + zoomFactor);
        
                    zoomContainer
                        .style("transform-origin", "center center")
                        .style("transform", `scale(${newScale})`);
                });
        
                // Add close button
                zoomContainer.append("button")
                    .attr("class", "close-btn")
                    .text("Close")
                    .style("position", "absolute")
                    .style("top", "50x")
                    .style("right", "75px")
                    .on("click", function () {
                        imgWrapper.remove(); // Remove the image container
                        d3.selectAll(".bar").style("opacity", 1); // Reset bar opacity
                        d3.selectAll(".x-axis text")
                            .style("fill", "black")
                            .style("font-weight", "normal"); // Reset label styles
                        d3.selectAll(".annotation").remove(); // Remove annotations
                    });
            } else {
                console.error("Tooltip position is undefined.");
            }
        }

    function handleLegendItemClick(group, slideNumber) {
        if (typeof slideNumber === 'undefined') {
            slideNumber = 1
        }
        const imagePath = `data/image_annotations/slide${slideNumber}/${group.toLowerCase().replace(/ /g, "_")}.png`;
        
        console.log(imagePath)
        // Create an Image object to check if the file exists
        const img = new Image();
        img.src = imagePath;
    
        img.onload = function() {
            // Image exists and is loaded, show it
          //  showImage(imagePath);
            handleLegendClick(group);
        };
    
        img.onerror = function() {
            // Image doesn't exist, show a popup
            showPopup("No data on this commodity")
        };
    }

    function showPopup(message) {
        const popup = d3.select("#popup");
        popup.style("display", "flex");
        popup.select("p").text(message);
        
        // Add event listener to close the popup
        popup.select(".close-btn").on("click", () => {
            popup.style("display", "none");
        });

        // Optionally, hide the popup after a delay
        setTimeout(() => {
            popup.style("display", "none");
        }, 3000); // Hide after 3 seconds
    }
}