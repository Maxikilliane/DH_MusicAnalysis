function distantAnalysis(analysisJson) {
    console.log(analysisJson.per_piece_stats)
    createChordQualityCountChart(analysisJson)
    createChordRootCountChart(analysisJson)
    createChordNameCountChart(analysisJson)

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
            console.log(newGroup[groupName][group])
            if (newGroup[groupName][group] < 5) {
                console.log("im if")
                console.log(newGroup[groupName][group])
                delete newGroup[groupName][group]
            }
        }

    }
    console.log(newGroup)

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