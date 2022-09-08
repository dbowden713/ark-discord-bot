const { exec, spawn } = require("child_process");

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

// Uses tasklist command and checks for (query) in the process list, with a callback for the result
const isRunning = (query, cb) => {
	let cmd = `tasklist`;
	exec(cmd, (err, stdout, stderr) => {
		cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
	});
};

exports.timestamp = getTimestamp;
exports.isRunning = isRunning;
