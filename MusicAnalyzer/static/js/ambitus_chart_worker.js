this.onmessage = function (event) {
    let input = event.data;
    let analysisJson = input.analysisJson;
    let groupNames = input.groupNames;

    let grouped = get_info_by_group(analysisJson, groupNames);

    /*_.mapValues(_.groupBy(analysisJson.per_piece_stats, 'group'),
    clist => clist.map(key => _.omit(key, 'group')));*/
    let notes = ['C-1', 'C1', 'C#1', 'D-1', 'D1', 'D#1', 'E-1', 'E1', 'E#1', 'F-1', 'F1', 'F#1', 'G-1', 'G1', 'G#1', 'A-1', 'A1', 'A#1', 'B-1', 'B1', 'B#1', 'C-2', 'C2', 'C#2', 'D-2', 'D2', 'D#2', 'E-2', 'E2', 'E#2', 'F-2', 'F2', 'F#2', 'G-2', 'G2', 'G#2', 'A-2', 'A2', 'A#2', 'B-2', 'B2', 'B#2', 'C-3', 'C3', 'C#3', 'D-3', 'D3', 'D#3', 'E-3', 'E3', 'E#3', 'F-3', 'F3', 'F#3', 'G-3', 'G3', 'G#3', 'A-3', 'A3', 'A#3', 'B-3', 'B3', 'B#3', 'C-4', 'C4', 'C#4', 'D-4', 'D4', 'D#4', 'E-4', 'E4', 'E#4', 'F-4', 'F4', 'F#4', 'G-4', 'G4', 'G#4', 'A-4', 'A4', 'A#4', 'B-4', 'B4', 'B#4', 'C-5', 'C5', 'C#5', 'D-5', 'D5', 'D#5', 'E-5', 'E5', 'E#5', 'F-5', 'F5', 'F#5', 'G-5', 'G5', 'G#5', 'A-5', 'A5', 'A#5', 'B-5', 'B5', 'B#5', 'C-6', 'C6', 'C#6', 'D-6', 'D6', 'D#6', 'E-6', 'E6', 'E#6', 'F-6', 'F6', 'F#6', 'G-6', 'G6', 'G#6', 'A-6', 'A6', 'A#6', 'B-6', 'B6', 'B#6', 'C-7', 'C7', 'C#7', 'D-7', 'D7', 'D#7', 'E-7', 'E7', 'E#7', 'F-7', 'F7', 'F#7', 'G-7', 'G7', 'G#7', 'A-7', 'A7', 'A#7', 'B-7', 'B7', 'B#7']
    let keys = [[]];

    let titles = Object.keys(grouped);

    for (let group in grouped) {
        let titlesPerGroup = [];
        for (musicPiece in grouped[group]) {
            titlesPerGroup[musicPiece] = grouped[group][musicPiece].title
        }
        keys[group] = titlesPerGroup

    }

    keys.shift();

    let realResult = []; // groups
    for (let group in grouped) {
        let arrOfResultObjs = []; //ambitusses for a piece in a group
        for (let musicPiece in grouped[group]) {
            let lowKey;
            if (grouped[group][musicPiece].lowest_pitch_count !== undefined) {
                lowKey = Object.keys(grouped[group][musicPiece].lowest_pitch_count)
            }
            let highKey;
            if (grouped[group][musicPiece].highest_pitch_count !== undefined) {
                highKey = Object.keys(grouped[group][musicPiece].highest_pitch_count)
            }

            let obj = {};
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
            if (Object.keys(obj).length !== 0) {
                arrOfResultObjs.push(obj)
            }
        }
        realResult.push(arrOfResultObjs);


    }


    let configs = [];
    for (result in realResult) {
        let myConfig = {
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


    let message = {};
    message["configs"] = configs;
    message["realResult"] = realResult;
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