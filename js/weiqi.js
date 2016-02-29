'use strict';


// Game Variables..............................................

var game = null,
gridSize = 19,
gridSpace = 0,
gridStartX = 0,
gridStartY = 0,

stoneRadius = 0,
stonePositions = [],
stoneColors = ['black', 'white'],
stoneCounts = [0, 0],
stoneColorNext = 0,

lastStone = null,

autoRemoveStonesFlag = true,
showLineNumbersFlag = false,
clickRemoveStoneFlag = false,
switchStoneColorFlag = true,

boardOpacity = 1,

$leftPanel,

waitTime = new StopWatch(),

// Stone Painters & Behaviors..............................................

stonePainter = {
    paint: function(sprite, context) { 
        context.save();
            
        var imageSize = 200,
        imgY = 0,
        shadowDistance = stoneRadius*0.1,
        opacity = sprite.opacity;
        
        sprite.left = gridStartX + sprite.col * gridSpace - stoneRadius/2;
        sprite.top = gridStartY + sprite.row * gridSpace - stoneRadius/2;
        
        context.globalAlpha = opacity;
        context.shadowColor = 'rgba(100,100,100,'+ opacity +')';
        context.shadowOffsetX = shadowDistance;
        context.shadowOffsetY = shadowDistance;
        context.shadowBlur = shadowDistance;

        if (sprite.color != stoneColors[0]) imgY = imageSize;   // image offset vertically
            
        context.drawImage(game.getImage('image/stones.png'), 0, imgY, imageSize, imageSize, sprite.left, sprite.top, stoneRadius, stoneRadius); 
        
        context.restore();
    }
},

stoneFader = {
    execute: function (sprite, context, now) {
        if (!sprite.lastFade) sprite.lastFade = now;
        
        if (sprite.fadeOut) {
            sprite.opacity -= (now - sprite.lastFade)/sprite.fadeOut;
            if (sprite.opacity <= 0)
            {   
                if (sprite.prev)
                    sprite.prev.next = sprite.next;
                if (sprite.next)
                    sprite.next.prev = sprite.prev;  
            
                // remove stone from arrays, sprites
                stonePositions[sprite.row][sprite.col] = null;
                game.removeSprite(sprite);
                
                for (var i = 0; i < stoneColors.length; ++i)
                    if (sprite.color == stoneColors[i])
                        --stoneCounts[i];
            }
            
        }
        else if (sprite.fadeIn) {
            sprite.opacity += (now - sprite.lastFade)/sprite.fadeIn;         
            
            if (sprite.opacity >= 1)
            {
                sprite.opacity = 1;
                sprite.fadeIn = 0;
            }
        }
        
        sprite.lastFade = now;

    }
};
   
// Update Methods..............................................

function updateGameVars() {

   var width = game.context.canvas.width,
    height = game.context.canvas.height,

    right = $leftPanel.offset().left + $leftPanel.outerWidth(),
    x = right;

    gridSpace = Math.min(width, height) / gridSize;  // leave 1/2 square for space
    gridStartX = Math.max(gridSpace/2, (gridSpace + width - height) / 2); // center horizontally

    x += gridSpace/2;

    // canvas uses region not covered by left panel
    if (gridStartX < x && $leftPanel.is(':visible')) {
        gridStartX = x;
        if (right + gridSpace*gridSize > width) {
            width -= right;
            gridSpace = width/gridSize;  // leave 1/2 square for space
            gridStartX = right + gridSpace/2;            
        }		
    }          
    
    gridStartY = Math.max(gridSpace/2, (gridSpace + height - width) / 2);// center vertically        
   
    stoneRadius = gridSpace*0.8;
}

// Stone Methods..............................................

function initstonePositions() {
    for (var i = 0; i < gridSize; ++i)
        stonePositions[i] = []; 
    
    lastStone = null;
    
    for (var i in stoneCounts)
        stoneCounts[i] = 0;
	
    game.startTime = getTimeNow();
    waitTime.start();
}

function removeNoLibertyStonesAround(thisStone) {
		
    var color = thisStone.color,
    row = thisStone.row,
    col = thisStone.col,
    group = [],
    stoneGroup = [];

    // clear liberty flag
    for (var i = 0; i < gridSize; ++i) 
        for (var j = 0; j < gridSize; ++j) {
            if (stonePositions[i][j])
                stonePositions[i][j].libertyChecked = false;
        }

    // adjacent neigbhors   
    if (!checkLiberty(group, row-1, col, color))
        stoneGroup = stoneGroup.concat( group);
     
    group = [];   
    if (!checkLiberty(group, row+1, col, color))
        stoneGroup = stoneGroup.concat( group);
    group = [];        
    if (!checkLiberty(group, row, col-1, color))
        stoneGroup = stoneGroup.concat( group);
    group = [];
    if (!checkLiberty(group, row, col+1, color))
        stoneGroup = stoneGroup.concat( group);

    for (var i in stoneGroup)
        stoneGroup[i].fadeOut = 400;  // fade then remove
}

