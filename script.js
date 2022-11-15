sportList = new Set()
sportList.add("--- All Sports (Slow!) ---")

eventList = new Set();
eventList.add("--- All Events ---")

const OLYMPICS_DATASET_DIR = "data/olympics.csv"
const COUNTRYINFO_DATASET_DIR = "data/countrydata.csv"

var filteredBySexData;

var justLoaded = 0;

var athletesDic = {}
var treeMapDic = {}
var lineChartDic = {}
var singleCountryDic = {}
var topMedaledCountries = {}
var countriesBeingCompared = ["United States", "Jamaica", "Portugal"]
var tiposUnicosMedalhas = ['BronzeMedals', 'SilverMedals', 'GoldMedals']
var currentExploredTeam = "Portugal";
var currentExploredTeamSport = "";

var eventSpecificDataForHover = {};

var parCordBackup;

var zoomedIn = false;

var ALL_COUNTRIES;

updatedMeasures = {}

var lineChartMode = 1;
var treeMapMode = 0;

var bottomYearFilter = "1992";
var topYearFilter = "2016";

var margin = { top: 20, right: 40, bottom: 40, left: 90 },
    width = 500 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;


const svgWidth = 550,
    svgHeight = 360,
    svgMargin = { top: 30, right: 30, bottom: 30, left: 30 },
    finalSvgWidth = svgWidth - svgMargin.left - svgMargin.right,
    finalSvgHeight = svgHeight - svgMargin.top - svgMargin.bottom;


var x,
    y = {},
    dimensions,
    dragging = {},
    background,
    foreground;

var color;

var tooltip;
var tooltipBarChart;
var tooltipTreeMap;
var tooltipTreeMap1;
var tooltipTreeMap2;
var tooltipLineChart;

var pressed = true;
var justPressed = false;

var countryInfoData;
var comparedCountryData;

var lineChartColorer;



