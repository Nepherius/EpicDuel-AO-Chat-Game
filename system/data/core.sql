CREATE TABLE IF NOT EXISTS `admins` (
  `charid` int(30) NOT NULL,
  `name` varchar(30) NOT NULL,
  `rank` varchar(30) NOT NULL,
  `level` int(11) NOT NULL
);
CREATE TABLE IF NOT EXISTS `channel` (
  `charid` int(100) NOT NULL,
  `name` varchar(30) NOT NULL,
  `afk` varchar(10) NOT NULL DEFAULT 'no'
);
CREATE TABLE IF NOT EXISTS `duelhistory` (
  `duelid` bigint(100) NOT NULL,
  `attacker` varchar(25) NOT NULL,
  `defender` varchar(25) NOT NULL,
  `winner` varchar(25) NOT NULL,
  `battlelog` text NOT NULL,
  `date` bigint(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS `members` (
  `charid` bigint(30) NOT NULL DEFAULT '0',
  `name` varchar(255) NOT NULL,
  `main` varchar(255) NOT NULL,
  `breed` varchar(30) DEFAULT NULL,
  `prof` varchar(50) NOT NULL DEFAULT 'no',
  `level` bigint(20) DEFAULT '1',
  `xp` bigint(100) NOT NULL DEFAULT '0',
  `hp` bigint(100) NOT NULL,
  `str` decimal(10,2) NOT NULL,
  `agil` decimal(10,2) NOT NULL,
  `intel` decimal(10,2) NOT NULL,
  `evasion` decimal(10,2) NOT NULL,
  `special` decimal(10,2) NOT NULL,
  `mindmg` decimal(10,2) NOT NULL,
  `maxdmg` decimal(10,2) NOT NULL,
  `won` bigint(50) NOT NULL DEFAULT '0',
  `lost` bigint(50) NOT NULL DEFAULT '0',
  `locked` bigint(20) NOT NULL DEFAULT '0',
  `notify` varchar(10) NOT NULL DEFAULT 'no',
  `banned` varchar(20) NOT NULL DEFAULT 'no'
);
CREATE TABLE IF NOT EXISTS `online` (
  `charid` int(20) NOT NULL,
  `name` varchar(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS `players` (
  `charid` bigint(20) NOT NULL,
  `firstname` varchar(30) DEFAULT NULL,
  `name` varchar(20) NOT NULL,
  `lastname` varchar(30) DEFAULT NULL,
  `level` smallint(6) NOT NULL,
  `breed` varchar(20) NOT NULL,
  `gender` varchar(20) NOT NULL,
  `faction` varchar(20) NOT NULL,
  `profession` varchar(20) NOT NULL,
  `profession_title` varchar(50) NOT NULL,
  `ai_rank` varchar(20) NOT NULL,
  `ai_level` smallint(6) NOT NULL,
  `guild` varchar(255) DEFAULT NULL,
  `guild_rank` varchar(20) DEFAULT NULL,
  `source` varchar(50) NOT NULL,
  `lastupdate` int(11) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS `uptime` (
  `start` int(20) NOT NULL
);

ALTER TABLE `admins`
  ADD UNIQUE KEY `charid` (`charid`);
ALTER TABLE `duelhistory`
  ADD PRIMARY KEY (`duelid`);
ALTER TABLE `members`
  ADD UNIQUE KEY `charid` (`charid`),
  ADD UNIQUE KEY `name` (`name`);
ALTER TABLE `online`
  ADD PRIMARY KEY (`charid`);
 ALTER TABLE `players`
  ADD PRIMARY KEY (`charid`),
  ADD UNIQUE KEY `charid` (`charid`);
  ALTER TABLE `duelhistory`
  MODIFY `duelid` bigint(100) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=0;