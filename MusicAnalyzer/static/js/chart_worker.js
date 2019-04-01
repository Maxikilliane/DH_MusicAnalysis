let rootEnum = {
    c: 1,
    d: 2,
    e: 3,
    f: 4,
    g: 5,
    a: 6,
    b: 7,
    properties: {
        1: {name: "c", value: 1},
        2: {name: "d", value: 2},
        3: {name: "e", value: 3},
        4: {name: "f", value: 4},
        5: {name: "g", value: 5},
        6: {name: "a", value: 6},
        7: {name: "b", value: 7}
    }
};

this.onmessage = function (e) {
    let sortTypeEnum = {"root": 1, "rootAndOctave": 2, "number": 3};

    let signEnum = {
        flat: 1,
        none: 2,
        sharp: 3,
        properties: {
            1: {name: "-", value: 1},
            2: {name: "", value: 2},
            3: {name: "#", value: 3}
        }

    };

    if (Object.freeze) {
        Object.freeze(sortTypeEnum);
        Object.freeze(rootEnum);
        Object.freeze(signEnum);
    }

    let input = e.data;
    let newGroup = getRelevantSummaryStatsForChart(input.analysisJson, input.statsAccessor, input.isDeletedWhenLessThanThree);
    // is dict of only the summary stats currently relevant for the chart as dict

    let uniqueKeys = getUniqueKeys(input.analysisJson, input.statsAccessor);
    // is list of keys relevant to the summary stats (like the individual chords names etc)

    if (input.isSortable) {

        if (input.sortType === sortTypeEnum.root) {
            uniqueKeys = sortRootCount(uniqueKeys);
        } else if (input.sortType === sortTypeEnum.rootAndOctave) {
            uniqueKeys = sortRootAndOctave(uniqueKeys);
        } else if (input.sortType === sortTypeEnum.number) {
            uniqueKeys = sortNumber(uniqueKeys);
        }
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

function sortRootAndOctave(arr) {
    let sortingArray = ['C-1', 'C1', 'C#1', 'D-1', 'D1', 'D#1', 'E-1', 'E1', 'E#1', 'F-1', 'F1', 'F#1', 'G-1', 'G1', 'G#1', 'A-1', 'A1', 'A#1', 'B-1', 'B1', 'B#1', 'C-2', 'C2', 'C#2', 'D-2', 'D2', 'D#2', 'E-2', 'E2', 'E#2', 'F-2', 'F2', 'F#2', 'G-2', 'G2', 'G#2', 'A-2', 'A2', 'A#2', 'B-2', 'B2', 'B#2', 'C-3', 'C3', 'C#3', 'D-3', 'D3', 'D#3', 'E-3', 'E3', 'E#3', 'F-3', 'F3', 'F#3', 'G-3', 'G3', 'G#3', 'A-3', 'A3', 'A#3', 'B-3', 'B3', 'B#3', 'C-4', 'C4', 'C#4', 'D-4', 'D4', 'D#4', 'E-4', 'E4', 'E#4', 'F-4', 'F4', 'F#4', 'G-4', 'G4', 'G#4', 'A-4', 'A4', 'A#4', 'B-4', 'B4', 'B#4', 'C-5', 'C5', 'C#5', 'D-5', 'D5', 'D#5', 'E-5', 'E5', 'E#5', 'F-5', 'F5', 'F#5', 'G-5', 'G5', 'G#5', 'A-5', 'A5', 'A#5', 'B-5', 'B5', 'B#5', 'C-6', 'C6', 'C#6', 'D-6', 'D6', 'D#6', 'E-6', 'E6', 'E#6', 'F-6', 'F6', 'F#6', 'G-6', 'G6', 'G#6', 'A-6', 'A6', 'A#6', 'B-6', 'B6', 'B#6', 'C-7', 'C7', 'C#7', 'D-7', 'D7', 'D#7', 'E-7', 'E7', 'E#7', 'F-7', 'F7', 'F#7', 'G-7', 'G7', 'G#7', 'A-7', 'A7', 'A#7', 'B-7', 'B7', 'B#7'];
    return sortingArray.map(key => arr.find(item => item === key))
        .filter(item => item);
}


function sortNumber(arr) {
    return arr.sort(function (a, b) {
        let a_number = parseFloat(a);
        if (a.indexOf('/') > -1) {
            let parts = a.split("/");
            let numerator = parts[0];
            let denominator = parts[1];
            a_number = parseInt(numerator)/parseInt(denominator);
        } else {
            a_number = parseFloat(a);
        }
        let b_number = parseFloat(b);
        if (b.indexOf('/') > -1) {
            let parts = b.split("/");
            let numerator = parts[0];
            let denominator = parts[1];
            b_number = parseInt(numerator)/parseInt(denominator);
        } else {
            b_number = parseFloat(b);
        }
        return a_number - b_number;
    });
}