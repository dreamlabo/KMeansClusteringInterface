const clickArea = document.getElementById("click-area")
const centroidInput = document.getElementById("num-centroids")
const errorMessage = document.getElementById("centroid-error-message")
let points = []
const ITERATE_TIMEOUT_TIME = 1000
const iterations_container = document.getElementById("iterations")
const iteration_label = document.getElementById("iterations-label")
const iteration_amount = document.getElementById("iterations-amount")
const iterations_concluded = document.getElementById("iterations-concluded")

const colors = ["#558B6E", "#02A9EA", "#F0C808", "#E56399", "#8963BA", "#B4ADA3",  "#9EBD6E", "#322A26", "#EE6123", "#6D213C"]

function clearArea(event) {
    event.preventDefault()
    points = []
    console.log(points)
    removeCentroids();
    let dots = clickArea.querySelectorAll('.dot');
    dots.forEach(dot => {
        dot.remove();
    });
}

// Add the point when clicking the area
clickArea.addEventListener('click', (event) => {
    const areaBox = clickArea.getBoundingClientRect();
    const dot = document.createElement('div')
    dot.classList.add('dot')
    dot.style.left = `${event.clientX - areaBox.left}px`;
    dot.style.top = `${event.clientY  - areaBox.top}px`;

    const point = {
        x: event.clientX - areaBox.left,
        y: event.clientY - areaBox.top,
        distance: Infinity,
        cluster: null
    }
    points.push(point)
    // Append the dot to the clickable area
    clickArea.appendChild(dot);
})


function calculate(e) {
    e.preventDefault();

    const numOfCentroids = centroidInput.value;
       
    if(numOfCentroids === "" || isNaN( numOfCentroids) ||numOfCentroids > points.length ) {
        errorMessage.classList.add("show-message");
        return;
    }

    errorMessage.classList.remove("show-message");
    iterations_concluded.classList.remove("isVisible");
    iteration_label.innerText = "Adding Centroids"
    iteration_amount.innerText = ""
    iterate(numOfCentroids);
}

function renderCentroids(centroidArray) {
    centroidArray.forEach(centroid => {
        const newCentroid = document.createElement('div')
        const x = `${centroid.x}px`
        const y = `${centroid.y}px`
        newCentroid.classList.add('centroid')
        newCentroid.style.left = x;
        newCentroid.style.top = y;
        clickArea.appendChild(newCentroid);
    })
}

function iterate(numOfCentroids) {
    addClusterColor(points, true);
    removeCentroids();

    const centroidsArray = setInitialCentroids(numOfCentroids)
    renderCentroids(centroidsArray)

    let continueCalculatingCentroids = true
    let j = 1;
  
    while(continueCalculatingCentroids) {
        // set the previous centroids to a new array
        const prevCentroids = []
        centroidsArray.forEach(centroid => {
            const newCentroid = {
                x: centroid.x,
                y: centroid.y
            }
            prevCentroids.push(newCentroid)
        })

        setDistances(centroidsArray) 
        recalculateCentroid(centroidsArray)

        for(let i = 0; i < centroidsArray.length; i++) {
            if(centroidsArray[i].x !== prevCentroids[i].x || centroidsArray[i].y !== prevCentroids[i].y) {
                continueCalculatingCentroids = true
                break;
            }
            else {
                continueCalculatingCentroids = false
            }
        }

        const newPoints = points.map(point => {
            return {
                    x: point.x,
                    y: point.y,
                    distance: point.distance,
                    cluster: point.cluster
            }
        })

        const updatedCentroids = centroidsArray.map(centroid => {
           return  {
                cluster: centroid.cluster,
                x: centroid.x,
                y: centroid.y
            }
        })

        const calculationComplete = !continueCalculatingCentroids;
        const iteration = j;
        const done = calculationComplete;

        setTimeout(() => {
            renderCentroidTableMovement(updatedCentroids)
            removeCentroids()
            renderIterationUI(iteration, done)
            renderNewCentroid(updatedCentroids)
            addClusterColor(newPoints)
            if(calculationComplete) {
                renderDetails(centroidsArray);
                calculateElbowGraph()  
                updateGraph(newPoints, centroidsArray, colors)
                
            }
        }, j * ITERATE_TIMEOUT_TIME);

        j++;
    }
}

