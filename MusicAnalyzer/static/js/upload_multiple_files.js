/*
 Code from tutorial on SimpleIsBetterThanComplex,
 see: https://simpleisbetterthancomplex.com/tutorial/2016/11/22/django-multiple-file-upload-using-ajax.html

 TODO: discuss whether progress bar is necessary
 */
$(function () {
  /* open file explorer window*/
  $(".upload_files").click(function () {
    $("#fileupload").click();
  });

  /* init file upload component */
  $("#fileupload").fileupload({
    dataType: 'json',
    done: function (e, data) {  /* process server response */
      if (data.result.is_valid) {
        $("#gallery tbody").prepend(
          "<tr><td>"+ data.result.name +"</td></tr>"
        )
      }
    }
  });

});