function init() {

    color = d3.scaleOrdinal()
        .domain(["Bronze", "Silver", "Gold", "No"])
        .range(['#a2631b', '#858380', '#FFC500', "#2ccde0"])

    var slider = document.getElementById('slider');

    noUiSlider.create(slider, {
        start: [1992, 2016],
        connect: true,
        step: 4,
        range: {
            'min': 1992,
            'max': 2016
        },
        pips: {
            mode: 'values',
            values: [1992, 1996, 2000, 2004, 2008, 2012, 2016],
            density: 50
        },
    });

    lineChartColorer = d3.scaleOrdinal()
    .domain(countriesBeingCompared)
    .range(d3.schemeSet2);

    let lis = document.querySelectorAll("li");
    for (let i = 0; i < lis.length; i++) {
        lis[i].style.backgroundColor = lineChartColorer(lis[i].innerText.slice(0, -2));
    }

    //console.log(lineChartColorer("Portugal"))




    // bottomYearFilter = document.getElementById("from").value;
    // topYearFilter = document.getElementById("to").value; 

    // tooltip = d3.select("#parCordDiv")
    //     .append("div")
    //     .attr("id", "tooltip")
    //     .style('width', finalSvgWidth / 2.5 + "px")
    //     .style("opacity", 0)
    //     .style("background-color", "white")
    //     .style("border", "solid")
    //     .style("border-width", "1px")
    //     .style("border-radius", "5px");


    d3.csv(OLYMPICS_DATASET_DIR).then(function (data) {
        d3.csv(COUNTRYINFO_DATASET_DIR).then(function (ciData) {
            countryInfoData = ciData;

            tooltip = d3.select("#parCordDiv").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            tooltipBarChart = d3.select("#barchartDiv").append("div")
                .attr("class", "tooltipBarChart")
                .style("opacity", 0);

            tooltipTreeMap = d3.select("#treeMapDiv").append("div")
                .attr("class", "tooltipTreeMap")
                .style("opacity", 0);

            tooltipTreeMap1 = d3.select("#treeMapDiv").append("div")
                .attr("class", "tooltipTreeMap1")
                .style("opacity", 0);

            tooltipTreeMap2 = d3.select("#treeMapDiv").append("div")
                .attr("class", "tooltipTreeMap2")
                .style("opacity", 0);

            tooltipLineChart = d3.select("#linechartDiv").append("div")
                .attr("class", "tooltipLineChart")
                .style("opacity", 0);

            ALL_COUNTRIES =  [...new Set(countryInfoData.map(d => d.Country))];



            //DATA SELECTION----------------------------------------------
            filteredBySexData = data.filter(function (elem) {
                return elem.Sex == d3.select("input[name='sexToggle']:checked").attr("value")[0];
            });
            //filteredBySexData = filteredBySexData.slice(0,100)

            initialDataMan = filteredBySexData.filter(function (elem) {
                return elem.Year <= topYearFilter && elem.Year >= bottomYearFilter && elem.Sport == "Athletics" && elem.Event == "Athletics Men's 100 metres";
            });

            initialDataWoman = filteredBySexData.filter(function (elem) {
                return elem.Year <= topYearFilter && elem.Year >= bottomYearFilter && elem.Sport == "Athletics" && elem.Event == "Athletics Women's 100 metres";
            });

            filteredBySexAndInterval = filteredBySexData.filter(function (elem) {
                return elem.Year <= topYearFilter && elem.Year >= bottomYearFilter;
            });

            //let searchSingle = d3.select("input[name='searchSingle']").node();
            //searchSingle.disabled = true;

            document.querySelectorAll("input[name='searchSingle']")[0].disabled = true;
            document.querySelectorAll("input[name='searchSingle']")[0].style.opacity = 0.5;
            var currSelectedTitle = document.getElementById("curr-selected-country-title");
            currSelectedTitle.style.opacity = 0.4;

            var currSelectedCountryAndSportTitle = document.getElementById("treemap-title");
            currSelectedCountryAndSportTitle.style.opacity = 0;

            var dropdownBox = document.getElementById("dropdown");
            var eventDropdownBox = document.getElementById("eventDropdown");
            

            //END OF DATA SELECTION----------------------------------------

            //CREATE METHODS-----------------------------------------------


            if (d3.select("input[name='sexToggle']:checked").attr("value")[0] === "M") {
                athletesDic = fillAthletesDic(initialDataMan);
                treeMapDic = fillCountriesDic(initialDataMan);

                comparedCountryData = countryInfoData.filter(function (elem) {
                    for (let i = 0; i < countriesBeingCompared.length; i++) {
                        if (elem.Country == countriesBeingCompared[i])
                            return true
                    }
                    return false

                });


                lineChartDic = fillLineChartDic(initialDataMan, lineChartMode);


                createTopBar("#dropdown");
                createBarChart("#vi1");
                createParalelCoordinates("#vi4", initialDataMan);
                createTreeMap("#vi5");
                createLineChart("#vi6");
            }
            else {
                athletesDic = fillAthletesDic(initialDataWoman);
                treeMapDic = fillCountriesDic(initialDataWoman);

                comparedCountryData = countryInfoData.filter(function (elem) {
                    for (let i = 0; i < countriesBeingCompared.length; i++) {
                        if (elem.Country == countriesBeingCompared[i])
                            return true
                    }
                    return false

                });

                lineChartDic = fillLineChartDic(initialDataWoman, lineChartMode);
                createTopBar("#dropdown");
                createBarChart("#vi1");
                createParalelCoordinates("#vi4", initialDataWoman);
                createTreeMap("#vi5");
                createLineChart("#vi6");
            }



            //END OF CREATE METHODS----------------------------------------

            //UPDATE METHODS-------------------------------

            d3.select("#curr-country").on("click", () => {


                //console.log("-------------------------------\nA) Clicked curr country!");

                if (treeMapMode == 1 || treeMapMode == 2) {
                    zoomedIn = false;
                    document.getElementById("curr-sport").innerHTML = "";
                    let filteredForSingle = filteredBySexAndInterval.filter(function (elem) { return elem.Team == currentExploredTeam });
                    singleCountryDic = fillSingleCountryDic_SPORT(filteredForSingle);
                    updateTreeMapSingleCountry(singleCountryDic);

                    //console.log("B) Inside if statement!")
                    treeMapMode = 1;

                    let sportFilter = d3.select("#dropdown").node().value;
                    if (sportFilter === "--- All Sports (Slow!) ---")
                        d3.select("#dropdown").dispatch("change");
                    else
                        d3.select("#eventDropdown").dispatch("change");

                    
                } 

            });

            d3.select("#multiple-countries-button").on("click", () => {
                dropdownBox.disabled = false;
                eventDropdownBox.disabled = false;
                dropdownBox.style.opacity = 1;
                eventDropdownBox.style.opacity = 1;
                document.getElementById("curr-sport").innerHTML = "";

                currSelectedCountryAndSportTitle.style.opacity = 0;
                currSelectedTitle.style.opacity = 0.4;

                //console.log("clicked multiple");

                document.querySelectorAll("input[name='searchSingle']")[0].disabled = true;
                document.querySelectorAll("input[name='searchSingle']")[0].style.opacity = 0.5;
                let curr = document.querySelectorAll("#multiple-countries-button")[0];
                curr.classList.add("selected");
                let old = document.querySelectorAll("#single-country-button")[0];
                old.classList.remove("selected");


                treeMapMode = 0;
                zoomedIn = false;

                // Step 1: erase current map (basicamente o metodo em baixo, mas sem o create)

                updateTreeMap(treeMapDic)
              
                let sportFilter = d3.select("#dropdown").node().value;
                if (sportFilter === "--- All Sports (Slow!) ---")
                    d3.select("#dropdown").dispatch("change");
                else
                    d3.select("#eventDropdown").dispatch("change");

            });

            d3.select("#single-country-button").on("click", () => {
                dropdownBox.disabled = true;
                eventDropdownBox.disabled = true;
                dropdownBox.style.opacity = 0.5;
                eventDropdownBox.style.opacity = 0.5;
                document.getElementById("curr-country").innerHTML = currentExploredTeam;
                document.getElementById("curr-sport").innerHTML = "";
                currSelectedCountryAndSportTitle.style.opacity = 1;
                currSelectedTitle.style.opacity = 1;
                document.querySelectorAll("input[name='searchSingle']")[0].disabled = false;
                document.querySelectorAll("input[name='searchSingle']")[0].style.opacity = 1;
                let curr = document.querySelectorAll("#single-country-button")[0];
                curr.classList.add("selected");
                let old = document.querySelectorAll("#multiple-countries-button")[0];
                old.classList.remove("selected");

                treeMapMode = 1;
                zoomedIn = false;

                // Step 1: erase current map (basicamente o metodo em baixo, mas sem o create)
                const svg = d3.select("#vi5");
                svg.selectAll("text").remove();
                svg.selectAll("rect").remove();
                svg.selectAll("vals").remove();
                svg.selectAll("titles").remove();

                // new
                let filteredForSingle = filteredBySexAndInterval.filter(function (elem) { return elem.Team == currentExploredTeam });
                singleCountryDic = fillSingleCountryDic_SPORT(filteredForSingle);
                updateTreeMapSingleCountry(singleCountryDic);

                let sportFilter = d3.select("#dropdown").node().value;
                if (sportFilter === "--- All Sports (Slow!) ---")
                    d3.select("#dropdown").dispatch("change");
                else
                    d3.select("#eventDropdown").dispatch("change");
                

            });

            d3.select(".participantsToggle").on("click", () => {
                pressed = !pressed;
                justPressed = true;

                let sportFilter = d3.select("#dropdown").node().value;
                if (sportFilter === "--- All Sports (Slow!) ---")
                    d3.select("#dropdown").dispatch("change");
                else
                    d3.select("#eventDropdown").dispatch("change");

            });


            d3.select("#dropdown").on("change", () => {

                let sportFilter = d3.select("#dropdown").node().value;

                let dados;
                if (sportFilter != "--- All Sports (Slow!) ---") {
                    dados = filteredBySexAndInterval.filter(function (elem) {
                        return elem.Sport == sportFilter;
                    });

                } else {
                    dados = filteredBySexAndInterval;
                }

                //athletesDic = fillAthletesDic(dados);
                //treeMapDic = fillCountriesDic(dados);

                let filteredForSingle;

                if (treeMapMode == 0) {
                    treeMapDic = fillCountriesDic(dados);
                    athletesDic = fillAthletesDic(dados);
                } else if (treeMapMode == 1) {
                    filteredForSingle = filteredBySexAndInterval.filter(function (elem) { return elem.Team == currentExploredTeam});
                    singleCountryDic = fillSingleCountryDic_SPORT(filteredForSingle);
                    athletesDic = fillAthletesDic(filteredForSingle);
                } else if (treeMapMode == 2) {
                    filteredForSingle = filteredBySexAndInterval.filter(function (elem) { return elem.Team == currentExploredTeam && elem.Sport == currentExploredTeamSport});
                    singleCountryDic = fillSingleCountryDic_EVENT(filteredForSingle);
                    athletesDic = fillAthletesDic(filteredForSingle);
                }

                comparedCountryData = countryInfoData.filter(function (elem) {
                    for (let i = 0; i < countriesBeingCompared.length; i++) {
                        if (elem.Country == countriesBeingCompared[i])
                            return true
                    }
                    return false

                });
                
                lineChartDic = fillLineChartDic(dados, lineChartMode);


                if (!justPressed) {

                    updateSecondDropdown(sportFilter);
                    updateBarChart(athletesDic);
                    
                    if (treeMapMode == 0) {
                        updateTreeMap(treeMapDic);
                    } else if (treeMapMode == 1) {
                        updateTreeMapSingleCountry(singleCountryDic);
                    } else if (treeMapMode == 2) {
                        updateTreeMapSingleCountryEvents(singleCountryDic);
                    }

                    updateLineChart(lineChartDic);
                }
                justPressed = false;

                if (treeMapMode == 0) {
                    updateParCord(dados);
                    parCordBackup = dados;
                } else if (treeMapMode == 1) {
                    updateParCord(filteredForSingle);
                    parCordBackup = filteredForSingle;
                } else if (treeMapMode == 2) {
                    updateParCord(filteredForSingle);
                    parCordBackup = filteredForSingle;
                }

            });



            slider.noUiSlider.on('update', function (values, handle) {

                if (justLoaded == 2) {
                    if (handle == 0) {
                        bottomYearFilter = String(values[handle]).slice(0, -3); // E.g: "2004.00" becomes "2004", so the comparisons below function properly
                    } else {
                        topYearFilter = String(values[handle]).slice(0, -3);
                    }

                    //console.log("-----------------------------------------");
                    //console.log("Bottom:", bottomYearFilter, " | Top: ", topYearFilter);

                    filteredBySexAndInterval = filteredBySexData.filter(function (elem) {
                        return elem.Year <= topYearFilter && elem.Year >= bottomYearFilter;
                    });

                    //console.log(filteredBySexAndInterval.length)

                    let sportFilter = d3.select("#dropdown").node().value;
                    if (sportFilter === "--- All Sports (Slow!) ---")
                        d3.select("#dropdown").dispatch("change");
                    else
                        d3.select("#eventDropdown").dispatch("change");
                } else {
                    //console.log("loaded once")
                    justLoaded += 1;
                }

            });


            //athletesDic = fillAthletesDic(filteredBySexAndInterval)

            // updateDropdown()
            // updateBarChart(athletesDic)

            // filteredBySexData = data.filter(function(elem) {
            //     return elem.Sex == d3.select("input[name='sexToggle']:checked").attr("value")[0];
            // });
            //  //filteredBySexData = filteredBySexData.slice(0,100)

            // filteredBySexAndInterval = filteredBySexData.filter(function(elem) {
            //     return elem.Year <= topYearFilter && elem.Year >= bottomYearFilter;
            // }); 


            d3.selectAll("#eventDropdown").on("change", () => {

                let eventFilter = d3.select("#eventDropdown").node().value;

                let sportFilter = d3.select("#dropdown").node().value;

                let dados;
                if (eventFilter != "--- All Events ---") {

                    //console.log(eventFilter,"here")
                    dados = filteredBySexAndInterval.filter(function (elem) {
                        return elem.Event == eventFilter;
                    });

                } else {

                    dados = filteredBySexAndInterval.filter(function (elem) {
                        return elem.Sport == sportFilter;
                    });

                }

                let filteredForSingle;

                if (treeMapMode == 0) {
                    treeMapDic = fillCountriesDic(dados);
                    athletesDic = fillAthletesDic(dados);
                } else if (treeMapMode == 1) {
                    filteredForSingle = filteredBySexAndInterval.filter(function (elem) { return elem.Team == currentExploredTeam});
                    singleCountryDic = fillSingleCountryDic_SPORT(filteredForSingle);
                    athletesDic = fillAthletesDic(filteredForSingle);
                } else if  (treeMapMode == 2) {
                    filteredForSingle = filteredBySexAndInterval.filter(function (elem) { return elem.Team == currentExploredTeam && elem.Sport == currentExploredTeamSport});
                    singleCountryDic = fillSingleCountryDic_EVENT(filteredForSingle);
                    athletesDic = fillAthletesDic(filteredForSingle);
                }

                comparedCountryData = countryInfoData.filter(function (elem) {
                    for (let i = 0; i < countriesBeingCompared.length; i++) {
                        if (elem.Country == countriesBeingCompared[i])
                            return true
                    }
                    return false

                });
                
                lineChartDic = fillLineChartDic(dados, lineChartMode);


                if (!justPressed) {

                    updateBarChart(athletesDic);
                    
                    if (treeMapMode == 0) {
                        updateTreeMap(treeMapDic);
                    } else if (treeMapMode == 1) {
                        updateTreeMapSingleCountry(singleCountryDic);
                    } else if (treeMapMode == 2) {
                        updateTreeMapSingleCountryEvents(singleCountryDic);
                    }

                    updateLineChart(lineChartDic);
                }
                justPressed = false;

                if (treeMapMode == 0) {
                    updateParCord(dados);
                    parCordBackup = dados;
                } else if (treeMapMode == 1) {
                    updateParCord(filteredForSingle);
                    parCordBackup = filteredForSingle;
                } else if (treeMapMode == 2) {
                    updateParCord(filteredForSingle);
                    parCordBackup = filteredForSingle;
                }


            });

            d3.selectAll("input[name='searchSingle']").on("change", () => {
                
                let searchValue = d3.select("input[name='searchSingle']").node().value;

                if (ALL_COUNTRIES.includes(searchValue)) {
                    currentExploredTeam = searchValue;
                    document.getElementById("curr-country").innerHTML = currentExploredTeam;

                    let sportFilter = d3.select("#dropdown").node().value;
                    if (sportFilter === "--- All Sports (Slow!) ---")
                        d3.select("#dropdown").dispatch("change");
                    else
                        d3.select("#eventDropdown").dispatch("change");

                } else {
                    console.log("Country is already present in the line chart viz or no country with name ", searchValue , " was found.");
                }

            });

            //d3.selectAll("input[name='search']").on("input", () => {
            d3.selectAll("input[name='searchMultiple']").on("change", () => {
                let searchValue = d3.select("input[name='searchMultiple']").node().value;

                if (ALL_COUNTRIES.includes(searchValue) && !countriesBeingCompared.includes(searchValue) && countriesBeingCompared.length < 5) {
                    countriesBeingCompared.push(searchValue);
                    console.log(searchValue);

                    let fatherUL = document.querySelectorAll("ul")[0];
                    let li = document.createElement("li");
                    li.style.backgroundColor = lineChartColorer(searchValue);
                    li.innerHTML = searchValue + " <strong>X</strong>";
                    fatherUL.appendChild(li);

                    

                    d3.select("input[name='searchMultiple']").node().value = "";

                    let sportFilter = d3.select("#dropdown").node().value;
                    if (sportFilter === "--- All Sports (Slow!) ---")
                        d3.select("#dropdown").dispatch("change");
                    else
                        d3.select("#eventDropdown").dispatch("change");
                } else {
                    console.log("Country is already present in the line chart viz or no country with name ", searchValue , " was found.");
                }


                

                //updateLineChart(lineChartDic);

            });

            document.querySelectorAll("ul")[0].addEventListener("click",function(e) {
                if (countriesBeingCompared.length > 1) {
                    if (e.target && e.target.matches("li")) {
                    console.log("removed ", e.target.innerText)
                    

                    countriesBeingCompared = countriesBeingCompared.filter(function(item) {
                        return item !== e.target.innerText.slice(0, -2);
                    });

                    let lis = document.querySelectorAll("li");
                    for (let i = 0; i < lis.length; i++) {
                        lis[i].style.backgroundColor = lineChartColorer(lis[i].innerText.slice(0, -2));
                    }

                    console.log(countriesBeingCompared)

                    e.target.remove();

                    let sportFilter = d3.select("#dropdown").node().value;
                    if (sportFilter === "--- All Sports (Slow!) ---")
                        d3.select("#dropdown").dispatch("change");
                    else
                        d3.select("#eventDropdown").dispatch("change");
                    }
                } else {
                    console.log("The number of compared countries cannot be zero.");
                }

              });


                




            d3.selectAll("input[name='sexToggle']").on("change", () => {

                filteredBySexData = data.filter(function (elem) {
                    return elem.Sex == d3.select("input[name='sexToggle']:checked").attr("value")[0];
                });

                filteredBySexAndInterval = filteredBySexData.filter(function (elem) {
                    return elem.Year <= topYearFilter && elem.Year >= bottomYearFilter;
                });

                switch (d3.select("input[name='sexToggle']:checked").attr("value")[0]) {
                    case "M":

                        document.getElementById("dropdown").value = "Athletics";
                        d3.select("#dropdown").dispatch("change");
                        document.getElementById("eventDropdown").value = "Athletics Men's 100 metres";
                        d3.select("#eventDropdown").dispatch("change");
                        //console.log("2-----")
                        break;

                    case "F":
                        document.getElementById("dropdown").value = "Athletics";
                        d3.select("#dropdown").dispatch("change");
                        document.getElementById("eventDropdown").value = "Athletics Women's 100 metres";
                        d3.select("#eventDropdown").dispatch("change");

                        break;

                }

            });


            if (d3.select("input[name='sexToggle']:checked").attr("value")[0] === "M") {

                document.getElementById("dropdown").value = "Athletics";
                d3.select("#dropdown").dispatch("change");
                document.getElementById("eventDropdown").value = "Athletics Men's 100 metres";
                d3.select("#eventDropdown").dispatch("change");
                //console.log("1-----")
            }
            else {
                document.getElementById("dropdown").value = "Athletics";
                d3.select("#dropdown").dispatch("change");
                document.getElementById("eventDropdown").value = "Athletics Women's 100 metres";
                d3.select("#eventDropdown").dispatch("change");
            }
        })
    });

    //END OF UPDATE METHODS--------------------------

}



