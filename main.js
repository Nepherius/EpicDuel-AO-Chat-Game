var timestamp = require('console-stamp')(console, '[dd.mm.yyyy HH:MM:ss.l]')
var fs = require('fs')
var assert = require('assert')
var pack = require('./system/pack')
var auth = require('./system/chat-packet')
var connect = require('./system/connect')
var handle = connect.handle
var s = connect.s
var events = require('events')
var Q = require('q')
var parseString = require('xml2js').parseString
var util = require('util')
var express = require('express')
var request = require('request')
var mysql = require('mysql')





// Import Commands
var commands = require('./modules/index.js')

// Define Events
global.outstandingLookups = new events.EventEmitter()
var buddyStatus = new events.EventEmitter()
var privgrp = new events.EventEmitter()
var incMessage = new events.EventEmitter()
global.onClientName = new events.EventEmitter()
var channels = new events.EventEmitter()

// Colors, just one for now
var defaultFontColor = '<font color=\'#89D2E8\'>'




var commandPrefix = '!'

// Login	

function pack_key(key) {
	return pack.pack(
	[
		['I', 0],
		['S', Login],
		['S', key]
	])
}
handle[auth.AOCP.LOGIN_SEED] = function (payload) {
    console.log('LOGIN_SEED')
    var seedLength = payload.readInt16BE(0)
    assert.equal(seedLength, payload.length - 2)
    var seed = payload.slice(2)

    var data = pack_key(auth.generate_login_key(seed, Login, Pass))
    var pp = auth.assemble_packet(auth.AOCP.LOGIN_REQUEST, data)

    s.write(pp)
}
// Select Character
handle[auth.AOCP.LOGIN_CHARLIST] = function (data) {
    console.log('LOGIN_CHARLIST')
    var chars = pack.unpack(data)
    console.log(chars)
    for (var key in chars) {
        if (key.toLowerCase() === Botname.toLowerCase()) {
            console.log(Botname + ' Found')
            var i = Object.keys(chars).indexOf(key)
            global.botId = chars[Object.keys(chars)[i]].id
            break
        }
    }
    if (!botId) {
        die(Botname + ' was not found on this account')
    }
    console.log({
        botId: botId
    })
    var data = pack.pack([
        ['I', botId]
    ])
    var pp = auth.assemble_packet(auth.AOCP.LOGIN_SELECT, data)
    s.write(pp)
}
// RESPONSE HANDLERS //	
handle[auth.AOCP.LOGIN_ERROR] = function (data) {
    pack.unpackError(data)
    die()
}

handle[auth.AOCP.LOGIN_OK] = function () {
    console.log('Logged On')
	connectdb().done(function (connection) {
		Q.when(query(connection,'DELETE FROM online'),
			query(connection,'DELETE FROM uptime'),
			query(connection,'INSERT INTO uptime (start) VALUES (UNIX_TIMESTAMP(NOW()))'))
			.done(function() {
				connection.release()
			})
	})
}

