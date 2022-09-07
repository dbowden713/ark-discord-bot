// Return a new date in 24-hour format: 14:22:39
function getTimestamp() {
	let date = new Date();
	return (
		date.toLocaleDateString("en-US", {
			month: "2-digit",
			day: "2-digit",
			year: "numeric",
		}) +
		" " +
		date.toLocaleTimeString("en-us", { hour12: false })
	);
}

exports.timestamp = getTimestamp;