function renderCentroidTableMovement(centroidsArr) {
    // cluster centroids
    // Where to place the table
    const clusterCentroidsTableSection = document.getElementById("table-cluster-movement")

    while (clusterCentroidsTableSection.firstChild) {
        clusterCentroidsTableSection.removeChild(clusterCentroidsTableSection.firstChild);
    }
    // Get the three column table template
    const clusterCentroidsTableTemplate = document.getElementById('template--three-column-table');
        // Clone three column table
    const clusterCentroidsTable = clusterCentroidsTableTemplate.content.cloneNode(true);
    clusterCentroidsTable.querySelector(".table-name").textContent = "Centroid Location"

    // Get the header row
    clusterCentroidsTable.querySelector(".th-col-one").textContent = "Centroid"
    clusterCentroidsTable.querySelector(".th-col-two").textContent = "x-axis"
    clusterCentroidsTable.querySelector(".th-col-three").textContent = "y-axis"
    const clusterCentroidsHeader = clusterCentroidsTable.querySelector(".three-column-table")

    // clusterCentroidsTableSection.append(clusterCentroidsTable)

    centroidsArr.forEach(centroid => {
        const templateRow = document.getElementById("template--three-col-data-row");
        const clonedRow = templateRow.content.cloneNode(true)

        clonedRow.querySelector(".td-col-one").textContent = centroid.cluster
        clonedRow.querySelector(".td-col-two").textContent = centroid.x.toFixed(4)
        clonedRow.querySelector(".td-col-three").textContent = centroid.y.toFixed(4)

        clusterCentroidsHeader.append(clonedRow)
    })

    clusterCentroidsTableSection.append(clusterCentroidsTable)
}


function renderIterationUI(iterationAmount, isDone) {
    iterations_container.classList.add("isVisible")
    if(!isDone){
        iteration_label.innerText = "Iteration: "
        iteration_amount.innerText = ""
        iteration_amount.innerText = iterationAmount;
    } 
    else {
        iteration_label.innerText = "Iterations Complete"
        iteration_amount.innerText = ""
        iterations_concluded.innerText = `Total Iterations: ${iterationAmount}`
        iterations_concluded.classList.add("isVisible")
    }
}