handle[auth.AOCP.CLIENT_NAME] = function (data, u) {
    var userId = u.I()
    var userName = u.S()
    u.done()
	connectdb().done(function (connection) {
		getUserName(connection,userId).done(function(result) {
			if (result[0].length === 0 || (new Date() / 1000 - result[0][0].lastupdate) > 86400 ) { 
			query(connection,'DELETE FROM players WHERE charId ='+ userId)
			request('http://people.anarchy-online.com/character/bio/d/5/name/' + userName + '/bio.xml', function (error, response, body) {
				if (!error && response.statusCode == 200) {
					if (body.length > 10) { // check if xml is empty
						parseString(body, function (err, result) {
							charName = result.character.name[0]
							charStats = result.character.basic_stats[0]
							charOrg ={}
							charOrg.organization_name = 'Not in a guild'
							charOrg.rank = 'None'
							if (result.character.organization_membership !== undefined) { charOrg = result.character.organization_membership[0]
								} else {
									charOrg = {
									organization_name : 'Not in a guild',
									rank : 'None'	
									}
								}	
							charLastUpdated = result.character.last_updated[0]
							connection.query('INSERT INTO players (charid, firstname, name, lastname, level, breed, gender, faction, profession, profession_title, ai_rank, ai_level, guild, guild_rank, source, lastupdate) VALUES (' 
								+ userId 
								+ ',"' + charName.firstname + '",' 
								+ '"' + charName.nick + '",' 
								+ '"' + charName.lastname + '",' 
								+ charStats.level + ','
								+ '"' + charStats.breed + '",'
								+ '"' + charStats.gender + '",'
								+ '"' + charStats.faction + '",'
								+ '"' + charStats.profession + '",'
								+ '"' + charStats.profession_title + '",'
								+ '"' + charStats.defender_rank + '",'
								+ charStats.defender_rank_id + ','
								+ '"' + charOrg.organization_name + '",'
								+ '"' + charOrg.rank + '",'
								+ '"people.anarchy-online.com",'
								+ '(UNIX_TIMESTAMP(NOW())))', function(err, result) {
									if(err) {
										console.log(err)
										connection.release()
									}
									onClientName.emit(userId,userName)
									connection.release()	
									}
								)	
							})
						} else {
							connection.release()
						}	
					} else {
						backUpWhois(connection,userName,userId)
					}					
				}).on('error', function(err) {
					console.log('Error while trying to connect to AO People: ' + err)
					backUpWhois(connection,userName,userId)
				})
			} else {
				connection.release()
			}			
		})
	})
}

var backUpWhois = function (connection,userName,userId) {
	request('https://rubi-ka.net/services/characters.asmx/GetAoCharacterXml?name=' + userName, function (error, response, body) {
		if (!error && response.statusCode == 200 && body.length > 10) {
			parseString(body, function (err, result) {
				charName = result.character.name[0]
				charStats = result.character.basic_stats[0]
				charOrg ={}
				charOrg.organization_name = 'Not in a guild'
				charOrg.rank = 'None'
				if (result.character.organization_membership !== undefined) { charOrg = result.character.organization_membership[0]
					} else {
						charOrg = {
						organization_name : 'Not in a guild',
						rank : 'None'	
						}
					}	
				charLastUpdated = result.character.last_updated
				connection.query('INSERT IGNORE INTO players (charid, firstname, name, lastname, level, breed, gender, faction, profession, profession_title, ai_rank, ai_level, guild, guild_rank, source, lastupdate) VALUES (' 
					+ userId 
					+ ',"' + charName.firstname + '",' 
					+ '"' + charName.nick + '",' 
					+ '"' + charName.lastname + '",' 
					+ charStats.level + ','
					+ '"' + charStats.breed + '",'
					+ '"' + charStats.gender + '",'
					+ '"' + charStats.faction + '",'
					+ '"' + charStats.profession + '",'
					+ '"' + charStats.profession_title + '",'
					+ '"' + charStats.defender_rank + '",'
					+ charStats.defender_rank_id + ','
					+ '"' + charOrg.organization_name + '",'
					+ '"' + charOrg.rank + '",'
					+ '"https://rubi-ka.net",'
					+ '(UNIX_TIMESTAMP(NOW())))', function(err, result) {
						if(err) {
							console.log(err)
							connection.release()
						}
						onClientName.emit(userId,userName)
						}
					)	
				})
		} 
	}).on('error', function(err) {
		console.log('Error while trying to connect to Rubi-Ka.net: ' + err)
		connection.release()
	})
}	
handle[auth.AOCP.BUDDY_ADD] = function (data, u) { // handles online/offline status too
    var userId = u.I()
    var userStatus = u.I() == 1 ? 'online' : 'offline'
    var unknownPart = u.S()
    u.done()
	if (userStatus === 'online') {
		buddyStatus.emit('online', userId, userStatus)
	} else if (userStatus === 'offline') {
		buddyStatus.emit('offline', userId, userStatus)
	}   
}

