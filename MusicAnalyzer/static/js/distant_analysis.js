function distantAnalysis(analysisJson) {
    console.log(analysisJson)
    createChordQualityCountChart(analysisJson)
    createChordRootCountChart(analysisJson)
    createChordNameCountChart(analysisJson)
    drawBoxplots(analysisJson)

}

function createChordNameCountChart(analysisJson) {
    // group stats by group
    var grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(car => _.omit(car, 'group')));


    // group stats by chord root count and sum up values
    var newGroup = []
    for (let group in grouped) {
        for (let arrayIndex in grouped[group]) {
            newGroup[group] = sumObjectsByKey(newGroup[group], grouped[group][arrayIndex].chord_name_count)
        }
    }
    for (groupName in newGroup) {
        for (group in newGroup[groupName]) {
            if (newGroup[groupName][group] < 5) {
                delete newGroup[groupName][group]
            }
        }

    }

    // sum all group names in one array
    let groupNames = Object.keys(newGroup)

    let uniqueKeys = getUniqueKeys(newGroup)

    let data = getMatchingVals(newGroup, uniqueKeys, groupNames)


    // draw the chart
    $(function () {
        var options = {
            seriesBarDistance: 10,
            axisX:
                {
                    offset: 60
                }
            ,
            axisY: {
                offset: 80,
                labelInterpolationFnc:

                    function (value) {
                        return value + ' CHF'
                    }

                ,
                scaleMinSpace: 15
            }
        }

        var responsiveOptions = [
            ['screen and (max-width: 640px)', {
                seriesBarDistance: 5,
                axisX: {
                    labelInterpolationFnc: function (value) {
                        return value[0];
                    }
                }
            }]
        ];

        new Chartist.Bar('.ct-chart-name', {
                labels: uniqueKeys,
                series: data,
                responsiveOptions
            }, {
                plugins: [
                    Chartist.plugins.legend({
                        legendNames: groupNames,
                    })
                ]
            },
            {
                seriesBarDistance: 10,
                axisX: {
                    offset: 60
                },
                axisY: {
                    offset: 80,
                    labelInterpolationFnc: function (value) {
                        return value + ' CHF'
                    },
                    scaleMinSpace: 15
                }

            }
        )
        ;
    });
}

function createChordRootCountChart(analysisJson) {
    // group stats by group
    var grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(car => _.omit(car, 'group')));


    // group stats by chord root count and sum up values
    var newGroup = []
    for (let group in grouped) {
        for (let arrayIndex in grouped[group]) {
            newGroup[group] = sumObjectsByKey(newGroup[group], grouped[group][arrayIndex].chord_root_count)
        }
    }

    // sum all group names in one array
    let groupNames = Object.keys(newGroup)

    let uniqueKeys = getUniqueKeys(newGroup)

    let data = getMatchingVals(newGroup, uniqueKeys, groupNames)


    // draw the chart
    $(function () {
        var options = {
            seriesBarDistance: 10
        };

        var responsiveOptions = [
            ['screen and (max-width: 640px)', {
                seriesBarDistance: 5,
                axisX: {
                    labelInterpolationFnc: function (value) {
                        return value[0];
                    }
                }
            }]
        ];

        new Chartist.Bar('.ct-chart-root', {
            labels: uniqueKeys,
            series: data,
            options,
            responsiveOptions
        }, {
            plugins: [
                Chartist.plugins.legend({
                    legendNames: groupNames,
                })
            ]
        });
    });
}

function createChordQualityCountChart(analysisJson) {
    // group stats by group
    var grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(car => _.omit(car, 'group')));


    // group stats by chord root count and sum up values
    var newGroup = []
    for (let group in grouped) {
        for (let arrayIndex in grouped[group]) {
            newGroup[group] = sumObjectsByKey(newGroup[group], grouped[group][arrayIndex].chord_quality_count)
        }
    }

    // sum all group names in one array
    let groupNames = Object.keys(newGroup)


    let uniqueKeys = getUniqueKeys(newGroup)

    let data = getMatchingVals(newGroup, uniqueKeys, groupNames)


    // draw the chart
    $(function () {
        var options = {
            seriesBarDistance: 10
        };

        var responsiveOptions = [
            ['screen and (max-width: 640px)', {
                seriesBarDistance: 5,
                axisX: {
                    labelInterpolationFnc: function (value) {
                        return value[0];
                    }
                }
            }]
        ];

        new Chartist.Bar('.ct-chart-quality', {
            labels: uniqueKeys,
            series: data,
            options,
            responsiveOptions
        }, {
            plugins: [
                Chartist.plugins.legend({
                    legendNames: groupNames,
                })
            ]
        });
    });
}

