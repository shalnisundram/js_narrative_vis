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
    const margin = { top: 10, right: 10, bottom: 80, left: 60 };
    const width = container.node().clientWidth - margin.left - margin.right;
    const height = container.node().clientHeight - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const groupColors = {
        "Energy": "#f7c435",
        "Minerals and Metals": "#dc8864",
        "Crops and Livestock": "#818b2e",
        "Manufactured": "#ba4848",
        "Food and Beverages": "#c75a1b",
        "Luxury Items": "#85a993",
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
        .padding(-8);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.exportsByCountry_exports)])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("class", "x-axis")
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

    highlightMaxExportCategory(data, groupColors, svg, width, height, margin);
    createLegend(svg, groupColors, width, slideNumber);

    // Add a vertical dashed line for a specific region
    var targetRegion = "Eastern Asia"; // Replace with the name of the region
    var xPos = x0(targetRegion) + x0.bandwidth() / 2;
    addVerticalLine(xPos, "red")
    
    targetRegion = "North America";
    xPos = x0(targetRegion) + x0.bandwidth() / 2;
    addVerticalLine(x0(targetRegion) + x0.bandwidth(), "blue")
    addVerticalLine

    function addVerticalLine(xPos, color) {
        // add Eastern Asia line
        svg.append("line")
            .attr("x1", xPos)
            .attr("y1", 150)
            .attr("x2", xPos)
            .attr("y2", height)
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5"); // Creates a dashed line
    }
}
// function createBarChart(container, data, tooltip, slideNumber) {
//     const margin = { top: 10, right: 10, bottom: 80, left: 60 };
//     const width = container.node().clientWidth - margin.left - margin.right;
//     const height = container.node().clientHeight - margin.top - margin.bottom;

//     const svg = container.append("svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", `translate(${margin.left},${margin.top})`);

//     const groupColors = {
//         "Energy": "#f7c435",
//         "Minerals and Metals": "#dc8864",
//         "Crops and Livestock": "#818b2e",
//         "Manufactured": "#ba4848",
//         "Food and Beverages": "#c75a1b",
//         "Luxury Items": "#85a993",
//         "Miscellaneous": "#f0b6ad",
//         "Unclassified": "#0b5227"
//     };

//     const regionGroups = d3.group(data, d => d.region);
//     const regions = Array.from(regionGroups.keys());

//     const x0 = d3.scaleBand()
//         .domain(regions)
//         .range([0, width])
//         .padding(0.1);

//     const x1 = d3.scaleBand()
//         .domain(data.map(d => d.country))
//         .range([0, x0.bandwidth()])
//         .padding(-5);

//     const y = d3.scaleLinear()
//         .domain([0, d3.max(data, d => Math.max(0, d.exportsByCountry_exports))])
//         .nice()
//         .range([height, 0]);

//     svg.append("g")
//         .attr("transform", `translate(0,${height})`)
//         .call(d3.axisBottom(x0))
//         .selectAll("text")
//         .attr("transform", "rotate(-45)")
//         .style("text-anchor", "end");

//     svg.append("g")
//         .call(d3.axisLeft(y));

//         const bars = svg.selectAll(".region-group")
//             .data(regions)
//             .enter().append("g")
//             .attr("class", "region-group")
//             .attr("transform", d => `translate(${x0(d)},0)`)
//             .selectAll(".bar")
//             .data(d => regionGroups.get(d))
//             .enter().append("rect")
//             .attr("class", "bar")
//             .attr("x", d => x1(d.country))
//             .attr("y", height)
//             .attr("width", x1.bandwidth())
//             .attr("height", 0)
//             .attr("fill", d => groupColors[d.group])
//             .on("mouseover", function (event, d) {
//                 tooltip.transition()
//                     .duration(200)
//                     .style("opacity", 0.9);
//                 tooltip.html(`Country: ${d.country}<br>Exports: ${d.exportsByCountry_exports}<br>Main Export: ${d.exportsByCountry_mainExport2019}<br>Group: ${d.group}`)
//                     .style("left", (event.pageX + 5) + "px")
//                     .style("top", (event.pageY - 28) + "px");
//             })
//             .on("mouseout", function () {
//                 tooltip.transition()
//                     .duration(500)
//                     .style("opacity", 0);
//             });

