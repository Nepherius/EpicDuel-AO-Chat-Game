CREATE TABLE IF NOT EXISTS `cmdcfg` (
  `id` int(11) NOT NULL,
  `module` varchar(50) NOT NULL,
  `cmd` varchar(50) NOT NULL,
  `access_req` int(20) NOT NULL DEFAULT '0',
  `options` varchar(50) NOT NULL,
  `description` varchar(75) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'enabled'
);
ALTER TABLE cmdcfg ADD PRIMARY KEY (id);
INSERT INTO `cmdcfg` (`id`, `module`, `cmd`, `access_req`, `options`, `description`, `status`) VALUES
(1, 'Core', 'addadmin', 4, '', 'Adds a bot admin', 'enabled'),
(2, 'Core', 'addmember', 3, '', 'Add player to member list', 'enabled'),
(3, 'Core', 'addmod', 4, '', 'Add a bot moderator', 'enabled'),
(4, 'Core', 'cmdlist', 1, '', 'List all available commands', 'enabled'),
(5, 'Core', 'deladmin', 4, '', 'Removes bot admin', 'enabled'),
(6, 'Core', 'delmember', 3, '', 'Remove player from member list', 'enabled'),
(7, 'Core', 'invite', 1, '', 'Invite player to private group', 'enabled'),
(8, 'Core', 'join', 1, '', 'Join bot private group', 'enabled'),
(9, 'Core', 'kick', 3, '', 'Kick player from private group', 'enabled'),
(10, 'Core', 'kickall', 3, '', 'Kick all players from private group', 'enabled'),
(11, 'Core', 'leave', 0, '', 'Leave private group', 'enabled'),
(12, 'Core', 'online', 1, '', 'Show a list of all players currently on bot channel.', 'enabled'),
(13, 'Core', 'register', 0, '', 'Register as a member of the group', 'enabled'),
(14, 'Core', 'unregister', 1, '', 'Unregister from group', 'enabled'),
(15, 'Whois', 'whois', 0, '', 'Show character info', 'enabled'),
(16, 'Core', 'online', 1, '', '', 'enabled'),
(20, 'Core', 'admins', 1, '', 'Show list of bot admins', 'enabled'),
(22, 'Core', 'shutdown', 4, '', 'Shut down bot', 'enabled'),
(44, 'Core', 'lock', 3, '', 'Lock player', 'enabled'),
(45, 'Core', 'unlock', 3, '', 'Unlock player', 'enabled'),
(48, 'Core', 'status', 1, '', 'Character status', 'enabled'),
(49, 'Core', 'duel', 1, '', 'Attack another player', 'enabled'),
(50, 'Core', 'viewduel', 1, '', 'View Duel', 'enabled'),
(51, 'Core', 'attacks', 1, '', 'View last attacks', 'enabled'),
(52, 'Core', 'defense', 1, '', 'View defense', 'enabled'),
(53, 'Core', 'ban', 4, '', '', 'enabled'),
(54, 'Core', 'unban', 4, '', '', 'enabled');
ALTER TABLE `cmdcfg` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=55;
