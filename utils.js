const node_util = require("node:util");
const exec = node_util.promisify(require("node:child_process").exec);
const spawn = node_util.promisify(require("node:child_process").spawn);
const config = require("./config");

// Return a new date in 24-hour format: 14:22:39
const getTimestamp = () => {
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
};

// Uses tasklist command and checks for the server in the process list
const isRunning = async () => {
	const { stdout, stderr } = await exec("tasklist");
	return (
		stdout.toLowerCase().indexOf("ShooterGameServer.exe".toLowerCase()) > -1
	);
};

const startServer = async (map) => {
	await spawn(config.map_scripts[map], [], {
		cwd: config.scripts_dir,
		shell: true,
	});
};

const stopServer = () => {
	// Attempt to stop the server process
	exec(`taskkill /im ShooterGameServer.exe /t`, (err, stdout, stderr) => {
		// This should never run since we already made sure the process exists
		if (err) {
			throw err;
		}

		// The /^(?!\s*$).+/ regex keeps any blank lines from cluttering the output
		if (stdout) {
			stdout.split("\n").forEach((line) => {
				if (/^(?!\s*$).+/.test(line)) {
					console.log(
						`[${getTimestamp()}] (TASKKILL):`,
						"stdout -",
						line
					);
				}
			});
		}

		// The /^(?!\s*$).+/ regex keeps any blank lines from cluttering the output
		if (stderr) {
			stderr.split("\n").forEach((line) => {
				if (/^(?!\s*$).+/.test(line)) {
					console.log(
						`[${getTimestamp()}] (TASKKILL):`,
						"stderr -",
						line
					);
				}
			});
		}
	});
};

exports.timestamp = getTimestamp;
exports.serverIsRunning = isRunning;
exports.startServer = startServer;
exports.stopServer = stopServer;
