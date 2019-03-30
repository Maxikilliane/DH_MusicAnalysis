$(document).ready(function () {
    console.log("doc ready");
    UIkit.notification({
        message: 'processing analysis',
        status: 'primary',
        pos: 'bottom-center',
        timeout: 5000000 // basically endless time, gets closed on success or error
    });
    let form = $("#start_distant_analysis_form");
    $.ajax({
        url: form.attr("data-analysis-choice-url"),
        data: form.serialize(),
        type: "POST",
        dataType: 'json',
        success: function (json) {
            distantAnalysis(json.all_summary_stats);
            addMetadata(json.metadata);
            UIkit.notification.closeAll();
        },
        error: function (xhr, errmsg, err) {
            UIkit.notification.closeAll();
            console.log("error");
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });
});

function addMetadata(metadata) {
    let table_content = "";
    for (let i = 0; i < metadata.length; ++i) {
        let music_piece = metadata[i];
        let row = "<tr>\n" +
            "             <td>" + music_piece.group + "</td>\n" +
            "             <td>" + music_piece.composer + "</td>\n" +
            "             <td>" + music_piece.title + "</td>\n" +
            "             <td>" + music_piece.year + "</td>\n" +
            "    </tr>";
        table_content = table_content.concat(row);
    }
    $("#metadata_table tbody").append(table_content);
}

function distantAnalysis(analysisJson) {
    console.log(analysisJson);
    createChordQualityCountChart(analysisJson)
    createChordRootCountChart(analysisJson)
    createChordNameCountChart(analysisJson)
    drawBoxplots(analysisJson)
    drawAmbitusRangeChart(analysisJson)
    createPitchNameCountChart(analysisJson)
    createPitchOctaveCountChart(analysisJson)
    createPitchNameWithOctaveCountChart(analysisJson)
    createKeyNameCountChart(analysisJson)
    createKeyModeCountChart(analysisJson)
    createKeyProbabilityLineChart(analysisJson)
}

function createKeyNameCountChart(analysisJson) {
    // group stats by group
    var grouped = analysisJson.per_group_stats

    // sum all group names in one array
    let groupNames = []
    for (group in grouped) {
        groupNames.push(grouped[group].group_name)
    }
    groupNames.pop()


    // group stats by chord root count and sum up values
    var newGroup = []
    for (let i = 0; i < grouped.length; i++) {
        newGroup[groupNames[i]] = sumObjectsByKey(newGroup[i], grouped[i].key_name_count)
    }


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

        new Chartist.Bar('.ct-chart-key-name', {
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

function createKeyModeCountChart(analysisJson) {
    // group stats by group
    var grouped = analysisJson.per_group_stats

    // sum all group names in one array
    let groupNames = []
    for (group in grouped) {
        groupNames.push(grouped[group].group_name)
    }
    groupNames.pop()


    // group stats by chord root count and sum up values
    var newGroup = []
    for (let i = 0; i < grouped.length; i++) {
        newGroup[groupNames[i]] = sumObjectsByKey(newGroup[i], grouped[i].key_mode_count)
    }


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

        new Chartist.Bar('.ct-chart-key-mode', {
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

function createKeyProbabilityLineChart(analysisJson) {
    var grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(key => _.omit(key, 'group')));


    var keyInformationObjectResult = []
    var musicPiecesResult = []
    for (group in grouped) {
        let keyInformationObject = []
        let musicPieces = []
        let firstGroup = grouped[group]
        for (let musicPiece in firstGroup) {
            if (firstGroup[musicPiece].key_information !== undefined) {
                keyInformationObject.push(firstGroup[musicPiece].key_information)
            }
            if (firstGroup[musicPiece].title !== undefined) {
                musicPieces.push(firstGroup[musicPiece].title)
            }
        }

        keyInformationObjectResult[group] = keyInformationObject

        musicPiecesResult[group] = musicPieces
    }

    let resultKeys = []
    let resultValues = []

    for (let group in keyInformationObjectResult) {
        let values = []
        let keys = []
        let keyGroup = keyInformationObjectResult[group]

        for (let y = 0; y < keyGroup.length; y++) {
            let probabilitiesPerPiece = []
            let keysPerPiece = []
            if (keyGroup[y] !== undefined) {
                for (let i = 0; i < keyGroup[y].length; i++) {
                    probabilitiesPerPiece.push(keyGroup[y][i].probability)
                    keysPerPiece.push(keyGroup[y][i].key_name)
                }
            }
            values[y] = probabilitiesPerPiece
            keys[y] = keysPerPiece
        }
        resultKeys[group] = keys
        resultValues[group] = values
    }

    for (let group in resultValues) {
        let value = resultValues[group]
        let key = resultKeys[group]
        for (let i = 0; i < value.length; i++) {
            let object = value[i]
            let keyObject = key[i]
            for (let y = 0; y < object.length; y++) {
                object[y] = {meta: keyObject[y], value: object[y]};
            }
        }
    }

    console.log(musicPiecesResult)


    console.log(resultValues)

    let labels = [1, 2, 3, 4]

    for (let group in resultValues) {
        if (group !== 'unique') {
            var newDiv = document.createElement('div');
            var newHeading = document.createElement('h4');
            newHeading.className = 'uk-text-center';
            newHeading.innerHTML = group;
            newDiv.className = 'ct-chart-key-probability-' + group;
            document.getElementById('probabilityCharts').appendChild(newHeading);
            document.getElementById('probabilityCharts').appendChild(newDiv);
        }
    }

    for (let group in resultValues) {
        if (group !== 'unique') {
            new Chartist.Line('.ct-chart-key-probability-' + group, {
                    labels: labels,
                    series: resultValues[group]
                },
                {
                    plugins: [
                        Chartist.plugins.legend({legendNames: musicPiecesResult[group]}),
                        Chartist.plugins.tooltip({appendToBody: true})
                    ]
                },
                {
                    fullWidth: true,
                    chartPadding: {
                        right: 40
                    }
                },
            );
        }
    }
}

function createChordNameCountChart(analysisJson) {
    // group stats by group
    var grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(key => _.omit(key, 'group')));


    // group stats by chord root count and sum up values
    var newGroup = []
    for (let group in grouped) {
        for (let arrayIndex in grouped[group]) {
            newGroup[group] = sumObjectsByKey(newGroup[group], grouped[group][arrayIndex].chord_name_count)
        }
    }

    for (groupName in newGroup) {
        for (group in newGroup[groupName]) {
            if (newGroup[groupName][group] < 3) {
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
            seriesBarDistance: 10
        };

        var responsiveOptions = [
            ['screen and (max-width: 640px)', {
                seriesBarDistance: 5
            }]
        ];

        for (let i = 0; i < data.length; i++) {
            data[i] = data[i].map(function (v, idx) {
                return {
                    meta: uniqueKeys[idx], value: v
                };

            });
        }
        var someDiv = document.getElementById('any-div-anywhere');
        Chartist.Bar('.ct-chart-name', {
                labels: uniqueKeys,
                series: data,
                options,
                responsiveOptions,
            },

            {
                plugins: [
                    Chartist.plugins.legend({
                        position: someDiv, legendNames: groupNames
                    }),
                    Chartist.plugins.tooltip({appendToBody: true})
                ]
            },
        );


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


    uniqueKeys = sortRootCount(uniqueKeys)

    let data = getMatchingVals(newGroup, uniqueKeys, groupNames)

    for (let i = 0; i < data.length; i++) {
        data[i] = data[i].map(function (v, idx) {
            return {
                meta: uniqueKeys[idx], value: v
            };

        });
    }
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
                }),
                Chartist.plugins.tooltip({class: 'uk-text-center', appendToBody: true})
            ]
        });
    });

}

