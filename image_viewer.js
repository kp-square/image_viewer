var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    image = new Image(),
    loc = {},
    dragging,
    zooming,
    dragOffsetX,
    dragOffsetY,
    clipCenterX,
    clipCenterY,
    clipX,
    clipY,
    draggerPoint,
    canvasTop = 0,
    canvasLeft = 0,
    canvasCenterX,
    canvasCenterY,
    canvasWidth,
    canvasHeight,
    viewWidth,
    viewHeight,
    viewLeft,
    viewTop,
    maxWidth,
    maxHeight,
    imgWidth,
    imgHeight;

function windowToCanvas(x, y) {
    bbox = canvas.getBoundingClientRect();
    x = x - bbox.left;
    y = y - bbox.top;
    return { x: x, y: y };
}


function customImageDrawer(context, image, clipCenter, clipWidth, clipHeight) {
    value1 = clipCenter.x - clipWidth / 2 > viewLeft?clipCenter.x - clipWidth / 2:viewLeft;
    value2 = clipCenter.y - clipHeight / 2>viewTop?clipCenter.y - clipHeight /2:viewTop;
    value3 = clipWidth < maxWidth?clipWidth:maxWidth;
    value4 = clipHeight < maxHeight?clipHeight:maxHeight;

    
    context.drawImage(image, value1, value2,
        clipWidth, clipHeight,
        canvasLeft, canvasTop,
        canvasWidth, canvasHeight);
}



class Dragger {
    constructor(x, y, draggerX1, draggerX2) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.draggerX1 = draggerX1;
        this.draggerX2 = draggerX2;
    }

    createPath(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
        context.closePath();
    }

    draw(context) {
        let base1 = new DraggerBase(this.draggerX1, context.canvas.height - 50, this.x, this.y);
        base1.draw(context, 'lightblue');
        let base2 = new DraggerBase(this.x, this.y, this.draggerX2, context.canvas.height - 50);
        base2.draw(context, 'gray');
        this.createPath(context);
        context.strokeStyle = 'blue';
        context.fillStyle = 'lightblue';
        context.stroke();
        context.fill();

    }
};

class DraggerBase {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    draw(context, color) {
        context.beginPath();
        context.moveTo(this.x1, this.y1);
        context.lineTo(this.x2, this.y2);
        context.lineWidth = 3;
        context.lineCap = 'round';
        context.strokeStyle = color;
        context.stroke();
    }
}

class ImageView {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    createPath(context) {
        context.beginPath();
        context.moveTo(this.x1, this.y1);
        context.lineTo(context.canvas.width, this.y1);
        context.lineTo(context.canvas.width, context.canvas.height);
        context.lineTo(this.x1, context.canvas.height);
        context.moveTo(this.x1, this.y1);
        context.closePath();
    }
}

image.src = 'sample_image.png';
image.onload = function (e) {
    canvasCenterX = canvas.width / 2;
    canvasCenterY = (canvas.height - 100) / 2;

    imgWidth = this.width;
    imgHeight = this.height;

    canvasWidth = canvas.width;
    canvasHeight = canvas.height - 100;

    var imgAspectRatio = this.width / this.height;
    var canvasAspectRatio = canvas.width / (canvas.height - 100);



    if (imgAspectRatio > canvasAspectRatio) {
        viewWidth = imgWidth;
        viewHeight = (1/imgAspectRatio)*viewWidth;
        clipX = imgWidth;
        clipY = viewWidth/canvasWidth * canvasHeight;
    }

    else {

        viewHeight = imgHeight;
        viewWidth = (imgAspectRatio)*viewHeight;
        clipY = imgHeight;
        clipX =viewHeight/canvasHeight * canvasWidth;
    }



    //clippingRegion
    var clipCenterX = viewWidth / 2;
    var clipCenterY = viewHeight / 2;
    var clipWidth;
    var clipHeight;

    //viewPort
    var drawWidth = canvas.width;
    var drawHeight = canvas.height - 100;

    //zoom dragger
    var draggerX1 = canvas.width / 2 - canvas.width / 3;
    var draggerX2 = canvas.width / 2 + canvas.width / 3;

    
    maxWidth = clipX;
    maxHeight = clipY;
    viewLeft = clipCenterX - clipX/2;
    viewTop = clipCenterY - clipY/2;
    customImageDrawer(context, image, { x: clipCenterX, y:clipCenterY}, clipX, clipY);



    var dragg = new Dragger(draggerX1, canvas.height - 50, draggerX1, draggerX2);
    dragg.draw(context);
    var view = new ImageView(0, 0, drawWidth, drawHeight);




    canvas.onmousedown = function (e) {
        e.preventDefault();
        loc = windowToCanvas(e.clientX, e.clientY);
        dragg.createPath(context);
        if (context.isPointInPath(loc.x, loc.y)) {
            zooming = true;
            dragging = false;
        }
        else {
            view.createPath(context);
            if (context.isPointInPath(loc.x, loc.y)) {
                dragOffsetX = loc.x;
                dragOffsetY = loc.y;
                dragging = true;
                zooming = false;
            }
        }

    }

    canvas.onmousemove = function (e) {
        e.preventDefault();
        let currentPosition = windowToCanvas(e.clientX, e.clientY);
        if (zooming) {
            //dragg.x lies between draggerX1 and draggerX2
            dragg.x = currentPosition.x > draggerX1 && currentPosition.x < draggerX2 ? currentPosition.x : dragg.x;
            scale = draggerX2 - draggerX1;
            context.clearRect(0, 0, canvas.width, canvas.height);
            let helpScale = draggerX2 - dragg.x;
            clipWidth = clipX * (helpScale / (scale));
            clipHeight = clipY/clipX * clipWidth;

            


            if (clipCenterX + clipWidth > imgWidth) {
                clipCenterX -=1;
            }
            if (clipCenterY + clipHeight > imgHeight) {
                clipCenterY -=1;
            }
            customImageDrawer(context, image, { x: clipCenterX, y: clipCenterY }, clipWidth, clipHeight);

            dragg.draw(context);
        }

        if (dragging && clipWidth && clipHeight) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            let aspectRatio = imgWidth / imgHeight;
            let dragX = (currentPosition.x - dragOffsetX);
            let dragY = (currentPosition.y - dragOffsetY);

            /*make sure the image occupies the canvas and none of 
             *the canvas space is left unused*/

            if (dragX > 0) {
                if (clipCenterX - clipWidth / 2 >= 0) {
                    clipCenterX -= 0.2 * dragX;
                }
            }
            if (dragX < 0) {
                if ((clipCenterX + clipWidth / 2) <= imgWidth) {
                    clipCenterX -= 0.2 * dragX;
                }
            }

            if (dragY > 0) {
                if (clipCenterY - clipHeight / 2 >= 0) {
                    clipCenterY -= 0.2 * dragY;
                }
            }
            if (dragY < 0) {
                if (clipCenterY + clipHeight / 2 <= imgHeight) {
                    clipCenterY -= 0.2 * dragY;
                }
            }

            customImageDrawer(context, image, { x: clipCenterX, y: clipCenterY }, clipWidth, clipHeight);

            dragg.draw(context);
        }

    }

    canvas.onmouseup = function (e) {
        e.preventDefault();
        dragging = false;
        zooming = false;
    }

};

