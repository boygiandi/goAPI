
module.exports = {
	now: function() {
		const date = new Date();
		return parseInt(date.getTime()/1000);
	}
}