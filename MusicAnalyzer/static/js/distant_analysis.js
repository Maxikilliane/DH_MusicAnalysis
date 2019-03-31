let sortTypeEnum = {"root": 1, "rootAndOctave": 2, "number": 3};
Object.freeze(sortTypeEnum);

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
    let groupNames = getGroupNames(analysisJson);
    createChordQualityCountChart(analysisJson, groupNames);
    createChordRootCountChart(analysisJson, groupNames);
    createChordNameCountChart(analysisJson, groupNames);
    drawBoxplots(analysisJson, groupNames);
    drawAmbitusRangeChart(analysisJson, groupNames);
    createPitchNameCountChart(analysisJson, groupNames);
    createPitchOctaveCountChart(analysisJson, groupNames);
    createPitchNameWithOctaveCountChart(analysisJson, groupNames);
    createKeyNameCountChart(analysisJson, groupNames);
    createKeyModeCountChart(analysisJson, groupNames);
    createKeyProbabilityLineChart(analysisJson, groupNames);
    createDurationFullNameNotesCountChart(analysisJson, groupNames);
    createDurationFullNameRestsCountChart(analysisJson, groupNames);
    createDurationLengthInQuartersNotesCountChart(analysisJson, groupNames);
    createDurationLengthInQuartersNotesRestsCountChart(analysisJson, groupNames);
    createDurationLengthInQuartersRestsCountChart(analysisJson, groupNames);
    createDurationSoundSilenceRatioChart(analysisJson, groupNames);
}


function createDurationSoundSilenceRatioChart(analysisJson, groupNames) {
    let statsAccessor = "duration_total_notes_vs_rests_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-sound_silence_ratio', groupNames);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10,
    };
    worker.postMessage(message);

}

function startWorker(worker, workerSourcePath,
                     chartSelector, groupNames,
                     isLabelToDiv, labelToDiv,
) {
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            worker = new Worker(workerSourcePath);
        }
        worker.onmessage = function (e) {
            let data = e.data.data;
            let uniqueKeys = e.data.uniqueKeys;
            let options = e.data.options;


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
            let plugins = [];
            if (isLabelToDiv) {

                let someDiv = document.getElementById(labelToDiv);

                plugins = [
                    Chartist.plugins.legend({
                        position: someDiv, legendNames: groupNames
                    }),
                    Chartist.plugins.tooltip({appendToBody: true})
                ];
            } else {
                plugins = [
                    Chartist.plugins.legend({
                        legendNames: groupNames,
                    }),
                    Chartist.plugins.tooltip({class: 'uk-text-center', appendToBody: true})
                ];

            }
            new Chartist.Bar(chartSelector, {
                labels: uniqueKeys,
                series: data,
                options,
                responsiveOptions
            }, {
                plugins: plugins
            });
        };
        return worker;
    } else {
        console.log("Sorry! No Web Worker support.");
    }
}

function createDurationLengthInQuartersRestsCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_length_in_quarters_rests_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-duration-length-rests-count', groupNames);

    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);
}

function createDurationLengthInQuartersNotesRestsCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_length_in_quarters_notes_rests_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js',
        '.ct-chart-duration-length-notes-rests-count', groupNames);


    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);
}

function createDurationLengthInQuartersNotesCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_length_in_quarters_notes_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-duration-length-notes-count', groupNames);

    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10,
    };
    worker.postMessage(message);
}

function createDurationFullNameRestsCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_fullname_rests_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-duration-fullname-rests-count', groupNames);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);
}

function createDurationFullNameNotesCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_fullname_notes_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-duration-fullname-notes-count', groupNames);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);

}

function createKeyNameCountChart(analysisJson, groupNames) {
    let statsAccessor = "key_name_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-key-name', groupNames);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);
}

function createKeyModeCountChart(analysisJson, groupNames) {
    let statsAccessor = "key_mode_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-key-mode', groupNames);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);
}