handle[auth.AOCP.BUDDY_REMOVE] = function (data, u) {
    console.log('BUDDY_REMOVE')
    var userId = u.I()
    u.done()
    console.log('User with id:' + userId + ' removed')
	buddyStatus.emit('offline', userId)
}

handle[auth.AOCP.MESSAGE_PRIVATE] = function (data, u) {
    var userId = u.I()
    var text = u.S().replace(commandPrefix,'')
	var unknownPart = u.S()
    u.done()
	incMessage.emit('pm', userId, text)
	
}	
handle[auth.AOCP.MESSAGE_VICINITY] = function (data, u) { // not working properly
	var userId = u.I()
	var text = u.S()
}	
handle[auth.AOCP.MESSAGE_VICINITYA] = function (data, u) { // not tested
	var unkString = u.S()
	var text = u.S()
    var unknownPart = u.S()
	u.done()
}
handle[auth.AOCP.MESSAGE_SYSTEM] = function (data, u) {
	var systemMsg = u.S()
	u.done()
	console.log('System Message : ' + systemMsg)
}	
handle[auth.AOCP.CLIENT_LOOKUP] = function (data, u) {
    var userId = u.I()
    var userName = u.S()
    u.done()
    var idResult = userId
    outstandingLookups.emit(userName, idResult)
}

handle[auth.AOCP.CHAT_NOTICE] = function (data, u) {
    var someId= u.I()
    var data2 = u.I() // ?
    var data3 = u.I() // ?
    var text = u.S() 
	    u.done()
}

handle[auth.AOCP.PRIVGRP_CLIJOIN] = function (data, u) {
    var botId = u.I()
    var userId = u.I()
    u.done()
	privgrp.emit('join', userId)
    
}

handle[auth.AOCP.PRIVGRP_CLIPART] = function (data, u) {
    var botId = u.I()
    var userId = u.I()
    u.done()
	privgrp.emit('part', userId)
    
}

handle[auth.AOCP.PRIVGRP_PART] = function (data, u) {
    var botId = u.I()
    var userId = u.I()
    u.done()
}

handle[auth.AOCP.PRIVGRP_MESSAGE] = function (data, u) {
    var botId = u.I()
    var userId = u.I()
    var text = u.S()
    var unknownPart = u.S()
    u.done()
	incMessage.emit('grp', userId, text)
	
}

handle[auth.AOCP.PRIVGRP_REFUSE] = function (data, u) // Needs testing
{
    var arg1 = u.I()
    var arg2 = u.I()
    u.done()

}

handle[auth.AOCP.GROUP_ANNOUNCE] = function (data, u) {
    var buffer = u.G()
    var channelName = u.S()
    var unknownId = u.I()
	var unknownPart = u.S()
    u.done()
	channels.emit('new', channelName, buffer)
}