function createTopBar(id) {

    for (i = 0; i < filteredBySexData.length; i++) {
        sportList.add(filteredBySexData[i].Sport);
    }

    d3.select(id).selectAll("option")
        .data(Array.from(sportList))
        .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; })

}


function updateDropdown() {
    sportList = new Set();
    sportList.add("--- All Sports (Slow!) ---")

    eventList = new Set();
    eventList.add("--- All Events ---")

    for (i = 0; i < filteredBySexData.length; i++) {
        sportList.add(filteredBySexData[i].Sport);
    }

    d3.select("#dropdown").selectAll("option").remove()
    d3.selectAll("#eventDropdown").selectAll("option").remove()

    d3.select("#dropdown")
        .selectAll("option")
        .data(Array.from(sportList))
        .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });

    d3.select("#eventDropdown")
        .selectAll("option")
        .data(Array.from(eventList))
        .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });


}

function updateSecondDropdown(nodeValue) {

    eventList = new Set();
    eventList.add("--- All Events ---")

    for (i = 0; i < filteredBySexData.length; i++) {

        filteredBySexData[i].Sport == nodeValue ? eventList.add(filteredBySexData[i].Event) : 0;

    }

    d3.select("#eventDropdown").selectAll("option").remove()
    d3.select("#eventDropdown")
        .selectAll("option")
        .data(Array.from(eventList))
        .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });


}

function createTreeMap(id) {

    const marginTM = { top: 10, right: 10, bottom: 10, left: 10 },
        widthTM = 700 - marginTM.left - marginTM.right,
        heightTM = 550 - marginTM.top - marginTM.bottom;

    // append the svg object to the body of the page
    var svg = d3.select(id)
        .append("svg")
        .attr("width", widthTM + marginTM.left + marginTM.right)
        .attr("height", heightTM + marginTM.top + marginTM.bottom)
        .append("g")
        .attr("transform",
            `translate(${marginTM.left}, ${marginTM.top})`);


    data = Object.values(treeMapDic)
    data.push({ 'Team': "None" })

    //console.log(data)

    var treeMapRectColor = d3.scaleLinear()
        .domain([0, 1])  
        .range(["darkgray", "gold"]); 

    //console.log(data)

    // stratify the data: reformatting for d3.js
    const root = d3.stratify()
        .id(function (d) { return d.Team; })   // Name of the entity (column name is name in csv)
        .parentId(function (d) { return d.Parent; })   // Name of the parent (column name is parent in csv)
        (data);
    root.sum(function (d) { return +d.TotalMedals })   // Compute the numeric value for each entity

    // Then d3.treemap computes the position of each element of the hierarchy
    // The coordinates are added to the root object above
    d3.treemap()
        .size([widthTM, heightTM])
        .padding(4)
        (root)

    // use this information to add rectangles:
    svg
        .selectAll("rect")
        .data(root.leaves())
        .join("rect")
        .attr("class", "treemap-rect")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("stroke", "black")
        //.style("fill", "#69b3a2")
        .style("fill", function (d) { 
            let ratio = d.data.GoldMedals / d.data.TotalMedals;
            if (isNaN(ratio))
                ratio = 0;
            return d3.color(treeMapRectColor(ratio)).formatHex() })
        .on("mouseover", (event, d) => treeMapMouseoverNORMAL(event, d))
        .on("mouseleave", (event, d) => treeMapMouseleaveNORMAL(event, d));

    // and to add the text labels
    svg
        .selectAll("text")
        .data(root.leaves())
        .join("text")
        .attr("x", function (d) { return d.x0 + 10 })    // +10 to adjust position (more right)
        .attr("y", function (d) { return d.y0 + 20 })    // +20 to adjust position (lower)
        .text(function (d) { 
            if ((d.x1 - d.x0) < 50 || (d.y1 - d.y0) < 50) {
                return "";
            } else {
            return d.data.Team 
            }
        })
        //.html(function (d) { return d.data.Team + "<br>" + d.data.TotalMedals })
        .attr("font-size", "15px")
        .attr("fill", "black")


    svg
        .selectAll("vals")
        .data(root.leaves())
        .join("text")
        .attr("x", function (d) {  return d.x0 + 10 })    // +10 to adjust position (more right)
        .attr("y", function (d) { return d.y0 + 40 })    // +20 to adjust position (lower)
        .text(function (d) { 
            if ((d.x1 - d.x0) < 50 || (d.y1 - d.y0) < 50) {
                return "";
            } else {
                return "(" + d.data.TotalMedals +")"
            }
        })
        //.text(function (d) { return "(" + d.data.TotalMedals +")" })
        //.html(function (d) { return d.data.Team + "<br>" + d.data.TotalMedals })
        .attr("font-size", "15px")
        .attr("fill", "black")
}

function updateTreeMap(data) {

    const svg = d3.select("#vi5");
    svg.selectAll("text").remove();
    svg.selectAll("rect").remove();

    createTreeMap('#vi5');


}

function updateTreeMapSingleCountry () {

    const svg = d3.select("#vi5");
    svg.selectAll("text").remove();
    svg.selectAll("rect").remove();
    svg.selectAll(".titleLabels").remove();
    svg.selectAll(".rectLabels").remove();
    svg.selectAll(".valueLabels").remove();


    createTreeMapSingleCountry('#vi5');

}

function updateTreeMapSingleCountryEvents () {
    const svg = d3.select("#vi5");
    svg.selectAll("text").remove();
    svg.selectAll("rect").remove();
    svg.selectAll(".titleLabels").remove();
    svg.selectAll(".rectLabels").remove();
    svg.selectAll(".valueLabels").remove();

    createTreeMapSingleCountryEvents("#vi5");
}

function treeSport(nodes) {
    var nodeById = {};

    // Index the nodes by id, in case they come out of order.
    nodes.forEach(function (d) {
      nodeById[d.Sport] = d;
    });

    // Lazily compute children.
    nodes.forEach(function (d) {
      if ("Parent" in d) {
        var manager = nodeById[d.Parent];
        // new
        if (manager === undefined)
            console.log("error at ", d);
        // new
        if (manager.children) manager.children.push(d);
        else manager.children = [d];
      }
    });

    return nodes[0]
  }


function createTreeMapSingleCountry(id) {

    const marginTM = { top: 10, right: 10, bottom: 10, left: 10 },
        widthTM = 700 - marginTM.left - marginTM.right,
        heightTM = 550 - marginTM.top - marginTM.bottom;

    // append the svg object to the body of the page
    var svg = d3.select(id)
        .append("svg")
        .attr("width", widthTM + marginTM.left + marginTM.right)
        .attr("height", heightTM + marginTM.top + marginTM.bottom)
        .append("g")
        .attr("transform",
            `translate(${marginTM.left}, ${marginTM.top})`);


    data = Object.values(singleCountryDic)
    data.push({"Sport" : "None"})

    //console.log(data)

    var treeMapRectColor = d3.scaleLinear()
        .domain([0, 1])  
        .range(["darkgray", "gold"]); 

    //console.log(data)

    // stratify the data: reformatting for d3.js
    const root = d3.stratify()
        .id(function (d) { return d.Sport; })   // Name of the entity (column name is name in csv)
        .parentId(function (d) { return d.Parent; })   // Name of the parent (column name is parent in csv)
        (data);
    root.sum(function (d) { return +d.TotalMedals })   // Compute the numeric value for each entity

    // Then d3.treemap computes the position of each element of the hierarchy
    // The coordinates are added to the root object above
    d3.treemap()
        .size([widthTM, heightTM])
        .padding(4)
        (root)

    // use this information to add rectangles:
    svg
        .selectAll("rect")
        .data(root.leaves())
        .join("rect")
        .attr("class", "treemap-rect")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("stroke", "black")
        //.style("fill", "#69b3a2")
        .style("fill", function (d) { 
            let ratio = d.data.GoldMedals / d.data.TotalMedals;
            if (isNaN(ratio))
                ratio = 0;
            return d3.color(treeMapRectColor(ratio)).formatHex() })
        .on("mouseover", (event, d) => treeMapMouseoverSingle(event, d))
        .on("click", (event, d) => treeMapMouseclick(event, d))
        .on("mouseleave", (event, d) => treeMapMouseleaveSingle(event, d));



    // and to add the text labels
    svg
        .selectAll("text")
        .data(root.leaves())
        .join("text")
        .attr("x", function (d) { return d.x0 + 10 })    // +10 to adjust position (more right)
        .attr("y", function (d) { return d.y0 + 20 })    // +20 to adjust position (lower)
        .text(function (d) { 
            if ((d.x1 - d.x0) < 50 || (d.y1 - d.y0) < 50) {
                return "";
            } else {
            return d.data.Sport 
            }
        })
        //.html(function (d) { return d.data.Team + "<br>" + d.data.TotalMedals })
        .attr("font-size", "15px")
        .attr("fill", "black")


    svg
    .selectAll("vals")
    .data(root.leaves())
    .join("text")
    .attr("x", function (d) { console.log(d); return d.x0 + 10 })    // +10 to adjust position (more right)
    .attr("y", function (d) { return d.y0 + 40 })    // +20 to adjust position (lower)
    .text(function (d) { 
        if ((d.x1 - d.x0) < 50 || (d.y1 - d.y0) < 50) {
            return "";
        } else {
            return "(" + d.data.TotalMedals +")"
        }
    })
    //.text(function (d) { return "(" + d.data.TotalMedals +")" })
    //.html(function (d) { return d.data.Team + "<br>" + d.data.TotalMedals })
    .attr("font-size", "15px")
    .attr("fill", "black")

}

