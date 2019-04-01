$(document).ready(function () {
    console.log("doc ready");

    triggerUpload();
    //triggerUpload();
});

function start_analysis(event) {
    let form = $("#individual_analysis_form");
    UIkit.notification({
        message: 'processing analysis',
        status: 'primary',
        pos: 'bottom-center',
        timeout: 5000000 // basically endless time, gets closed on success or error
    });
    $.ajax({
        url: form.attr("data-analysis-choice-url"),
        data: form.serialize(),
        type: "POST",
        dataType: 'html',
        success: function (data) {
            //$('#musicPiece').val(data.music_piece);
            //triggerUpload();
            $('.musicPiece').html(data);
            triggerUpload();
            if ($('#ambitus_results').length) {
                displayMusic("ambitusCanvas", "ambitus");
            }

            UIkit.notification.closeAll();
        },
        error: function (xhr, errmsg, err) {
            UIkit.notification.closeAll();
            console.log("error");
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
            UIkit.notification({
                message: 'Your file is too large to be processed by our server. Try a smaller file.',
                status: 'primary',
                pos: 'bottom-center',
                timeout: 10000 // basically endless time, gets closed on success or error
            });
        }
    });

}