var extHandle = {}
handle[auth.AOCP.GROUP_MESSAGE] = function (data, u)
{
	var g = u.G()
	var userId = u.I()
	var text = u.E()
	var unknownPart = u.S()
	u.done()


		var ext = u.extMsg(text)

		if (ext.text)
		{
			//console.log({g : g, userId : userId, nonExtended : ext.text})
			if (g.slice(0,1).toString('hex') == 3) {
				incMessage.emit('org', userId, ext.text)
			}
			return
		}
		console.log({from: userId, category : ext.category, instance : ext.instance })
		var cats = {
			//MISC
			'501_ad0ae9b' : 'ORG_LEAVE_ALIGN', // alingment change
			
			// TOWERS	
			'506_c299d4' : 'NW_ATTACK',
			'506_8cac524' : 'NW_ABANDON',
			'506_70de9b2' : 'NW_OPENING',
			'506_5a1d609' : 'NW_TOWER_ATT_ORG',
			'506_d5a1d68' : 'NW_TOWER_ATT',
			'506_fd5a1d4' : 'NW_TOWER',
			
			// ORG
			'508_a5849e7' : 'ORG_JOIN',
			'508_2360067' : 'ORG_KICK',
			'508_2bd9377' : 'ORG_LEAVE',
			'508_8487156' : 'ORG_FORM',
			'508_88cc2e7' : 'ORG_DISBAND',
			'508_c477095'  : 'ORG_VOTE',
			'508_a8241d4'  : 'ORG_ORBITAL_STRIKE',
			
			//CITY
			'1001_01' : 'AI_CLOAK',
			'1001_02' : 'AI_RADAR',
			'1001_03' : 'AI_ATTACK',
			'1001_04' : 'AI_HQ_REMOVE',
			'1001_05' : 'AI_REMOVE_INIT',
			'1001_06' : 'AI_REMOVE',
			'1001_07' : 'AI_HQ_REMOVE_INIT',
			
			//FACTION
			 '2005_00' : 'Neutral',
			 '2005_01' : 'Clan',
			 '2005_02' : 'Omni'
  
		} 

		var key = ext.category + '_' + ext.instance

		if (key in cats)
		{
			if (cats[key] in extHandle)
			{
				console.log("extHandle.%s", cats[key])
				extHandle[cats[key]](ext.u)
			}
			else
			{
				console.log("No extHandle.%s", cats[key])
			}
		}
		else
		{
			console.log("Unknown extended message identifier: %s", key)
		}
	
}
// Extended Messages Handlers
extHandle.ORG_LEAVE_ALIGN = function(u) {
	var s1 = u.eS()
	send_GROUP_MESSAGE(s1 +  ' has left the organization because of alignment change.') 
}	
//TOWERS
extHandle.NW_ATTACK = function(u) {
//	var att_side = u.eS()
	var att_org = u.eS()
//	var att_name = u.eS()
//	var def_side = u.eS()
//	var def_org = u.eS()
//	var nw_zone = u.eS()
//	var coordX = u.eS()
//	var coordY = u.eS()
	u.done()
console.log(att_org)	
}	
extHandle.NW_ABANDON = function(u) {
//	var side = u.eS()
	var nw_org = u.eS()
	var nw_zone = u.eS()
	u.done()
	send_GROUP_MESSAGE('Notum Wars Update: The ' + side + ' organization ' + nw_org + ' lost their base in ' + nw_zone + '.')
}	
extHandle.NW_OPENING = function(u) {
	var nw_player = u.eS()
	var nw_pf = u.eS()
	var coords = u.eS()
	var def_org = u.eS()
	u.done()
	send_GROUP_MESSAGE(nw_player + ' just initiated an attack on playfield '+ nw_pf + ' at location ' + coords + '. That area is controlled by ' + def_org + '. All districts controlled by your organization are open to attack! You are in a state of war. Leader chat informed.')
	
}	
extHandle.NW_TOWER_ATT_ORG = function(u) {
	var nw_tower = u.eS()
	var nw_zone = u.eS()
	var nw_health = u.eS()
	var att_name = u.eS()
	var att_org	 = u.eS()
	u.done()
	send_GROUP_MESSAGE('The tower ' + nw_tower + ' in ' + nw_zone + ' was just reduced to ' + nw_health +  '% health by ' + att_name + ' from the ' + att_org + ' organization!')
}	
extHandle.NW_TOWER_ATT = function(u) {
	var nw_tower = u.eS()
	var nw_zone = u.eS()
	var nw_health = u.eS()
	var att_name = u.eS()
	u.done()
	send_GROUP_MESSAGE('The tower ' + nw_tower + ' in ' + nw_zone +  ' was just reduced to ' + nw_health + '% health by ' + att_name + '!')
}	
extHandle.NW_TOWER = function(u) {
	var nw_tower = u.eS()
	var nw_zone = u.eS()
	var nw_health = u.eS()
	u.done()
	send_GROUP_MESSAGE('The tower ' + nw_tower + ' in ' + nw_zone + ' was just reduced to ' + nw_health + '% health!')
}	

