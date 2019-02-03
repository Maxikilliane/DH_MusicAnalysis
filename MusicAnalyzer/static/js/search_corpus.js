function search_corpus(){
    //event.preventDefault();
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
                    if (json.context === "individual"){
                        type_of_selection = "radio";
                    } else if (json.context === "distant"){
                        type_of_selection = "checkbox";
                    }
                    for (let i = 0; i < json.results.length; i++){
                        console.log(json.results[i]);
                        let row = "<tr>\n" +
                            '<td><input type="'+type_of_selection+'" name="music_piece" value="'+json.results[i].path+'"></td>' +
                            "<td>"+json.results[i].composer+"</td>\n" +
                            "<td>"+json.results[i].title+"</td>\n" +
                            "</tr>" ;
                        $("table#searchResults tbody").append(row);
                    }

                }
            },
            error:function(xhr,errmsg,err) {
                UIkit.notification.closeAll();
                console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
            }
        });

}