function renderDetails(centroidsArr){
    const pointsInEachCluster = calculateNumberOfPointsInACluster(points);

    const tableClusterCases = document.getElementById("table-cluster-cases");
    while (tableClusterCases.firstChild) {
        tableClusterCases.removeChild(tableClusterCases.firstChild);
      }

    const twoColTableTemplate = document.getElementById("template--two-column-table");
    const twoColTable = twoColTableTemplate.content.cloneNode(true);
    
    twoColTable.querySelector(".table-name").textContent = "Cluster Cases"
    twoColTable.querySelector(".table-col-start").textContent = "Cluster"
    twoColTable.querySelector(".table-col-end").textContent = "Cases"
    // Step 3: Select the table where rows should be appended
    const twoColTableElement = twoColTable.querySelector(".two-column-table");

    // Step 4: Loop through the data and add rows to the table
    for (let i = 0; i < Object.keys(pointsInEachCluster).length; i++) {
        const tableRowTemplate = document.getElementById("template--two-col-data-row");
        const tableRow = tableRowTemplate.content.cloneNode(true);

        // Set the data for each cell in the row
        tableRow.querySelector(".table-col-start--data").textContent = i;
        tableRow.querySelector(".table-col-end--data").textContent = pointsInEachCluster[i];
        
        // Append the row to the table's tbody (or directly to the table if no tbody)
        twoColTableElement.appendChild(tableRow);
    }

    // Step 5: Append the whole table to the DOM
    tableClusterCases.appendChild(twoColTable);


    // cluster centroids
    // Where to place the table
    const clusterCentroidsTableSection = document.getElementById("table-cluster-centroids")

    while (clusterCentroidsTableSection.firstChild) {
        clusterCentroidsTableSection.removeChild(clusterCentroidsTableSection.firstChild);
    }
    // Get the three column table template
    const clusterCentroidsTableTemplate = document.getElementById('template--three-column-table');
        // Clone three column table
    const clusterCentroidsTable = clusterCentroidsTableTemplate.content.cloneNode(true);
    clusterCentroidsTable.querySelector(".table-name").textContent = "Centroid Location"

    // Get the header row
    clusterCentroidsTable.querySelector(".th-col-one").textContent = "Centroid"
    clusterCentroidsTable.querySelector(".th-col-two").textContent = "x-axis"
    clusterCentroidsTable.querySelector(".th-col-three").textContent = "y-axis"
    const clusterCentroidsHeader = clusterCentroidsTable.querySelector(".three-column-table")

    // clusterCentroidsTableSection.append(clusterCentroidsTable)

    centroidsArr.forEach(centroid => {
        const templateRow = document.getElementById("template--three-col-data-row");
        const clonedRow = templateRow.content.cloneNode(true)

        clonedRow.querySelector(".td-col-one").textContent = centroid.cluster
        clonedRow.querySelector(".td-col-two").textContent = centroid.x.toFixed(4)
        clonedRow.querySelector(".td-col-three").textContent = centroid.y.toFixed(4)

        clusterCentroidsHeader.append(clonedRow)
    })

    clusterCentroidsTableSection.append(clusterCentroidsTable)


    //List of Points
    const clusterAllocationTableSection = document.getElementById("table-cluster-allocation")
    while (clusterAllocationTableSection.firstChild) {
        clusterAllocationTableSection.removeChild(clusterAllocationTableSection.firstChild);
    }
    const template = document.getElementById('template--four-column-table');

    const clonedTable = template.content.cloneNode(true);
    const tableElement = clonedTable.querySelector(".four-column-table")
            // create the header row
    clonedTable.querySelector(".th-col-one").textContent = "Centroid"
    clonedTable.querySelector(".th-col-two").textContent = "x-axis"
    clonedTable.querySelector(".th-col-three").textContent = "y-axis"
    clonedTable.querySelector(".th-col-four").textContent = "Centroid Distance"

    // Create a data row
    points.forEach(point => {
        const templateRow = document.getElementById("template--four-col-data-row");

        const clonedRow = templateRow.content.cloneNode(true)

        clonedRow.querySelector(".td-col-one").textContent = point.cluster
        clonedRow.querySelector(".td-col-two").textContent = point.x.toFixed(1);
        clonedRow.querySelector(".td-col-three").textContent = point.y.toFixed(1);
        clonedRow.querySelector(".td-col-four").textContent = point.distance.toFixed(4);

        // Append the new row to the table
        tableElement.append(clonedRow)
    })
    clusterAllocationTableSection.appendChild(clonedTable);


    setClosetPointToEachCentroid(centroidsArr);
    //List closet point to centroid
    const closetPointTableSection = document.getElementById("table-closest-point")
    while (closetPointTableSection.firstChild) {
        closetPointTableSection.removeChild(closetPointTableSection.firstChild);
    }

    const closetPointTableTemplate = document.getElementById('template--four-column-table');

    const closetPointTable = closetPointTableTemplate .content.cloneNode(true);
    closetPointTable.querySelector(".table-name").textContent = "Closest Point"
    const closetPointTableHeader = closetPointTable.querySelector(".four-column-table")
    // create the header row
    closetPointTable.querySelector(".th-col-one").textContent = "Centroid"
    closetPointTable.querySelector(".th-col-two").textContent = "x-axis"
    closetPointTable.querySelector(".th-col-three").textContent = "y-axis"
    closetPointTable.querySelector(".th-col-four").textContent = "Centroid Distance"

    // Create a data row
    centroidsArr.forEach(centroid => {
        const templateRow = document.getElementById("template--four-col-data-row");

        const clonedRow = templateRow.content.cloneNode(true)

        clonedRow.querySelector(".td-col-one").textContent =centroid.cluster
        clonedRow.querySelector(".td-col-two").textContent = centroid.closetPoint.x.toFixed(1);
        clonedRow.querySelector(".td-col-three").textContent = centroid.closetPoint.y.toFixed(1);
        clonedRow.querySelector(".td-col-four").textContent = centroid.closetPoint.distance.toFixed(4);

        // Append the new row to the table
        closetPointTableHeader.append(clonedRow)
    })

    closetPointTableSection.appendChild(closetPointTable);
}

