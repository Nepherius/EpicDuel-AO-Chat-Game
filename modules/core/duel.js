var Q = require('q')
var moment = require('moment')
var capitalize = require('underscore.string/capitalize')
var async = require('async')
exports.register = register = function(userId) {
	connectdb().done(function(connection) {
		query(connection, 'SELECT * FROM members WHERE charId = ' + userId).done(function (result) {
			if (result[0].length !== 0) { //first check if player is already a member
					send_MESSAGE_PRIVATE(userId,' You are already a member')
					connection.release()
			} else {
				query(connection,'SELECT * FROM players WHERE charId = ?', userId).done(function(result) {
					if (result[0][0].level >= 1) {
						//	query(connection,'INSERT INTO members (charId, name, main) VALUES (' + userId + ',"' + result[0][0].name + '","' + result[0][0].name +'")').done(function() {
						//	send_BUDDY_ADD(userId)
						//	send_MESSAGE_PRIVATE(userId, 'You are now a member')
						//	connection.release()
						//})
						regScreen(userId)
						connection.release()
					} else {
						send_MESSAGE_PRIVATE(userId, 'Your level must be at least 50')
						connection.release()
					}
				})
			}	
		})	
	})
}

var regScreen = function(userId) {
	send_MESSAGE_PRIVATE(userId, blob('Choose breed', regMsg))	
}
var regMsg = '<center> <font color=#FFFF00> :::Breed Selection:: </font> </center> \n\n'
regMsg += '<font color=#FF0000>Breed cannot be changed once slected! </font>\n\n'
regMsg += '<font color=#00FFFF>Atrox: </font> Atroxes are known for their strength and endurance however they are quite slow.\n'
regMsg += 'HP: 45\n'
regMsg += 'Str: 20\n'
regMsg += 'Agil: 5\n'
regMsg += 'Intel: 5\n'
regMsg += 'Evasion: 2%\n'
regMsg += 'Special trigger chance: 3%\n'
regMsg += 'Base Dmg:2-5\n'
regMsg += tellBlob('Epicduel', 'setbreed atrox', 'Atrox I choose you!') + '\n\n'
regMsg += '<font color=#00FFFF>Solitus: </font> Jack of all trades, master of none\n'
regMsg += 'HP: 40\n'
regMsg += 'Str: 15\n'
regMsg += 'Agil: 8\n'
regMsg += 'Intel: 10\n'
regMsg += 'Evasion: 3%\n'
regMsg += 'Special trigger chance: 10%\n'
regMsg += 'Base Dmg:1-4\n'
regMsg += tellBlob('Epicduel', 'setbreed solitus', 'Solitus I choose you!') + '\n\n'
regMsg += '<font color=#00FFFF>Opefix: </font> Float like a butterfly sting like a bee.\n'
regMsg += 'HP: 35\n'
regMsg += 'Str: 10\n'
regMsg += 'Agil: 20\n'
regMsg += 'Intel: 8\n'
regMsg += 'Evasion: 6%\n'
regMsg += 'Special trigger chance: 8%\n'
regMsg += 'Base Dmg:2-4\n'
regMsg += tellBlob('Epicduel', 'setbreed opifex', 'Opifex I choose you!') + '\n'
regMsg += '<font color=#00FFFF>Nanomage: </font> If you want to shoot lightning out of your fingers.\n'
regMsg += 'HP: 30\n'
regMsg += 'Str: 5\n'
regMsg += 'Agil: 5\n'
regMsg += 'Intel: 20\n'
regMsg += 'Evasion: 3%\n'
regMsg += 'Special trigger chance: 30%\n'
regMsg += 'Base Dmg:1-3\n'
regMsg += tellBlob('Epicduel', 'setbreed nanomage', 'Nanomage I choose you!') + '\n'

