function search_corpus(){
    //event.preventDefault();
        let form = $("#search_form");
        console.log(form);
        console.log(form.serialize());
        $.ajax({
            url: form.attr("data-search-corpus-url"),
            data: form.serialize(),
            type: "POST",
            dataType: 'json',
            success: function (json) {
                console.log(json);
                if (json.error) {
                    console.log(json.error);
                }else{
                    console.log("success");
                    for (let i = 0; i < json.results.length; i++){
                        console.log(json.results[i]);
                        let row = "<tr>\n" +
                            "<th>"+json.results[i].composer+"</th>\n" +
                            "<th>"+json.results[i].title+"</th>\n" +
                            "</tr>" ;
                        $("table#searchResults tbody").append(row);
                    }

                }
            },
            error:function(xhr,errmsg,err) {
                console.log(xhr.status + ": " + xhr.responseText); // provide a bit more info about the error to the console
            }
        });

}
