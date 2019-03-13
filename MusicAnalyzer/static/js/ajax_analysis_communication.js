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
            $('.musicPiece').html(data);
            triggerUpload();
            UIkit.notification.closeAll();
        //"{% url 'update_items' %}?item_num=" + item_num

            //replaceWith("<div>hallo welt</div>");

            /*
            if (json.error) {
                console.log(json.error);
            } else {
                console.log("success");
                let typeOfSelection = adjustToContextAndFileSource(json.results, json.context, "search");
                addResultsToTable(json.results, typeOfSelection, "search");
            }*/
        },
        error: function (xhr, errmsg, err) {
            UIkit.notification.closeAll();
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });

}