function setClosetPointToEachCentroid(arrayOfCentroids) {
    arrayOfCentroids.forEach(centroid => {
        centroid.closetPoint.x = null;
        centroid.closetPoint.y = null;
        centroid.closetPoint.distance = Infinity;
    })

    points.forEach(point => {
        if(arrayOfCentroids[point.cluster].closetPoint.distance > point.distance) {
            arrayOfCentroids[point.cluster].closetPoint.distance = point.distance;
            arrayOfCentroids[point.cluster].closetPoint.x = point.x;
            arrayOfCentroids[point.cluster].closetPoint.y = point.y;
        }
    })
}

function calculateNumberOfPointsInACluster(pointsArr) {
    const pointCount = {}
    pointsArr.forEach(point => {
        if(pointCount.hasOwnProperty(point.cluster)) {
            pointCount[point.cluster] += 1;
        }
        else {
            pointCount[point.cluster] = 1
        }
    })
    return pointCount;
}

function setInitialCentroids(numberOfCentroids) {
    const centroidsArr = []
    const randNumbers = {}
    for(let i = 0; i < numberOfCentroids; i++) {
        let isFound = true;
        while(isFound) {
            const centroidIndex = Math.floor(Math.random() * (points.length));

            if(!randNumbers.hasOwnProperty(centroidIndex)) {
                isFound = false;
                randNumbers[centroidIndex] = 1

                // const centroid = document.createElement('div')
                // const x = `${points[centroidIndex].x}px`
                // const y = `${points[centroidIndex].y}px`
                // centroid.classList.add('centroid')
                // centroid.style.left = x;
                // centroid.style.top = y;
            
                // clickArea.appendChild(centroid);

                const newCentroid = {
                    cluster: i,
                    x: points[centroidIndex].x,
                    y: points[centroidIndex].y,
                    closetPoint: {
                        x: null,
                        y: null,
                        distance: Infinity
                    }
                }
                centroidsArr.push(newCentroid) 
            }
        } 
    }
    return centroidsArr;
}

function renderNewCentroid(centroids) {
    centroids.forEach(centroid => {
        const newCentroid = document.createElement('div')
        newCentroid.classList.add('centroid')
        newCentroid.textContent = centroid.cluster
        newCentroid.style.left = `${centroid.x}px`;
        newCentroid.style.top = `${centroid.y}px`;
        clickArea.appendChild(newCentroid);
    })
}

