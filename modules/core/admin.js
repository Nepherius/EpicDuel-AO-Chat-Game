var capitalize = require('underscore.string/capitalize')
var moment = require('moment')

exports.lock = lock = function (userId, args) {
	if (!args[1]) {
		send_MESSAGE_PRIVATE(userId, 'Usage !lock playername minutes')
		return
	} else if (isNaN(args[1])) {
		send_MESSAGE_PRIVATE(userId, 'Usage !lock playername minutes')
		return
	}
	connectdb().done(function(connection) {
		query(connection, 'SELECT * FROM members WHERE name = ?', args[0].toLowerCase()).done(function(result) {
			if (result !== 0) {
				query(connection, 'UPDATE members SET locked = ' + moment().add(args[1], 'minutes') / 1000 + ' WHERE members.charid = ?', userId).done(function() {
					send_MESSAGE_PRIVATE(userId, capitalize(args[0].toLowerCase()) + ' is  now locked for ' + args[1] + ' minutes')
					connection.release()
				})
			} else {
				send_MESSAGE_PRIVATE(userId, capitalize(args[0].toLowerCase()) + ' is not a member')
				connection.release()
			}
		})
	})
}
exports.unlock = unlock = function (userId, args) {
	if (!args) {
		send_MESSAGE_PRIVATE(userId, 'Usage !unlock playername')
		return
	}
	connectdb().done(function(connection) {
		query(connection, 'SELECT * FROM members WHERE name = ?', args[0].toLowerCase()).done(function(result) {
			if (result !== 0) {
				query(connection, 'UPDATE members SET locked = 0 WHERE members.name = ?', args[0]).done(function() {
					send_MESSAGE_PRIVATE(userId, capitalize(args[0].toLowerCase()) + ' is now rested and can duel again.')
					connection.release()
				})
			} else {
				send_MESSAGE_PRIVATE(userId, capitalize(args[0].toLowerCase()) + ' is not a member')
				connection.release()
			}
		})
	})
}	

exports.ban = ban = function(userId, args) {
	if (!args) {
		send_MESSAGE_PRIVATE('Usage: !ban player_name')
		return
	}
	var userName = capitalize(args[0].toLowerCase())
	connectdb().done(function(connection) {
		getUserId(connection, userName).done(function(result) {
			if (result[0] !== 0) {
				console.log(result[0][0].charid)
				query(connection, 'UPDATE members SET banned = "yes" WHERE charid = ' + result[0][0].charid).done(function() {
					send_MESSAGE_PRIVATE(userId, userName + ' is now banned')
					connection.release()
				})				
			} else {
				send_MESSAGE_PRIVATE(userId, userName + ' is not a member')
				connection.release()
			}
		})
	})
}
exports.unban = unban = function(userId, args) {
	if (!args) {
		send_MESSAGE_PRIVATE('Usage: !unban player_name')
		return
	}
	var userName = capitalize(args[0].toLowerCase())
	connectdb().done(function(connection) {
		getUserId(connection, userName).done(function(result) {
			if (result[0] !== 0) {
				query(connection, 'UPDATE members SET banned = "no" WHERE charid = ?', result[0][0].charid).done(function() {
					send_MESSAGE_PRIVATE(userId, userName + ' is no longer banned')
					connection.release()
				})				
			} else {
				send_MESSAGE_PRIVATE(userId, userName + ' is not a member')
				connection.release()
			}
		})
	})
}