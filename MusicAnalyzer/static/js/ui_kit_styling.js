$( document ).ready(function() {
    addUiKitToInput();
});

function addUiKitToInput(){
$(".question ul li label input[type=checkbox]").addClass("uk-checkbox");
$(".question ul li label input[type=radio]").addClass("uk-radio");
}