function checkLiberty(stoneGroup, row, col, color) {
    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize)
        return 0;
     
    var stone = stonePositions[row][col];
    
    if (!stone)        
        return 1;

    if (stone.color == color) return 0;

    if (stone.libertyChecked)
        return 0;   

    stone.libertyChecked = true;

    // adjacent neigbhors
    var liberty =  
    checkLiberty(stoneGroup, row-1, col, color) ||
    checkLiberty(stoneGroup, row+1, col, color) ||
    checkLiberty(stoneGroup, row, col-1, color) ||
    checkLiberty(stoneGroup, row, col+1, color);    //short circuit needs only 1 true

    
    if (liberty) return liberty;
    else stoneGroup.push(stone);
    
    return 0;
}

function switchColor() {
    stoneColorNext = ++stoneColorNext % stoneColors.length;
}
// Paint Methods..............................................

function paintChessBoard(context) {
    context.save();

    var sx = gridStartX,
    ex = sx + (gridSize-1)*gridSpace,
    sy = gridStartY,
    ey = sy + (gridSize-1)*gridSpace,
    cStep = (gridSize-1)/2 * gridSpace,
    qStep = Math.floor((gridSize-1)/3) * gridSpace,
    cx = sx + cStep, 
    cy = sy + cStep,
    dotRadius = 4,
    bsx = sx - gridSpace/2,
    bsy = sy - gridSpace/2,
    bex = ex + gridSpace/2,
    bey = ey + gridSpace/2,
    skipSize = gridSpace/8;
   
	if (video.src && video.videoWidth > 0 && video.videoHeight > 0)
		context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, context.canvas.width, context.canvas.height);

    context.globalAlpha = .8

    context.fillStyle = stoneColors[stoneColorNext]

	context.fillRect(0,0,context.canvas.width, context.canvas.height)

    context.globalAlpha = 1

    context.drawImage(game.getImage('image/board.jpg'), bsx, bsy, bex - bsx, bey - bsy); // draw chess board background

    // draw board borders
    context.strokeStyle = '#AAA';
    context.lineWidth = 3;

    context.beginPath();
    context.moveTo(bsx, bsy);
    context.lineTo(bsx, bey);
    context.lineTo(bex, bey);
    context.lineTo(bex, bsy);
    context.closePath();
    context.stroke();
        
    // draw grids  
    context.strokeStyle = '#000';
    context.lineWidth = 1;


    // set up for text line#

    context.font= '12px Arial';
    context.textAlign= 'center';
    context.fillStyle = '#F00';

    // vertical lines
    for (var x = sx, nx = 0; nx < gridSize; ++nx, x+=gridSpace) {
        context.beginPath();
        context.moveTo(x, sy);
        context.lineTo(x, ey);
        context.stroke();
        
        if (showLineNumbersFlag) {
            context.textBaseline= 'bottom';
            context.fillText(nx+1, x, sy-3);   
        
            context.textBaseline= 'top';        
            context.fillText(nx+1, x, ey+3);
        }
    } 

    context.textBaseline= 'middle';        

    // horizonal lines
    for (var y = sy, ny = 0; ny < gridSize; ++ny, y+=gridSpace) {
        context.beginPath();
        context.moveTo(sx, y);
        context.lineTo(ex, y);
        context.stroke();
        
        if (showLineNumbersFlag) {
            context.textAlign= 'right';
            context.fillText(ny+1, sx-3, y);   
        
            context.textAlign= 'left';        
            context.fillText(ny+1, ex+3, y);
        }
    }
    
    // draw 8 dots + center dot
    context.fillStyle = '#000';     
    for (var i = -1; i <= 1; ++i)
        for (var j = -1; j <= 1; ++j)
        {
            context.beginPath();	
            context.arc(cx + i * qStep, cy + j * qStep, dotRadius, 0, PI2);  
            context.closePath();
            context.fill();

        } 

    context.restore();
}
        
// Callback Methods.........................................

// Document Ready.........................................

