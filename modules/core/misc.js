var capitalize = require('underscore.string/capitalize')
var moment = require('moment')

exports.top = top = function(userId,args) {
	if (args && isNaN(args[0])) { 
		send_MESSAGE_PRIVATE(userId, 'Must provide a valid number')
		return
	}
	if (args && args[0] > 25) {
		args[0] = 25;
	}
	var topLimit = (args ? +args[0] : 10 )
	connectdb().done(function(connection) {
		query(connection, 'SELECT * FROM members ORDER BY level DESC LIMIT ' + connection.escape(topLimit)).done(function(result) {
			connection.release()
			var topResult = '<center> <font color=#FFFF00> :::Top Player::: </font> </center> \n\n'
			var count = 0; 
			result[0].map(function(player) {
				count++
				topResult += count + '. <font color=#00FFFF>' + player.name + '</font><font color=#FFFF00> Level: ' + player.level + '</font><font color=#00FF00> Wins: ' + player.won + '</font><font color=#FF0000> Lost: ' + player.lost + '</font>\n' 
			})
			send_MESSAGE_PRIVATE(userId, blob('Top Players', topResult)) 
			
		})
	})
		
 

}

exports.about = about = function (userId) {
	send_MESSAGE_PRIVATE(userId, blob('About NephBot', aboutReply))	
}

var aboutReply = '<center> <font color=#FFFF00> :::Epic Duels Bot::: </font> </center> \n\n'
aboutReply += '<font color=#00FFFF>Version:</font> 1.0 \n'
aboutReply += '<font color=#00FFFF>By:</font> Nepherius \n'
aboutReply += '<font color=#00FFFF>In:</font> Node.js \n\n'
aboutReply += '<font color=#00FFFF>Thanks to Cratertina for helping me balance the breeds.</font>\n'
aboutReply += '<font color=#00FFFF>Special Thanks:</font> To all the people that worked on the original AO Chat Bots, Nephbot would not be possible without them.    \n'

