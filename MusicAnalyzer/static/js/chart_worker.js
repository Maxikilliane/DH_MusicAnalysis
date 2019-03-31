this.onmessage = function (e) {
    let input = e.data;
    let newGroup = getRelevantSummaryStatsForChart(input.analysisJson, input.statsAccessor, input.isDeletedWhenLessThanThree);
    // is dict of only the summary stats currently relevant for the chart as dict

    let uniqueKeys = getUniqueKeys(input.analysisJson, input.statsAccessor);
    // is list of keys relevant to the summary stats (like the individual chords names etc)

    if (input.isSortableByRoot){
        uniqueKeys = sortRootCount(uniqueKeys)
    }

    let data = getMatchingVals(newGroup, uniqueKeys, input.groupNames);

    for (let i = 0; i < data.length; i++) {
        data[i] = data[i].map(function (v, idx) {
            return {
                meta: uniqueKeys[idx], value: v
            };

        });
    }

    //function started here
    const options = {
        seriesBarDistance: input.seriesBarDistance
    };

    /*
    const responsiveOptions = [
        ['screen and (max-width: 640px)', {
            seriesBarDistance: 5,
            axisX: {
                labelInterpolationFnc: function (value) {
                    return value[0];
                }
            }
        }]
    ];
    */
    let message = {};
    message["data"] = data;
    message["uniqueKeys"] = uniqueKeys;
    message["options"] = options;
    this.postMessage(message);
    this.close();
};

function getRelevantSummaryStatsForChart(analysisJson, nameOfSummaryStatsNeeded, isDeletedWhenLessThanThree) {
    let group_stats = analysisJson.per_group_stats;
    let newGroup = [];
    for (let i = 0; i < group_stats.length; ++i) {
        let groupName = group_stats[i].group_name;
        let relevant_value = group_stats[i][nameOfSummaryStatsNeeded];

        if (isDeletedWhenLessThanThree) {
            for (let group in relevant_value) {
                if (relevant_value[group] < 3) {
                    delete relevant_value[group]
                }
            }
        }


        newGroup[groupName] = group_stats[i][nameOfSummaryStatsNeeded];
    }
    return newGroup;
}

function getUniqueKeys(analysisJson, nameOfNecessaryAnalysis) {

    return Object.keys(analysisJson.total_sum_stats[nameOfNecessaryAnalysis]);
}

function getMatchingVals(newGroup, uniqueKeys, groupNames) {
    // map the groups by the keys from the unique array so that the values are in the right order
    let matchingVals = [];
    for (let group in newGroup) {
        let toCheck = newGroup[group];
        matchingVals[group] = uniqueKeys.map(key => toCheck[key])
    }

    let data = [];
    for (let groupName in groupNames) {
        let name = groupNames[groupName];
        data[groupName] = matchingVals[name]
    }
    return data;
}

function sortRootCount(arr) {
    let sortingArray = ['C-', 'C', 'C#', 'D-', 'D', 'D#', 'E-', 'E', 'E#', 'F-', 'F', 'F#', 'G-', 'G', 'G#', 'A-', 'A', 'A#', 'B-', 'B', 'B#'];
    return sortingArray.map(key => arr.find(item => item === key))
        .filter(item => item)

}