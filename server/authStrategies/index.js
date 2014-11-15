var facebook = require("./facebook"),
	github = require("./github"),
	twitter = require("./twitter"),
	vkontakte = require("./vkontakte");
	local = require("./local");
	rememberMe = require("./rememberMe");

//todo Add auto exporting strategies by its file name
module.exports = {
	facebook: facebook,
	github: github,
	twitter: twitter,
	vkontakte: vkontakte,
	local: local,
	rememberMe: rememberMe
}