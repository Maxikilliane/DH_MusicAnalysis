function search_corpus(){

        let form = $("#search_form");
        UIkit.notification({
            message: 'searching...',
            status: 'primary',
            pos: 'bottom-center',
            timeout: 5000000 // basically endless time, gets closed on success or error
        });
        console.log(form);
        console.log(form.serialize());
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
                }else{
                    console.log("success");
                    let type_of_selection;
                    if (json.results.length > 0){
                        if(json.context === "distant"){
                            type_of_selection = "checkbox";
                            $("#select_all_music_pieces").removeClass("invisible");
                        }else if (json.context ==="individual"){
                            type_of_selection = "radio";
                            $("#deselect_all_music_pieces").removeClass("uk-disabled");
                        }
                        $("#searchResults").removeClass("invisible");
                    }else{
                        if (json.context === "distant"){
                            type_of_selection = "checkbox";
                            $("#select_all_music_pieces").addClass("invisible");
                        }else if (json.context ==="individual"){
                            type_of_selection = "radio";
                            $("#deselect_all_music_pieces").addClass("uk-disabled");
                        }
                        $("#searchResults").addClass("invisible");
                        showNoSearchResultsMessage();
                    }

                    $("#t_searchResults tbody tr").remove(); // delete all previous results
                    for (let i = 0; i < json.results.length; i++){
                        let row = "<tr>\n" +
                            '<td><input type="'+type_of_selection+'" name="music_piece" value="'+json.results[i].path+'"></td>' +
                            "<td>"+json.results[i].composer+"</td>\n" +
                            "<td>"+json.results[i].title+"</td>\n" +
                            "</tr>" ;
                        $("#t_searchResults tbody").append(row);
                    }

                }
            },
            error:function(xhr,errmsg,err) {
                UIkit.notification.closeAll();
                console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
            }
        });

}


function toggleSelectAll(source){
    let name = source.name;
    let checkboxes = document.getElementsByName(name);
    for(let i=0; i< checkboxes.length; i++){
        checkboxes[i].checked = source.checked;
    }
}

function showNoSearchResultsMessage(){
    UIkit.notification({
            message: 'No results.',
            status: 'warning',
            pos: 'bottom-center',
            timeout: 1000
    });
}
