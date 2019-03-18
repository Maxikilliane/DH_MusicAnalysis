$( document ).ready(function() {
    addUiKitToInput();
});

function addUiKitToInput(){
$(".question ul li label input[type=checkbox]").addClass("uk-checkbox");
$(".question ul li label input[type=radio]").addClass("uk-radio");
$(".question ul li").addClass("analysisFormListItem");
$(".question ul").addClass("analysisFormList");
$(".question ul li label input[type=radio]").addClass("uk-radio");
}

function displayUiKitMessage(message, status ){
    UIkit.notification({
        message: message,
        status: status,
        pos: 'bottom-center',
        timeout: 5000 // basically endless time, gets closed on success or error
    });

}