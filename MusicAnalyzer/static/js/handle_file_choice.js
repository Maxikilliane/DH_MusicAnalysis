/*
 Code from tutorial on SimpleIsBetterThanComplex,
 see: https://simpleisbetterthancomplex.com/tutorial/2016/11/22/django-multiple-file-upload-using-ajax.html
 */

$(function () {
    UIkit.upload('.js-upload', {

        url: '',
        multiple: true,

        loadStart: function (e) {
            bar.removeAttribute('hidden');
            bar.max = e.total;
            bar.value = e.loaded;
        },

        progress: function (e) {
            bar.max = e.total;
            bar.value = e.loaded;
        },

        loadEnd: function (e) {
            bar.max = e.total;
            bar.value = e.loaded;
            if (e.total && e.loaded) {
                setTimeout(function () {
                    bar.setAttribute('hidden', 'hidden');
                }, 1000);

            }
        },
    });
    /* open file explorer window*/
    $(".upload_files").click(function () {
        $("#fileupload").click();
    });

    /* init file upload component */
    let bar = document.getElementById('js-progressbar');

    $("#fileupload").fileupload({
        dataType: 'json',
        done: function (e, data) {  /* process server response */
            if (data.result.is_valid) {
                let results = [data.result.upload];
                let typeOfSelection = adjustToContextAndFileSource(results, data.result.context, "upload");
                addResultsToTable(results, typeOfSelection, "upload");
            } else {
                UIkit.notification({
                    message: data.result.error_message,
                    status: 'warning',
                    pos: 'bottom-center',
                    timeout: 2000
                });
            }
        }
    });
});

/* tutorial code until here*/


function search_corpus() {

    let form = $("#search_form");
    UIkit.notification({
        message: 'searching...',
        status: 'primary',
        pos: 'bottom-center',
        timeout: 5000000 // basically endless time, gets closed on success or error
    });
    $.ajax({
        url: form.attr("data-search-corpus-url"),
        data: form.serialize(),
        type: "POST",
        dataType: 'json',
        success: function (json) {
            UIkit.notification.closeAll();
            console.log(json);
            if (json.error) {
                console.log(json.error);
            } else {
                console.log("success");
                let typeOfSelection = adjustToContextAndFileSource(json.results, json.context, "search");
                addResultsToTable(json.results, typeOfSelection, "search");
            }
        },
        error: function (xhr, errmsg, err) {
            UIkit.notification.closeAll();
            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });

}

function add_group() {
    console.log("add group");
    let form = $("#add_group_form");
    $.ajax({
        url: form.attr("data-add-group-url"),
        data: form.serialize(),
        type: "POST",
        dataType: 'json',
        success: function (json) {
            UIkit.notification({
                message: 'Added new group:',
                status: 'success',
                pos: 'bottom-center',
                timeout: 5000 // basically endless time, gets closed on success or error
            });
            console.log(json);

            if (json.error) {
                console.log(json.error);
            } else {
                console.log("success");
                let pk = json.id;
                let new_group_element = '<li><div class=".uk-form-controls uk-form-controls-text"><label for="id_choose_group-group_choice_' +
                    pk + '"><input name="choose_group-group_choice" value="' +
                    pk + '" id="id_choose_group-group_choice_' +
                    pk + '" type="radio" class="uk-radio" checked="checked"> ' +
                    String(json.name) + '</label></div></li>';

                $("#id_choose_group-group_choice").append(new_group_element);
            }
        },
        error: function (xhr, errmsg, err) {

            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });
}

function appendClickListeners() {
    let radios = document.getElementsByName("music_piece");
    let analyzeButton1 = document.getElementById("analyzeButton1");
    let analyzeButton2 = document.getElementById("analyzeButton2");
    for (let i = 0, max = radios.length; i < max; i++) {
        radios[i].addEventListener("click", function () {
            console.log(radios[i]);
            analyzeButton1.disabled = isRadioClicked();
            analyzeButton2.disabled = isRadioClicked();
        });
    }


    function isRadioClicked() {
        return $('input[type=radio]:checked').length === 0 && $('input[type=checkbox]:checked').length === 0
    }
}

// show the previously uploaded files in the table
$(document).ready(function () {
    let json = JSON.parse(document.getElementById('already_uploaded').textContent);
    if (json.results.length > 0) {
        let typeOfSelection = adjustToContextAndFileSource(json.results, json.context, "upload");
        addResultsToTable(json.results, typeOfSelection, "upload");
    }
    appendClickListeners()
});


// adjust all the checkboxes to be in the same state (checked/unchecked) as the one in the table header
function toggleSelectAll(source) {
    let name = source.name;

    let checkboxes = document.getElementsByName(name);
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].checked = source.checked;
    }
}

function showNoSearchResultsMessage() {
    UIkit.notification({
        message: 'No results.',
        status: 'warning',
        pos: 'bottom-center',
        timeout: 1000
    });
}

/*
 * params:
 * results: array of results (either from search or from upload)
 * context: distant hearing or individual
 * fileSource: upload or search
 *
 * adjusts the result tds depending on context and fileSource
 * returns typeOfSelection depending on context
 */
function adjustToContextAndFileSource(results, context, fileSource) {
    let noResultsFlag;
    let typeOfSelection;
    if (fileSource === "search") {
        $("#t_searchResults tbody tr.search td input").not(':checked').parent().parent().remove();
        if (results.length <= 0) {
            noResultsFlag = true;
            showNoSearchResultsMessage();
        }
    } else if (fileSource === "upload") {

    }

    if (context === "distant") {
        typeOfSelection = "checkbox";
    } else if (context === "individual") {
        typeOfSelection = "radio";
    }

    if ($('#t_searchResults tbody tr').length === 0 && noResultsFlag) {
        $("#searchResults").addClass("invisible");
        $("#select_all_music_pieces").addClass("invisible");
        $("#deselect_all_music_pieces").addClass("uk-disabled");
    } else {
        $("#searchResults").removeClass("invisible");
        $("#select_all_music_pieces").removeClass("invisible");
        $("#deselect_all_music_pieces").removeClass("uk-disabled");
    }

    return typeOfSelection;
}


// display files in the table where they can be chosen for analysis
function addResultsToTable(results, typeOfSelection, fileSource) {
    for (let i = 0; i < results.length; i++) {
        let row = "<tr class=" + fileSource + ">\n" +
            '<td><input type="' + typeOfSelection + '" ' +
            'name="music_piece" ' +
            'value="path_' + fileSource + '__' + results[i].path + '__number__' + results[i].number + '" ' +
            'class="uk-' + typeOfSelection + '"></td>' +
            "<td>" + results[i].composer + "</td>\n" +
            "<td>" + results[i].title + "</td>\n" +
            "</tr>";
        $("#t_searchResults tbody").append(row);
        appendClickListeners();

    }
}