function getUniqueKeys(newGroup) {
    // get only the keys of chord root count (e.g. A,C# etc.)
    let allKeys = []
    for (let group in newGroup) {
        allKeys[group] = Object.keys(newGroup[group])
    }

    // throw all the keys together in one unique (every entry only once) array
    var uniqueKeys = []
    Array.prototype.unique = function () {
        var a = this.concat();
        for (var i = 0; i < a.length; ++i) {
            for (var j = i + 1; j < a.length; ++j) {
                if (a[i] === a[j])
                    a.splice(j--, 1);
            }
        }

        return a;
    };
    for (let groupOfKeys in allKeys) {
        uniqueKeys = uniqueKeys.concat(allKeys[groupOfKeys])
    }
    uniqueKeys = uniqueKeys.unique()
    uniqueKeys.pop()
    return uniqueKeys
}

function getMatchingVals(newGroup, uniqueKeys, groupNames) {
    // map the groups by the keys from the unique array so that the values are in the right order
    let matchingVals = [];
    for (let chord in newGroup) {
        let toCheck = newGroup[chord]
        matchingVals[chord] = uniqueKeys.map(key => toCheck[key])
    }

    var data = [];
    for (groupName in groupNames) {
        let name = groupNames[groupName]
        data[groupName] = matchingVals[name]
    }
    return data;
}


function sumObjectsByKey(...objs) {
    return objs.reduce((a, b) => {
        for (let k in b) {
            if (b.hasOwnProperty(k))
                a[k] = (a[k] || 0) + b[k];
        }
        return a;
    }, {});
}

function drawBoxplots(analysisJson) {
    var groupNames = []
    var resultArray = []
    for (let group in analysisJson.per_group_stats) {
        if (analysisJson.per_group_stats[group].semitones_li != undefined) {
            groupNames[group] = analysisJson.per_group_stats[group].group_name;
            resultArray[group] = [analysisJson.per_group_stats[group].min_ambitus_semitones,
                getPercentile(analysisJson.per_group_stats[group].semitones_li, 25),
                analysisJson.per_group_stats[group].median_ambitus_semitones,
                getPercentile(analysisJson.per_group_stats[group].semitones_li, 75),
                analysisJson.per_group_stats[group].max_ambitus_semitones]
        }
    }
    var myConfig = {
        "graphset": [
            {
                "type": "boxplot",
                "plotarea": {
                    "margin": "100"
                },
                "scaleX": {
                    "guide": {
                        "visible": false
                    },
                    "label": {
                        "text": "Group"
                    },
                    "values": groupNames,
                    "item": {
                        "wrapText": true
                    }
                },
                "scaleY": {
                    "minValue": "auto",
                    "guide": {
                        "lineStyle": "solid"
                    },
                    "label": {
                        "text": "Number of semitones"
                    },
                    "item": {
                        "wrapText": true
                    }
                },
                "tooltip": {
                    "fontSize": 11,
                    "align": "left",
                    "borderRadius": 7,
                    "borderWidth": 1,
                    "backgroundColor": "#fff",
                    "alpha": 0.9,
                    "padding": 10,
                    "color": "#000"
                },
                "plot": {},
                "options": {
                    "box": {
                        "barWidth": 0.5,
                        "tooltip": {
                            "text": "<span style=\"font-style:italic;\">Group %scale-key-text</span><br><b style=\"font-size:15px;color:%color3\">Number of semitones:</b><br><br>Maximum: <b>%data-max</b><br>Upper Quartile: <b>%data-upper-quartile</b><br>Median: <b>%data-median</b><br>Lower Quartile: <b>%data-lower-quartile</b><br>Minimum: <b>%data-min</b>"
                        },
                        "background-color": "#d70206",
                        "border-color": "#d70206"
                    },
                    "outlier": {
                        "tooltip": {
                            "text": "<span style=\"font-style:italic;\">Group %scale-key-text</span><br><b style=\"font-size:15px;color:%color-7\">Number of semitones: %node-value</b>"
                        },
                        "marker": {
                            "type": "circle"
                        }
                    }
                },
                "series": [
                    {
                        "dataBox": resultArray,
                        "dataOutlier": []
                    }
                ]
            }
        ]
    };

    zingchart.render({
        id: 'boxplots',
        data: myConfig,
        height: "100%",
        width: "100%"
    });
}

// we need Q1 and Q3 for the boxplots
function getPercentile(data, percentile) {
    var index = (percentile / 100) * data.length;
    var result;
    if (Math.floor(index) == index) {
        result = (data[(index - 1)] + data[index]) / 2;
    } else {
        result = data[Math.floor(index)];
    }
    return result;
}
