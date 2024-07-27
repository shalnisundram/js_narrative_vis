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

        container.html("");  // clear previous content
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
            currentSlide = 0;
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

    // show first slide
    updateSlideTitle(slides[1], 1);
    const container = d3.select("#slide-container");
    createBarChart(container, slides[0], tooltip);
});

function createSlides(data) {
    // sort data by percGlobalExports2019
    data.sort((a, b) => a.exportsByCountry_percGlobalExports2018 - b.exportsByCountry_percGlobalExports2018);

    // divide data into 5 equal groups
    const slides = [];
    const groupSize = Math.ceil(data.length / 5);
    for (let i = 0; i < 5; i++) {
        slides.push(data.slice(i * groupSize, (i + 1) * groupSize));
    }

    return slides;
}

function updateSlideTitle(slideData, slideNumber) {
    const minPerc = d3.min(slideData, d => d.exportsByCountry_percGlobalExports2018);
    const maxPerc = d3.max(slideData, d => d.exportsByCountry_percGlobalExports2018);

    d3.select("#slide-title").text(`Slide ${slideNumber}: Global Exports ${(minPerc * 100).toFixed(2)} - ${(maxPerc * 100).toFixed(2)}%`);
}

function createBarChart(container, data, tooltip, slideNumber) {
    const margin = { top: 10, right: 0, bottom: 100, left: 75 };
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

    const regionColors = {
        "Australia and New Zealand": "#ef09c5",
        "Baltic Countires": "#ea3891",
        "British Isles": "#37579e",
        "Caribbean": "#b78916", 
        "Central Africa": "#5ef995",
        "Central America": "#44bec9",
        "Eastern Europe": "#11f437",
        "Eastern Asia": "#b53322",
        "Eastern Africa": "#dd835f",
        "Melanesia": "#d82d0a",
        "Melanesia": "#ba14e0",
        "Micronesia": "#ea67d9",
        "North America": "#32b5b2", 
        "Middle East": "#5ebbf9",
        "Nordic Countries": "#9f30db",
        "South America": "#e2521d",
        "Southeast Asia": "#094999",
        "Southern Africa": "#d32e4f",
        "Southern and Central Asia": "#dc8864",
        "Southern Europe": "#2be560",
        "Western Africa": "#f98416",
        "Western Europe": "#b78837",
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
    
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("fill", d => regionColors[d] || "black"); // region-specific colors

        svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("fill", d => regionColors[d] || "black");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .text("Region");

    // Add y-axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .text("Exports (USD)");

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

    var slide = slides[currentSlide];

    addVerticalLine("Eastern Asia", slide)
    addVerticalLine("North America", slide)
    addVerticalLine("Southeast Asia", slide)
    
    function addVerticalLine(targetRegion, slide) {
        var regionColor = regionColors[targetRegion]
        var xPos = x0(targetRegion) + x0.bandwidth() / 2;
        var maxCountryInRegion = highlightMaxExportCountryForRegion(data, targetRegion, groupColors, svg, width, height, margin)
        console.log(maxCountryInRegion)
        var slide = slides[currentSlide]

        var maxCountryData = slide.find(d => d.country === maxCountryInRegion);
        var flagPath = `${maxCountryData.flag}`
        
        // top country lin
        svg.append("line")
            .attr("x1", xPos)
            .attr("y1", 150)
            .attr("x2", xPos)
            .attr("y2", height)
            .attr("stroke", regionColor)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");
        
        // flag
        svg.append("image")
            .attr("xlink:href", `${flagPath}`)
            .attr("x", xPos - 15)
            .attr("y", 130) 
            .attr("width", 25) 
            .attr("height", 15);
    }
}
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
 
        const maxCategory = d3.max(data, d => d.exportsByCountry_exports);
        const maxCategoryData = data.find(d => d.exportsByCountry_exports === maxCategory);
    
        let text_str = '';
    
        console.log("max Cat country", maxCategoryData.country);
        var xpos;
    
        if (maxCategoryData.country == "Poland") { // slide 1
            text_str = "Notice the red background to match manufactured goods, the highest export commodity in the lower half of the top 0.01% of export goods in 2018";
            xpos = 200
            ypos = 80
        }
        if (maxCategoryData.country == "Zimbabwe") { // slide 2
            text_str = "This tier of commodities is the only group in which luxury items is the top export commodity group";
            xpos = 40
            ypos = 90
        }
        if (maxCategoryData.country == "Cambodia") { // slide 3
            text_str = "Top 3 export regions: East Asia, North America, and Southeast Asia, dominate this percentage group in energy. ";
            xpos = 0
            ypos = 70
        }
        if (maxCategoryData.country == "Romania") { // slide 4
            text_str = "Tier 2 export countries dominate this perctage group in manufacturing and energy";
            xpos = 100
            ypos = 80
        }
        if (maxCategoryData.country == "China") { // slide 5
            text_str = "The U.S. and China - the top export countries - take up up to 10.78% of exports in energy and manufacturing, respectively";
            xpos = 130
            ypos = 80
        }
    
        console.log(currentSlide);
    
        // highlight chart background for curr slide
        svg.append("rect")
            .attr("x", 0)
            .attr("y", -10)
            .attr("width", width)
            .attr("height", height + 10)
            .attr("fill", groupColors[maxCategoryData.group])
            .attr("opacity", 0.5)
            .lower(); // Move the rectangle to the back
    
// for overlay insights box
const foreignObject = svg.append("foreignObject")
.attr("x", xpos)  // Adjust position as needed
.attr("y", ypos)  // Adjust position as needed
.attr("width", width - 100)
.attr("height", height - 100);

const div = foreignObject.append("xhtml:div")
.attr("class", "overlay-box");

div.html(`
<details>
    <summary class="collapsible-button">More info</summary>
    <p>${text_str}</p>
</details>
`);

        div.html(`
            <details>
                <summary>Insights</summary>
                <p>${text_str}</p>
            </details>
        `);
        
    }
    function highlightMaxExportCountryForRegion(data, region, groupColors, svg, width, height, margin) {
      
        const regionData = data.filter(d => d.region === region);
    
        if (regionData.length === 0) {
            console.log(`No data available for region: ${region}`);
            return null;
        }
            const maxCountryData = regionData.reduce((max, d) => d.exportsByCountry_exports > max.exportsByCountry_exports ? d : max, regionData[0]);
    
        console.log(`Max export country for ${region}: ${maxCountryData.country}`);
    
        return maxCountryData.country;
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

    // compute num items/row
    const itemsPerRow = Math.ceil(legendKeys.length / 2);
    const rowWidth = legendItemWidth + legendSpacing + 60; // Width of a row item

    legendKeys.forEach((key, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;

        legend.append("rect")
            .attr("class", "legend-item")
            .attr("x", col * rowWidth)
            .attr("y", row * (legendItemHeight + legendSpacing))
            .attr("width", legendItemWidth)
            .attr("height", legendItemHeight)
            .style("fill", groupColors[key])
            .style("cursor", "pointer")
            .on("click", (event, d) => handleLegendItemClick(d, slideNumber));
        
        legend.append("text")
            .attr("x", col * rowWidth + legendItemWidth + legendSpacing - 7)
            .attr("y", row * (legendItemHeight + legendSpacing) + legendItemHeight / 2)
            .attr("dy", ".35em")
            .attr("font-size", "8px")
            .text(key);
});

function handleLegendClick(group) {
    const slide = slides[currentSlide];

    // find country with max eports for clicked group and show respective bar
    const maxExportCountry = slide
        .filter(d => d.group === group)
        .reduce((max, d) => d.exportsByCountry_exports > max.exportsByCountry_exports ? d : max, { exportsByCountry_exports: -Infinity });

    highlightBar(maxExportCountry);
}

function highlightBar(country) {
    const svg = d3.select("#slide-container svg");

    // select all bars, tweak opacity
    svg.selectAll(".bar")
        .transition()
        .duration(750)
        .style("opacity", d => d.country === country.country ? 1 : 0); // clear other bars

    // highlight label
    svg.selectAll(".x-axis text")
        .transition()
        .duration(750)
        .style("fill", d => d === country.country ? "red" : "black")
        .style("font-weight", d => d === country.country ? "bold" : "normal");

    const annotation = svg.selectAll(".annotation")
    .data([country]);

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
        .style("opacity", 1); // fade in

    // clear previous annotations upon deletion of slide
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

const legendBoxHeight = 2 * (legendItemHeight + legendSpacing) - legendSpacing + 2 * legendPadding;
const legendBoxWidth = itemsPerRow * rowWidth - legendSpacing + 2 * legendPadding;

legend.append("rect")
    .attr("x", -legendPadding)
    .attr("y", -legendPadding)
    .attr("width", legendBoxWidth)
    .attr("height", legendBoxHeight)
    .style("fill", "none")
    .style("stroke", "black")
    .style("stroke-width", "1px");

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
            imgContainer.selectAll("div.annotation-image-container").remove(); // clear existing images
        
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
                    .style("width", "200px")
                    .style("height", "auto");
        
                const img = zoomContainer.append("img")
                    .attr("src", imagePath)
                    .attr("class", "annotation-image")
                    .style("display", "block")
                    .style("width", "100%")
                    .style("height", "auto")
                    .on("load", function () {
                        d3.select(this).transition()
                            .duration(500)
                            .style("display", "block");
                    })
                    .on("error", function () {
                        imgWrapper.remove();
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
        
                // add close button
                zoomContainer.append("button")
                    .attr("class", "close-btn")
                    .text("Close")
                    .style("position", "absolute")
                    .style("top", "50x")
                    .style("right", "75px")
                    .on("click", function () {
                        // remove previous state and reset
                        imgWrapper.remove(); // remove image container
                        d3.selectAll(".bar").style("opacity", 1);
                        d3.selectAll(".x-axis text")
                            .style("fill", "black")
                            .style("font-weight", "normal");
                        d3.selectAll(".annotation").remove(); 
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
        const img = new Image();
        img.src = imagePath;
    
        img.onload = function() {
            handleLegendClick(group);
        };
    
        img.onerror = function() { // image doesn't exist
            showPopup("No data on this commodity")
        };
    }

    function showPopup(message) {
        const popup = d3.select("#popup");
        popup.style("display", "flex");
        popup.select("p").text(message);
        
        // listen for close popup
        popup.select(".close-btn").on("click", () => {
            popup.style("display", "none");
        });
    }
}