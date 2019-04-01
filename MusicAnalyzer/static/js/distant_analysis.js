let sortTypeEnum = {"root": 1, "rootAndOctave": 2, "number": 3, "duration":4, "roman":5};
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
             UIkit.notification({
                message: 'Your files are too large to be processed by our server. Try doing the analysis with fewer and/or smaller files.',
                status: 'primary',
                pos: 'bottom-center',
                timeout: 10000 // basically endless time, gets closed on success or error
            });
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
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-sound_silence_ratio', groupNames);
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


function createDurationLengthInQuartersRestsCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_length_in_quarters_rests_count";
    let worker;
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-duration-length-rests-count', groupNames);

    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: true,
        sortType: sortTypeEnum.number,
        seriesBarDistance: 10
    };
    worker.postMessage(message);
}

function createDurationLengthInQuartersNotesRestsCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_length_in_quarters_notes_rests_count";
    let worker;
    worker = startWorker(worker, path_to_chart_worker,
        '.ct-chart-duration-length-notes-rests-count', groupNames);


    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: true,
        sortType: sortTypeEnum.number,
        seriesBarDistance: 10
    };
    worker.postMessage(message);
}

function createDurationLengthInQuartersNotesCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_length_in_quarters_notes_count";
    let worker;
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-duration-length-notes-count', groupNames);

    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: true,
        sortType: sortTypeEnum.number,
        seriesBarDistance: 10,
    };
    worker.postMessage(message);
}

function createDurationFullNameRestsCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_fullname_rests_count";
    let worker;
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-duration-fullname-rests-count', groupNames);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: true,
        sortType: sortTypeEnum.duration,
        isForNotes: false,
        seriesBarDistance: 10
    };
    worker.postMessage(message);
}

function createDurationFullNameNotesCountChart(analysisJson, groupNames) {
    let statsAccessor = "duration_fullname_notes_count";
    let worker;
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-duration-fullname-notes-count', groupNames);
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false,
        isSortable: true,
        sortType: sortTypeEnum.duration,
        isForNotes: true,
        seriesBarDistance: 10
    };
    worker.postMessage(message);

}

function createKeyNameCountChart(analysisJson, groupNames) {
    let statsAccessor = "key_name_count";
    let worker;
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-key-name', groupNames);
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
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-key-mode', groupNames);
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
    let workerSourcePath = path_to_key_probability_worker;
    /*let grouped = _.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
        clist => clist.map(key => _.omit(key, 'group')));*/
    if (typeof(Worker) !== "undefined") {
        if (typeof(worker) == "undefined") {
            worker = new Worker(workerSourcePath);
        }
        worker.onmessage = function (e) {
            let resultValues = e.data.resultValues;
            let musicPiecesResult = e.data.musicPiecesResult;
            let labels = e.data.labels;

            for (let group in resultValues) {
                let group_without_whitespace = replace_whitespace_in_string(group, "-");
                if (group !== 'unique') {
                    let newDiv = document.createElement('div');
                    let newHeading = document.createElement('h4');
                    newHeading.className = 'uk-text-center';
                    newHeading.innerHTML = group;
                    newDiv.className = 'ct-chart-key-probability-' + group_without_whitespace;
                    document.getElementById('probabilityCharts').appendChild(newHeading);
                    document.getElementById('probabilityCharts').appendChild(newDiv);


                    new Chartist.Line('.ct-chart-key-probability-' + group_without_whitespace, {
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
        displayNoWebworkerSupportMessage();
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
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-name', groupNames, true, "tooltip-div1");
    let message = {
        analysisJson: analysisJson,
        statsAccessor: statsAccessor,
        groupNames: groupNames,
        isDeletedWhenLessThanThree: false
        ,
        isSortable: true,
        sortType: sortTypeEnum.roman,
        seriesBarDistance: 10
    };
    worker.postMessage(message);

}

function createChordRootCountChart(analysisJson, groupNames) {
    let statsAccessor = "chord_root_count";
    let worker;
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-root', groupNames, false);
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
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-pitch-name', groupNames, false);
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
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-pitch-octave', groupNames, false);
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
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-quality', groupNames, false);
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
    worker = startWorker(worker, path_to_chart_worker, '.ct-chart-pitch-octave-name', groupNames, true, 'tooltip-div2');
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
    let workerSourcePath = path_to_boxplot_worker;
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
        displayNoWebworkerSupportMessage();
    }
    let message = {
        analysisJson: analysisJson,
        groupNames: groupNames
    };
    worker.postMessage(message);

}


function drawAmbitusRangeChart(analysisJson, groupNames) {
    let worker;
    let workerSourcePath = path_to_ambitus_chart_worker;
    if (typeof(Worker) !== "undefined") {
        if (typeof(w) == "undefined") {
            worker = new Worker(workerSourcePath);
        }
        worker.onmessage = function (e) {
            let realResult = e.data.realResult;
            let configs = e.data.configs;

            // create divs for diagrams
            let counter = 0;
            for (result in realResult) {
                let newDiv = document.createElement('div');

                newDiv.id = 'ct-chart-ambitus-range-' + result;
                document.getElementById('rangeCharts').appendChild(newDiv);


            }

            //configs.splice(-1, 1);


            for (config in configs) {
                if (config !== "unique") {
                    zingchart.render({
                        id: 'ct-chart-ambitus-range-' + config,
                        data: configs[config]
                    });
                }
            }


        };
    } else {
        displayNoWebworkerSupportMessage();
    }

    let message = {
        analysisJson: analysisJson,
        groupNames: groupNames
    };
    worker.postMessage(message);
}

function replace_whitespace_in_string(str, replaceWith){
    return str.replace(/\s/g, replaceWith);
}

function displayNoWebworkerSupportMessage(){
    UIkit.notification({
        message: 'Your browser does not support a feature which is necessary for this application. Please use a newer browser, like Chroome 4.0 or Firefox 3.5.',
        status: 'primary',
        pos: 'bottom-center',
        timeout: 5000
    });
}


function startWorker(worker, workerSourcePath,
                     chartSelector, groupNames,
                     isLabelToDiv, labelToDiv
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
        displayNoWebworkerSupportMessage();
    }
}