function createTreeMapSingleCountryEvents(id) {

    const marginTM = { top: 10, right: 10, bottom: 10, left: 10 },
        widthTM = 700 - marginTM.left - marginTM.right,
        heightTM = 550 - marginTM.top - marginTM.bottom;

    // append the svg object to the body of the page
    var svg = d3.select(id)
        .append("svg")
        .attr("width", widthTM + marginTM.left + marginTM.right)
        .attr("height", heightTM + marginTM.top + marginTM.bottom)
        .append("g")
        .attr("transform",
            `translate(${marginTM.left}, ${marginTM.top})`);


    data = Object.values(singleCountryDic)
    data.push({"Event" : "None"})

    //console.log(data)

    var treeMapRectColor = d3.scaleLinear()
        .domain([0, 1])  
        .range(["darkgray", "gold"]); 

    //console.log(data)

    // stratify the data: reformatting for d3.js
    const root = d3.stratify()
        .id(function (d) { return d.Event; })   // Name of the entity (column name is name in csv)
        .parentId(function (d) { return d.Parent; })   // Name of the parent (column name is parent in csv)
        (data);
    root.sum(function (d) { return +d.TotalMedals })   // Compute the numeric value for each entity

    // Then d3.treemap computes the position of each element of the hierarchy
    // The coordinates are added to the root object above
    d3.treemap()
        .size([widthTM, heightTM])
        .padding(4)
        (root)

    // use this information to add rectangles:
    svg
        .selectAll("rect")
        .data(root.leaves())
        .join("rect")
        .attr("class", "treemap-rect")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("stroke", "black")
        //.style("fill", "#69b3a2")
        .style("fill", function (d) { 
            let ratio = d.data.GoldMedals / d.data.TotalMedals;
            if (isNaN(ratio))
                ratio = 0;
            return d3.color(treeMapRectColor(ratio)).formatHex() })
        .on("mouseover", (event, d) => treeMapMouseoverSingleEvent(event, d))
        .on("mouseleave", (event, d) => treeMapMouseleaveSingleEvent(event, d));

    // and to add the text labels
    svg
        .selectAll("text")
        .data(root.leaves())
        .join("text")
        .attr("x", function (d) { return d.x0 + 10 })    // +10 to adjust position (more right)
        .attr("y", function (d) { return d.y0 + 20 })    // +20 to adjust position (lower)
        .text(function (d) { 
            if ((d.x1 - d.x0) < 50 || (d.y1 - d.y0) < 50) {
                return "";
            } else {
            return d.data.Event 
            }
        })
        //.html(function (d) { return d.data.Team + "<br>" + d.data.TotalMedals })
        .attr("font-size", "15px")
        .attr("fill", "black")


    svg
    .selectAll("vals")
    .data(root.leaves())
    .join("text")
    .attr("x", function (d) { console.log(d); return d.x0 + 10 })    // +10 to adjust position (more right)
    .attr("y", function (d) { return d.y0 + 40 })    // +20 to adjust position (lower)
    .text(function (d) { 
        if ((d.x1 - d.x0) < 50 || (d.y1 - d.y0) < 50) {
            return "";
        } else {
            return "(" + d.data.TotalMedals +")"
        }
    })
    //.text(function (d) { return "(" + d.data.TotalMedals +")" })
    //.html(function (d) { return d.data.Team + "<br>" + d.data.TotalMedals })
    .attr("font-size", "15px")
    .attr("fill", "black")


}



function createBarChart(id) {

    const svg = d3
        .select(id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("id", "gBarChart")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    athletesDicValues = Object.values(athletesDic)

    athletesDicValues.sort(function (a, b) {
        return d3.descending(a.TotalMedals, b.TotalMedals)
    });

    athletesDicValues = athletesDicValues.slice(0, 5);


    // var stackedData = d3.stack()
    //     .keys(tiposUnicosMedalhas)
    //     (athletesDicValues)



    const x = d3.scaleLinear().domain([0, 30]).range([0, width]);
    svg
        .append("g")
        .attr("id", "gXAxis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    const y = d3
        .scaleBand()
        .domain(athletesDicValues.map((d) => getShortenedName(d.Name)))
        .range([0, height])
        .padding(0.2);

    svg.append("g").attr("id", "gYAxis").call(d3.axisLeft(y));


    svg
        .append("g").selectAll(".totalParticipations")
        .data(athletesDicValues)
        .join("rect")
        .attr("class", "totalParticipations")
        .attr("y", d => y(getShortenedName(d.Name)))
        .attr("x", d => x(0))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.participations))
        .style("stroke", "black")
        .attr("fill", "lightblue")
        .attr("opacity", "0.5")
        .on("mouseover", (event, d) => barMouseover(event, d, ".totalParticipations", "Participations: " + d.participations))
        .on("mouseleave", (event, d) => barMouseLeave(d, ".totalParticipations"))
    //.append("title").text((d) => "Name "+d.Name + "\nCountry: " + d.Team + "\nParticipations: " + d.participations + "\nSport: " +d.Sport);


    svg
        .append("g").selectAll(".bronze")
        .data(athletesDicValues)
        .join("rect")
        .attr("class", "bronze")
        .attr("y", d => y(getShortenedName(d.Name)))
        .attr("x", d => x(d[0]))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.BronzeMedals))
        .style("stroke", "black")
        .attr("fill", "#8f6904")
        .on("mouseover", (event, d) => barMouseover(event, d, ".bronze", "Bronze Medals: " + d.BronzeMedals))
        .on("mouseleave", (event, d) => barMouseLeave(d, ".bronze"))
    //.append("title").text((d) =>"Name "+d.Name + "\nCountry: " + d.Team + "\nBronze Medals: " + d.BronzeMedals +"\nSport: " +d.Sport);


    svg
        .append("g").selectAll(".silver")
        .data(athletesDicValues)
        .join("rect")
        .attr("class", "silver")
        .attr("y", d => y(getShortenedName(d.Name)))
        .attr("x", d => x(d.BronzeMedals))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.SilverMedals))
        .style("stroke", "black")
        .attr("fill", "#d1d1ce")
        .on("mouseover", (event, d) => barMouseover(event, d, ".silver", "Silver Medals: " + d.SilverMedals))
        .on("mouseleave", (event, d) => barMouseLeave(d, ".silver"))
    //.append("title").text((d) => "Name "+d.Name + "\nCountry: " + d.Team + "\nSilver Medals: " + d.SilverMedals +"\nSport: " +d.Sport);

    svg
        .append("g").selectAll(".gold")
        .data(athletesDicValues)
        .join("rect")
        .attr("class", "gold")
        .attr("y", d => y(getShortenedName(d.Name)))
        .attr("x", d => x(d.BronzeMedals + d.SilverMedals))
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.GoldMedals))
        .style("stroke", "black")
        .attr("fill", "#f7ce61")
        .on("mouseover", (event, d) => barMouseover(event, d, ".gold", "Gold Medals: " + d.GoldMedals))
        .on("mouseleave", (event, d) => barMouseLeave(d, ".gold"))
    //.append("title").text((d) =>"Name "+d.Name + "\nCountry: " + d.Team + "\nGold Medals: " + d.GoldMedals +"\nSport: " +d.Sport);



}

function updateBarChart(athletesDic) {

    athletesDicValues = Object.values(athletesDic)

    athletesDicValues = athletesDicValues.filter(function (d) {
        return (d.TotalMedals != 0)
    });

    athletesDicValues.sort(function (a, b) {
        return d3.descending(a.TotalMedals, b.TotalMedals)
    });

    let size = athletesDicValues.length;

    if (size < 5) {
        athletesDicValues = athletesDicValues.slice(0, size);
    } else {
        athletesDicValues = athletesDicValues.slice(0, 5);
    }


    const svg = d3.select("#gBarChart");

    const x = d3.scaleLinear().domain([0, 30]).range([0, width]);

    const y = d3
        .scaleBand()
        .domain(athletesDicValues.map((d) => getShortenedName(d.Name)))
        .range([0, height])
        .padding(0.2);

    d3.select("#gXAxis").call(d3.axisBottom(x))
    d3.select("#gYAxis").call(d3.axisLeft(y))

    svg
        .selectAll(".totalParticipations")
        .data(athletesDicValues)
        .join(
            (enter) => {
                rects = enter
                    .append("rect")
                    .attr("class", "totalParticipations")
                    .attr("x", x(0))
                    .attr("height", y.bandwidth())
                    .attr("y", d => y(getShortenedName(d.Name)))
                    .attr("width", d => x(0))
                    .style("stroke", "black")
                    .attr("fill", "lightblue")
                    .style("opacity", 0.5)
                    .on("mouseover", (event, d) => barMouseover(event, d, ".totalParticipations", "Participations: " + d.participations))
                    .on("mouseleave", (event, d) => barMouseLeave(d, ".totalParticipations"))
                    .transition()
                    .duration(1000)
                    .attr("width", d => x(d.participations))

            },
            (update) => {
                update
                    .transition()
                    .duration(1000)
                    .attr("y", d => y(getShortenedName(d.Name)))
                    .attr("x", d => x(0))
                    .attr("height", y.bandwidth())
                    .attr("width", d => x(d.participations))
                    .style("stroke", "black");

            },
            (exit) => {
                exit.remove();
            }
        );

    svg
        .selectAll(".bronze")
        .data(athletesDicValues)
        .join(
            (enter) => {
                rects = enter
                    .append("rect")
                    .attr("class", "bronze")

                    .attr("x", x(0))
                    .attr("height", y.bandwidth())
                    .attr("y", d => y(getShortenedName(d.Name)))
                    .attr("width", d => x(0))
                    .style("stroke", "black")
                    .attr("fill", "#8f6904")
                    .on("mouseover", (event, d) => barMouseover(event, d, ".bronze", "Bronze Medals: " + d.BronzeMedals))
                    .on("mouseleave", (event, d) => barMouseLeave(d, ".bronze"))
                    .transition()
                    .duration(1000)
                    .attr("width", d => x(d.BronzeMedals))
                    .style("stroke", "black");
            },
            (update) => {
                update
                    .transition()
                    .duration(1000)
                    .attr("y", d => y(getShortenedName(d.Name)))
                    .attr("x", d => x(0))
                    .attr("height", y.bandwidth())
                    .attr("width", d => x(d.BronzeMedals))

                    .style("stroke", "black");

            },
            (exit) => {
                exit.remove();
            }
        );


    svg
        .selectAll(".silver")
        .data(athletesDicValues)
        .join(
            (enter) => {
                rects = enter
                    .append("rect")
                    .attr("class", "silver")
                    .attr("y", d => y(getShortenedName(d.Name)))
                    .attr("x", d => x(d.BronzeMedals))
                    .attr("height", y.bandwidth())
                    .attr("width", d => x(0))
                    .style("stroke", "black")
                    .attr("fill", "#d1d1ce")
                    .on("mouseover", (event, d) => barMouseover(event, d, ".silver", "Silver Medals: " + d.SilverMedals))
                    .on("mouseleave", (event, d) => barMouseLeave(d, ".silver"))
                    .transition()
                    .duration(1000)
                    .attr("width", d => x(d.SilverMedals))
                    .style("stroke", "black");

            },
            (update) => {
                update
                    .transition()
                    .duration(1000)
                    .attr("y", d => y(getShortenedName(d.Name)))
                    .attr("x", d => x(d.BronzeMedals))
                    .attr("height", y.bandwidth())
                    .attr("width", x(0))
                    .attr("width", d => x(d.SilverMedals))
                    .style("stroke", "black");

            },
            (exit) => {
                exit.remove();
            }
        );

    svg
        .selectAll(".gold")
        .data(athletesDicValues)
        .join(
            (enter) => {
                rects = enter
                    .append("rect")
                    .attr("class", "gold")
                    .attr("y", d => y(getShortenedName(d.Name)))
                    .attr("x", d => x(d.BronzeMedals + d.SilverMedals))
                    .attr("height", y.bandwidth())
                    .attr("width", d => x(0))
                    .style("stroke", "black")
                    .attr("fill", "#f7ce61")

                    .on("mouseover", (event, d) => barMouseover(event, d, ".gold", "Gold Medals: " + d.GoldMedals))
                    .on("mouseleave", (event, d) => barMouseLeave(d, ".gold"))
                    .transition()
                    .duration(1000)
                    .attr("width", d => x(d.GoldMedals))
                    .style("stroke", "black");

            },
            (update) => {
                update
                    .transition()
                    .duration(1000)
                    .attr("y", d => y(getShortenedName(d.Name)))
                    .attr("x", d => x(d.BronzeMedals + d.SilverMedals))
                    .attr("height", y.bandwidth())
                    .attr("width", x(0))

                    .attr("width", d => x(d.GoldMedals))
                    .style("stroke", "black");

            },
            (exit) => {
                exit.remove();
            }
        );

}

