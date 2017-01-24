$(window).on('resizeEnd', function () {
	$(".welcome_area, .static_image").height($(window).height());
});
$(window).on('resize', function () {
	if (this.resizeTO) clearTimeout(this.resizeTO);
	this.resizeTO = setTimeout(function () {
		$(this).trigger('resizeEnd');
	}, 300);
}).trigger("resize");