//ORG
extHandle.ORG_JOIN = function(u) {
    var s1 = u.eS()
    var s2 = u.eS()
	u.done()
    console.log(s1 + ' invited ' + s2 + ' to your organization.' )
}
extHandle.ORG_KICK = function(u) {
	var s1 = u.eS()
	var s2 = u.eS()
	u.done()
	send_GROUP_MESSAGE(s1 + ' kicked ' + s2 + ' from your organization')
}	
extHandle.ORG_LEAVE = function(u) {
	var s1 = u.eS()	
	u.done()
	send_GROUP_MESSAGE(s1 + ' has left your organization.')
}
extHandle.ORG_FORM = function(u) {
	var s1 = u.eS()
	var orgForm  = u.eS()
	u.done()
	send_GROUP_MESSAGE(s1 + ' changed the organization governing form to ' + orgForm)	
}	
extHandle.ORG_DISBAND = function(u) {
	var s1 = u.eS()
	u.done()
	send_GROUP_MESSAGE(s1 + ' has disbanded the organization')	
}	
extHandle.ORG_VOTE = function(u) {
	var voteSubj = u.eS()
	var voteDurantion = u.eS()
	var voteChoices = u.eS()
	u.done()
	send_GROUP_MESSAGE('Voting Notice: ' + voteSubj + '\n Candidates: \n' + voteChoices + '\n Duration: \n' + voteDurantion + ' minutes')
}
extHandle.ORG_ORBITAL_STRIKE = function(u) {
	var s1 = u.eS()
	u.done()
	send_GROUP_MESSAGE(s1 + ' has launched an orbital strike!')
}
// City

extHandle.AI_CLOAK = function(u) {
	var s1 = u.eS()
	var cloakStatus = u.eS()
	u.done()
	send_GROUP_MESSAGE(s1 + ' turned, the cloaking device in your city, ' + cloakStatus)
}
extHandle.AI_RADAR = function(u) {
	send_GROUP_MESSAGE('Your radar station is picking up alien activity in the area surrounding your city.')	
}	
extHandle.AI_ATTACK = function(u) {
	var cityZone = u.eS()
	send_GROUP_MESSAGE('Your city in ' + cityZone + ' has been targeted by hostile forces.')	
}	
extHandle.AI_HQ_REMOVE = function(u) {
	var s1 = u.eS()
	var cityZone = u.eS()
	u.done()
	send_GROUP_MESSAGE(s1 + ' removed the organization headquarters in ' + cityZone)
}
extHandle.AI_REMOVE_INIT = function(u) {
	var s1 = u.eS()
	var cityType = u.eS()
	var cityZone = u.eS()
	u.done()
	send_GROUP_MESSAGE(s1 + ' initiated removal of a ' + cityType + ' in ' + cityZone)	
}	
extHandle.AI_REMOVE = function(u) {
	var s1 = u.eS()
	var cityType = u.eS()
	var cityZone = u.eS()
	u.done()
	send_GROUP_MESSAGE(s1 + ' removed a ' + cityType + ' in ' + cityZone)	
}
extHandle.AI_HQ_REMOVE_INIT = function(u) {
	var s1 = u.eS()
	var cityZone = u.eS()
	u.done()
	send_GROUP_MESSAGE(s1 + ' initiated removal of the organization headquarters in ' + cityZone)
}	

// REQUEST HANDLERS //

global.send = function(type, spec) {
    s.write(auth.assemble_packet(type, pack.pack(spec)))
}