// Utility function to add the cluster color
function addClusterColor(pointsArr, setAsInitialColor = false) {
    let dots = clickArea.querySelectorAll('.dot');
    dots.forEach(dot => {
        dot.remove();
    });

    if(setAsInitialColor) {
        pointsArr.forEach(point => {
            const newPoint = document.createElement('div')
            newPoint.classList.add('dot')
            newPoint.style.left = `${point.x}px`;
            newPoint.style.top = `${point.y}px`;
            newPoint.style.background = "black"
            clickArea.appendChild(newPoint);
        })
    }
    else {
        pointsArr.forEach(point => {
            const newPoint = document.createElement('div')
            newPoint.classList.add('dot')
            newPoint.style.left = `${point.x}px`;
            newPoint.style.top = `${point.y}px`;

            switch(point.cluster) {
                case 0: 
                    newPoint.style.background =  colors[0]  // "#558B6E"; // Green
                    break;
                case 1: 
                    newPoint.style.background =  colors[1]  // "#02A9EA"; // blue
                    break;
                case 2: 
                    newPoint.style.background =  colors[2]  // "#F0C808";  // Yellow
                    break
                case 3: 
                    newPoint.style.background =  colors[3]  // "#E56399"; // Pink
                    break
                case 4: 
                    newPoint.style.background =  colors[4]  // "#8963BA"; // purple
                    break   
                case 5: 
                    newPoint.style.background =  colors[5]  // "#B4ADA3"; // silver 
                    break
                case 6: 
                    newPoint.style.background =  colors[6]  // "#9EBD6E"; // Olive 
                    break      
                case 7: 
                    newPoint.style.background = colors[7]   // "#322A26"; // Brown    
                    break  
                case 8: 
                    newPoint.style.background =  colors[8]  // "#EE6123"; // Orange  
                    break    
                case 9: 
                    newPoint.style.background = colors[9]   // "#6D213C"; // Red  
                    break   
            }
            clickArea.appendChild(newPoint);
        })
    }
}

// For each point, set the nearest centroid point~
function setDistances(centroids) {
    for(let i = 0; i < points.length; i++) {
        points[i].distance = Infinity;
    }

    for(let i = 0; i < centroids.length; i++) {
        // let initialDistance = Infinity
        for(let j = 0; j < points.length; j++) {
            const calcDistance = calculateDistance(points[j], centroids[i])
            if(points[j].distance > calcDistance) {
                 points[j].distance = calcDistance
                 points[j].cluster = i
            }
        }
    }
}

// Utility function to calculate distance between point and centroid
function calculateDistance(p1, p2) {
    const initial = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    return Math.sqrt(Math.abs(initial))
}

// Recalculates the centroid, given all the points in its cluster
function recalculateCentroid(centroids) {
    const accumulatorHashMap = {}
    for(let i = 0; i < points.length; i++) {
        if(accumulatorHashMap.hasOwnProperty(points[i].cluster)) {
            accumulatorHashMap[points[i].cluster].x += points[i].x
            accumulatorHashMap[points[i].cluster].y += points[i].y
            accumulatorHashMap[points[i].cluster].totalPoints += 1
        }
        else {
            accumulatorHashMap[points[i].cluster] =  {
                x: points[i].x,
                y: points[i].y,
                totalPoints: 1,
            }
        }
    }
    console.log("-------",centroids)
    for(const key in accumulatorHashMap ) {
        centroids[key].x =  accumulatorHashMap[key].x / accumulatorHashMap[key].totalPoints
        centroids[key].y =  accumulatorHashMap[key].y / accumulatorHashMap[key].totalPoints
    }
}

// Removes centroid from the UI
function removeCentroids() {
    const centroidsToRemove = clickArea.querySelectorAll(".centroid")
    centroidsToRemove.forEach(centroid => {
        centroid.remove()
    })
}