function createPitchNameCountChart(analysisJson) {
    // group stats by group
    var grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(car => _.omit(car, 'group')));


    // group stats by chord root count and sum up values
    var newGroup = []
    for (let group in grouped) {
        for (let arrayIndex in grouped[group]) {
            newGroup[group] = sumObjectsByKey(newGroup[group], grouped[group][arrayIndex].pitch_name_count)
        }
    }

    // sum all group names in one array
    let groupNames = Object.keys(newGroup)

    let uniqueKeys = getUniqueKeys(newGroup)

    uniqueKeys = sortRootCount(uniqueKeys)

    let data = getMatchingVals(newGroup, uniqueKeys, groupNames)

    for (let i = 0; i < data.length; i++) {
        data[i] = data[i].map(function (v, idx) {
            return {
                meta: uniqueKeys[idx], value: v
            };

        });
    }

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

        new Chartist.Bar('.ct-chart-pitch-name', {
            labels: uniqueKeys,
            series: data,
            options,
            responsiveOptions
        }, {
            plugins: [
                Chartist.plugins.legend({
                    legendNames: groupNames,
                }),
                Chartist.plugins.tooltip({appendToBody: true})
            ]
        });
    });
}

function createPitchOctaveCountChart(analysisJson) {
    // group stats by group
    var grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(car => _.omit(car, 'group')));


    // group stats by chord root count and sum up values
    var newGroup = []
    for (let group in grouped) {
        for (let arrayIndex in grouped[group]) {
            newGroup[group] = sumObjectsByKey(newGroup[group], grouped[group][arrayIndex].pitch_octave_count)
        }
    }

    // sum all group names in one array
    let groupNames = Object.keys(newGroup)

    let uniqueKeys = getUniqueKeys(newGroup)

    let data = getMatchingVals(newGroup, uniqueKeys, groupNames)

    for (let i = 0; i < data.length; i++) {
        data[i] = data[i].map(function (v, idx) {
            return {
                meta: uniqueKeys[idx], value: v
            };

        });
    }

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

        new Chartist.Bar('.ct-chart-pitch-octave', {
            labels: uniqueKeys,
            series: data,
            options,
            responsiveOptions
        }, {
            plugins: [
                Chartist.plugins.legend({
                    legendNames: groupNames,
                }),
                Chartist.plugins.tooltip({appendToBody: true})
            ]
        });
    });
}