function createKeyProbabilityLineChart(analysisJson, groupNames) {
    //need: resultValues, musicPiecesResult, labels
    let worker;
    let workerSourcePath = 'http://127.0.0.1:8000/static/js/key_probability_chart_worker.js';
    /*let grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(key => _.omit(key, 'group')));*/
    if (typeof(Worker) !== "undefined") {
        if (typeof(worker) == "undefined") {
            worker = new Worker(workerSourcePath);
        }
        worker.onmessage = function (e) {
            console.log("key prob message");
            let resultValues = e.data.resultValues;
            let musicPiecesResult = e.data.musicPiecesResult;
            let labels = e.data.labels;

            for (let group in resultValues) {
                if (group !== 'unique') {
                    let newDiv = document.createElement('div');
                    let newHeading = document.createElement('h4');
                    newHeading.className = 'uk-text-center';
                    newHeading.innerHTML = group;
                    newDiv.className = 'ct-chart-key-probability-' + group;
                    document.getElementById('probabilityCharts').appendChild(newHeading);
                    document.getElementById('probabilityCharts').appendChild(newDiv);


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
        };
    } else {
        console.log("Sorry! No Web Worker support.");//TODO replace with UI-Kit message
    }

    let message = {
        analysisJson: analysisJson,
        groupNames: groupNames
    };
    worker.postMessage(message);

}

function createChordNameCountChart(analysisJson, groupNames) {
    let statsAccessor = "chord_name_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-name', groupNames, true, "tooltip-div1");
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: true,
        isSortable: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);

}

function createChordRootCountChart(analysisJson, groupNames) {
    let statsAccessor = "chord_root_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-root', groupNames, false);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: true,
        isSortable: true,
        sortType: sortTypeEnum.root,
        seriesBarDistance: 10
    };
    worker.postMessage(message);

}

function createPitchNameCountChart(analysisJson, groupNames) {
    let statsAccessor = "pitch_name_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-pitch-name', groupNames, false);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: true,
        sortType: sortTypeEnum.root,
        seriesBarDistance: 10
    };
    worker.postMessage(message);

}

function createPitchOctaveCountChart(analysisJson, groupNames) {
    let statsAccessor = "pitch_octave_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-pitch-octave', groupNames, false);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);
}

function sortRootCount(arr) {
    let sortingArray = ['C-', 'C', 'C#', 'D-', 'D', 'D#', 'E-', 'E', 'E#', 'F-', 'F', 'F#', 'G-', 'G', 'G#', 'A-', 'A', 'A#', 'B-', 'B', 'B#'];
    return sortingArray.map(key => arr.find(item => item === key))
        .filter(item => item)

}


function createChordQualityCountChart(analysisJson, groupNames) {
    let statsAccessor = "chord_quality_count";
    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-quality', groupNames, false);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);

}

function createPitchNameWithOctaveCountChart(analysisJson, groupNames) {
    let statsAccessor = "pitch_name_with_octave_count";

    let worker;
    worker = startWorker(worker, 'http://127.0.0.1:8000/static/js/chart_worker.js', '.ct-chart-pitch-octave-name', groupNames, true, 'tooltip-div2');
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: true,
        sortType: sortTypeEnum.rootAndOctave,
        seriesBarDistance: 100
    };
    worker.postMessage(message);
}

function getGroupNames(analysisJson) {
    let group_names = [];
    let group_stats = analysisJson.per_group_stats;
    for (let i = 0; i < group_stats.length; ++i) {
        group_names.push(group_stats[i].group_name)
    }
    return group_names
}


function drawBoxplots(analysisJson, groupNames) {
    let worker;
    let workerSourcePath = 'http://127.0.0.1:8000/static/js/boxplot_worker.js';
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            worker = new Worker(workerSourcePath);
        }
        worker.onmessage = function (e) {
            let myConfig = e.data.myConfig;
            zingchart.render({
                id: 'boxplots',
                data: myConfig,
                height: "100%",
                width: "100%"
            });

        };
    } else {
        console.log("Sorry! No Web Worker support.");
    }
    let message = {
        analysisJson: analysisJson,
        groupNames: groupNames
    };
    worker.postMessage(message);

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