function getNumMedals(data, name, athletesDic) {
    for (let i = 0; i < data.length; i++) {
        //if (data[i].Name === name && (data[i].Medal != 'No'))
        if (data[i].Name === name) {
            athletesDic[name]["participations"] += 1
            switch (data[i].Medal) {

                case "Bronze":
                    athletesDic[name]["BronzeMedals"] += 1;
                    athletesDic[name]["TotalMedals"] += 1;
                    break;

                case "Silver":
                    athletesDic[name]["SilverMedals"] += 1;
                    athletesDic[name]["TotalMedals"] += 1;
                    break;

                case "Gold":
                    athletesDic[name]["GoldMedals"] += 1;
                    athletesDic[name]["TotalMedals"] += 1;
                    break;

                default:
                    break;
            }
        }
    }

}



function getNumMedalsForCountryDic(data, name, team, dic, teamEventYear) {

    let ident;

    for (let i = 0; i < data.length; i++) {

        if (data[i].Name === name) {

            ident = String(data[i].Team) + "," + String(data[i].Year) + "," +  String(data[i].Event) + "," + String(data[i].Medal) 

            if (!teamEventYear.has(ident)) {

                teamEventYear.add(ident);

                dic[team]["participations"] += 1
                switch (data[i].Medal) {

                    case "Bronze":
                        dic[team]["BronzeMedals"] += 1;
                        dic[team]["TotalMedals"] += 1;
                        break;

                    case "Silver":
                        dic[team]["SilverMedals"] += 1;
                        dic[team]["TotalMedals"] += 1;
                        break;

                    case "Gold":
                        dic[team]["GoldMedals"] += 1;
                        dic[team]["TotalMedals"] += 1;
                        break;

                    default:
                        break;
                }
            }

        }
    }

}




function fillAthletesDic(filteredBySexData) {

    athletesDic = {};
    for (let i = 0; i < filteredBySexData.length; i++) {

        if (athletesDic[filteredBySexData[i].Name] === undefined) {
            athletesDic[filteredBySexData[i].Name] = {
                "GoldMedals": 0, "SilverMedals": 0, "BronzeMedals": 0, "TotalMedals": 0, "Name": filteredBySexData[i].Name
                , "participations": 0, "Team": filteredBySexData[i].Team, "Sport": filteredBySexData[i].Sport
            }
            getNumMedals(filteredBySexData, filteredBySexData[i].Name, athletesDic);
        }

    }
    return athletesDic
}

function fillCountriesDic(data) {

    treeMapDic = {};
    let athletesCovered = new Set();
    let id;
    let teamEventYear = new Set();
    for (let i = 0; i < data.length; i++) {

        id = data[i].ID;

        if (!athletesCovered.has(id)) {

            if (treeMapDic[data[i].Team] === undefined) {
                treeMapDic[data[i].Team] = {
                    "Team": data[i].Team, "GoldMedals": 0, "SilverMedals": 0, "BronzeMedals": 0,
                    "TotalMedals": 0, "participations": 0, "Parent": "None"
                }
            }

            getNumMedalsForCountryDic(data, data[i].Name, data[i].Team, treeMapDic, teamEventYear);
            athletesCovered.add(id);

        }
        

    }

    filteredDic = {}
    keys = Object.keys(treeMapDic)


    for (i = 0; i < keys.length; i++) {
        element = keys[i];

        if (treeMapDic[element].TotalMedals > 0)
            filteredDic[element] = treeMapDic[element]

    }

    return filteredDic
}

function fillSingleCountryDic_EVENT (data) {

    //console.log("'data' being passed to getNumMedalsSingleCountryDic_EVENT: " , data);

    singleCountryDic = {};
    athletesCovered = new Set();
    let ident;
    let teamEventYear = new Set();
    eventSpecificDataForHover = {};
    for (let i = 0; i < data.length; i++) {

        ident = String(data[i].ID) + "," + String(data[i].Event)


        //if ( (data[i].Sport === currentExploredTeamSport) && (!athletesCovered.has(ident)   )) {
        if ( (data[i].Sport === currentExploredTeamSport) && (!athletesCovered.has(ident)   )) {

            if (singleCountryDic[data[i].Event] === undefined) {
                singleCountryDic[data[i].Event] = {
                    "Event" : data[i].Event, "GoldMedals": 0, "SilverMedals": 0, "BronzeMedals": 0,
                    "TotalMedals": 0, "participations": 0, "Parent": "None"
                }
                
            }
  
            getNumMedalsForSingleCountryDic_EVENT(data, data[i].ID, data[i].Event, singleCountryDic, teamEventYear);
            athletesCovered.add(ident);
            

        }


    }

    //console.log("pre filtered dic: ", singleCountryDic);

    filteredDic = {}
    keys = Object.keys(singleCountryDic)


    for (i = 0; i < keys.length; i++) {
        element = keys[i];

        if (singleCountryDic[element].TotalMedals > 0)
            filteredDic[element] = singleCountryDic[element]

    }
    //console.log("aaaaaaaaaaaaaaa");

    //console.log("Filtered dic: ", filteredDic);

    return filteredDic
}



function getNumMedalsForSingleCountryDic_EVENT(data, id, event, dic, teamEventYear) {

    let ident;

    if (eventSpecificDataForHover[event] === undefined)
        eventSpecificDataForHover[event] = [];


    for (let i = 0; i < data.length; i++) {
        if (data[i].ID === id && event === data[i].Event) {

            if (!eventSpecificDataForHover[event].includes(data[i].Name)) {
                eventSpecificDataForHover[event].push(data[i].Name);
            }

            ident = String(data[i].Year) + "," + String(data[i].Event) + "," + String(data[i].Medal)
            dic[event]["participations"] += 1

            if (!teamEventYear.has(ident)) {

                teamEventYear.add(ident);

                switch (data[i].Medal) {

                    case "Bronze":
                        dic[event]["BronzeMedals"] += 1;
                        dic[event]["TotalMedals"] += 1;
                       
                        break;

                    case "Silver":
                        dic[event]["SilverMedals"] += 1;
                        dic[event]["TotalMedals"] += 1;
                        break;
                       

                    case "Gold":
                        dic[event]["GoldMedals"] += 1;
                        dic[event]["TotalMedals"] += 1;
                      
                        break;

                    default:
                        break;
                }
            }
        }
    }


}

function getNumMedalsForSingleCountryDic_SPORT(data, id, sport, dic, teamEventYear) {
    let ident;

    for (let i = 0; i < data.length; i++) {
        if (data[i].ID === id) {

            ident = String(data[i].Year) + "," + String(data[i].Event) + "," + String(data[i].Medal)

            if (!teamEventYear.has(ident)) {

                teamEventYear.add(ident);

                dic[sport]["participations"] += 1
                switch (data[i].Medal) {

                    case "Bronze":
                        dic[sport]["BronzeMedals"] += 1;
                        dic[sport]["TotalMedals"] += 1;
                        break;

                    case "Silver":
                        dic[sport]["SilverMedals"] += 1;
                        dic[sport]["TotalMedals"] += 1;
                        break;

                    case "Gold":
                        dic[sport]["GoldMedals"] += 1;
                        dic[sport]["TotalMedals"] += 1;
                        break;

                    default:
                        break;
                }
            }
        }
    }
}

function fillSingleCountryDic_SPORT (data) {

    singleCountryDic = {};
    athletesCovered = new Set();
    let teamEventYear = new Set();
    for (let i = 0; i < data.length; i++) {

        if (!athletesCovered.has(data[i].ID)) {

            if (singleCountryDic[data[i].Sport] === undefined) {
                singleCountryDic[data[i].Sport] = {
                    "Sport" : data[i].Sport, "GoldMedals": 0, "SilverMedals": 0, "BronzeMedals": 0,
                    "TotalMedals": 0, "participations": 0, "Parent": "None"
                }
            }

            getNumMedalsForSingleCountryDic_SPORT(data, data[i].ID, data[i].Sport, singleCountryDic, teamEventYear);
            athletesCovered.add(data[i].ID);

        }


    }

    filteredDic = {}
    keys = Object.keys(singleCountryDic)


    for (i = 0; i < keys.length; i++) {
        element = keys[i];

        if (singleCountryDic[element].TotalMedals > 0)
            filteredDic[element] = singleCountryDic[element]

    }
    //console.log("aaaaaaaaaaaaaaa");

    //console.log("Filtered dic: ", filteredDic);

    return filteredDic
}

function fillLineChartDic (data) {

    yearsDone = {};
    lineChartDic = []
    let teamEventYear = new Set();
    for (let i = 0; i < data.length; i++) {

        if (yearsDone[data[i].Year] === undefined) {
            dictToPush = {}
            for (let z = 0; z < countriesBeingCompared.length; z++) {
                dictToPush[countriesBeingCompared[z]] = 0;
            }

            dictToPush["year"] = parseInt(data[i].Year);

            lineChartDic.push(dictToPush);
            yearsDone[data[i].Year] = {};
        }

        for (let j = 0; j < countriesBeingCompared.length; j++) {
            if (yearsDone[data[i].Year][countriesBeingCompared[j]] === undefined) {
                yearsDone[data[i].Year][countriesBeingCompared[j]] = 0;

                getNumMedalsForCountryDate(data[i].Year, countriesBeingCompared[j], data, yearsDone,teamEventYear);
            }
        }
    }
    valores = Object.values(yearsDone);
    keys = Object.keys(yearsDone);

    //console.log(valores,keys)
    //console.log(comparedCountryData)
    //console.log("Values: ",valores);
    //console.log("Keys: ", keys);
    for (let i = 0; i < keys.length; i++) {
        // console.log(Object.values(valores[i])[0],Object.values(valores[i])[1],Object.values(valores[i])[2])
        temp = comparedCountryData.filter(function (elem) {
            return elem.Year == lineChartDic[i]["year"]
        });



        if (lineChartMode == 0) {
            /*lineChartDic[i][s1] = Object.values(valores[i])[0];
            lineChartDic[i][s2] = Object.values(valores[i])[1];
            lineChartDic[i][s3] = Object.values(valores[i])[2];*/
            for (let p = 0; p < countriesBeingCompared.length; p++) {
                lineChartDic[i][countriesBeingCompared[p]] = Object.values(valores[i])[p];
                //console.log("Year ", i ," | Country ", countriesBeingCompared[p], " | Medals: ", lineChartDic[i][countriesBeingCompared[p]]);
            }

        } else if (lineChartMode == 1){
            let million = 1000000;
            /*lineChartDic[i][s1] = Object.values(valores[i])[0] / (temp[2].Population / million);
            lineChartDic[i][s2] = Object.values(valores[i])[1] / (temp[0].Population / million);
            lineChartDic[i][s3] = Object.values(valores[i])[2] / (temp[1].Population / million);*/
            for (let p = 0; p < countriesBeingCompared.length; p++) {
                for (let t = 0; t < temp.length; t++) {
                    if (temp[t].Country == countriesBeingCompared[p]) {
                        index = t;
                    }
                }
                lineChartDic[i][countriesBeingCompared[p]] = Object.values(valores[i])[p] / (temp[index].Population / million);         
            }

        } else if(lineChartMode == 2) {
            let billion = 1000000000;
            /*lineChartDic[i][s1] = Object.values(valores[i])[0] / (temp[2].GDP / billion);
            lineChartDic[i][s2] = Object.values(valores[i])[1] / (temp[0].GDP / billion);
            lineChartDic[i][s3] = Object.values(valores[i])[2] / (temp[1].GDP / billion);*/

            for (let p = 0; p < countriesBeingCompared.length; p++) {
                let index = 0;
                for (let t = 0; t < temp.length; t++) {
                    if (temp[t].Country == countriesBeingCompared[p]) {
                        index = t;
                    }
                }
                lineChartDic[i][countriesBeingCompared[p]] = Object.values(valores[i])[p] / (temp[index].GDP / billion);
            }
        }


    }


    /* ERRO AQUI */
    /*lineChartDic = lineChartDic.sort(function (a, b) {
        return d3.ascending(a.year, b.year)
    })*/

    let startingYear = parseInt(bottomYearFilter, 10);
    for (let k = 0; k < Object.keys(lineChartDic).length; k++) {
        lineChartDic[k].year = startingYear + 4 * k;
    }

    //console.log(lineChartDic, "here at fill for line chart");
    return lineChartDic;

}


