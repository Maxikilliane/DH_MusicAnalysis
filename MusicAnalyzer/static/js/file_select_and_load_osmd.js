

function displayMusic(containerId, fileId) {
    let initialZoom = 0.6;
    let container = document.getElementById(containerId);
    let openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
            drawCredits: false,
            drawTitle: false,
            drawPartNames: false,
            drawLyricist: false,
            drawComposer: false,
            drawSubtitle: false,
            drawComments: false
        }
    );
    let localFile = document.getElementById(fileId).value;

    openSheetMusicDisplay.load(localFile);
    openSheetMusicDisplay.zoom = initialZoom;
    openSheetMusicDisplay.render();
}


function triggerUpload() {
    console.log("uploading file");
    let initialZoom = 0.6;
    let canvas = document.getElementById("osmdCanvas");
    let localFile = document.getElementById("musicPiece").value;
    let openSheetMusicDisplay = new opensheetmusicdisplay.OpenSheetMusicDisplay("osmdCanvas", {autoResize: true});
    let zoomIn = document.getElementById("zoom-in-btn");
    let zoomOut = document.getElementById("zoom-out-btn");
    let chordCheckbox = document.getElementById("id_analysis_choice-individual_analysis_0");
    let chordTypeSelectionElement = document.getElementById("chordDependent");
    let keyCheckbox = document.getElementById("id_analysis_choice-individual_analysis_2");
    let ambitusCheckbox = document.getElementById("id_analysis_choice-individual_analysis_1");
    let keyProbabilityElement = document.getElementById("keyDependent");
    let keyHeading = document.getElementById("keyHeading");
    let keyRadios = document.getElementById("id_key-key_choice").getElementsByTagName("input");

    openSheetMusicDisplay.load(localFile);
    openSheetMusicDisplay.zoom = initialZoom;
    openSheetMusicDisplay.render();

    // Create zoom controls
    zoomIn.onclick = function () {
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

    chordCheckbox.addEventListener('click', function () {
        if (this.checked) {
            chordTypeSelectionElement.style.display = "inherit";
            keyHeading.innerText = "Choose which key you want to use for the chord analysis:"
            for (let i = 0, max = keyRadios.length; i < max; i++) {
                keyRadios[i].style.display = "inline-block";
            }
        } else {
            chordTypeSelectionElement.style.display = "none";
            keyHeading.innerText = "Possible keys with their probability:"
            for (let i = 0, max = keyRadios.length; i < max; i++) {
                keyRadios[i].style.display = "None";
            }
        }
    });
    keyCheckbox.addEventListener('click', function () {
        if (this.checked) {
            keyProbabilityElement.style.display = "inherit";

        } else {
            keyProbabilityElement.style.display = "none";
        }
    });


    let checkboxes = document.getElementsByClassName("analysisFormListItem");


    let analyzeButton = document.getElementById("individual_analysis_button");

    for (let i = 0, max = checkboxes.length; i < max; i++) {

        checkboxes[i].addEventListener("click", function () {

            analyzeButton.disabled = !isBoxClicked()
        });
    }

    function isBoxClicked() {
        return ambitusCheckbox.checked === true || chordCheckbox.checked === true
    }


}

