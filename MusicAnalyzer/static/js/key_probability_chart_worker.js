this.onmessage = function (event) {
    let input = event.data;
    let analysisJson = input.analysisJson;
    let groupNames = input.groupNames;
    let grouped = get_info_by_group(analysisJson, groupNames);

    let keyInformationObjectResult = [];
    let musicPiecesResult = [];
    for (let group in grouped) {
        let keyInformationObject = [];
        let musicPieces = [];
        let firstGroup = grouped[group];
        for (let musicPiece in firstGroup) {
            if (firstGroup[musicPiece].key_information !== undefined) {
                keyInformationObject.push(firstGroup[musicPiece].key_information)
            }
            if (firstGroup[musicPiece].title !== undefined) {
                musicPieces.push(firstGroup[musicPiece].title)
            }
        }

        keyInformationObjectResult[group] = keyInformationObject;

        musicPiecesResult[group] = musicPieces
    }

    let resultKeys = [];
    let resultValues = [];

    for (let group in keyInformationObjectResult) {
        let values = [];
        let keys = [];
        let keyGroup = keyInformationObjectResult[group];

        for (let y = 0; y < keyGroup.length; y++) {
            let probabilitiesPerPiece = [];
            let keysPerPiece = [];
            if (keyGroup[y] !== undefined) {
                for (let i = 0; i < keyGroup[y].length; i++) {
                    probabilitiesPerPiece.push(keyGroup[y][i].probability);
                    keysPerPiece.push(keyGroup[y][i].key_name)
                }
            }
            values[y] = probabilitiesPerPiece;
            keys[y] = keysPerPiece
        }
        resultKeys[group] = keys;
        resultValues[group] = values;
    }

    for (let group in resultValues) {
        let value = resultValues[group];
        let key = resultKeys[group];
        for (let i = 0; i < value.length; i++) {
            let object = value[i];
            let keyObject = key[i];
            for (let y = 0; y < object.length; y++) {
                object[y] = {meta: keyObject[y], value: object[y]};
            }
        }
    }

    let labels = [1, 2, 3, 4];

    let message = {};
    message["resultValues"] = resultValues;
    message["musicPiecesResult"] = musicPiecesResult;
    message["labels"] = labels;
    console.log("prob message");
    console.log(message);
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