function getNumMedalsForCountryDate(year, team, data, yearsDone,teamEventYear) {
    let ident;

    for (let i = 0; i < data.length; i++) {

        ident = String(data[i].Year) + "," + String(data[i].Event) + "," + String(data[i].Medal) + ","+ String(data[i].Team)
        
        if (data[i].Year == year && data[i].Team == team) {
            if (!teamEventYear.has(ident)) {
                teamEventYear.add(ident);
            switch (data[i].Medal) {
                case "Bronze": case "Silver": case "Gold":
                    yearsDone[data[i].Year][team] += 1;
                    break;

                default:
                    break;
                }
            }
        }
    }
}


function createParalelCoordinates(id, data) {
    updatedMeasures={}
    // data = data.slice(0, 30);

    // Define the div for the tooltip

    if (pressed) {
        data = data.filter(function (elem) {
            return elem.Medal != "No";
        });

    }
    var svg = d3.select(id).append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", "translate(" + svgMargin.left + ", " + svgMargin.top + ")");
    // Extract the list of dimensions as keys and create a y scale for each.

    dimensions = ["Height", "Weight", "Age"];

    let domains = {
        "Height": d3.extent(data, function (d) { return +d["Height"] })
        , "Weight": d3.extent(data, function (d) { return +d["Weight"] })
        , "Age": d3.extent(data, function (d) { return +d["Age"] })
    };

    for (i in dimensions) {
        let name = dimensions[i];
        y[name] = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return +d[name]; }))
            .range([finalSvgHeight, 0]);
    }


    // Create our x axis scale.
    x = d3.scalePoint()
        .domain(dimensions)
        .range([0, finalSvgWidth]);

    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", line);

    // Draw lines
    lines = svg.append("g")
        .attr("class", "lines")
        .selectAll("path")
        .data(data).enter()
        .append("path")
        .attr("d", line)
        .attr("class", "line")
        .attr("stroke-width", 2.0)
        .style("stroke", function (d) { return (color(d.Medal)) })
        .style("fill", "none")
        .on("mouseover", (event, d) => parCordMouseover(event, d, d.Medal))
        .on("mouseleave", (event, d) => parCordMouseLeave(d, d.Medal))
    //.append("title").text( d => "Name: " + d.Name + "\nMedal: " + d.Medal + "\nYear: " + d.Year + "\nEvent: " + d.Event);

    // Add a group element for each dimension.
    g = svg.selectAll(".dimension")
        .data(dimensions).enter()
        .append("g")
        .attr("class", "dimension")
        .attr("transform", function (d) { return "translate(" + x(d) + ")"; });

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function (d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("fill", "black")
        .attr("font-size", "12")
        .attr("y", -9)
        .text(function (d) { return d; });

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .call(d3.brushY()
            .extent([
                [-10, 0],
                [10, finalSvgHeight]
            ])
            .on("start", function (event, e) { event.sourceEvent.stopPropagation();} )
            .on("brush", brush)
            .on("end", brush))
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    function line(d) {
        return d3.line()(dimensions.map(function (key) {
            return [x(key), y[key](d[key])];
        }));
    }

    function brushstart() {
        d3.event.sourceEvent.stopPropagation();
    }

    // Handles a brush event, toggling the display of foreground lines.
    function brush() {
        // Get a set of dimensions with active brushes and their current extent.
        var actives = [];
        var ativos = {}
        svg.selectAll(".brush")
            .filter(function (d) {
                return d3.brushSelection(this);
            })
            .each(function (key) {
                actives.push({
                    dimension: key,
                    extent: d3.brushSelection(this)
                });
                ativos[key] = d3.brushSelection(this);
                
            });

        // Change line visibility based on brush extent.
        if (actives.length === 0) {
            lines.style("display", null);
        } else {
            lines.style("display", function (d) {
                return actives.every(function (brushObj) {
                    console.log(brushObj.dimension,updatedMeasures)
                    convertValue(ativos, brushObj.dimension, domains, updatedMeasures);
                    return brushObj.extent[0] <= y[brushObj.dimension](d[brushObj.dimension]) && y[brushObj.dimension](d[brushObj.dimension]) <= brushObj.extent[1];
                }) ? null : "none";
            });
        }

        updatedData = filteredBySexData.filter(function (elem) {
            return elem.Year <= topYearFilter && elem.Year >= bottomYearFilter;
        });

        for (i = 0; i < Object.keys(updatedMeasures).length; i++) {
            updatedData = updatedData.filter(function (elem) {

                element = Object.keys(updatedMeasures)[i];

                if (element == "Height") {
                    return elem.Height >= updatedMeasures[element][0] && elem.Height <= updatedMeasures[element][1]
                }

                if (element == "Weight") {
                    return elem.Weight >= updatedMeasures[element][0] && elem.Weight <= updatedMeasures[element][1]
                }

                if (element == "Age") {
                    return elem.Age >= updatedMeasures[element][0] && elem.Age <= updatedMeasures[element][1]
                }
            }
            );
        };


        let eventFilter = d3.select("#eventDropdown").node().value;

        if (eventFilter != "--- All Events ---") {

            dados = updatedData.filter(function (elem) {
                return elem.Event == eventFilter;
            });
        }

        else {

            let sportFilter = d3.select("#dropdown").node().value;
            if (sportFilter != "--- All Sports (Slow!) ---") {
                dados = updatedData.filter(function (elem) {
                    return elem.Sport == sportFilter;
                });

            }
            else {
                dados = updatedData;
            }

        }
        //athletesDic = fillAthletesDic(dados);
        //treeMapDic = fillCountriesDic(dados);
        //singleCountryDic = fillSingleCountryDic(dados);

        if (treeMapMode == 0) {
            athletesDic = fillAthletesDic(dados);
            treeMapDic = fillCountriesDic(dados);
            updateTreeMap(treeMapDic);
            updateBarChart(athletesDic);
            //console.log("we out here, updateTreeMap!");
        } else if (treeMapMode == 1) {
            //console.log("we out here, updateTreeMapSingleCountry!");
            let filteredForSingle = updatedData.filter(function (elem) { return elem.Team == currentExploredTeam });
            singleCountryDic = fillSingleCountryDic_SPORT(filteredForSingle);
            updateTreeMapSingleCountry(singleCountryDic);
            athletesDic = fillAthletesDic(filteredForSingle);
            updateBarChart(athletesDic);
        } else if (treeMapMode == 2) {
            //console.log("we out here, updateTreeMapSingleCountryEvents!");
            let filteredForSingle = updatedData.filter(function (elem) { return elem.Sport == currentExploredTeamSport && elem.Team == currentExploredTeam });
            singleCountryDic = fillSingleCountryDic_EVENT(filteredForSingle);
            updateTreeMapSingleCountryEvents(filteredForSingle);
            athletesDic = fillAthletesDic(filteredForSingle);
            updateBarChart(athletesDic);
        }

        
        //updateBarChart(athletesDic);
        //updateTreeMap(treeMapDic);
        //updateTreeMapSingleCountry(singleCountryDic);

        comparedCountryData = countryInfoData.filter(function (elem) {
            for (let i = 0; i < countriesBeingCompared.length; i++) {
                if (elem.Country == countriesBeingCompared[i])
                    return true
            }
            return false

        });

        if (treeMapMode == 0) {
            lineChartDic = fillLineChartDic(dados);
            updateLineChart(lineChartDic);
        }



        // Take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.

    }
}

function convertValue(b, dimension, domains, measuresDic) {
    new_min = domains[dimension][0];
    new_max = domains[dimension][1];


    min_filter = b[dimension][0]
    max_filter = b[dimension][1]

    //new_value = ( (old_value - old_min) / (old_max - old_min) ) * (new_max - new_min) + new_min

    new_min_filter = (finalSvgHeight - max_filter) / (finalSvgHeight) * (new_max - new_min) + new_min
    new_max_filter = (finalSvgHeight - min_filter) / (finalSvgHeight) * (new_max - new_min) + new_min

    measuresDic[dimension] = [new_min_filter, new_max_filter]



    //console.log(new_min_filter,"|",new_max_filter)
    // console.log()

}



function updateParCord(data) {

    //console.log(data)
    // data = data.slice(0, 30);
    dimensions = ["Height", "Weight", "Age"];


    for (i in dimensions) {
        let name = dimensions[i];
        y[name] = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return +d[name]; }))
            .range([finalSvgHeight, 0]);
    }


    d3.select(".lines").remove();
    d3.select(".background").remove();
    d3.selectAll(".axis").remove();
    d3.selectAll(".brush").remove();
    d3.selectAll(".dimension").remove();
    createParalelCoordinates("#vi4", data);


}


