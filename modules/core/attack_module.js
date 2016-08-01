var Q = require('q')
var moment = require('moment')
var capitalize = require('underscore.string/capitalize')
var async = require('async')

exports.duel = duel = function(userId, defender) {
	if (!defender) {
		send_MESSAGE_PRIVATE(userId, '!duel \<player name \>')
		return;
	}
	var defender = capitalize(defender[0].toLowerCase())
	connectdb().done(function(connection) {
		checkLock(userId).done(function(result) {
			if(result) {
				send_MESSAGE_PRIVATE(userId, 'You\'re still licking your wounds after the last duel, you can fight again in ' + result)
				connection.release()
				return
			}
			query(connection, 'SELECT * FROM members WHERE charid =?', userId).done(function(result) {
				if (result[0][0].prof === 'no') {
					send_MESSAGE_PRIVATE(userId, 'You need to select a profession first.')
					connection.release
					return
				}
				query(connection,'SELECT * FROM members WHERE name = ?', defender).done(function(result) {
					if (result[0].length === 0) {
						send_MESSAGE_PRIVATE(userId, defender + ' is not a member!')
						connection.release()
					} else if (userId == result[0][0].charid) {
						send_MESSAGE_PRIVATE(userId, 'You punch yourself in the face, you\'re probably a trox ...')
						connection.release()
					} else {
						getUserName(connection,userId).done(function(result) {
							prepareAttack(result[0][0].name, defender)
							connection.release()
						})
					}			
				})
			})
		})
	})
}
var prepareAttack = function(attacker,defender) {
	connectdb().done(function(connection) {
		query(connection,'SELECT * FROM members WHERE name = ?', attacker).done(function(result) {
			var attackerData = result[0][0]
			query(connection,'SELECT * FROM members WHERE name = ?', defender).done(function(result) {
				var defenderData = result[0][0]
				duelCooldown(attackerData.name,  defenderData.name).done(function(result) {
					if (result) {
						send_MESSAGE_PRIVATE(attackerData.charid, 'You can only duel the same player once every 2 hours, time left ' + result)
						connection.release()
						return
					}
					var attackerHp = attackerData.hp
					var defenderHp = defenderData.hp
					var battleLog =' <center> <font color=#FFFF00> :::Battle Log:: </font> </center> \n\n'
					var round = 0
					var attackerAbsorb = 0
					var defenderAbsorb = 0
					var attackerStunned = false
					var defenderStunned = false
					var attackerEvade = false
					var defenderEvade = false
					var attackerDeflect = false
					var defenderDeflect = false
					var attackerDrained = false
					var defenderDrained = false
					// Initiate attack sequence
					async.whilst(
						function () { return defenderHp > 0 && attackerHp > 0},
						function (callback) {
							if (round > 50) { // Mostly due to the limit of AO character limit
									battleLog = '<center> <font color=#FFFF00> :::Battle Log:: </font> </center> \n\n'
									battleLog += '<center> Long Fight detected, skipping to the end ... </center>'
							}
							hit(attackerData,defenderData,defenderEvade).done(function(result) {
								round++ 
								battleLog += '\n<font color=#FFFFFF>' + attackerData.name + '</font>: ' + Number(attackerHp).toFixed(2) + ' HP  || <font color=#008000>' + defenderData.name + '</font>: ' + Number(defenderHp).toFixed(2) + ' HP || Round: '+ round + '\n'
								battleLog += '<img src=tdb://id:GFX_GUI_FRIENDLIST_SPLITTER><img src=tdb://id:GFX_GUI_FRIENDLIST_SPLITTER>\n'
								if (!attackerStunned) {	
									if (result === 'miss') { // Miss
										if (defenderEvade) { defenderEvade = false }
										if (defenderDeflect = true) { defenderDeflect = false }
										battleLog += '<font color=#FFFFFF>' + attackerData.name + '</font> tried to hit <font color=#008000>' + defenderData.name + '</font> but missed.\n'
									} else if (result === 'crit') {// Critical
										if (defenderAbsorb > 0) { // check if any specials are in play
											var dmgLeftAfterAbsorb = attackerData.maxdmg * 2 >= defenderAbsorb ? (attackerData.maxdmg * 2) - defenderAbsorb : defenderAbsorb - (attackerData.maxdmg * 2) 
											battleLog += '<font color=#FFFFFF>' + attackerData.name + '</font> hit <font color=#008000>' + defenderData.name + '</font> for <font color=#FF0000>' + dmgLeftAfterAbsorb.toFixed(2) + ' dmg</font>. Critical Hit!\n'
											defenderHp -= dmgLeftAfterAbsorb.toFixed(2)
											defenderAbsorb = defenderAbsorb - dmgLeftAfterAbsorb > 0 ? (defenderAbsorb - dmgLeftAfterAbsorb).toFixed(2) : 0
										} else if (defenderDeflect) {
											var defenderDeflectAmount = (attackerData.maxdmg * 2) * 0.3
											battleLog += '<font color=#FFFFFF>' + attackerData.name + '</font> hit <font color=#008000>' + defenderData.name + '</font> for <font color=#FF0000>' + (attackerData.maxdmg * 2) - defenderDeflectAmount + ' dmg</font>. Critical Hit!\n'
											defenderHp = Number(defenderHp) - ((attackerData.maxdmg * 2) - defenderDeflectAmount)
											battleLog += '<font color=#FFFFFF>' + attackerData.name + ' </font>is hit by ' + defenderDeflectAmount + ' shield damage\n'
											attackerHp = Number(attackerHp) - defenderDeflectAmount
											defenderDeflect = false
										} else {
											battleLog += '<font color=#FFFFFF>' + attackerData.name + '</font> hit <font color=#008000>' + defenderData.name + '</font> for <font color=#FF0000>' + attackerData.maxdmg * 2 + ' dmg</font>. Critical Hit!\n'
											defenderHp = Number(defenderHp) - (attackerData.maxdmg * 2)
										}
									} else { // Regular
										if (attackerAbsorb > 0) { // check if any specials are in play
											var dmgLeftAfterAbsorb = result >= defenderAbsorb ? (result) - defenderAbsorb : defenderAbsorb - (result)   
											battleLog += '<font color=#FFFFFF>' + attackerData.name + '</font> hit <font color=#008000>' + defenderData.name + '</font> for <font color=#FF0000>' + dmgLeftAfterAbsorb.toFixed(2) + ' dmg</font>.\n'
											defenderHp -= dmgLeftAfterAbsorb.toFixed(2)
											defenderAbsorb = defenderAbsorb - dmgLeftAfterAbsorb > 0 ? (defenderAbsorb - dmgLeftAfterAbsorb).toFixed(2) : 0
										} else if (defenderDeflect) {
											var defenderDeflectAmount = result * 0.3
											battleLog +='<font color=#FFFFFF>' + attackerData.name + '</font> hit <font color=#008000>' + defenderData.name + '</font> for <font color=#FF0000>' + (result - defenderDeflectAmount).toFixed(2)+ ' dmg</font>.\n'
											defenderHp = Number(defenderHp) - (result - defenderDeflectAmount)
											battleLog += '<font color=#FFFFFF>' + attackerData.name + '</font> is hit by ' + defenderDeflectAmount.toFixed(2) + ' shield damage\n'
											attackerHp = Number(attackerHp) - defenderDeflectAmount
											defenderDeflect = false
										} else {
											battleLog +='<font color=#FFFFFF>' + attackerData.name + '</font> hit <font color=#008000>' + defenderData.name + '</font> for <font color=#FF0000>' + result + ' dmg</font>.\n'
											defenderHp = (defenderHp - result).toFixed(2)
										}
									}
								}	
									triggerSpecial(attackerData).done(function(specResult) {
										if (!attackerStunned) {
											if (specResult) {
												battleLog += 'Ability: '
												switch(attackerData.prof) {
													case 'Adventurer':
														attackerAbsorb = (attackerData.intel * 0.05) + (attackerData.str * 0.10)
														battleLog += attackerData.name + '\`s shield will absorb ' + attackerAbsorb + ' dmg.\n'
													break;
													case 'Agent':
														if (defenderData.prof === 'Engineer') {
																battleLog += 'Aimed Shot blocked by shield\n'
														} else {
															var aimedShot = attackerData.agil * 0.50
															battleLog += attackerData.name + ' uses Aimed Shot and hits ' + defenderData.name + ' with ' + aimedShot + ' dmg\n'
															defenderHp = Number(defenderHp) - aimedShot
														}
													break;
													case 'Bureaucrat':
														var bodyguard = Number(attackerData.level) + (attackerData.intel * 0.05)
														battleLog += 'Bodyguard hits ' + defenderData.name + ' with ' + bodyguard + ' dmg\n'
														defenderHp = Number(defenderHp) - bodyguard
													break;
													case 'Enforcer':
														battleLog += attackerData.name + ' stunned ' + defenderData.name + ' for 1 round.\n'
														defenderStunned = true
													break;
													case 'Doctor':
														if (defenderData.prof === 'Meta-Physicist') {
															battleLog += 'Unable to cast heal due to Nano Shutdown\n'
														} else {
															var heal = attackerData.hp == attackerHp ? 0 : (attackerData.intel * 0.10) + 6
															if (attackerData.hp == attackerHp) {
																heal = 0;
															} else if (Number(attackerHp) + heal > attackerData.hp) {
																heal = heal - (Number(attackerHp) + heal - attackerData.hp)
															}
															battleLog += attackerData.name + ' healed himself for ' + heal.toFixed(2) + ' hp.\n'
															attackerHp = Number(attackerHp) + heal
														}
													break;
													case 'Fixer':
														battleLog += attackerData.name + ' will evade next attack\n'
														attackerEvade = true
													break;
													case 'Keeper':
														var healingAura = attackerData.hp == attackerHp ? 0 : (attackerData.str * 0.05) + Number(attackerData.level) 
														if (attackerData.hp == attackerHp) {
															healingAura = 0;
														} else if (Number(attackerHp) + healingAura > attackerData.hp) {
															healingAura = healingAura - (Number(attackerHp) + healingAura - attackerData.hp)
														}
														battleLog += ' Healing Aura restored ' + healingAura.toFixed(2) + ' of ' + attackerData.name + '`s health\n'
														attackerHp = Number(attackerHp) + healingAura
														break;
													case 'Martial-Artist':
														var maCrit = Number(attackerData.maxdmg) * 2.5 
														battleLog += attackerData.name + ' hits ' + defenderData.name + ' with ' + maCrit.toFixed(2) + ' dmg. Critical!\n'
														defenderHp = Number(defenderHp) - maCrit
													break;
													case 'Nano-Technician':
														if (defenderData.prof === 'Meta-Physicist') {
															battleLog += 'Unable to cast Shock due to Nano Shutdown\n'
														} else {
															var nanoDmg = Number(attackerData.maxdmg) * 2 + Number(attackerData.intel) * 0.10
															battleLog += attackerData.name + ' shocks ' + defenderData.name + ' and deals ' + nanoDmg.toFixed(2) + ' dmg\n'
															defenderHp -= Number(defenderHp) - nanoDmg
														}
													break;
													case 'Shade':
														if (defenderData.prof === 'Engineer') {
															battleLog += 'Sneak Attack blocked by shield\n'
														} else {
															var shadeDmg = (Number(attackerData.str) * 0.0005 + 0.15) * Number(defenderData.hp)
															battleLog += attackerData.name + ' sneaks behind ' + defenderData.name + ' and deals ' + shadeDmg + ' dmg\n'
															defenderHp = Number(defenderHp) - shadeDmg	
														}
													break;
													case 'Soldier':
														if (defenderData.prof === 'Meta-Physicist') {
															battleLog += 'Unable to cast Deflet Shield due to Nano Shutdown\n'
														} else {
															attackerDeflect = true
															battleLog += attackerData.name + ' will deflect some of the damage received. \n'
														}	
													break;
													case 'Trader':
														if (defenderData.prof === 'Meta-Physicist') {
															battleLog += 'Unable to cast Drain due to Nano Shutdown\n'
														} else {
															battleLog += attackerData.name + ' casts drain on ' + defenderData.name + '.\n'
															defenderDrained = true;
															var defenderDrainAmount = 0.25
															if (defenderData.mindmg > 0) {
																attackerData.mindmg += defenderDrainAmount
																defenderData.mindmg -= defenderDrainAmount
															} else if (defenderData.mindmg < 0) {
																defenderData.mindmg = 0
															}
															if (defenderData.maxdmg > 0) {
																attackerData.maxdmg += defenderDrainAmount
																defenderData.maxdmg -= defenderDrainAmount
															} else if (defenderData.maxdmg < 0) {
																defenderData.maxdmg = 0
															}
														}
													break;
													default: // This shouldnt happen
														battleLog += attackerData.name + ' has no valid profession set!\n'
												}
											}
										} else { // If attacker is stunned
											battleLog += attackerData.name + ' is stunned and cannot act.\n'
											attackerStunned = false
											if (attackerData.prof == 'Bureaucrat') {
												var bodyguard = Number(attackerData.level) + (attackerData.intel * 0.05)
												battleLog += 'Bodyguard hits ' + defenderData.name + ' with ' + bodyguard + ' dmg\n'
												defenderHp = Number(defenderHp) - bodyguard
											}
										}								
									if (defenderHp <= 0) { // Dead people can't hit back, stop here
										setTimeout(callback, 100)
									} else if (defenderStunned) { // If defender is stunned
										battleLog+= defenderData.name + ' is stunned and cannot act.\n'
										defenderStunned = false
										var bodyguard = Number(attackerData.level) + (defenderData.intel * 0.05)
										battleLog += 'Bodyguard hits ' + attackerData.name + ' with ' + bodyguard + ' dmg\n'
										attackerHp -= bodyguard
										setTimeout(callback, 100)
									} else {
										hit(defenderData,attackerData,attackerEvade).done(function(result) {
											if (result === 'miss') {
												battleLog += '<font color=#008000>' + defenderData.name + '</font> tried to hit <font color=#FFFFFF>' + attackerData.name + '</font> but missed.\n'
												if (attackerEvade = true) { attackerEvade = false }
												if (attackerDeflect = true) { attackerDeflect = false }
											} else if (result === 'crit') { // Critical
												if (attackerAbsorb > 0) { // check if any specials are in play
													var dmgLeftAfterAbsorb = defenderData.maxdmg * 2 >= attackerAbsorb ? (defenderData.maxdmg * 2) - attackerAbsorb : attackerAbsorb - (defenderData.maxdmg * 2) 
													battleLog += '<font color=#008000>' + defenderData.name + '</font> hit <font color=##FFFFFF>' + attackerData.name + '</font> for <font color=#FF0000>' + dmgLeftAfterAbsorb.toFixed(2) + ' dmg</font>. Critical Hit!\n'
													attackerHp -= dmgLeftAfterAbsorb.toFixed(2)
													attackerAbsorb = attackerAbsorb - dmgLeftAfterAbsorb > 0 ? (attackerAbsorb - dmgLeftAfterAbsorb).toFixed(2) : 0
												} else if (attackerDeflect) {
													var attackerDeflectAmount = (defenderData.maxdmg * 2) * 0.3
													battleLog += '<font color=#008000>' + defenderData.name + '</font> hit <font color=#FFFFFF>' + attackerData.name + '</font> for <font color=#FF0000>' + (defenderData.maxdmg * 2) - attackerDeflectAmount + ' dmg</font>. Critical Hit!\n'
													attackerHp = Number(attackerHp) - ((defenderData.maxdmg * 2) - attackerDeflectAmount)
													battleLog += '<font color=#008000>' + defenderData.name + ' </font>is hit by ' + attackerDeflectAmount + ' shield damage\n'
													defenderHp = Number(defenderHp) - attackerDeflectAmount
													attackerDeflect = false
												} else {
													battleLog += '<font color=#008000>' + defenderData.name + '</font> hit <font color=#FFFFFF' + attackerData.name + '</font> for <font color=#FF0000>' + defenderData.maxdmg * 2 + ' dmg</font>. Critical Hit!\n'
													attackerHp -= defenderData.maxdmg * 2
												}
											} else { // Regular Hit
												if (attackerAbsorb > 0) { // check if any specials are in play
													var dmgLeftAfterAbsorb = result >= attackerAbsorb ? (result) - attackerAbsorb : attackerAbsorb - (result)   
													battleLog += '<font color=#008000>' + defenderData.name + '</font> hit <font color=#FFFFFF>' + attackerData.name + '</font> for <font color=#FF0000>' + dmgLeftAfterAbsorb.toFixed(2) + ' dmg</font>.\n'
													attackerHp -= dmgLeftAfterAbsorb.toFixed(2)
													attackerAbsorb = attackerAbsorb - dmgLeftAfterAbsorb > 0 ? (attackerAbsorb - dmgLeftAfterAbsorb).toFixed(2) : 0
												} else if (attackerDeflect) {
													console.log('I got here')
													var attackerDeflectAmount = result * 0.3
													battleLog +='<font color=#008000>' + defenderData.name + '</font> hit <font color=#FFFFFF>' + attackerData.name + '</font> for <font color=#FF0000>' + (result - attackerDeflectAmount).toFixed(2)+ ' dmg</font>.\n'
													attackerHp = Number(attackerHp) - (result - attackerDeflectAmount)
													battleLog += '<font color=#008000>' + defenderData.name + '</font> is hit by ' + attackerDeflectAmount.toFixed(2) + ' shield damage\n'
													defenderHp = Number(defenderHp) - attackerDeflectAmount
													attackerDeflect = false
												} else {
													battleLog +='<font color=#008000>' + defenderData.name + '</font> hit <font color=#FFFFFF>' + attackerData.name + '</font> for <font color=#FF0000>' + result + ' dmg</font>.\n'
													attackerHp = (attackerHp - result).toFixed(2)
												}
											}
											triggerSpecial(defenderData).done(function(specResult) {
												if (specResult) {
													battleLog += 'Special : '
													switch(defenderData.prof) {
														case 'Adventurer':
															defenderAbsorb = (defenderData.intel * 0.05) + (defenderData.str * 0.10)
															battleLog += defenderData.name + '\`s shield will absorb ' + defenderAbsorb + ' dmg.\n'
														break;
														case 'Agent' :
															if (attackerData.prof === 'Engineer') {
																battleLog += 'Aimed Shot blocked by shield\n'
															} else {
																var aimedShot = defenderData.agil * 0.50
																battleLog += defenderData.name + ' uses Aimed Shot and hits ' + attackerData.name + ' with ' + aimedShot + ' dmg\n'
																attackerHp = Number(attackerHp) - aimedShot	
															}
														break;
														case 'Bureaucrat':
															var bodyguard = Number(attackerData.level) + (defenderData.intel * 0.05)
															battleLog += 'Bodyguard hits ' + attackerData.name + ' with ' + bodyguard + ' dmg\n'
															attackerHp = Number(attackerHp) - bodyguard
														break;
														case 'Enforcer':
															battleLog += defenderData.name + ' stunned ' + attackerData.name + ' for 1 round.\n'
															attackerStunned = true
														break;
														case 'Doctor' :
															if (attackerData.prof === 'Meta-Physicist') {
																battleLog += 'Unable to cast heal due to Nano Shutdown\n'
															} else {
																var heal = defenderData.hp == defenderHp ? 0 : (defenderData.intel * 0.10) + 6
																if (defenderData.hp == defenderHp) {
																	heal = 0;
																} else if (Number(defenderHp) + heal > defenderData.hp) {
																	heal = heal - (Number(defenderHp) + heal - defenderData.hp)
																}
																battleLog += defenderData.name + ' healed himself for ' + heal.toFixed(2) + ' hp.\n'
																defenderHp = Number(defenderHp) + heal
															}
														break;
														case 'Fixer' :
															battleLog += defenderData.name + ' will evade next attack\n'
															defenderEvade = true
															break;
														case 'Keeper':
															var healingAura = defenderData.hp == defenderHp ? 0 : (defenderData.str * 0.05) + Number(defenderData.level) 
															if (defenderData.hp == defenderHp) {
																healingAura = 0;
															} else if (Number(defenderHp) + healingAura > defenderData.hp) {
																healingAura = healingAura - (Number(defenderHp) + healingAura - defenderData.hp)
															}
															battleLog += ' Healing Aura restored ' + healingAura.toFixed(2) + ' of ' + defenderData.name + '`s health\n'
															defenderHp = Number(defenderHp) + healingAura
														break;
														case 'Martial-Artist':
															var maCrit = Number(defenderData.maxdmg) * 2.5 
															battleLog += defenderData.name + ' hits ' + attackerData.name + ' with ' + maCrit.toFixed(2) + ' dmg. Critical!\n'
															attackerHp = Number(attackerHp) - maCrit
														break;
														case 'Nano-Technician':
															if (attackerData.prof === 'Meta-Physicist') {
																battleLog += 'Unable to cast Shock due to Nano Shutdown\n'
															} else {
																var nanoDmg = (Number(defenderData.maxdmg) * 2) + (Number(defenderData.intel) * 0.10)
																battleLog += defenderData.name + ' shocks ' + attackerData.name + ' and deals ' + nanoDmg.toFixed(2) + ' dmg\n'
																attackerHp = Number(attackerHp) - nanoDmg
															}
														break;
														case 'Shade':
															if (attackerData.prof === 'Engineer') {
																battleLog += 'Sneak Attack blocked by shield\n'
															} else {
																var shadeDmg = (Number(defenderData.str) * 0.0005 + 0.15) * Number(attackerData.hp)
																battleLog += defenderData.name + ' sneaks behind ' + attackerData.name + ' and deals ' + shadeDmg.toFixed + ' dmg\n'
																attackerHp = Number(attackerHp) - shadeDmg	
															}
														break;
														case 'Soldier':
															if (attackerData.prof === 'Meta-Physicist') {
																battleLog += 'Unable to cast Deflet Shield due to Nano Shutdown\n'
															} else {
																defenderDeflect = true
																battleLog += defenderData.name + ' will deflect some of the damage received next round\n'
															}	
														break;
														case 'Trader':
														if (attackerData.prof === 'Meta-Physicist') {
															battleLog += 'Unable to cast Drain due to Nano Shutdown\n'
														} else {
															battleLog += defenderData.name + ' casts drain on ' + attackerData.name + '.\n'
															attackerDrained = true;
															var attackerDrainAmount = 0.25
															if (attackerData.mindmg > 0) {
																defenderData.mindmg += attackerDrainAmount
																attackerData.mindmg -= attackerDrainAmount
															} else if (attackerData.mindmg < 0) {
																attackerData.mindmg = 0
															}
															if (attackerData.maxdmg > 0) {
																defenderData.maxdmg += attackerDrainAmount
																attackerData.maxdmg -= attackerDrainAmount
															} else if (attackerData.maxdmg < 0) {
																attackerData.maxdmg = 0
															}
														}
													break;
														default: // This shouldnt happen
														battleLog += defenderData.name + ' has no valid profession set!\n'
													}
												}
												setTimeout(callback, 100)
											})
										})	
									}
								})
							})
						},
						function (err) { // Handle battle result
							var winnerData = attackerHp >0 ? attackerData : defenderData
							var loserData = attackerHp <= 0 ? attackerData : defenderData
							var xpGain;
							if (winnerData.level === loserData.level) {
								xpGain = winnerData.level * 10;
							} else if (winnerData.level > loserData.level) {
								xpGain = winnerData.level * 5;
							} else if (winnerData.level < loserData.level) {
								xpGain = winnerData.level * 10 + (loserData.level - winnerData.level) * 10
							}						
							battleLog += '\n<font color=#00FF00>Winner: </font>' + winnerData.name + ' -  awarded <font color=#FFFF00>' + xpGain + 'xp</font>\n\n'
							query(connection, 'INSERT INTO duelhistory (attacker,defender,winner,battlelog,date) VALUES ("' + attackerData.name + '","' + defenderData.name + '","' + winnerData.name + '","' + battleLog + '",' + moment() / 1000 + ')').done(function(result) {
								battleLog += '<font color=#FF00FF>Duel Id</font>: ' + result[0].insertId
								send_MESSAGE_PRIVATE(attackerData.charid, blob('Battle Log','<font color=#00FFFF>' +  battleLog + '</font>'))
							})
							
							
							if (winnerData.xp + xpGain >= Levels[winnerData.level + 1]) {
								switch(winnerData.breed) {
									case 'atrox':
										var sql = 'hp = hp + 15, str = str + 3, agil = agil + 1,intel = intel + 1, evasion = evasion + 0.10, special = special + 0.5, mindmg = mindmg + 0.25, maxdmg = maxdmg + 0.25, won = won + 1'
									break;
									case 'solitus':
										var sql = 'hp = hp + 10, str = str + 2, agil = agil + 2, intel = intel + 2 ,evasion = evasion + 0.15,special = special + 0.15, mindmg = mindmg + 0.15, maxdmg = maxdmg + 0.15, won = won + 1'
									break;
									case 'opifex':
										var sql = 'hp = hp + 8, str = str + 1, agil = agil + 3,intel = intel + 1,  evasion = evasion + 0.25, special = special + 0.10, mindmg = mindmg + 0.10, maxdmg = maxdmg + 0.10, won = won + 1'
									break;
									case 'nanomage': 	
										var sql = 'hp = hp + 5, str = str + 1, agil = agil + 3,intel = intel +3,  evasion = evasion + 0.10,special = special +0.25, mindmg = mindmg + 0.10, maxdmg = maxdmg + 0.10, won = won + 1'
									break;
									default:
										console.log('Level Up Error -  Breed not found.')
										connection.release()
										return
								}
								Q.when(query(connection, 'UPDATE members SET level = level + 1, xp =' + (winnerData.xp + xpGain - Levels[winnerData.level + 1]) + ',' + sql + ' WHERE name = ?', winnerData.name),
									query(connection, 'UPDATE members SET lost = lost + 1 WHERE name = ?', loserData.name),
									query(connection, 'UPDATE members SET locked = ' + moment().add(2, 'minutes') / 1000 + ' WHERE charid = ' + attackerData.charid)
								).done(function() {
									connection.release()
									send_MESSAGE_PRIVATE(winnerData.charid, 'Congratulations! You are now level ' + (Number(winnerData.level) + 1) + ', all your stats have been increased.')
								})
							} else {
								
								Q.when(query(connection, 'UPDATE members SET xp = xp + ' + xpGain + ', won = won + 1 WHERE name = ?',winnerData.name),
									query(connection, 'UPDATE members SET lost = lost + 1 WHERE name = ?', loserData.name),
									query(connection, 'UPDATE members SET locked = ' + moment().add(2, 'minutes') / 1000 + ' WHERE charid = ' + attackerData.charid)
								).done(function() {
									connection.release()
								})
							}
						}
					)
				})
			})
		})
	})
}

 hit = function (hitAttackerData, hitDefenderData, evade) {
	var defer = Q.defer()
	if (evade) {
		var newHp = 'miss'
		defer.resolve(newHp)
	} else if ((Math.floor(Math.random()  * 32) ) + (hitDefenderData.str * 0.25)  <= (1 +  (hitDefenderData.agil * 0.25) + hitDefenderData.evasion)){
		var newHp = 'miss'
		defer.resolve(newHp)
	} else if (Math.floor(Math.random() * 100) + 1 <= (hitAttackerData.agil - hitDefenderData.agil) * 0.20){
		var newHp = 'crit'
		defer.resolve(newHp)
	}       else { 
		var newHp = (Math.random()*(hitAttackerData.maxdmg - hitAttackerData.mindmg) + hitAttackerData.mindmg).toFixed(2);
		defer.resolve(newHp)
	}
    return defer.promise
 }