$(document).ready(function() {
    game = new Game('weiqi', 'gameCanvas');

    // panel controls..................................................

    localVariables.loadSettings(game.gameName);

    $leftPanel = $('#leftPanel').change(function() {localVariables.saveSettings(game.gameName)}); 
    
    var $newBtn = $('#newBtn').click(function() {
        $gridSizeInput.change();                     
    }),
	
    $gridSizeInput = $('#gridSize').change(function() {
		gridSize = parseInt($(this).val());
		stoneColorNext = 0;          
		updateGameVars();
		initstonePositions();
		game.sprites = [];// clear all stone sprites 			               
    });
  
    $('#passBtn').click(function() {
        switchColor();
    });
    
    $('#removeStones').change(function() {
        autoRemoveStonesFlag = $(this).is(':checked');
    }).change();

    $('#showStats').change(function() {
        if ( $(this).is(':checked'))
            $('#stats').fadeIn();
        else
            $('#stats').fadeOut();
			
    }).change();

    $('#showLineNumbers').change(function() {
        showLineNumbersFlag = $(this).is(':checked');
    }).change();
     
    $('#boardOpacity').change(function() {
        boardOpacity = parseInt($(this).val()) / 100;
    }).change();
	 
    $('#clickRemoveStone').change(function() {
        clickRemoveStoneFlag = $(this).is(':checked');
    }).change();
    
    $('#switchStoneColor').change(function() {
        switchStoneColorFlag = $(this).is(':checked');
    }).change();
    
    $('#boardImage').change(function() {
        var src = $.trim($(this).val());
        if (!src) return;

        $('<img/>').load(function() {
            $('body').css('background-image', 'url(' + src + ')');
			$(video).removeAttr('src');
        })
		.error(function() {	// if not image, video maybe
			$(video).attr({autoplay:true, loop:true, src:src})	// set up video
		})		
		.attr('src', src);
		
    }).change()
	.dropDown($('#bkgMediaList'));
    
    // Load game..................................................
    
    game.queueImage('image/board.jpg');
    game.queueImage('image/stones.png');

    for (var i = 0; i < game.imageUrls.length; ++i)
        game.loadImages();
		
    // Game Paint Methods.........................................
   
    game.startAnimate = function(time) {

       var update = false;
		
        // update game variables if dimension or left panel changes
        if (game.context.canvas.width != window.innerWidth) {
            game.context.canvas.width = window.innerWidth;
            update = true;
        }
        if (game.context.canvas.height != window.innerHeight) {
            game.context.canvas.height = window.innerHeight;
            update = true;
        }			

        if (update)	
            updateGameVars();
        
        // stats
        var secs = Math.floor(waitTime.getElapsedTime() / 1000);

        $('#numBlack').html(stoneCounts[0]);
        $('#numWhite').html(stoneCounts[1]);

        $('#waitTime').html(secondToString(secs));

        secs = Math.floor( this.gameTime / 1000 );
        $('#gameTime').html(secondToString(secs));
		
    //$('#fps').html(this.fps.toFixed(2));

    }
	
    game.paintUnderSprites = function () { // Draw things other than sprites        
        
        paintChessBoard(game.context);       
        
    };
    /*
    game.paintOverSprites = function () {
        if (showStCountsFlag)
            paintStoneCounts(game.context, game.context.canvas.width, 0);
    };*/

    // Key Listeners..............................................

    game.addKeyListener(
    {
        key: 'space',   
        listener: function () {
            $newBtn.click();
        }
    }
    );
        
    game.addKeyListener(
    {
        key: 'd',   
        listener: function () {
            if (!lastStone) return;
            
            lastStone.fadeOut = 500; // fade & remove last stone
            
            if (switchStoneColorFlag && stoneColors[stoneColorNext] != lastStone.color)
                switchColor();
            
            lastStone = lastStone.prev;
            
        }
    }
    );

    game.addKeyListener(
    {
        key: 's',   
        listener: function () {
            switchColor();      
        }
    }
    );
        
    // Mouse Listeners..............................................

	game.addMouseListener(
	{
		mouseEvt: 'click', 
		listener: function(e) {
			    
        var mPos = windowToCanvas(this, e.pageX, e.pageY),
        
        // snap to intersection
        col = Math.round((mPos.x - gridStartX) / gridSpace),
        row = Math.round((mPos.y - gridStartY) / gridSpace),
        
        space = gridSpace/4;
		  
		 if (col < 0 || col >= gridSize || row < 0 || row >= gridSize)
        // alternate move between black and white
        {
            switchColor();
        }
        // inside board area
        else if (Math.min(col, row) >= 0 && Math.max(col, row) < gridSize)
        {        
            if (stonePositions[row][col]) {
                var x = stonePositions[row][col].left,
                y = stonePositions[row][col].top;
				
                if (clickRemoveStoneFlag && ssd(x-mPos.x, y-mPos.y) < stoneRadius * stoneRadius )	// remove if flag
                    stonePositions[row][col].fadeOut = 100;
					
                return;	// if clicking on stone
            }
                
            var stone = new Sprite('stone-r' + row + 'c' + col, stonePainter, [ stoneFader ]);
    
            stone.color = stoneColors[stoneColorNext];

            stone.col = col;
            stone.row = row;
            stone.prev = lastStone; // double linked list
            stone.next = null;
            stone.opacity = 0;
            stone.fadeIn = 100;
        
            stonePositions[row][col] = stone;
            game.addSprite(stone);

            ++stoneCounts[stoneColorNext];

            if (stone.prev)
                stone.prev.next = stone;

            lastStone = stone;

            if (autoRemoveStonesFlag)
                removeNoLibertyStonesAround(stone);
		
            if (switchStoneColorFlag)
                switchColor();
            
            waitTime.start();
        }

		}
    }); 
    
    // Start game.................................................

    $newBtn.click();
    
    game.start();
    
///loadCtrlValues(game.gameName)
});