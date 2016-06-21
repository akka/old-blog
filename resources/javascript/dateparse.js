$(window).load(function() {

	$('.feed-date').each(function(index) {
		var str = $(this).text().substring(0,16);
		var date = moment(str, "ddd, DD MMM YYYY");
		var htm = '<div class="feed-month">'+moment(date).format("MMM")+'</div>';
		htm += '<div class="feed-day">'+moment(date).format("DD")+'</div>';
		htm += '<div class="feed-year">'+moment(date).format("YYYY")+'</div>';
		$(this).html(htm)
	});

	$(".feed-entry").each(function() {
		$(this).css('height',$(this).height()+10);
	});
  
	/*var day = moment("12-25-1995", "MM-DD-YYYY");*/
});
