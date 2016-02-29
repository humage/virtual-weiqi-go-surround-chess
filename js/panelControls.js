'use strict';

function randomNumber(min, max) {
    return Math.floor(Math.random() * (max-min+1)) + min;
}


// Plugins .......................................................................

var video = document.createElement('video'),
	supported = {		
		webm : !!(video.canPlayType && video.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/no/, '')),
		mp4 : !!(video.canPlayType && video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, '')),
		ogv : !!(video.canPlayType && video.canPlayType('video/ogg; codecs="theora"').replace(/no/, ''))
	};
	
(function($){
			
	// jquery dropDownList
	$.fn.dropDown = function($list) {
		var $div = this.wrap('<div/>').parent().addClass('dropDownDiv'),		
		
		$arrow = $('<span/>').addClass('dropDownArrow').appendTo($div)
			.click(function() {
				if ($list.is(':hidden'))
					$elem.focus();
				return false; // disable label click
			}),
		
		$elem = this
		.focus(function() {
        	$list.stop(true,true)
      		.slideDown();
			
			$arrow.html('▼');
				
		 })
		.blur(function() {
			setTimeout(function() {
				$list.stop(true,true).slideUp(); $arrow.html('▽')
			}, 100)	// slow down for $list click
		 })
		.blur();
						
		$list.on({
			click : function() {
				$elem.val(this.href).change()
				.blur();	// close list			

				return false;
			},
			'mouseenter touchstart' : function() {
				$list.find('li a').removeClass('highlighted');
				$(this).addClass('highlighted');
			}
		}, 'li a')
		.appendTo($div);	// right after, must be in same container
				
		this.removeUnsupported($list)
		.keydown(function(e) {
			var $this = $(this),
			$highlighted = $list.find('.highlighted');
			
			switch (e.keyCode) {
				case 13:	// enter
					if ($list.is(':visible') && $highlighted.length)
						$highlighted.click();
					else
						$this.change();
					break;
				case 27:	// esc
						$elem.blur();
					break;
				case 38:	// up arrow
					if ($highlighted.length)
						$highlighted = $highlighted.parent().prev().find('a');
					
					if (!$highlighted.length)
						$highlighted = $list.find('li a:last');
						
					$highlighted.mouseenter();				
					break;
				case 40: // down arrow				
					if ($list.is(':hidden'))
						$this.focus();
					if ($highlighted.length)
						$highlighted = $highlighted.parent().next().find('a');
					
					if (!$highlighted.length)
						$highlighted = $list.find('li a:first');
						
					$highlighted.mouseenter();
					break;
			}
		})
		.keypress(function(e) {
			var digit = e.charCode - 48;
			if (digit >=0 && digit < 10)	// 0-9 select
				$list.find('li a').eq(digit).mouseenter();					
		});
		
		$list.find('li a').each(function(index) {
			if (index > 9) return;
			$('<code/>').html(index).prependTo(this);
		});
		
		return this;	
	};
	
	// remove unsupported video format
	$.fn.removeUnsupported = function($list) {	
		$list.find('li').each(function() {
            var $this = $(this),
            type = $this.find('a').attr('href').split('.').pop().toLowerCase();			
			if (supported[type] === false) $this.remove();
		});
				
		return this;
	};
	
})(jQuery);


// Full Screen.......................................................................

// return full screen function based on browser support
var pfx = ['webkit', 'moz', 'ms', 'o', ''];

function fullScreen(obj, method) {
	
	var p = 0, m, t;
	while (p < pfx.length && !obj[m]) {
		m = method;
		if (pfx[p] == '') {
			m = m.substr(0,1).toLowerCase() + m.substr(1);
		}
		m = pfx[p] + m;
		t = typeof obj[m];
		if (t != 'undefined') {
			pfx = [pfx[p]];
			return {type: t, name: m};
		}
		p++;
	}
}
		
// Local Storage.......................................................................

var localVariables = {
    nameAppend: '_settings',
    
    get : function($name) {
        if (!localStorage) return;
        return localStorage[$name];
    },
    set : function($name, $value) {
        if (!localStorage) return;
        localStorage[$name] = $value;
    },
    
    saveSettings: function(gameName) {
        var ctrls = {};
        $('#leftPanel :input[id]').not(':button').each(function() {
            var $this = $(this),
            value = $this.val();
			
            if ($this.is(':checkbox'))
                value = $this.is(':checked');
		
            ctrls[this.id] = value;
        });	
	
        this.set(gameName + this.nameAppend, JSON.stringify(ctrls));
    },
    loadSettings: function(gameName) {
        var varObj = this.get(gameName + this.nameAppend);
        if (!varObj) return;
        
        var ctrls = JSON.parse(varObj);
	
        for (var id in ctrls) {
            var $id = $('#' + id);
		
            if ($id.is(':checkbox'))
                $id.prop('checked', ctrls[id]);
            else
                $id.val(ctrls[id]);
        }
    }
};

// Stop Watch.......................................................................

function StopWatch()  {
    this.startTime = 0;
    this.running = false;
}

function secondToString(secs)
{
    var s = secs%60, 
    m=Math.floor(secs / 60)%60,
    h=Math.floor(secs / 3600);
		
    return h + ':' + (m<10?'0':'') + m + ':' + (s<10?'0':'') + s;
		
}

StopWatch.prototype = {

    start: function () {
        this.startTime = new Date();
        this.running = true;
    },

    getElapsedTime: function () {
        if (!this.running) return null;
        
        return new Date() - this.startTime;
 
    
    }
};

/* window events */

$(window).keydown(function(e) {
    if ($(e.target).is('input')) return;
	
    switch (e.keyCode) {
        case 112: // F1
            $('#toggleHelpWin').click();
            return false;
            break;
			
        case 113: // F2
            $('#stats')[0].toggle();
            return false;
            break;
			
        case 27: // escape
            $('#toggleLeftPanel').click();
            break;	
    }
});

$(document).ready(function() {
	
	
	// full screen button show
	var objFS = fullScreen(document.body, 'RequestFullScreen');
	if (objFS && objFS.name && objFS.type == 'function') {
		var funcNameFS = objFS.name, funcNameCancel,
			blNameFS, blNameIsFS;
		
		if (objFS = fullScreen(document, 'FullScreen'))
			blNameFS = objFS.name;
		if (objFS = fullScreen(document, 'IsFullScreen'))
			blNameIsFS = objFS.name;
		if (objFS = fullScreen(document, 'CancelFullScreen'))
			funcNameCancel = objFS.name;				
		
		$('.maxBtn').click(function() {			
			if (document[blNameFS] || document[blNameIsFS])	// if already fullscreen
				document[funcNameCancel]();	// restore
			else
				document.body[funcNameFS]();	// go fullscreen

			return false;		
		}).fadeIn(3000);
	}
})
// toggle windows - button click
.on('click', '.toggleWindow', function() {
    var hash = $(this).attr('href'),
    $elem = $(hash);
			
    if (!$elem.length) return;
		
    if ($elem[0].toggle)
        $elem[0].toggle(this);
    else
        $elem.toggle();
		
    return false;
});