exports.setbreed = setbreed = function(userId,args) {
	if(!args) {
		send_MESSAGE_PRIVATE(userId, 'You need to specify a breed')
		return
	}
	var breed = args[0]
	connectdb().done(function(connection) {
		query(connection, 'SELECT * FROM members WHERE charid = ?', userId).done(function(result) {
			if(result[0].length !== 0) {
				send_MESSAGE_PRIVATE(userId, 'You can\'t change your breed')
				connection.release()
				return
			} else {
				getUserName(connection,userId).done(function(result) {
					userName = result[0][0].name
					if(breed == 'atrox') {
						query(connection, 'INSERT INTO members (charid,name,main,breed,hp,str,agil,intel,evasion,special, mindmg, maxdmg) VALUES (' + userId + ',"' + userName + '","' + userName + '","atrox", 45, 20,5,5,2,3,2,5)').done(function() {
							connection.release()
						})
					} else if(breed == 'solitus') {
						query(connection, 'INSERT INTO members (charid,name,main,breed,hp,str,agil,intel,evasion,special, mindmg, maxdmg) VALUES (' + userId + ',"' + userName + '","' + userName + '","solitus", 40, 15,8,10,3,10,1,4)').done(function() {
							connection.release()
						})
					} else if(breed == 'opifex') {
						query(connection, 'INSERT INTO members (charid,name,main,breed,hp,str,agil,intel,evasion,special, mindmg, maxdmg) VALUES (' + userId + ',"' + userName + '","' + userName + '","opifex", 35, 10,20,8,6,8,2,4)').done(function() {
							connection.release()
						})
					} else if(breed == 'nanomage') {
						query(connection, 'INSERT INTO members (charid,name,main,breed,hp,str,agil,intel,evasion,special, mindmg, maxdmg) VALUES (' + userId + ',"' + userName + '","' + userName + '","nanomage", 30, 5,5,20,2,30,1,3)').done(function() {
							connection.release()
						})
					} else {
							send_MESSAGE_PRIVATE(userId, 'Invalid breed choice!')
					}
					chooseProf(userId)
				})
			}
		})
	})
}
exports.setprof = setprof = function(userId,args) {
	if(!args) {
		send_MESSAGE_PRIVATE(userId, 'You need to specify a profession.')
	}
	connectdb().done(function(connection) {
		query(connection,'SELECT * FROM members WHERE charid = ?', userId).done(function(result){
			if (result[0].length === 0){
				send_MESSAGE_PRIVATE(userId, 'There\'s an order to do things in, try !register first')
				connection.release()
				return
			} else if (result[0][0].prof !== 'no') {
				send_MESSAGE_PRIVATE(userId, 'You already have a profession!')
				connection.release()
				return
			} else {
				if(!Professions.hasOwnProperty(args)) {
					send_MESSAGE_PRIVATE(userId, 'That\'s not a valid profession.')
					connection.release()
					return
				}
				query(connection, 'UPDATE members SET prof = ? WHERE charid = ' + userId, args[0]).done(function() {
					send_MESSAGE_PRIVATE(userId, 'WOW! You are so good at this.I feel bad for your opponents already. ' +blob('Getting Started', welcomeMsg))
					connection.release()
				})
			}
		})
	})
}

var welcomeMsg = '<center> <font color=#FFFF00> :::Welcome To Epic Duel::: </font> </center> \n\n'
welcomeMsg += 'Here is a short list of commands that will help you dominate the arena: \n'
welcomeMsg += tellBlob('Epicduel', '!status', 'Status') + ' - See your character status\n'
welcomeMsg += tellBlob('Epicduel', '!top', 'Top') + ' - See the top players\n'
welcomeMsg += '!duel \<player name\> - Most important command of all, use it to crush your opponents!\n' 
welcomeMsg += '!viewduel \<duel Id\> - You can use this to show your friends how fast you killed your opponnents\n\n' 
welcomeMsg += '<font color=#FF0000>DISCLAIMER: All breed names, class names, bugs and balancing issues are sole property of FUNCOM(tm) and I claim no credit!</font>'

