this.onmessage = function (event) {
    let input = event.data;
    let analysisJson = input.analysisJson;
    let groupNames = []
    let resultArray = [];
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

    let message = {};
    message["myConfig"] = myConfig;
    this.postMessage(message);
    this.close();
};

function get_info_by_group(analysisJson, groupNames) {
    let list_per_piece = analysisJson.per_piece_stats;
    let grouped = {};
    for (let i = 0; i < groupNames.length; ++i) {
        let name = groupNames[i];
        grouped[name] = [];
    }

    for (let i = 0; i < list_per_piece.length; ++i) {
        let musicPiece = list_per_piece[i];
        let group = musicPiece.group;
        delete musicPiece["group"];
        grouped[group].push(musicPiece);
    }
    return grouped;

}


// we need Q1 and Q3 for the boxplots
function getPercentile(data, percentile) {
    let index = (percentile / 100) * data.length;
    let result;
    if (Math.floor(index) == index) {
        result = (data[(index - 1)] + data[index]) / 2;
    } else {
        result = data[Math.floor(index)];
    }
    return result;
}
