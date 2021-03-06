UPDATE `cmdcfg` SET `access_req` = '1' WHERE `cmd` = 'whois';
UPDATE `cmdcfg` SET `access_req` = '1' WHERE `cmd` = 'online';
UPDATE `cmdcfg` SET `access_req` = '0' WHERE `cmd` = 'register';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `cmd` = 'invite';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'start';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'stop';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'pause';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'resume';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'lock';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'unlock';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'flatroll';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'rem';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'add';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'kick';
UPDATE `cmdcfg` SET `access_req` = '3' WHERE `module` = 'RAID' and cmd = 'loot';
UPDATE `cmdcfg` SET `status` = 'disabled' WHERE `module` = 'Core' and cmd = 'register';
UPDATE `cmdcfg` SET `status` = 'enabled' WHERE `module` = 'Core' and cmd = 'points';
UPDATE `cmdcfg` SET `status` = 'enabled' WHERE `module` = 'RAID' and cmd = 'points';
UPDATE `cmdcfg` SET `status` = 'enabled' WHERE `module` = 'RAID' and cmd = 'bid';
UPDATE `cmdcfg` SET `status` = 'enabled' WHERE `module` = 'RAID' and cmd = 'reward';
UPDATE `cmdcfg` SET `status` = 'enabled' WHERE `module` = 'RAID' and cmd = 'deduct';