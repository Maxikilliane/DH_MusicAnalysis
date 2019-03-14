window.onload = function () {
    triggerUpload()
}

function triggerUpload() {
    let initialZoom = 0.6
    let openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmdCanvas", {autoResize: true});
    let canvas = document.getElementById("osmdCanvas")
    let localFile = document.getElementById("musicPiece").value;
    let zoomIn = document.getElementById("zoom-in-btn");
    let zoomOut = document.getElementById("zoom-out-btn");

    openSheetMusicDisplay.load(localFile)
    openSheetMusicDisplay.zoom = initialZoom;
    openSheetMusicDisplay.render()

    // Create zoom controls
    zoomIn.onclick = function () {
        console.log("click")
        initialZoom *= 1.2;
        scale();
    };
    zoomOut.onclick = function () {
        initialZoom /= 1.2;
        scale();
    };

    function scale() {
        disable();
        window.setTimeout(function () {
            openSheetMusicDisplay.zoom = initialZoom;
            openSheetMusicDisplay.render();
            enable();
        }, 0);
    }


    function disable() {
        document.body.style.opacity = "0.3";
        canvas.disabled = zoomIn.disabled = zoomOut.disabled = "disabled";
    }

    function enable() {
        document.body.style.opacity = "1";
        canvas.disabled = zoomIn.disabled = zoomOut.disabled = "";
    }

}