function createLineChart(id) {

    // const margin = {top: 10, right: 100, bottom: 30, left: 30},
    // width = 460 - margin.left - margin.right,
    // height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3.select(id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("id", "lineChartSvg")
        .attr("transform", `translate(${margin.left},${margin.top})`);


    // List of groups (here I have one group per column)
    //const allGroup = [topMedaledCountries[0].Team, topMedaledCountries[1].Team, topMedaledCountries[2].Team]
    const allGroup = countriesBeingCompared;

    // Reformat the data: we need an array of arrays of {x, y} tuples
    const dataReady = allGroup.map(function (grpName) { // .map allows to do something for each element of the list
        return {
            name: grpName,
            values: lineChartDic.map(function (d) {
                return { year: d.year, value: +d[grpName], name: grpName };
            })
        };
    });
    // I strongly advise to have a look to dataReady with
    //console.log("Dataready log: ", dataReady);


    dicforMinMax = Object.values(dataReady[0].values)
    arrayMinMax = []
    for (let i = 0; i < dicforMinMax.length; i++) {
        arrayMinMax.push(dicforMinMax[i].year)
    }

    // A color scale: one color for each group
    //const myColor = d3.scaleOrdinal()
        //.domain(allGroup)
       // .range(d3.schemeSet2);

    // Add X axis --> it is a date format
    const x = d3
        .scalePoint()
        .domain(arrayMinMax)
        .range([0, width]);
    svg
        .append("g")
        .attr("class", "xAxis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));


    svg.append("text")
        .attr("class", "y label")
        .attr("x", - (width / 2))
        .attr("y", - 40)
        .attr("transform", "rotate(-90)")
        .text("medals (total)")
        .style("font-size", "14px")
        .style("fill" , "black")
        //.style("font-weight", "bold")



    //console.log(Object.values(dataReady[0].values),"HELLO")
    yAxisMinMax = []

    for (let i = 0; i < dataReady.length; i++) {
        values = Object.values(dataReady[i].values)
        for (let j = 0; j < values.length; j++) {
            yAxisMinMax.push(values[j].value)
        }
    }

    yAxisMinMax.sort(function (a, b) {
        return a - b;
    })

    //console.log("yaxisminmax: ", yAxisMinMax);

    // ATTENTION, ASSUMES YAXISMINMAX IS SORTED!
    let nonZeroMin = 0;
    for (let v = 0; v < yAxisMinMax.length; v++) {
        if (yAxisMinMax[v] > 0) {
            nonZeroMin = yAxisMinMax[v]
            break;
        }
    }

    //console.log(nonZeroMin);

    //let pair = [ nonZeroMin, yAxisMinMax[yAxisMinMax.length - 1]]
    let pair = [0, yAxisMinMax[yAxisMinMax.length - 1]]


    //const y = d3.scaleLog()
    const y = d3.scaleLinear()
        .domain(pair)
        .range([height, 0]);
    svg.append("g")
        //.call(d3.axisLeft(y).tickFormat(d3.format(".1e")))
        .call(d3.axisLeft(y).tickFormat((x) => d3.format(".2", x)(x)))
        //.call(d3.axisLeft(y).tickFormat((x) => x + " B"))
        .attr("class", "yAxis");



    // Add the lines
    const line = d3.line()
        //.defined(function (d) { return d.value; })
        .x(d => x(+d.year))
        .y(d => y(+d.value))
    svg.selectAll("myLines")
        .data(dataReady)
        .join("path")
        .attr("class", "lineChartLine")
        .attr("d", d => line(d.values))
        .attr("stroke", d => lineChartColorer(d.name))
        .style("stroke-width", 4)
        .style("fill", "none")
        .on("mouseover", (event, d) => lineChartMouseover(event, d, 1))
        .on("mouseleave", (event, d) => lineChartMouseleave(event, d))

    // Add the points
    svg
        // First we need to enter in a group
        .selectAll("myDots")
        .data(dataReady)
        .join('g')
        .style("fill", d => lineChartColorer(d.name))
        // Second we need to enter in the 'values' part of this group
        .selectAll("myPoints")
        .data(d => d.values)
        .join("circle")
        .attr("class", "circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 5)
        .attr("stroke", "white")
        .on("mouseover", (event, d) => lineChartMouseover(event, d, 0))
        .on("mouseleave", (event, d) => lineChartMouseleave(event, d))
        

    // Add a legend at the end of each line
    svg
        .selectAll("myLabels")
        .data(dataReady)
        .join('g')
        .append("text")
        .attr("class", "text")
        .datum(d => { return { name: d.name, value: d.values[d.values.length - 1] }; }) // keep only the last value of each time series
        .attr("transform", d => `translate(${x(d.value.year)},${y(d.value.value)})`) // Put the text at the position of the last point
        .attr("x", 12) // shift the text a bit more right
        .text(d => d.name)
        .style("fill", d => lineChartColorer(d.name))
        .style("font-size", 15)


}


function updateLineChart(data) {
    const svg = d3.select("#vi6");
    svg.selectAll(".circle").remove();
    svg.selectAll(".text").remove();
    svg.selectAll(".lineChartLine").remove();
    svg.selectAll(".xAxis").remove();
    svg.selectAll(".yAxis").remove();
    createLineChart('#vi6');

}

function barMouseover(event, d, medalSelect, message) {

    const [x, y] = d3.pointer(event);
    console.log(d)
    d3.selectAll(medalSelect).filter(function (elem) {
        return elem.Name == d.Name;
    }).style("stroke", "red")
        .style("stroke-width", 2);

    let med;
    if (medalSelect == ".gold")
        med = "Gold"
    else if (medalSelect == ".silver")
        med = "Silver"
    else if (medalSelect == ".bronze")
        med = "Bronze"
    else
        med = "No"

    //console.log(med)

    d3.selectAll(".line").filter(function (elem) {
        return (elem.Name != d.Name);
    })
        .style("stroke", "lightgray");

    d3.selectAll(".line").filter(function (elem) {
        return elem.Name == d.Name && elem.Medal == med;
    })
        .style("stroke", "red");


    tooltipBarChart
        .html("<strong>Name</strong>: " + d.Name + "<br>" +
            "<strong>Nationality:</strong> " + d.Team + "<br>" +
            "<strong>Sport:</strong> " + d.Sport + "<br>" +
            "<strong>" + message + "</strong>")
        .style("opacity", 0.9)
        .style("left", (x + 100) + "px")
        .style("top", (y - 10) + "px")

    var treeRects;
    
    switch (treeMapMode) {
        case 0:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                return elem.data.Team == d.Team;
            }).style("stroke-width", 3);
            break;

        case 1:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                return elem.data.Sport == d.Sport;
            }).style("stroke-width", 3);
            break;

        case 2:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                d3.selectAll(".treemap-rect").filter(function(elem) {
                    if(eventSpecificDataForHover[elem.data.Event].includes(d.Name)){
                        console.log("name ",d.Name)
                        console.log("elem Event ",elem.data.Event)
                        console.log("eventSpeccidicDataHover ",eventSpecificDataForHover[elem.data.Event])
                    }
                    return eventSpecificDataForHover[elem.data.Event].includes(d.Name);  
                
                }).style("stroke-width", 3);
            })
     
            break;
    
        default:
            break;
    }
}

function barMouseLeave(d, medalSelect) {

    tooltipBarChart.style("opacity", 0);

    d3.selectAll(medalSelect).filter(function (elem) {
        return elem.Name == d.Name;
    }).style("stroke", "black")
        .style("stroke-width", 1);


    d3.selectAll(".line").style("stroke", function (d) {
        return color(d.Medal);
    })

    switch (treeMapMode) {
        case 0:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                return elem.data.Team == d.Team;
            }).style("stroke-width", 1);
            break;

        case 1:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                return elem.data.Sport == d.Sport;
            }).style("stroke-width", 1);
            break;

        case 2:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                d3.selectAll(".treemap-rect").filter(function(elem) {
                    if(eventSpecificDataForHover[elem.data.Event].includes(d.Name)){
                        console.log("name ",d.Name)
                        console.log("elem Event ",elem.data.Event)
                        console.log("eventSpeccidicDataHover ",eventSpecificDataForHover[elem.data.Event])
                    }
                    return eventSpecificDataForHover[elem.data.Event].includes(d.Name);  
                
                }).style("stroke-width", 1);
            })
     
            break;
    
        default:
            break;
    }
}

function treeMapMouseover (event, d) {
    const [x, y] = d3.pointer(event);

    tooltipTreeMap
        .html("<strong>Country</strong>: " + d.data.Team + "<br>" +
        "<strong>Total medals</strong>: " + d.data.TotalMedals + "<br>" +
        "<strong>Gold medals</strong>: " + d.data.GoldMedals + "<br>" +
        "<strong>Silver medals</strong>: " + d.data.SilverMedals + "<br>" +
        "<strong>Bronze medals</strong>: " + d.data.BronzeMedals + "<br>"
        )
        .style("opacity", 0.9)
        .style("left", (x + 600) + "px")
        .style("top", (y+50) + "px")

    // TODO:
    // MUDAR COR DO QUADRADO

    let treeRects = d3.selectAll(".treemap-rect");

    treeRects.filter(function (elem) {
        return elem.data.Team == d.data.Team;
    })//.style("stroke", "red")
       // .style("stroke-width", 2);
        .style("stroke-width", 3);
}

function treeMapMouseleave (event, d) {
    tooltipTreeMap.style("opacity", 0);

    let treeRects = d3.selectAll(".treemap-rect");

   // treeRects.style("stroke", "black")
        //.style("stroke-width", 1);
    treeRects.style("stroke-width", 1);
    
}

function treeMapMouseoverNORMAL (event, d) {
    const [x, y] = d3.pointer(event);

    tooltipTreeMap
        .html("<strong>Country</strong>: " + d.data.Team + "<br>" +
        "<strong>Total medals</strong>: " + d.data.TotalMedals + "<br>" +
        "<strong>Gold medals</strong>: " + d.data.GoldMedals + "<br>" +
        "<strong>Silver medals</strong>: " + d.data.SilverMedals + "<br>" +
        "<strong>Bronze medals</strong>: " + d.data.BronzeMedals + "<br>"
        )
        .style("opacity", 0.9)
        .style("left", (x + 600) + "px")
        .style("top", (y+50) + "px")


    // Highlight rect que e hovered
    let treeRects = d3.selectAll(".treemap-rect");
    treeRects.filter(function (elem) {
        return elem.data.Team == d.data.Team;
    }).style("stroke-width", 3);

    // Parallel cords
    d3.selectAll(".line").filter(function(elem) {
        return elem.Team != d.data.Team;
    }).style("stroke", "lightgray");

    d3.selectAll(".line").filter(function(elem) {
            return elem.Team == d.data.Team;
    }).style("stroke", "red");

    // Bar chart
    medals = ["bronze", "silver", "gold", "totalParticipations"];
    for (let i = 0; i < medals.length; i++) {
        d3.selectAll("." + medals[i].toLowerCase()).filter(function(elem) {
                return elem.Team == d.data.Team;
            }).style("stroke", "red")
            .style("stroke-width", 2);
    }

}

function treeMapMouseleaveNORMAL (event, d) {
    tooltipTreeMap.style("opacity", 0);
    let treeRects = d3.selectAll(".treemap-rect");
    treeRects.style("stroke-width", 1);

    var data;
    if (pressed) {
        data = Object.values(parCordBackup).filter(function(elem) {
            return elem.Medal != "No";
        });
    } else {
        data = Object.values(parCordBackup)
    }

    d3.selectAll(".line").data(data).style("stroke", function(d) {
        return color(d.Medal);
    })
    

    medals = ["bronze", "silver", "gold", "totalParticipations"];

    for (let i = 0; i < medals.length; i++) {

        d3.selectAll("." + medals[i].toLowerCase()).filter(function(elem) {
                return elem.Team == d.data.Team;
            }).style("stroke", "black")
            .style("stroke-width", 1);
    }

    
}

function treeMapMouseoverSingle (event, d) {
    const [x, y] = d3.pointer(event);

    tooltipTreeMap1
        .html(
        "<strong>Sport</strong>: " + d.data.Sport + "<br>" +
        "<strong>Total medals</strong>: " + d.data.TotalMedals + "<br>" +
        "<strong>Gold medals</strong>: " + d.data.GoldMedals + "<br>" +
        "<strong>Silver medals</strong>: " + d.data.SilverMedals + "<br>" +
        "<strong>Bronze medals</strong>: " + d.data.BronzeMedals + "<br>"
        )
        .style("opacity", 0.9)
        .style("left", (x + 600) + "px")
        .style("top", (y+50) + "px")


    let treeRects = d3.selectAll(".treemap-rect");


    if (zoomedIn) {
        treeRects.filter(function (elem) {
            return elem.data.Event == d.data.Event;
        }).style("stroke-width", 3);
    } else {
        treeRects.filter(function (elem) {
            return elem.data.Sport == d.data.Sport;
        }).style("stroke-width", 3);
    }

    // Parallel cords
    d3.selectAll(".line").filter(function(elem) {
        return elem.Sport != d.data.Sport;
    }).style("stroke", "lightgray");

    d3.selectAll(".line").filter(function(elem) {
            return elem.Sport == d.data.Sport;
    }).style("stroke", "red");

    // Bar chart
    medals = ["bronze", "silver", "gold", "totalParticipations"];
    for (let i = 0; i < medals.length; i++) {
        d3.selectAll("." + medals[i].toLowerCase()).filter(function(elem) {
                return elem.Sport == d.data.Sport;
            }).style("stroke", "red")
            .style("stroke-width", 2);
    }


    
}