global.send_PRIVGRP_MESSAGE = function(chanId, text) {
    send(
    auth.AOCP.PRIVGRP_MESSAGE, [
        ['I', chanId],
        ['S', defaultFontColor + text + '</font>'],
        ['S', '\0']
    ])
}
global.send_MESSAGE_PRIVATE = function(userId, text) {
    console.log('%s -> %d', text, userId)
    send(
    auth.AOCP.MESSAGE_PRIVATE, [
        ['I', userId],
        ['S', defaultFontColor + text + '</font>'],
        ['S', '\0']
    ])
}

global.send_ONLINE_SET = function(arg) {
    console.log('SET ONlINE')
    send(
    auth.AOCP.ONLINE_SET, [
        ['I', arg]
    ])
}

global.send_PRIVGRP_KICK = function(userId) {
    send(
    auth.AOCP.PRIVGRP_KICK, [
        ['I', userId]
    ])
    console.log('Kicked ' + userId + ' from channel')
}

global.send_PRIVGRP_JOIN = function(userId) {
    send(
    auth.AOCP.PRIVGRP_JOIN, [
        ['I', userId]
    ])

}

global.send_PRIVGRP_PART = function(userId) {
    send(
    auth.AOCP.PRIVGRP_PART, [
        ['I', userId]
    ])

}

global.send_PRIVGRP_KICKALL = function() 
{
	send(
		auth.AOCP.PRIVGRP_KICKALL, 	[]
	)
	
}

global.send_CLIENT_LOOKUP = function(userName) {
    send(
    auth.AOCP.CLIENT_LOOKUP, [
        ['S', userName.toString()]
    ])

}

global.send_BUDDY_ADD = function(userId) {
    console.log('BUDDY_ADD_id %d', userId)
    send(
    auth.AOCP.BUDDY_ADD, [
        ['I', userId],
        ['S', '\u0001']
    ])
}

global.send_PRIVGRP_INVITE = function(userId) {
    console.log('Inviting user to chat')
    send(
    auth.AOCP.PRIVGRP_INVITE, [
        ['I', userId]
    ])
}

global.send_BUDDY_REMOVE = function(userId) {
    console.log('BUDDY_REMOVE_id %d', userId)
    send(
    auth.AOCP.BUDDY_REMOVE, [
        ['I', userId]
    ])
}



global.send_GROUP_MESSAGE = function(msg) {
	console.log('[Org]' + msg)
	send(
	auth.AOCP.GROUP_MESSAGE, [
		['G', orgBuffer],
		['S', defaultFontColor + msg + '</font>'],
		['S', 'foo']	
	])
}	
// EVENT HANDLERS //

incMessage.on('pm', function (userId, message) {
	console.log('[PM]' + message)
	connectdb().done(function (connection) {
		query(connection, 'SELECT * FROM uptime').done(function(result) {
			if	((new Date() / 1000 - result[0][0].start) > 5) {
					if (!message.match(/Away from keyboard/ig)) {	// if message is afk reply stop here
						if (cmd.hasOwnProperty(message.split(' ')[0].toLowerCase())) {
							checkAccess(userId).done(function(result) {
								var userAc = result
								query(connection, 'SELECT * FROM cmdcfg WHERE module = "Core" AND cmd = "' + message.split(' ')[0] + '"').done(function(result2) {
									if (result2[0].length === 0 || result2[0].length > 0 && result2[0][0].status === 'enabled' ) {
										if (result2[0].length === 0 || result2[0][0].access_req <= userAc) {
											isBanned(userId).done(function(result) {
												if (result === true) {
													send_MESSAGE_PRIVATE(userId, 'You are banned')
													connection.release()
													return
												}
												setTimeout(function() {
													if (message.split(' ').length === 1) {
														cmd[message.toLowerCase()](userId)
														connection.release()
													} else {
														var args = []
														for (var i = 1; i < message.split(' ').length; i++) {
															args.push(message.split(' ')[i])
														}
													//console.log(args)
													cmd[message.split(' ')[0].toLowerCase()](userId, args)
													connection.release()
													}
												}, 500)
											})
										} else {	
											if (message.split(' ')[0].toLowerCase() == 'join') {
												send_MESSAGE_PRIVATE(userId, 'Channel Locked')
											} else {
												send_MESSAGE_PRIVATE(userId, 'Access Denied')
											}
											connection.release()
										}
									} else { 
										connection.release()
										send_MESSAGE_PRIVATE(userId, 'Command Disabled')
									}
								})
							})
					} else {
						send_MESSAGE_PRIVATE(userId, 'Command not found')
						connection.release()
					}
				}
				
			}	else {
			connection.release()	
			}
		})
		
	})
})	

