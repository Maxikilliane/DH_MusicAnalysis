function exportToCanvas(classOfContainer) {

    var svgElem = document.querySelector("." + classOfContainer + " svg");
    svgElem.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    var canvas = document.querySelector('.' + classOfContainer ).parentElement.querySelector(' .downloadCanvas');
    console.log(canvas);
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //ctx.canvas.height = svgElem.clientHeight;
    //ctx.canvas.width = svgElem.clientWidth;
    ctx.canvas.height = svgElem.getBBox().height;
    ctx.canvas.width = svgElem.getBBox().width;
    console.log(ctx.canvas.height);
    console.log(ctx.canvas.width);



    var DOMURL = window.URL || window.webkitURL || window;
    console.log(DOMURL);
    var img = new Image();
    img.crossOrigin = "Anonymous";
    console.log(img);
    var blob = undefined;
    //catch is not working, but I leave it here as a clue to help with blob in MSIE, if you need it to start something up
    //IEsupport : As per https://gist.github.com/Prinzhorn/5a9d7db4e4fb9372b2e6#gistcomment-2075344
    //foreignObject is not supported at all in IE as per https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject
    try {
        blob = new Blob([svgElem.outerHTML], {
            type: "image/svg+xml;charset=utf-8"
        });
        console.log(blob);
    }
    catch (e) {
        console.log("error for blob");
        console.log(e);
        if (e.name == "InvalidStateError") {
            var bb = new MSBlobBuilder();
            bb.append(svgElem.outerHTML);
            blob = bb.getBlob("image/svg+xml;charset=utf-8");
        }
        else {
            throw e; //Fallthrough exception, if it wasn't for IE corner-case
            console.log(e);
        }
    }
    var url = DOMURL.createObjectURL(blob);
    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);
    };
    img.src = url;

}