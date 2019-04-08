this.onmessage = function (e) {
    let sortTypeEnum = {"root": 1, "rootAndOctave": 2, "number": 3, "duration": 4, "roman": 5};
    if (Object.freeze) {
        Object.freeze(sortTypeEnum);
    }
    let input = e.data;
    let newGroup = getRelevantSummaryStatsForChart(input.analysisJson, input.statsAccessor, input.isDeletedWhenLessThanThree);
    // is dict of only the summary stats currently relevant for the chart as dict
    let uniqueKeys = getUniqueKeys(input.analysisJson, input.statsAccessor);
    // is list of keys relevant to the summary stats (like the individual chords names etc)
    let xAxisTitle = input.xAxisTitle;
    let yAxisTitle = input.yAxisTitle;

    if (input.isSortable) {

        if (input.sortType === sortTypeEnum.root) {
            uniqueKeys = sortRootCount(uniqueKeys);
        } else if (input.sortType === sortTypeEnum.rootAndOctave) {
            uniqueKeys = sortRootAndOctave(uniqueKeys);
        } else if (input.sortType === sortTypeEnum.number) {
            uniqueKeys = sortNumber(uniqueKeys);
        } else if (input.sortType === sortTypeEnum.duration) {
            uniqueKeys = sortByDurationName(uniqueKeys, input.analysisJson, input.isForNotes);
        } else if (input.sortType === sortTypeEnum.roman) {
            uniqueKeys = sortByRoman(uniqueKeys)
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
        seriesBarDistance: input.seriesBarDistance,
        axisY: {
            onlyInteger: true
        }

    };

    let message = {};
    message["data"] = data;
    message["uniqueKeys"] = uniqueKeys;
    message["options"] = options;
    message["yAxisTitle"] = yAxisTitle;
    message["xAxisTitle"] = xAxisTitle;
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
    let sortingArray = ['C-0', 'C0', 'C#0', 'D-0', 'D0', 'D#0', 'E-0', 'E0', 'E#0', 'F-0', 'F0', 'F#0', 'G-0', 'G0', 'G#0', 'A-0', 'A0', 'A#0', 'B-0', 'B0', 'B#0', 'C-1', 'C1', 'C#1', 'D-1', 'D1', 'D#1', 'E-1', 'E1', 'E#1', 'F-1', 'F1', 'F#1', 'G-1', 'G1', 'G#1', 'A-1', 'A1', 'A#1', 'B-1', 'B1', 'B#1', 'C-2', 'C2', 'C#2', 'D-2', 'D2', 'D#2', 'E-2', 'E2', 'E#2', 'F-2', 'F2', 'F#2', 'G-2', 'G2', 'G#2', 'A-2', 'A2', 'A#2', 'B-2', 'B2', 'B#2', 'C-3', 'C3', 'C#3', 'D-3', 'D3', 'D#3', 'E-3', 'E3', 'E#3', 'F-3', 'F3', 'F#3', 'G-3', 'G3', 'G#3', 'A-3', 'A3', 'A#3', 'B-3', 'B3', 'B#3', 'C-4', 'C4', 'C#4', 'D-4', 'D4', 'D#4', 'E-4', 'E4', 'E#4', 'F-4', 'F4', 'F#4', 'G-4', 'G4', 'G#4', 'A-4', 'A4', 'A#4', 'B-4', 'B4', 'B#4', 'C-5', 'C5', 'C#5', 'D-5', 'D5', 'D#5', 'E-5', 'E5', 'E#5', 'F-5', 'F5', 'F#5', 'G-5', 'G5', 'G#5', 'A-5', 'A5', 'A#5', 'B-5', 'B5', 'B#5', 'C-6', 'C6', 'C#6', 'D-6', 'D6', 'D#6', 'E-6', 'E6', 'E#6', 'F-6', 'F6', 'F#6', 'G-6', 'G6', 'G#6', 'A-6', 'A6', 'A#6', 'B-6', 'B6', 'B#6', 'C-7', 'C7', 'C#7', 'D-7', 'D7', 'D#7', 'E-7', 'E7', 'E#7', 'F-7', 'F7', 'F#7', 'G-7', 'G7', 'G#7', 'A-7', 'A7', 'A#7', 'B-7', 'B7', 'B#7', 'C-8', 'C8', 'C#8', 'D-8', 'D8', 'D#8', 'E-8', 'E8', 'E#8', 'F-8', 'F8', 'F#8', 'G-8', 'G8', 'G#8', 'A-8', 'A8', 'A#8', 'B-8', 'B8', 'B#8', 'C-9', 'C9', 'C#9', 'D-9', 'D9', 'D#9', 'E-9', 'E9', 'E#9', 'F-9', 'F9', 'F#9', 'G-9', 'G9', 'G#9', 'A-9', 'A9', 'A#9', 'B-9', 'B9', 'B#9', 'C-10', 'C10', 'C#10', 'D-10', 'D10', 'D#10', 'E-10', 'E10', 'E#10', 'F-10', 'F10', 'F#10', 'G-10', 'G10', 'G#10', 'A-10', 'A10', 'A#10', 'B-10', 'B10', 'B#10'];
    return sortingArray.map(key => arr.find(item => item === key))
        .filter(item => item);
}


function sortNumber(arr) {
    return arr.sort(function (a, b) {
        return compareByNumber(a, b);
    });
}

function compareByNumber(a, b) {
    let a_number = parseFloat(a);
    if (a.indexOf('/') > -1) {
        let parts = a.split("/");
        let numerator = parts[0];
        let denominator = parts[1];
        a_number = parseInt(numerator) / parseInt(denominator);
    } else {
        a_number = parseFloat(a);
    }
    let b_number = parseFloat(b);
    if (b.indexOf('/') > -1) {
        let parts = b.split("/");
        let numerator = parts[0];
        let denominator = parts[1];
        b_number = parseInt(numerator) / parseInt(denominator);
    } else {
        b_number = parseFloat(b);
    }
    return a_number - b_number;
}

function sortByDurationName(arr, analysisJson, isForNotes) {
    let sort_dict = {};
    if (isForNotes) {
        sort_dict = analysisJson.total_sum_stats.duration_name_value_dict_not;
    } else {
        sort_dict = analysisJson.total_sum_stats.duration_name_value_dict_res;
    }
    return arr.sort(function (a, b) {
        return compareByNumber(sort_dict[a], sort_dict[b])
    });
}

function sortByRoman(arr) {
    let sortingArray = ["-I", "I", "#I", "-II", "II", "#II", "-III", "III", "#III", "-IV", "IV", "#IV", "-V", "V", "#V", "-VI", "VI", "#VI", "-VII", "VII", "#VII", "-i", "i", "#i", "-ii", "ii", "#ii", "-iii", "iii", "#iii", "-iv", "iv", "#iv", "-v", "v", "#v", "-vi", "vi", "#vi", "-vii", "vii", "#vii"];
    for (let i = 0; i < arr.length; ++i) {
        if (sortingArray.indexOf(arr[i]) === -1) {
            sortingArray.push(arr[i]);
        }
    }
    return sortingArray.map(key => arr.find(item => item === key))
        .filter(item => item);
}