incMessage.on('grp', function (userId, message) {
    console.log("[Channel]" + userId + ": " + message)
    if (message[0].match(/\!/) && cmd.hasOwnProperty(message.split(' ')[0].replace(commandPrefix, '').toLowerCase())) {
        checkAccess(userId).done(function (result) {
            var userAc = result
            connectdb().done(function (connection) {
                query(connection, 'SELECT * FROM cmdcfg WHERE module = "Core" AND cmd = "' + message.split(' ')[0].replace(commandPrefix, '') + '"').done(function (result2) {
                    if (result2[0].length === 0 || result2[0].length > 0 && result2[0][0].status === 'enabled') {
                        if (result2[0].length === 0 || result2[0][0].access_req <= userAc) {
                            console.log('User acc' + userAc)

                            setTimeout(function () {
                                if (message.split(' ').length === 1) {
                                    cmd[message.replace(commandPrefix, '').toLowerCase()](userId)
                                } else {
                                    var args = []
                                    for (var i = 1; i < message.split(' ').length; i++) {
                                        args.push(message.split(' ')[i])
                                    }
                                    //console.log(args)
                                    cmd[message.split(' ')[0].replace(commandPrefix, '').toLowerCase()](userId, args)
                                }
                            }, 500)
                        } else {
                            send_MESSAGE_PRIVATE(userId, 'Access denied')
                            connection.release()
                        }
                    } else {
                        connection.release()
                        send_MESSAGE_PRIVATE(userId, 'Command Disabled')
                    }
                })
				connection.release()
            })
        })
    } else if (message[0].match(/\!/)) {
        send_MESSAGE_PRIVATE(userId, 'Command not found')
    }
})

incMessage.on('org', function (userId, message) {
	console.log('[' + ORG + ']'  + message)
	connectdb().done(function (connection) {
		query(connection, 'SELECT * FROM uptime').done(function(result) {
			if	((new Date() / 1000 - result[0][0].start) > 5) {
				if (message[0].match(/\!/) && cmd.hasOwnProperty(message.split(' ')[0].replace(commandPrefix, '').toLowerCase())) {
					checkAccess(userId).done(function (result) {
						var userAc = result
							query(connection, 'SELECT * FROM cmdcfg WHERE module = "Core" AND cmd = "' + message.split(' ')[0].replace(commandPrefix, '') + '"').done(function (result2) {
								if (result2[0].length === 0 || result2[0].length > 0 && result2[0][0].status === 'enabled') {
									if (result2[0].length === 0 || result2[0][0].access_req <= userAc) {
										console.log('User acc' + userAc)
										setTimeout(function () {
											if (message.split(' ').length === 1) {
												cmd[message.replace(commandPrefix, '').toLowerCase()](userId)
											} else {
												var args = []
												for (var i = 1; i < message.split(' ').length; i++) {
													args.push(message.split(' ')[i])
												}
												//console.log(args)
												cmd[message.split(' ')[0].replace(commandPrefix, '').toLowerCase()](userId, args)
											}
										}, 500)
									} else {
										send_MESSAGE_PRIVATE(userId, 'Access denied')
									}
								} else {
									send_MESSAGE_PRIVATE(userId, 'Command Disabled')
								}
							})
					})
				} else if (message[0].match(/\!/)) {
					send_MESSAGE_PRIVATE(userId, 'Command not found')
				}
	
			}
		})
		connection.release()
	})		
	
})	

