$(document).ready(function() {
		var $javaTab = $('.tab-java');
		var $javaTabFix = $('.tab-java-fix');
		$javaTab.hide();		
		$javaTabFix.hide();

    $('.java-toggle').click(function() {    	  
        var $outer = $(this).siblings('.slide');
        var $javaCode = $outer.children('.java');
        var $toggleText = $(this);
        var $javaTab = $(this).siblings('.tab-java');
        var $javaTabFix = $(this).siblings('.tab-java-fix');

        $toggleText.html() == 	'Show Java' ? $toggleText.html('Hide Java') : $toggleText.html('Show Java');

        $(function() {
            $javaCode.animate({
                left: parseInt($javaCode.css('left'), 10) == 0 ? $javaCode.outerWidth() : 0
            }, {
                duration: 200,
                queue: false
            });
            $outer.animate({
                width: parseInt($outer.css('width'), 10) == 460 ? 960 : 460
            }, {
                duration: 200,
                queue: false
            });
            $javaTab.animate({
                top: parseInt($javaTab.css('top'), 10) == 50 ? 0 : 50
            }, {
                duration: 250,
                queue: false
            });
        });

        $javaTab.toggle(200);
        $javaTabFix.toggle(200);
    });
});


/*
$(document).ready(function() {
		var $javaTab = $('.tab-java');
		var $javaTabFix = $('.tab-java-fix');
		$javaTab.hide();		
		$javaTabFix.hide();

    $('.java-toggle').click(function() {
        var $outer = $('#slideleft');
        var $java = $('.java');
        var $toggleText = $('.java-toggle');

        $toggleText.html() == 	'Show Java' ? $toggleText.html('Hide Java') : $toggleText.html('Show Java');
        $(function() {
            $java.animate({
                left: parseInt($java.css('left'), 10) == 0 ? $java.outerWidth() : 0
            }, {
                duration: 200,
                queue: false
            });
            $outer.animate({
                width: parseInt($outer.css('width'), 10) == 460 ? 960 : 460
            }, {
                duration: 200,
                queue: false
            });
            $javaTab.animate({
                top: parseInt($javaTab.css('top'), 10) == 50 ? 0 : 50
            }, {
                duration: 250,
                queue: false
            });
        });

        $javaTab.toggle(200);
        $javaTabFix.toggle(200);
    });
});*/