function treeMapMouseleaveSingle (event, d) {
    tooltipTreeMap1.style("opacity", 0);
    let treeRects = d3.selectAll(".treemap-rect");
    treeRects.style("stroke-width", 1);

    //console.log(parCordBackup);

    var data;
    if (pressed) {
        data = Object.values(parCordBackup).filter(function(elem) {
            return elem.Medal != "No";
        });
    } else {
        data = Object.values(parCordBackup)
    }


    d3.selectAll(".line").data(data).style("stroke", function(d) {
        return color(d.Medal);
    })
    

    medals = ["bronze", "silver", "gold", "totalParticipations"];

    for (let i = 0; i < medals.length; i++) {

        d3.selectAll("." + medals[i].toLowerCase()).filter(function(elem) {
                return elem.Sport == d.data.Sport;
            }).style("stroke", "black")
            .style("stroke-width", 1);
    }

    
}

function treeMapMouseoverSingleEvent (event, d) {
    const [x, y] = d3.pointer(event);

    tooltipTreeMap2
        .html("<strong>Event</strong>: " + d.data.Event + "<br>" +
        "<strong>Total medals</strong>: " + d.data.TotalMedals + "<br>" +
        "<strong>Gold medals</strong>: " + d.data.GoldMedals + "<br>" +
        "<strong>Silver medals</strong>: " + d.data.SilverMedals + "<br>" +
        "<strong>Bronze medals</strong>: " + d.data.BronzeMedals + "<br>"
        )
        .style("opacity", 0.9)
        .style("left", (x + 600) + "px")
        .style("top", (y+50) + "px")


    let treeRects = d3.selectAll(".treemap-rect");

    //console.log("zoomed in: ", zoomedIn);

    if (zoomedIn) {
        treeRects.filter(function (elem) {
            return elem.data.Event == d.data.Event;
        }).style("stroke-width", 3);
    } else {
        treeRects.filter(function (elem) {
            return elem.data.Sport == d.data.Sport;
        }).style("stroke-width", 3);
    }

    // Parallel cords
    d3.selectAll(".line").filter(function(elem) {
        return elem.Event != d.data.Event;
    }).style("stroke", "lightgray");

    d3.selectAll(".line").filter(function(elem) {
            return elem.Event == d.data.Event;
    }).style("stroke", "red");


    // Bar chart
    medals = ["bronze", "silver", "gold", "totalParticipations"];
    for (let i = 0; i < medals.length; i++) {
        d3.selectAll("." + medals[i].toLowerCase()).filter(function(elem) {        
            return eventSpecificDataForHover[d.data.Event].includes(elem.Name);
            }).style("stroke", "red")
            .style("stroke-width", 2);
    }

   // console.log("-------------------------------------------------------------")


    
}

function treeMapMouseleaveSingleEvent (event, d) {

    tooltipTreeMap2.style("opacity", 0);
    let treeRects = d3.selectAll(".treemap-rect");
    treeRects.style("stroke-width", 1);

    //console.log(parCordBackup);

    var data;
    if (pressed) {
        data = Object.values(parCordBackup).filter(function(elem) {
            return elem.Medal != "No";
        });
    } else {
        data = Object.values(parCordBackup)
    }


    d3.selectAll(".line").data(data).style("stroke", function(d) {
        return color(d.Medal);
    })
    

    // Bar chart
    medals = ["bronze", "silver", "gold", "totalParticipations"];
    for (let i = 0; i < medals.length; i++) {
        d3.selectAll("." + medals[i].toLowerCase()).filter(function(elem) {        
            return eventSpecificDataForHover[d.data.Event].includes(elem.Name);
            }).style("stroke", "black")
            .style("stroke-width", 1);
    }

}



function treeMapMouseclick (event, d) {
    tooltipTreeMap1.style("opacity", 0);
    let treeRects = d3.selectAll(".treemap-rect");
    treeRects.style("stroke-width", 1);
    //console.log("clicked!");
    currentExploredTeamSport = d.data.Sport;
    //console.log(d.data);
    //console.log(d.data.Sport);

    document.getElementById("curr-sport").innerHTML = " > " + currentExploredTeamSport;
    zoomedIn = true;

    const svg = d3.select("#vi5");
    svg.selectAll("text").remove();
    svg.selectAll("rect").remove();
    svg.selectAll(".titleLabels").remove();
    svg.selectAll(".rectLabels").remove();
    svg.selectAll(".valueLabels").remove();


    let filteredForSingle = filteredBySexAndInterval.filter(function (elem) { return elem.Team == currentExploredTeam && elem.Sport == currentExploredTeamSport });
    singleCountryDic = fillSingleCountryDic_EVENT(filteredForSingle);
    createTreeMapSingleCountryEvents("#vi5");

    treeMapMode = 2;

    let sportFilter = d3.select("#dropdown").node().value;
    if (sportFilter === "--- All Sports (Slow!) ---")
        d3.select("#dropdown").dispatch("change");
    else
        d3.select("#eventDropdown").dispatch("change");
    


}




function lineChartMouseover (event, d, hoveredElement) {
    const [x, y] = d3.pointer(event);

    let isCircle = (hoveredElement == 0) ? true : false;
    let criteria = ""

    if (lineChartMode == 0) 
        criteria = "Total medals"
    else if (lineChartMode == 1) 
        criteria = "Medals per million pop."
    else if (lineChartMode == 2)
        criteria = "Medals per billion GDP"

    if (isCircle) {

        let roundedValue = Math.round(d.value * 100000) / 100000

        //roundedValue = d.value.toFixed(5);
        
        tooltipLineChart
            .html("<strong>Country</strong>: " + d.name + "<br>" + 
                "<strong>" + criteria + "</strong>: " + roundedValue + "<br>" +
                "<strong>Year</strong>: " + d.year
            )
            .style("opacity", 0.9)

    } else {
        tooltipLineChart
            .html("<strong>Country</strong>: " + d.name + "<br>")
            .style("opacity", 0.9)

    }

    tooltipLineChart
    .style("left", (x + 1200) + "px")
    .style("top", (y + 60) + "px")
}


function lineChartMouseleave (event, d) {
    tooltipLineChart.style("opacity", 0)
}



function parCordMouseover(event, d, medal) {

    const [x, y] = d3.pointer(event);

    d3.selectAll(".line").filter(function (elem) {
        return elem.ID == d.ID && elem.Year == d.Year;
    })
        .style("stroke", "red");

    d3.selectAll(".line").filter(function (elem) {
        return elem.ID != d.ID && elem.Medal != d.Medal;
    })
        .style("stroke", "lightgray");

    tooltip
        .html("<strong>Name</strong>: " + d.Name + "<br>" +
            "<strong>Medal</strong>: " + d.Medal + "<br>" +
            "<strong>Year</strong>: " + d.Year + "<br>" +
            "<strong>Sport:</strong> " + d.Sport + "<br>" +
            "<strong>Event:</strong> " + d.Event)
        .style("opacity", 0.9)
        .style("left", (x + 50) + "px")
        .style("top", (y + 300) + "px")


    if (medal != "No") {

        d3.selectAll("." + medal.toLowerCase()).filter(function (elem) {
            return elem.Name == d.Name;
        }).style("stroke", "red")
            .style("stroke-width", 2);

    }

    else {
        d3.selectAll(".totalParticipations").filter(function (elem) {
            return elem.Name == d.Name;
        }).style("stroke", "red")
            .style("stroke-width", 2);

    }

    switch (treeMapMode) {
        case 0:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                return elem.data.Team == d.Team;
            }).style("stroke-width", 3);
            break;

        case 1:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                return elem.data.Sport == d.Sport;
            }).style("stroke-width", 3);
            break;

        case 2:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                return elem.data.Event == d.Event;
            }).style("stroke-width", 3);
            break;
    
        default:
            break;
    }

}



function parCordMouseLeave(d, medal) {

    tooltip.style("opacity", 0)

    d3.selectAll(".line").style("stroke", function (d) {
        return color(d.Medal);
    })

    if (medal != "No") {

        d3.selectAll("." + medal.toLowerCase()).filter(function (elem) {
            return elem.Name == d.Name;
        }).style("stroke", "black")
            .style("stroke-width", 1);

    } else {
        d3.selectAll(".totalParticipations").filter(function (elem) {
            return elem.Name == d.Name;
        }).style("stroke", "black")
            .style("stroke-width", 1);
    }

    switch (treeMapMode) {
        case 0:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                return elem.data.Team == d.Team;
            }).style("stroke-width", 1);
            break;

        case 1:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                return elem.data.Sport == d.Sport;
            }).style("stroke-width", 1);
            break;

        case 2:
            treeRects = d3.selectAll(".treemap-rect");
            treeRects.filter(function (elem) {
                d3.selectAll(".treemap-rect").filter(function(elem) {
                    if(eventSpecificDataForHover[elem.data.Event].includes(d.Name)){
                        console.log("name ",d.Name)
                        console.log("elem Event ",elem.data.Event)
                        console.log("eventSpeccidicDataHover ",eventSpecificDataForHover[elem.data.Event])
                    }
                    return eventSpecificDataForHover[elem.data.Event].includes(d.Name);  
                
                }).style("stroke-width", 1);
            })
     
            break;
    
        default:
            break;
    }
}

function getShortenedName(fullname) {

    const splitName = fullname.split(" ")
    let temp = "";
    if (splitName.length > 1) {
        for (let i = 0; i < splitName.length - 1; i++) {
            temp += splitName[i][0] + ". "
        }
        return temp += splitName[splitName.length - 1]
    }
    return splitName[splitName.length - 1]

}

function changeLineChartMode (id) {
    let mode = parseInt(id, 10);
    lineChartMode = mode;
    let currentShownMode = document.getElementsByClassName("dropbtn")[0];
    if (mode == 0) {
        currentShownMode.innerHTML = "total medals";
    } else if (mode == 1) {
        currentShownMode.innerHTML = "total medals per million population";
    } else if (mode == 2 ) {
        currentShownMode.innerHTML = "total medals per billion GDP";
    }

    
    /* DE MOMENTO RECALCULA TUDO, O QUE PODE TORNAR AS COISAS MUITO LENTAS EM CERTOS CASOS 
    (TODOS OS EVENTOS, OU PIOR.. TODOS OS DESPORTOS!) */

    let sportFilter = d3.select("#dropdown").node().value;
    if (sportFilter === "--- All Sports (Slow!) ---")
        d3.select("#dropdown").dispatch("change");
    else
        d3.select("#eventDropdown").dispatch("change");
    



    
    

}