buddyStatus.on('online', function (userId, userStatus) {
    if (ORG) {
	connectdb().done(function(connection) {
			query(connection,'SELECT * FROM members WHERE charid = ?',userId).done(function(result) {
				if (result[0].length == 0) { // Stop here if userID is not found in memberlist
					connection.release()
					return
				}
				// Check is user is already in online list, should prevent unnecessary spam in case something goes wrong (lag, etc)
				query(connection,'SELECT * FROM online WHERE charid = ?',userId).done(function(onlineCheck) {
					if (onlineCheck[0].length !== 0) {
					connection.release()
					return
				}
					query(connection,'INSERT IGNORE INTO online (charid, name) VALUES (' + userId + ',"' + result[0][0].name + '")').done(function() {
						send_GROUP_MESSAGE(result[0][0].name + ' is now online') // send to org channel or group channel
						connection.release()
					})
				})	
			})
		})
	} else {
		connectdb().done(function(connection) {
			getUserNameAsync(connection,userId).done(function(result) {
				query(connection,'INSERT INTO online (charid, name) VALUES (' + userId + ',"' + result[0][0].name + '")').done(function() {
					console.log(result[0][0].name + ' is now online.')
					connection.release()
				})
			})
		})
	}
})

buddyStatus.on('offline', function (userId, userStatus) {
    if (ORG) {
		connectdb().done(function (connection) {
			query(connection,'SELECT * FROM online WHERE charid = ?', userId).done(function(result) {
				if (result[0].length == 0) {
					connection.release()
					return
				}
				query(connection,'UPDATE members SET lastseen = UNIX_TIMESTAMP(NOW()) WHERE charid = ?', userId).then(function() {
					query(connection,'DELETE FROM online WHERE charid = ?', userId).done(function () {
						send_GROUP_MESSAGE(result[0][0].name + ' logged off') // send to org channel or group channel
						connection.release()
					})
				})
			})
		})
	} else {	
		connectdb().done(function (connection) {
			query(connection,'SELECT * FROM online WHERE charid = ?', userId).done(function(result) {
				if (result[0].length == 0) {
					connection.release()
					return
				}
				query(connection,'DELETE FROM online WHERE charid = ?', userId).done(function () {
					console.log(result[0][0].name + ' logged off') // send to org channel or group channel
					connection.release()
				})
			})
		})
	}
})

privgrp.on('join', function(userId) {
	connectdb().done(function(connection) {
		getUserName(connection, userId).done(function(result) {
			query(connection,'INSERT INTO channel (charId,name) VALUES (' + userId + ',"' + result[0][0].name + '")').done(function() {
				send_PRIVGRP_MESSAGE(botId, result[0][0].name + ' joined the channel') 
				
			})
		})
		query(connection, 'SELECT * FROM members WHERE charid =' + userId).done(function(result) {
			if (result[0].length === 0) {
				console.log(result[0])
			} 
		})
		connection.release()
	})	
})

privgrp.on('part', function(userId) {
	connectdb().done(function(connection) {
		getUserName(connection, userId).done(function(result) {
			query(connection,'DELETE FROM raidforce WHERE name= "' + result[0][0].name + '"').done(function() {
				send_PRIVGRP_MESSAGE(botId, result[0][0].name + ' left the raid') 
			})
			query(connection,'DELETE FROM channel WHERE name= "' + result[0][0].name + '"').done(function() {
				send_PRIVGRP_MESSAGE(botId, result[0][0].name + ' left the channel')
			})
		})
		connection.release()
	})	
})	
global.Channels = {}
channels.on('new', function(chName,chBuffer) {
	Channels[chName] =  chBuffer
	
	if (chBuffer.slice(0,1).toString('hex') == 3) {
		global.orgBuffer = new Buffer(chBuffer)
	}	
	
})
