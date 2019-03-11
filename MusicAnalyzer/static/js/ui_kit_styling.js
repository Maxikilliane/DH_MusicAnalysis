$( document ).ready(function() {
    addUiKitToInput();
});

function addUiKitToInput(){
$(".question ul li label input[type=checkbox]").addClass("uk-checkbox");
$(".question ul li").addClass("analysisFormListItem");
$(".question ul").addClass("analysisFormList");

}