var chooseProf = function(userId) {
	var setProfMsg = '<center> <font color=#FFFF00> :::Choose a profession::: </font> </center> \n\n'
	for (prof in Professions) {
		setProfMsg += '\n<img src=tdb://id:GFX_GUI_FRIENDLIST_SPLITTER>\n'
		setProfMsg += Professions[prof].icon
		setProfMsg += '<font color=#FFFF00> ' + prof + '</font>\n'
		setProfMsg += 'Special Ability: ' + Professions[prof].ability + '\n'
		setProfMsg += tellBlob('Epicduel', 'setprof ' + prof, 'Choose ' +  prof)
		setProfMsg += '\n<img src=tdb://id:GFX_GUI_FRIENDLIST_SPLITTER>\n'
	}
	send_MESSAGE_PRIVATE(userId,'Great choice, now choose a profession: ' + blob('Professions', setProfMsg))
}



exports.viewduel = viewduel = function(userId, args) {
	if (!args) {
		send_MESSAGE_PRIVATE(userId, '!viewduel \<Duel Id\>')
		return
	}
	connectdb().done(function(connection) {
		query(connection, 'SELECT * FROM duelhistory WHERE duelid = ?', args[0]).done(function(result) {
			if (result[0].length === 0) {
				send_MESSAGE_PRIVATE(userId, 'Invalid Duel Id')
				connection.release()
				return
			}
			var viewduelReply = '<center> <font color=#FFFF00> :::Duel ' +  args[0] + ' Results::: </font> </center> \n\n'
			viewduelReply += '<font color=#00FFFF>Attacker</font>: ' + result[0][0].attacker + '\n'
			viewduelReply += '<font color=#00FFFF>Defender</font>: ' + result[0][0].defender + '\n'
			viewduelReply += '<font color=#00FFFF>Winner</font>: ' + result[0][0].winner + '\n'
			viewduelReply += '<font color=#00FFFF>Date</font>: ' + moment(moment.unix(result[0][0].date)).fromNow() + '\n\n'
			viewduelReply += result[0][0].battlelog + '\n'
			send_MESSAGE_PRIVATE(userId, blob('View Duel Id '  + args[0], viewduelReply))
			connection.release()
		})
	})
}
exports.status = status = function(userId) {
	connectdb().done(function(connection) {
		query(connection, 'SELECT * FROM members WHERE charid = ?', userId).done(function(result) {
			connection.release()
			var statusReply = '<center> <font color=#FFFF00> :::Character Status:: </font> </center> \n\n'
			statusReply += '<font color=#00FFFF>Breed</font>: ' + result[0][0].breed + '\n'
			statusReply += '<font color=#00FFFF>Profession</font>: ' + result[0][0].prof + '\n'
			statusReply += '<font color=#00FFFF>Level</font>: ' + result[0][0].level + '\n'
			statusReply += '<font color=#00FFFF>XP</font>: ' + result[0][0].xp + '/' + Levels[result[0][0].level + 1] + '\n'
			statusReply += '<font color=#00FFFF>HP</font>: ' + result[0][0].hp + '\n'
			statusReply += '<font color=#00FFFF>Strength</font>: ' + result[0][0].str + '\n'
			statusReply += '<font color=#00FFFF>Agility</font>: ' + result[0][0].agil + '\n'
			statusReply += '<font color=#00FFFF>Intelligence</font>: ' + result[0][0].intel + '\n'
			statusReply += '<font color=#00FFFF>Evasion</font>: ' + result[0][0].evasion + '\n'
			statusReply += '<font color=#00FFFF>Special Ability</font>: ' + result[0][0].special + '\n'
			statusReply += '<font color=#00FFFF>Base Dmg</font>:' + result[0][0].mindmg + '-' + result[0][0].maxdmg +'\n\n'
			statusReply += '<font color=#00FFFF>Battles Won</font>: ' + result[0][0].won + '\n'
			statusReply += '<font color=#00FFFF>Battles Lost</font>: ' + result[0][0].lost + '\n'
			statusReply += '<font color=#00FFFF>Attack Notify</font>: ' + result[0][0].notify + '\n'
			send_MESSAGE_PRIVATE(userId, blob('Status', statusReply))
		})
	})
}
exports.attacks = attacks = function(userId) {
	connectdb().done(function(connection) {
		query(connection, 'SELECT duelhistory.* FROM duelhistory INNER JOIN members ON members.name = duelhistory.attacker WHERE members.charid = ? ORDER BY duelid LIMIT 50', userId).done(function(result) {
			connection.release()
			var attackHistoryMsg = '<center> <font color=#FFFF00> :::Your last 50 attacks:: </font> </center> \n\n'
			result[0].map(function(res) {
				attackHistoryMsg += '<font color=#00FFFF>Duel Id:</font> ' + res.duelid + ' <font color=#00FFFF>Defender:</font> ' + res.defender + (res.attacker === res.winner ? ' <font color=#00FF00>You Won</font> ' : ' <font color=#FF0000>You Lost</font> ') + tellBlob('Epicduel', 'viewduel ' + res.duelid, 'Battle Log') + ' \n'
			})
			send_MESSAGE_PRIVATE(userId, blob('Attack History', attackHistoryMsg))
		})
	})
}
exports.defense = defense = function(userId) {
	connectdb().done(function(connection) {
		query(connection, 'SELECT duelhistory.* FROM duelhistory INNER JOIN members ON members.name = duelhistory.defender WHERE members.charid = ? ORDER BY duelid ASC LIMIT 50', userId).done(function(result) {
			connection.release()
			var attackHistoryMsg = '<center> <font color=#FFFF00> :::Defense History:: </font> </center> \n\n'
			result[0].map(function(res) {
				attackHistoryMsg += '<font color=#00FFFF>Duel Id:</font> ' + res.duelid + ' <font color=#00FFFF>Attacker :</font> ' + res.attacker + (res.defender === res.winner ? ' <font color=#00FF00>You Won</font> ' : ' <font color=#FF0000>You Lost</font> ') + tellBlob('Epicduel', 'viewduel ' + res.duelid, 'Battle Log') + ' \n'
			})
			send_MESSAGE_PRIVATE(userId, blob('Defense History', attackHistoryMsg))
		})
	})
}
global.Professions = {
		'Adventurer': {
			icon: '<img src=rdb://84211>',
			ability: 'Damage Absorb - Some specials bypass it, strength and intel based'
		},
		'Agent': {
			icon: '<img src=rdb://16186>',
			ability: 'Aimed Shot - Ignores some shields, agility based.' 
		},
		'Bureaucrat': {
			icon: '<img src=rdb://16341>',
			ability: 'Bodyguard - Permanent, power increases with level.'
		},
		'Doctor': {
			icon: '<img src=rdb://44235>',
			ability: 'Heal - Restores some hp, intel based.'
		},
		'Enforcer': {
			icon: '<img src=rdb://117926>',
			ability: 'Stun - Stuns opponent for 1 round.'
		},
		'Engineer': {
			icon: '<img src=rdb://44135>',
			ability: 'Special Attack Block - Permanent, Blocks all special attacks.'
		},
		'Fixer': {
			icon: '<img src=rdb://16300>',
			ability: 'Evade - Evades the next attack.'
		},
		'Keeper': {
			icon: '<img src=rdb://39250>',
			ability: 'Healing Aura - Permanent, strength based. '
		},
		'Martial-Artist': {
			icon: '<img src=rdb://16196>',
			ability: 'Critical Hit - Permanent, deals 2.5 times max base damage.'
		},
		'Meta-Physicist': {
			icon: '<img src=rdb://16308>',
			ability: 'Nano Shutdown - Permanent, prevents some opponents from casting ablities.'
		},
		'Nano-Technician': {
			icon: '<img src=rdb://16283>',
			ability: 'Shock - Ignores ALL shields, increases with base dmg and intel.'
		},
		'Shade': {
			icon: '<img src=rdb://39290>',
			ability: 'Sneak Attack - Hits opponent for 15% of hes total HP, increases with strength.'					
		},
		'Soldier': {
			icon: '<img src=rdb://16237>',
			ability: 'Deflect Shield - Deflects a percent of the damage received next round, based on str.'
		},
		'Trader': {
			icon: '<img src=rdb://117924>',
			ability: 'Drain.'
		}
}