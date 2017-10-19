function setVideo(url, s, l) {
var r = '<video width="640" height="480" controls autoplay>' +
	 ' <source src="'+url+'?s='+s+'&l='+l+'" type="video/mp4">' +
	'  <source src="movie.ogg" type="video/ogg">' +
'	Your browser does not support the video tag.' +
	'</video>';
  document.getElementById('niu').innerHTML = r;
}

setTimeout(
	function() {
 		setVideo('/api/test_video_section.js', 10, 6);
 }, 1000
)