var triggerSpecial = function(specialAttackerData) {
	var defer = Q.defer()
	if (specialAttackerData.prof === 'Bureaucrat' || specialAttackerData.prof === 'Keeper') {
		var special = true
		defer.resolve(special)
	} else if (specialAttackerData.prof === 'Engineer' || specialAttackerData.prof === 'Meta-Physicist') {
		var special = false
		defer.resolve(special)
	} else if (Math.floor(Math.random() * 100) + 1 <= specialAttackerData.special + (specialAttackerData.intel * 0.20)) {
		var special = true
		defer.resolve(special)
	} else {
		var special = false
		defer.resolve(special)
	}
	return defer.promise	
}
global.Levels = {
	'2' : 100,
	'3' : 150,
	'4' : 200,
	'5' : 300,
	'6' : 450,
	'7' : 600,
	'8' : 800,
	'9' : 1100,
	'10': 1500
}


function pad(n) {
  n = Math.abs(n); // to handle negative durations
  return (n < 10) ? ("0" + n) : n;
}

var checkLock = function(userId) {
	var defer = Q.defer()
	connectdb().done(function(connection) {
		query(connection,'SELECT * FROM members WHERE charid = ?', userId).done(function(result) {
			if (moment().isAfter(moment.unix(result[0][0].locked))) {
				var timeUntilUnlock = false;
				defer.resolve(timeUntilUnlock)
				connection.release()
				return timeUntilUnlock
			} else {
				var a = moment()
				var b = moment.unix(result[0][0].locked)
				var duration = moment.duration(b.diff(a))
				var timeUntilUnlock = pad(duration.hours()) + ":" + pad(duration.minutes()) + ":" + pad(duration.seconds())
				defer.resolve(timeUntilUnlock)
				connection.release()
				return timeUntilUnlock
			}
		})		
	})
	return defer.promise 
}
var duelCooldown = function(attackerId, defenderId) {
	var defer = Q.defer()
	connectdb().done(function(connection) {
		query(connection,'SELECT * FROM duelhistory WHERE attacker = "' + attackerId + '" AND defender ="' + defenderId + '" ORDER BY date DESC LIMIT 1').done(function(result) {
			if (result[0].length === 0) {
				var timeUntilUnlock = false;
				defer.resolve(timeUntilUnlock)
				connection.release()
				return timeUntilUnlock
			}
			if (moment().isAfter(moment.unix(result[0][0].date + 7200))) {
				var timeUntilUnlock = false;
				defer.resolve(timeUntilUnlock)
				connection.release()
				return timeUntilUnlock
			} else {
				var a = moment()
				var b = moment.unix(result[0][0].date + 7200)
				var duration = moment.duration(b.diff(a))
				var timeUntilUnlock = pad(duration.hours()) + ":" + pad(duration.minutes()) + ":" + pad(duration.seconds())
				defer.resolve(timeUntilUnlock)
				connection.release()
				return timeUntilUnlock
			}
		})		
	})
	return defer.promise 
}