//     bars.transition()
//         .duration(750)
//         .attr("y", d => y(d.exportsByCountry_exports))
//         .attr("height", d => height - y(d.exportsByCountry_exports));

//     highlightMaxExportCategory(data, groupColors, svg, width, height, margin);
//     createLegend(svg, groupColors, width, slideNumber);

//     // Add a vertical dashed line for a specific region
//     var targetRegion = "Eastern Asia"; // Replace with the name of the region
//     var xPos = x0(targetRegion) + x0.bandwidth() / 2;
//     addVerticalLine(xPos, "red")
    
//     targetRegion = "North America";
//     xPos = x0(targetRegion) + x0.bandwidth() / 2;
//     addVerticalLine(x0(targetRegion) + x0.bandwidth(), "blue")
//     addVerticalLine

//     function addVerticalLine(xPos, color) {
//         // add Eastern Asia line
//         svg.append("line")
//             .attr("x1", xPos)
//             .attr("y1", 150)
//             .attr("x2", xPos)
//             .attr("y2", height)
//             .attr("stroke", color)
//             .attr("stroke-width", 2)
//             .attr("stroke-dasharray", "5,5"); // Creates a dashed line
//     }
//     //data.forEach(d => showAnnotation(d));
// }
    function wrapText(text, width) {
        const words = text.split(/\s+/);
        const lines = [];
        let line = '';
    
        words.forEach(word => {
            const testLine = line + (line ? ' ' : '') + word;
            const testWidth = getTextWidth(testLine);
    
            if (testWidth > width) {
                lines.push(line);
                line = word;
            } else {
                line = testLine;
            }
        });
    
        lines.push(line);
    
        return lines;
    }
    
    function getTextWidth(text) {
        // Use a temporary SVG text element to measure text width
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.textContent = text;
        svg.appendChild(textElement);
        document.body.appendChild(svg);
    
        const width = textElement.getBBox().width;
        document.body.removeChild(svg);
        
        return width;
    }

    function highlightMaxExportCategory(data, groupColors, svg, width, height, margin) {
        
        // Find max export category within current slide
        const maxCategory = d3.max(data, d => d.exportsByCountry_exports);
        const maxCategoryData = data.find(d => d.exportsByCountry_exports === maxCategory);
        var text_str = ``
        console.log(maxCategoryData.country)

        if (maxCategoryData.country == "Poland") { // slide 1
            text_str = `Notice the red background to match manufactured goods, the highest export commodity in the lower half of the top 
            .0001 - .0001% of export goods in 2018`
        }
        if (maxCategoryData.country == "Zimbabwe") { // slide 2
            text_str = `This tier of commodities is the only group in which luxury items are the top export commodity group` 
        }

        const wrappedText = wrapText(text_str, 350);

        if (maxCategoryData) {
            // highlight chart background for curr slide
            svg.append("rect")
                .attr("x", 0)
                .attr("y", -10)
                .attr("width", width)
                .attr("height", height + 10)
                .attr("fill", groupColors[maxCategoryData.group])
                .attr("opacity", 0.3)
                .lower(); // Move the rectangle to the back
    
            // annotation for max export category
            svg.append("text")
            .attr("x", 500)
            .attr("y", -margin.top / 2 + 100)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "black")
            .selectAll("tspan")
            .data(wrappedText)
            .enter()
            .append("tspan")
            .attr("x", width / 2)
            .attr("dy", (d, i) => i === 0 ? 0 : 14) // Line height (adjust as needed)
            .text(d => d);
    
            // Highlight the region
           // circleRegion(x0(maxCategoryData.region), width, height, margin);
        }
    }


    // if (slideNumber === 5) { 
    //     circleRegion(x0("Eastern Asia"), x0.bandwidth(), height, margin)
    // }

    // if (slideNumber == 3) {
    //     circleRegion(x0("Southeast Asia"), x0.bandwidth(), height, margin)
    // }

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