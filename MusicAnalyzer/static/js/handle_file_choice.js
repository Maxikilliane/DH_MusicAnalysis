
$(function () {
     var bar = document.getElementById('js-progressbar');

    UIkit.upload('.js-upload', {

        url: '',
        multiple: true,
        //allow: "*.musicxml",
        method: "POST",
        beforeSend: function(e) {
            e.headers = {'X-CSRFTOKEN': Cookies.get("csrftoken")}
        },

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
        },

        completeAll: function (e) {
            console.log(e);

            data =  JSON.parse(e.response);

            if (data.is_valid) {
                     let results = [];
                     let meta = data.result;
                     results.push(meta);
                     let typeOfSelection = adjustToContextAndFileSource(results, data.context, "upload");
                     addResultsToTable(results, typeOfSelection, "upload");
                 } else {
                     UIkit.notification({
                         message: data.error_message,
                         status: 'warning',
                         pos: 'bottom-center',
                         timeout: 2000
                     });
                 }

            setTimeout(function () {
                bar.setAttribute('hidden', 'hidden');
            }, 1000);
        }

    });

});


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

            if (json.error) {
                console.log(json.error);
            } else {
                console.log("success");
                console.log(json);
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

function addGroup() {
    let form = $("#add_group_form");
    $.ajax({
        url: form.attr("data-add-group-url"),
        data: form.serialize(),
        type: "POST",
        dataType: 'json',
        success: function (json) {
            UIkit.notification({
                message: 'Added new group: ' + String(json.name),
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
                let new_group_option = '<option value="' + pk + '">' + String(json.name) + '</option>\n';
                $("[id$=-group_choice]").append(new_group_option);
                $("#group_options").append(new_group_option);

                let newLabel = '<span class="uk-label">' + String(json.name) + '</span>\n';
                $("#groupLabels").append(newLabel);
            }
        },
        error: function (xhr, errmsg, err) {

            console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
        }
    });
}


function appendClickListeners() {
    let $radios = $("input[name=music_piece]");//document.getElementsByName("music_piece");
    let analyzeButton1 = document.getElementById("analyzeButton1");
    let analyzeButton2 = document.getElementById("analyzeButton2");
    $radios.off().on("click", function () {

        analyzeButton1.disabled = isRadioClicked();
        analyzeButton2.disabled = isRadioClicked();
    });


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
    appendClickListeners();
});

$('html').bind('keypress', function(e) {
   if(e.keyCode === 13)
   {
      addGroup(e);
      return false;
   }
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
    let start = getCurrentNumOfForms();
    for (let i = 0; i < results.length; i++) {
        let formNum = parseInt(start) + i;
        let fileSourceOptions = "";
        if (fileSource === "search_corpus") {
            fileSourceOptions += '<option value="search_corpus" selected="selected">search_corpus</option>\n' +
                '<option value="upload">upload</option>'
        } else if (fileSource === "upload") {
            fileSourceOptions += '<option value="search_corpus">search_corpus</option>\n' +
                '<option value="upload" selected="selected">upload</option>'
        }
        let selection = '<td><input type="' + typeOfSelection + '" ' +
            'name="music_piece" ' +
            //'value="path_' + fileSource + '__' + results[i].path + '__number__' + results[i].number + '" ' +
            'class="uk-' + typeOfSelection + '">' +

            '<div class="invisible">' +
            '<input type="checkbox" name="choose_music_piece-' + formNum + '-is_selected" id="id_choose_music_piece-' + formNum + '-is_selected">' +
            '<textarea name="choose_music_piece-' + formNum + '-path_to_source" cols="40" rows="10" id="id_choose_music_piece-' + formNum + '-path_to_source">' + results[i].path + '</textarea>' +
            '<input type="text" name="choose_music_piece-' + formNum + '-file_source" id="id_choose_music_piece-' + formNum + '-file_source" value="' + fileSource + '">' +
            '<input type="number" name="choose_music_piece-' + formNum + '-number" id="id_choose_music_piece-' + formNum + '-number" value=' + results[i].number + '>' +
            '<input type="checkbox" name="choose_music_piece-' + formNum + '-DELETE" id="id_choose_music_piece-' + formNum + '-DELETE"> </div>' +
            '</td>';

        let group = "";
        console.log("typeOfSelection:");
        console.log(typeOfSelection);
        if (typeOfSelection === "checkbox") {
            console.log("get group");
            let groupOptions = getGroupOptions();
            group += '<td>' +
                '<select class="uk-select" name="choose_music_piece-' + formNum + '-group_choice" id="id_choose_music_piece-' + formNum + '-group_choice">\n' +
                groupOptions +
                '</select>' +
                '</td>\n';
        }
        let composer = "<td>" + results[i].composer + "</td>\n";
        let title = "<td>" + results[i].title + "</td>\n";
        let row = "<tr class=" + fileSource + ">\n" + selection + group + composer + title + "</tr>";

        $("#t_searchResults tbody").append(row);
        appendClickListeners();

    }
    setCurrentNumOfForms(results.length)

}

function getGroupOptions() {
    return $("#group_options").prop("innerHTML");
}

function getCurrentNumOfForms() {
    return $('#id_choose_music_piece-TOTAL_FORMS').val()
}

function setCurrentNumOfForms(numberOfNewForms) {
    let numFormsField = $('#id_choose_music_piece-TOTAL_FORMS');
    let numBefore = parseInt(numFormsField.val());
    let numNow = numBefore + numberOfNewForms;
    numFormsField.val(numNow);
}

function addSelected(event, typeOfSelection) {
    let selectedRows;
    if (typeOfSelection === "checkbox") {
        selectedRows = $("#t_searchResults tbody tr td input[type=checkbox]:checked").parent().parent();
    } else if (typeOfSelection === "radio") {
        selectedRows = $("#t_searchResults tbody tr td input[type=radio]:checked").parent().parent();
    }
    let selectedInForms = selectedRows.find("td div.invisible input[name$=-is_selected]");
    selectedInForms.attr('checked', true);

    selectedInForms.prop('checked', true);
    $('#select_to_analyse_form').submit();
}