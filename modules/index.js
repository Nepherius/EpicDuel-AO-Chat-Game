// Import commands 
var commands = require('./core/core_commands')
var whois_module = require('./core/whois')
var items_module = require('./core/items')
var misc = require('./core/misc')
var duel_module = require('./core/duel')
var attack_module = require('./core/attack_module')
var admin_module = require('./core/admin')


//General
commands.whois = whois
commands.items = items
commands.ban = ban
commands.unban = unban
commands.lock = lock
commands.unlock = unlock

//MISC
commands.about = about
commands.top = top
// Export commands to main.js
module.exports = commands
//Duel
commands.register = register
commands.setbreed = setbreed
commands.setprof = setprof
commands.status = status
commands.duel = duel
commands.viewduel = viewduel
commands.attacks= attacks
commands.defense = defense

// Create & Initiate Cmd
function Cmd(helpInfo, commands) {
    var functionName;
    this.help = function (replyTo, helpTopic) {
        if (undefined === helpTopic) {
            send_MESSAGE_PRIVATE(replyTo, blob('Help', helpMsg))
        } else if (helpInfo.hasOwnProperty(helpTopic)) {
            send_MESSAGE_PRIVATE(replyTo, helpInfo[helpTopic])
        } else {
            send_MESSAGE_PRIVATE(replyTo, 'Requested topic not found')
        }
    };

    for (functionName in commands) {
        if (commands.hasOwnProperty(functionName)) {
            this[functionName] = commands[functionName]
        }
    }
}

helpMsg = '<center> <font color=#FFFF00> :::General Help::: </font> </center> \n\n'
helpMsg += '<font color=#00FFFF>Help: </font> You are looking at it.' + '\n'
helpMsg += '<font color=#00FFFF>About: </font> General Bot info.' + '\n'
helpMsg += '<font color=#00FFFF>Status: </font> Display your channel subscription status.' + '\n'
helpMsg += '<font color=#00FFFF>Subscribe: </font> subscribe [channel name] to subsctibe to a channel' + '\n'
helpMsg += '<font color=#00FFFF>Unubscribe: </font> unsubscribe [channel name] to unsubsctibe from a channel' + '\n'
helpMsg += '<font color=#00FFFF>Gen: </font> gen [message] to send a general message.' + '\n'
helpMsg += '<font color=#00FFFF>LR: </font> lr [message] to send a message to lootrights channel.' + '\n'
helpMsg += '<font color=#00FFFF>WTS: </font> wts [message] to send a message to Want To Sell channel.' + '\n'
helpMsg += '<font color=#00FFFF>WTB: </font> wb [message] to send a message to Want TO Buy channel.' + '\n'
 
var helpCmd = {}
helpCmd.invite = 'To invite a player to the channel use: !invite \'player\'' // a lonely example

// Create an instance of Cmd.
global.cmd = new Cmd(helpCmd, commands)