function sortRootCount(arr) {
    var sortingArray = ['C-', 'C', 'C#', 'D-', 'D', 'D#', 'E-', 'E', 'E#', 'F-', 'F', 'F#', 'G-', 'G', 'G#', 'A-', 'A', 'A#', 'B-', 'B', 'B#']
    return sortingArray.map(key => arr.find(item => item === key))
        .filter(item => item)

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
    uniqueKeys.pop()
    let data = getMatchingVals(newGroup, uniqueKeys, groupNames)

    for (let i = 0; i < data.length; i++) {
        data[i] = data[i].map(function (v, idx) {
            return {
                meta: uniqueKeys[idx], value: v
            };

        });
    }

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
                }),
                Chartist.plugins.tooltip({appendToBody: true})
            ]
        });
    });
}

function createPitchNameWithOctaveCountChart(analysisJson) {
    // group stats by group
    var grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(car => _.omit(car, 'group')));


    // group stats by chord root count and sum up values
    var newGroup = []
    for (let group in grouped) {
        for (let arrayIndex in grouped[group]) {
            newGroup[group] = sumObjectsByKey(newGroup[group], grouped[group][arrayIndex].pitch_name_with_octave_count)
        }
    }

    // sum all group names in one array
    let groupNames = Object.keys(newGroup)

    let uniqueKeys = getUniqueKeys(newGroup)

    var sortingArray = ['C-1', 'C1', 'C#1', 'D-1', 'D1', 'D#1', 'E-1', 'E1', 'E#1', 'F-1', 'F1', 'F#1', 'G-1', 'G1', 'G#1', 'A-1', 'A1', 'A#1', 'B-1', 'B1', 'B#1', 'C-2', 'C2', 'C#2', 'D-2', 'D2', 'D#2', 'E-2', 'E2', 'E#2', 'F-2', 'F2', 'F#2', 'G-2', 'G2', 'G#2', 'A-2', 'A2', 'A#2', 'B-2', 'B2', 'B#2', 'C-3', 'C3', 'C#3', 'D-3', 'D3', 'D#3', 'E-3', 'E3', 'E#3', 'F-3', 'F3', 'F#3', 'G-3', 'G3', 'G#3', 'A-3', 'A3', 'A#3', 'B-3', 'B3', 'B#3', 'C-4', 'C4', 'C#4', 'D-4', 'D4', 'D#4', 'E-4', 'E4', 'E#4', 'F-4', 'F4', 'F#4', 'G-4', 'G4', 'G#4', 'A-4', 'A4', 'A#4', 'B-4', 'B4', 'B#4', 'C-5', 'C5', 'C#5', 'D-5', 'D5', 'D#5', 'E-5', 'E5', 'E#5', 'F-5', 'F5', 'F#5', 'G-5', 'G5', 'G#5', 'A-5', 'A5', 'A#5', 'B-5', 'B5', 'B#5', 'C-6', 'C6', 'C#6', 'D-6', 'D6', 'D#6', 'E-6', 'E6', 'E#6', 'F-6', 'F6', 'F#6', 'G-6', 'G6', 'G#6', 'A-6', 'A6', 'A#6', 'B-6', 'B6', 'B#6', 'C-7', 'C7', 'C#7', 'D-7', 'D7', 'D#7', 'E-7', 'E7', 'E#7', 'F-7', 'F7', 'F#7', 'G-7', 'G7', 'G#7', 'A-7', 'A7', 'A#7', 'B-7', 'B7', 'B#7']
    uniqueKeys = sortingArray.map(key => uniqueKeys.find(item => item === key))
        .filter(item => item)

    let data = getMatchingVals(newGroup, uniqueKeys, groupNames)

    for (let i = 0; i < data.length; i++) {
        data[i] = data[i].map(function (v, idx) {
            return {
                meta: uniqueKeys[idx], value: v
            };

        });
    }
    // draw the chart
    $(function () {
        var options = {
            seriesBarDistance: 100
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
        var someDiv = document.getElementById('any-div-anywhere2');
        new Chartist.Bar('.ct-chart-pitch-octave-name', {
            labels: uniqueKeys,
            series: data,
            options,
            responsiveOptions
        }, {
            plugins: [
                Chartist.plugins.legend({
                    legendNames: groupNames, position: someDiv
                }),
                Chartist.plugins.tooltip({appendToBody: true})
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

    return uniqueKeys
}

function getMatchingVals(newGroup, uniqueKeys, groupNames) {
    // map the groups by the keys from the unique array so that the values are in the right order
    let matchingVals = [];
    for (let group in newGroup) {
        let toCheck = newGroup[group]
        matchingVals[group] = uniqueKeys.map(key => toCheck[key])
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

function drawAmbitusRangeChart(analysisJson) {
    var grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(key => _.omit(key, 'group')));
    let notes = ['C-1', 'C1', 'C#1', 'D-1', 'D1', 'D#1', 'E-1', 'E1', 'E#1', 'F-1', 'F1', 'F#1', 'G-1', 'G1', 'G#1', 'A-1', 'A1', 'A#1', 'B-1', 'B1', 'B#1', 'C-2', 'C2', 'C#2', 'D-2', 'D2', 'D#2', 'E-2', 'E2', 'E#2', 'F-2', 'F2', 'F#2', 'G-2', 'G2', 'G#2', 'A-2', 'A2', 'A#2', 'B-2', 'B2', 'B#2', 'C-3', 'C3', 'C#3', 'D-3', 'D3', 'D#3', 'E-3', 'E3', 'E#3', 'F-3', 'F3', 'F#3', 'G-3', 'G3', 'G#3', 'A-3', 'A3', 'A#3', 'B-3', 'B3', 'B#3', 'C-4', 'C4', 'C#4', 'D-4', 'D4', 'D#4', 'E-4', 'E4', 'E#4', 'F-4', 'F4', 'F#4', 'G-4', 'G4', 'G#4', 'A-4', 'A4', 'A#4', 'B-4', 'B4', 'B#4', 'C-5', 'C5', 'C#5', 'D-5', 'D5', 'D#5', 'E-5', 'E5', 'E#5', 'F-5', 'F5', 'F#5', 'G-5', 'G5', 'G#5', 'A-5', 'A5', 'A#5', 'B-5', 'B5', 'B#5', 'C-6', 'C6', 'C#6', 'D-6', 'D6', 'D#6', 'E-6', 'E6', 'E#6', 'F-6', 'F6', 'F#6', 'G-6', 'G6', 'G#6', 'A-6', 'A6', 'A#6', 'B-6', 'B6', 'B#6', 'C-7', 'C7', 'C#7', 'D-7', 'D7', 'D#7', 'E-7', 'E7', 'E#7', 'F-7', 'F7', 'F#7', 'G-7', 'G7', 'G#7', 'A-7', 'A7', 'A#7', 'B-7', 'B7', 'B#7']
    keys = [[]]

    let titles = Object.keys(grouped)

    for (let group in grouped) {
        let titlesPerGroup = []
        for (musicPiece in grouped[group]) {
            titlesPerGroup[musicPiece] = grouped[group][musicPiece].title
        }
        keys[group] = titlesPerGroup

    }
    keys.shift()

    let realResult = []
    for (let group in grouped) {
        let arrOfResultObjs = [];
        for (musicPiece in grouped[group]) {
            let lowKey
            if (grouped[group][musicPiece].lowest_pitch_count !== undefined) {
                lowKey = Object.keys(grouped[group][musicPiece].lowest_pitch_count)
            }
            let highKey
            if (grouped[group][musicPiece].highest_pitch_count !== undefined) {
                highKey = Object.keys(grouped[group][musicPiece].highest_pitch_count)
            }

            let obj = {}
            if (highKey !== undefined && lowKey !== undefined) {
                obj = {

                    values: [notes.indexOf(highKey[0]) - notes.indexOf((lowKey[0]))],
                    offsetValues: [notes.indexOf(lowKey[0])],
                    'data-lows': [lowKey],
                    'data-highs': [highKey],
                    'data-city': grouped[group][musicPiece].title,
                    'text': grouped[group][musicPiece].title
                }
            }
            if (jQuery.isEmptyObject(obj) === false) {
                arrOfResultObjs.push(obj)
            }
        }
        realResult.push(arrOfResultObjs)


    }


    let configs = []
    for (result in realResult) {
        var myConfig = {
            type: 'hbar',
            "title": {
                "text": titles[result],
                "font-color": "#000000",
                "backgroundColor": "none",
                "font-size": "20px",
                "alpha": 1,
                "adjust-layout": true,
            },

            globals: {
                fontFamily: 'Roboto'
            },
            "legend": {
                "alpha": 0.05,
                "shadow": false,
                "align": "left",
                "marker": {
                    "type": "circle",
                    "border-color": "none",
                    "size": "10px"
                },
                "border-width": 0,
                "pageStatus": {
                    "color": "black"
                }
            },
            scaleX: {
                labels: [''],
                zooming: true,
                zoomTo: [0, 5],
                label: {
                    fontSize: 14
                }
            },
            scaleY: {
                values: notes,
                label: {
                    text: 'Note',
                    fontSize: 14
                },
                guide: {
                    lineStyle: 'solid'
                }
            },
            scrollX: {},
            tooltip: {
                text: "%data-city<br>Lowest pitch: %data-lows<br>Highest pitch: %data-highs"
            },
            plotarea: {
                margin: '75 50 60 85'
            },
            series: realResult[result]
        };

        configs.push(myConfig)
    }
    // create divs for diagrams
    for (result in realResult) {
        var newDiv = document.createElement('div');

        newDiv.id = 'ct-chart-ambitus-range-' + result;
        document.getElementById('rangeCharts').appendChild(newDiv);
    }
    configs.splice(-1, 1)


    for (config in configs) {
        if (config !== "unique") {
            zingchart.render({
                id: 'ct-chart-ambitus-range-' + config,
                data: configs[config]
            });
        }
    }


}