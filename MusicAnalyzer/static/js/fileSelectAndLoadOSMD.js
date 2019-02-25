window.onload = function() {
   triggerUpload()
}

function triggerUpload() {
    let localFile = document.getElementById("musicPiece").value;
    let openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmdCanvas");
    openSheetMusicDisplay.load(localFile)
    openSheetMusicDisplay.render()


}