function calculateElbowGraph() {
    // console.log("------------------------------------------------------")
    let elbowCentroids = []
    const elbowItems = []
    const CENTROIDS_TO_CALCULATE = 10;
    for(let centroidNum = 1; centroidNum <= CENTROIDS_TO_CALCULATE; centroidNum++) {
        // console.log("Iteration ------------------", centroidNum)
        elbowCentroids = []
        elbowCentroids = setInitialCentroids(centroidNum);
        let continueCalculatingCentroids = true
        let j = 0;
        // console.log(centroidsArray)

        while(continueCalculatingCentroids) {
            // set the previous centroids to a new array
            const prevCentroids = []
            elbowCentroids.forEach(centroid => {
                const newCentroid = {
                    x: centroid.x,
                    y: centroid.y
                }
                prevCentroids.push(newCentroid)
            })

            setDistances(elbowCentroids) 
            recalculateCentroid(elbowCentroids)

            for(let i = 0; i < elbowCentroids.length; i++) {
                // console.log(centroidsArray[i].x)
                // console.log(prevCentroids[i].x)
                if(elbowCentroids[i].x !== prevCentroids[i].x || elbowCentroids[i].y !== prevCentroids[i].y) {
                    continueCalculatingCentroids = true
                    break;
                }
                else {
                    continueCalculatingCentroids = false
                }
            }
    
            // console.log(j,"Calculated (should be new)", elbowCentroids)
            j++
          
        }

        const totalDistanceFromCentroids = points.reduce((accum, point) => {
            return accum += point.distance
        }, 0)
    
        console.log(Math.pow(totalDistanceFromCentroids, 2))
        const newElbowItem = {
            x: centroidNum,
            y: Math.pow(totalDistanceFromCentroids, 2)
        }
    
        elbowItems.push(newElbowItem)
        console.log("elbows", elbowItems)
        console.log("centroids", elbowCentroids)
    }
    plotData(elbowItems)
}






    // // Function to update the graph with data
    //     function updateGraph(pointData) {
    //         // Calculate the domain for x and y based on the data
    //         const xMax = roundUpToNearestHundred(d3.max(pointData, d => d.x));
    //         const yMax = roundUpToNearestHundred(d3.max(pointData, d => d.y));

    //         const x = d3.scaleLinear()
    //             .domain([0, xMax])
    //             .range([0, width]);
        
    //         const y = d3.scaleLinear()
    //             .domain([0, yMax]) // Start at 0
    //             .range([height, 0]);
    
    //     const g = svg.append("g")
    //         .attr("transform", `translate(${margin.left},${margin.top})`);
    
    //         // x.domain([0, xMax]);
    //         // y.domain([0, yMax]);
    
    //         // Update the axes with the new scale
    //         g.select(".x-axis")
    //             .call(d3.axisBottom(x).tickValues(d3.range(0, xMax + 1, 100)));
    
    //         g.select(".y-axis")
    //             .call(d3.axisLeft(y).tickValues(d3.range(0, yMax + 1, 100)));
    
    //         // Add gridlines after the axes update
    //         g.append("g")
    //             .attr("class", "grid")
    //             .attr("stroke-opacity", 0.2)
    //             .call(d3.axisLeft(y)
    //                 .tickSize(-width)
    //                 .tickValues(d3.range(0, yMax + 1, 100))
    //                 .tickFormat(''));
    
    //         g.append("g")
    //             .attr("class", "grid")
    //             .attr("transform", `translate(0,${height})`)
    //             .attr("stroke-opacity", 0.2)
    //             .call(d3.axisBottom(x)
    //                 .tickSize(-height)
    //                 .tickValues(d3.range(0, xMax + 1, 100))
    //                 .tickFormat(''));
    
    //         // Now add the data points, centroids, and legend
    //         // addDataPoints();
    //         // addCentroids();
    //         // addLegend();
    //     }
        
    // // Helper function to round up to the nearest hundred
    // const roundUpToNearestHundred = (num) => Math.ceil(num / 100) * 100;






















































function calculateCentroids() {
    const actualCentroids = []
    setInitialCentroids(5, actualCentroids)

    let continueCalculatingCentroids = true
        let j = 0;
        // const actualItems = []
        
    while(continueCalculatingCentroids) {
        // set the previous centroids to a new array
        const prevCentroids = []
        actualCentroids.forEach(centroid => {
            const newCentroid = {
                x: centroid.x,
                y: centroid.y
            }
            prevCentroids.push(newCentroid)
        })

        // console.log(j,"Prev             :", prevCentroids)
        // console.log(j,"Should equal prev:", actualCentroids)

        setDistances(actualCentroids) 
        recalculateCentroid(actualCentroids)

        for(let i = 0; i <actualCentroids.length; i++) {
            // console.log(centroids[i].x)
            // console.log(prevCentroids[i].x)
            if(actualCentroids[i].x !== prevCentroids[i].x || actualCentroids[i].y !== prevCentroids[i].y) {
                continueCalculatingCentroids = true
                break;
            }
            else {
                continueCalculatingCentroids = false
            }
        }

        console.log(j,"Calculated actual (should be new)", actualCentroids)
        j++
    }
}