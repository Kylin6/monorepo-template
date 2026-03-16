# ************************************************************
# Sequel Ace SQL dump
# 版本号： 20095
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# 主机: 127.0.0.1 (MySQL 8.4.4)
# 数据库: trxen
# 生成时间: 2026-03-06 02:43:08 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE='NO_AUTO_VALUE_ON_ZERO', SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# 转储表 addr_desc
# ------------------------------------------------------------

DROP TABLE IF EXISTS `addr_desc`;

CREATE TABLE `addr_desc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `addr` char(34) NOT NULL,
  `desc` text,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `addr` (`addr`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `addr_desc` WRITE;
/*!40000 ALTER TABLE `addr_desc` DISABLE KEYS */;

INSERT INTO `addr_desc` (`id`, `addr`, `desc`, `created_at`, `updated_at`)
VALUES
	(1,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','kylin',1761642997,1772689329),
	(2,'TG2fP7CS5BQPf2zkEBuMHGL5HbZfnfu6t6','test1',1761725817,1761725817),
	(3,'TPVsYCfYLr9U3xnpYdFzq9NJ8etKY7cnuu','托管地址1',1761727291,1772674319),
	(5,'TXoPBGhELQUzBkbqymNmLjR299pNNzbRpc','ad',1761728705,1761728705),
	(9,'TJJ3v8zGoPx4td75FHbrp489afDf8MEQfS','用户充值接收2',1761729220,1761729220),
	(10,'TEa492EDH2sbd7MvLtna1N1TgSATGpKbJc','区块链能量接收1',1761729536,1761729550),
	(11,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskT1','kylin',1771914703,1772689275);

/*!40000 ALTER TABLE `addr_desc` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 admin_user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `admin_user`;

CREATE TABLE `admin_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `type` tinyint NOT NULL DEFAULT '30',
  `auth_key` varchar(32) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `google_secret` varchar(32) DEFAULT NULL,
  `access_token` varchar(32) DEFAULT NULL,
  `two_step_validate` tinyint DEFAULT NULL,
  `last_login_at` int DEFAULT NULL,
  `last_login_ip` varchar(16) DEFAULT NULL,
  `remark` text,
  `access_token_expired` int DEFAULT NULL,
  `status` smallint NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `email` (`username`) USING BTREE,
  UNIQUE KEY `password_reset_token` (`password_reset_token`) USING BTREE,
  UNIQUE KEY `access_token` (`access_token`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `admin_user` WRITE;
/*!40000 ALTER TABLE `admin_user` DISABLE KEYS */;

INSERT INTO `admin_user` (`id`, `username`, `type`, `auth_key`, `password_hash`, `password_reset_token`, `created_at`, `updated_at`, `google_secret`, `access_token`, `two_step_validate`, `last_login_at`, `last_login_ip`, `remark`, `access_token_expired`, `status`)
VALUES
	(987897,'aa@cc.com',10,'1jLwSTunbzxi-cjGvk_YMxcqDYg4ieKA','$2y$13$mqIJzuzsY9GSSLth/UvO3.o/OsbBgVVV29KGt8SjD1cKIlAlLCKP2',NULL,1710395057,1713446431,'ENVWIMH4AAOG5JOK','ae73c5ce04c7b32049f57cfaf66e4363',0,1773287343,'192.168.31.116',NULL,1773287343,10);

/*!40000 ALTER TABLE `admin_user` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 agent
# ------------------------------------------------------------

DROP TABLE IF EXISTS `agent`;

CREATE TABLE `agent` (
  `uid` int NOT NULL AUTO_INCREMENT COMMENT '代理ID',
  `username` varchar(31) DEFAULT NULL COMMENT '用户名',
  `password_hash` varchar(64) DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `bot_token` varchar(255) DEFAULT NULL,
  `bot_username` varchar(255) DEFAULT NULL,
  `addr` char(34) DEFAULT NULL COMMENT '代理地址-频道能量',
  `recharge_addr` char(34) DEFAULT NULL,
  `u2t_addr` char(34) DEFAULT NULL,
  `agent_recharge_addr` char(34) DEFAULT NULL,
  `nickname` varchar(255) DEFAULT NULL COMMENT '昵称',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '频道价格',
  `plan_price` decimal(10,2) DEFAULT NULL,
  `plan_out_price` decimal(10,2) DEFAULT NULL,
  `count_price` decimal(10,2) DEFAULT NULL,
  `count_out_price` decimal(10,2) DEFAULT NULL,
  `count_bandwidth_price` decimal(10,2) DEFAULT NULL,
  `count_bandwidth_out_price` decimal(10,2) DEFAULT NULL,
  `quick_energy_change` decimal(10,2) DEFAULT NULL,
  `domain` varchar(255) DEFAULT NULL COMMENT '网站域名',
  `support` varchar(255) DEFAULT NULL COMMENT '客服飞机号',
  `channel` varchar(255) DEFAULT NULL COMMENT '频道地址',
  `u2t_price` decimal(10,2) DEFAULT NULL,
  `notify_url` varchar(255) DEFAULT NULL,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `access_token` varchar(32) DEFAULT NULL,
  `token_expired_at` int DEFAULT NULL,
  `remark` text COMMENT '代理备注',
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `last_login_at` int DEFAULT NULL,
  `last_login_ip` int DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '10',
  PRIMARY KEY (`uid`) USING BTREE,
  UNIQUE KEY `uid` (`uid`) USING BTREE,
  UNIQUE KEY `addr` (`addr`) USING BTREE,
  UNIQUE KEY `username` (`username`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `agent` WRITE;
/*!40000 ALTER TABLE `agent` DISABLE KEYS */;

INSERT INTO `agent` (`uid`, `username`, `password_hash`, `parent_id`, `bot_token`, `bot_username`, `addr`, `recharge_addr`, `u2t_addr`, `agent_recharge_addr`, `nickname`, `price`, `plan_price`, `plan_out_price`, `count_price`, `count_out_price`, `count_bandwidth_price`, `count_bandwidth_out_price`, `quick_energy_change`, `domain`, `support`, `channel`, `u2t_price`, `notify_url`, `balance`, `access_token`, `token_expired_at`, `remark`, `created_at`, `updated_at`, `last_login_at`, `last_login_ip`, `status`)
VALUES
	(100000,'fasfa','$2y$13$mh9tohqMlZcLXktZOOIcsubdWKNkCaGsUB4F5gmUS72jECXQ7lEdG',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'11122',2.00,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,0,NULL,1762414517,NULL,NULL,NULL,10),
	(200000,'fasfasdfa','fasdfas',NULL,NULL,NULL,'TMZJiALPQEMykMge9yb6hZ5G8qqwuVxQ1E',NULL,NULL,NULL,'一级私域代理',2.10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'cc.xx.com',NULL,NULL,NULL,NULL,0.00,NULL,0,'一级私域',1748333005,NULL,NULL,NULL,10),
	(500000,'fasdfasdf','fasdfdad',NULL,'','111','TPVsYCfYLr9U3xnpYdFzq9NJ8etKY7cnuu','THEQNEdcwSebDUPY79ht1PutaVSZ1x31ro',NULL,NULL,'122',2.40,35.00,37.00,12.00,23.00,30.00,29.00,NULL,'xx.yy.com111','xxxooo','https://t.me/fdfadfasdfa',0.04,NULL,0.00,NULL,0,'私域代理',1762414534,NULL,NULL,NULL,10),
	(180594165,'fasdfas','$2y$13$XWmcgZte6SM9kZCHACfV7u52kD4X5eMveiEtbzCEllNSHIyKstKMu',NULL,'7610948338:AAFnUs7WEQrrKR7t0TBVW6_usJ6V0R40CrI',NULL,'TWRhoADdMfi7tivm6MA4rXF9wKECc1twCm','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','TLnzRPobnRYUV4uceThhtgxp6mFpYxJ7iv',NULL,NULL,2.40,32.00,40.00,18.00,21.00,500.00,600.00,0.05,'xx.yy.com','@kylin68','https://t.me/botcs123',-0.83,'https://699baf96d44a.ngrok-free.app/webhook',0.00,'3059eb5e373d2543141506e8aee2e170',0,'私域代理',1762504298,NULL,1763453969,NULL,10),
	(180594343,'cal','$2y$13$3HPKPyEcJ1gWvmUGsMvqoutw8aVOP3A9qNcX./ymaY.ULp0xEV8M.',NULL,'8211810666:AAEumG6mStUg7oTtubLAEJ6gVgonTyZKoq8','vip_trade_bot','TNGeqXUNTkTouK8MUCMMmkk84pvKUrDmB4','TNGeqXUNTkTouK8MUCMMmkk84pvKUrDmB2','TFWDxiqrWrepJbLGqxzfSipiyjCpLdeefD','TNGeqXUNTkTouK8MUCMMmkk84pvKUrDmB1',NULL,30.00,30.00,40.00,30.00,40.00,30.00,40.00,0.15,'vip-trade.com','vip_support','https://t.me/vip_trade_channel',0.12,'https://api.vip-trade.com/notify',0.00,NULL,0,'主要交易通道，支持USDT交易',1761558316,NULL,NULL,NULL,10),
	(180594344,'测试添加','$2y$13$/vsawUVJxSQQzq0VvMyWU.mRw/NYOflRgyBsqhczLAUgln8jHxCGi',NULL,'','','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskT1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskT2','TBMPN3FnkJGGX6bEw4NrntQC616EnCR4Hv','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskT3',NULL,30.00,30.00,30.00,NULL,NULL,30.00,30.00,0.10,'qwe.com','','',-0.10,'',0.00,NULL,0,'测试添加',1761622596,NULL,NULL,NULL,10),
	(180594345,'qweewq','$2y$13$mpYp2mrAYIN678Zj.UaRv.vs6fWN0PZlm6j0lWOZQx3/s8DOGPXKC',NULL,'','','','','TWeAEjURNG8rkUyjXrbiRTuHc7A3aHy2tU','','0011',30.00,30.00,29.00,NULL,NULL,600.00,30.00,0.15,'asd.com','','',NULL,'',0.00,'b16a16716e41649356f3cc7385d67f3a',0,'',1761634305,NULL,1762928555,NULL,10);

/*!40000 ALTER TABLE `agent` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 agent_log
# ------------------------------------------------------------

DROP TABLE IF EXISTS `agent_log`;

CREATE TABLE `agent_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `agent_log` WRITE;
/*!40000 ALTER TABLE `agent_log` DISABLE KEYS */;

INSERT INTO `agent_log` (`id`, `uid`, `agent_id`, `created_at`)
VALUES
	(5,180594165,180593568,1748332383),
	(6,180594339,180594165,1748332615);

/*!40000 ALTER TABLE `agent_log` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 api_key
# ------------------------------------------------------------

DROP TABLE IF EXISTS `api_key`;

CREATE TABLE `api_key` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `name` varchar(32) DEFAULT NULL,
  `token` char(32) NOT NULL,
  `white_list` text,
  `ua` text,
  `notify_url` varchar(255) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '10',
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `api_key` WRITE;
/*!40000 ALTER TABLE `api_key` DISABLE KEYS */;

INSERT INTO `api_key` (`id`, `uid`, `name`, `token`, `white_list`, `ua`, `notify_url`, `status`, `created_at`, `updated_at`)
VALUES
	(100,180593568,NULL,'DWfQgH-3XshHrRxIVjKqq7526WNB2kjj','127.0.0.1\n192.168.4.1',NULL,'http://127.0.0.1:3245',10,NULL,1758607080),
	(180593570,180594165,NULL,'LVmeL8CX2ELMGC06p-D9iXswNn0JxyWZ',NULL,NULL,'http://192.168.31.116:3000/webhook',0,1752051913,1752055145),
	(180593571,180594339,NULL,'2JqBAEy4DvlXgdqdOuox9MvmE4AOvX0s',NULL,NULL,'http://192.168.31.116:3000/webhook',10,1755586763,1755586763);

/*!40000 ALTER TABLE `api_key` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 authorized_wallet
# ------------------------------------------------------------

DROP TABLE IF EXISTS `authorized_wallet`;

CREATE TABLE `authorized_wallet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` tinyint NOT NULL DEFAULT '0',
  `uid` int DEFAULT NULL,
  `addr` char(34) NOT NULL,
  `delegate_addr` char(34) DEFAULT NULL,
  `energy` int DEFAULT '0',
  `bandwidth` int DEFAULT '0',
  `energy_usage` int DEFAULT NULL,
  `bandwidth_usage` int DEFAULT NULL,
  `delegated_frozen_v2_balance_for_energy` int DEFAULT NULL,
  `acquired_delegated_frozen_v2_balance_for_energy` int DEFAULT NULL,
  `acquired_delegated_frozen_v2_balance_for_bandwidth` int DEFAULT NULL,
  `energy_limit` int DEFAULT NULL,
  `bandwidth_limit` int DEFAULT NULL,
  `energy_total` int DEFAULT NULL,
  `bandwidth_total` int DEFAULT NULL,
  `active_permissions` text,
  `permission_id` int DEFAULT NULL,
  `authorized_count` tinyint DEFAULT NULL,
  `proportion` decimal(5,2) DEFAULT NULL COMMENT '分成',
  `bandwidth_proportion` decimal(5,2) DEFAULT NULL,
  `proportion_fixed` tinyint DEFAULT NULL,
  `bandwidth_proportion_fixed` tinyint DEFAULT NULL,
  `stake_for_bandwidth` int DEFAULT NULL,
  `stake_for_energy` int DEFAULT NULL,
  `total` int DEFAULT '0',
  `available` int DEFAULT '0',
  `usdt_balance` decimal(18,6) DEFAULT NULL,
  `sell_energy` tinyint DEFAULT NULL,
  `sell_bandwidth` tinyint DEFAULT NULL,
  `energy_min_price` int DEFAULT NULL,
  `bandwidth_min_price` int DEFAULT NULL,
  `auto_vote` tinyint DEFAULT NULL,
  `auto_vote_withdraw` tinyint DEFAULT NULL,
  `auto_withdraw` tinyint DEFAULT NULL,
  `auto_withdraw_keep` int DEFAULT NULL,
  `lock` tinyint NOT NULL DEFAULT '10',
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `allow_expire` varchar(255) DEFAULT NULL,
  `allow_bandwidth_expire` varchar(255) DEFAULT NULL,
  `source` tinyint NOT NULL DEFAULT '10',
  `commission` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '总佣金',
  `weights` int DEFAULT NULL COMMENT '权重',
  `sort` int NOT NULL DEFAULT '0',
  `remark` text,
  `status` tinyint NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `addr` (`addr`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `authorized_wallet` WRITE;
/*!40000 ALTER TABLE `authorized_wallet` DISABLE KEYS */;

INSERT INTO `authorized_wallet` (`id`, `type`, `uid`, `addr`, `delegate_addr`, `energy`, `bandwidth`, `energy_usage`, `bandwidth_usage`, `delegated_frozen_v2_balance_for_energy`, `acquired_delegated_frozen_v2_balance_for_energy`, `acquired_delegated_frozen_v2_balance_for_bandwidth`, `energy_limit`, `bandwidth_limit`, `energy_total`, `bandwidth_total`, `active_permissions`, `permission_id`, `authorized_count`, `proportion`, `bandwidth_proportion`, `proportion_fixed`, `bandwidth_proportion_fixed`, `stake_for_bandwidth`, `stake_for_energy`, `total`, `available`, `usdt_balance`, `sell_energy`, `sell_bandwidth`, `energy_min_price`, `bandwidth_min_price`, `auto_vote`, `auto_vote_withdraw`, `auto_withdraw`, `auto_withdraw_keep`, `lock`, `created_at`, `updated_at`, `balance`, `allow_expire`, `allow_bandwidth_expire`, `source`, `commission`, `weights`, `sort`, `remark`, `status`)
VALUES
	(7,20,180593568,'TXoPBGhELQUzBkbqymNmLjR299pNNzbRpc','TBVseMfrSRvvaFnMeVG1b28TzNV3h6uyFJ',5334119,85839,24075144,180839,123462,1880131,9260,29407683,0,5343644,86655,'57,58',3,1,0.00,0.00,0,0,0,1197716,1269457,71741,0.000000,10,10,0,0,0,0,0,0,0,1721661215,1772697620,257.18,'10,20,30','10,20,30',0,257.18,0,1762415426,'测试备注',0),
	(8,20,180594165,'TScKxWuq88dVfGoGfv4gaRuL9WKyktYuED','TBVseMfrSRvvaFnMeVG1b28TzNV3h6uyFJ',0,0,0,0,0,0,0,0,0,0,600,'4,57,58',3,2,0.55,0.85,10,0,0,0,0,0,0.000000,10,0,100,0,0,0,10,100,0,1721661215,1772697620,0.00,NULL,NULL,10,0.00,1,0,NULL,0),
	(16,30,180594339,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TBVseMfrSRvvaFnMeVG1b28TzNV3h6uyFJ',136093,0,69381,426,0,0,1863,205520,0,136148,3188,'4,13,54,57,58',3,1,0.00,0.00,10,10,0,21510,21693,183,1.501953,10,10,0,0,10,10,10,10,0,1722971072,1772697620,15.02,NULL,NULL,10,15.02,1,1772697226,NULL,10),
	(32,4,NULL,'TBLJCRRiamVopKgkJnTQqV987zUDWvbcAd',NULL,0,0,0,0,0,0,0,0,0,0,600,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,27,27,0.000000,0,0,0,0,0,0,0,0,10,1730351498,1772697620,0.00,NULL,NULL,10,0.00,1,0,NULL,0),
	(33,40,NULL,'TMMx3iwQC3WtJ9rzw4RYb2Fwo2wf141TYm',NULL,0,0,0,0,0,0,0,0,0,0,600,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,18,18,0.000000,0,0,0,0,0,0,0,0,10,1730351531,1772697620,0.00,NULL,NULL,10,0.00,1,0,NULL,0),
	(38,5,NULL,'TJm7FcvMc6EMr3Y17dg9bXSqWHSut2v5DZ',NULL,0,0,0,0,0,0,0,0,0,0,600,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,2,2,0.000000,0,0,0,0,0,0,0,0,10,0,1772697620,0.00,NULL,NULL,10,0.00,NULL,0,NULL,0),
	(39,30,NULL,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',NULL,1031,29,0,0,0,0,620,1031,0,1031,1632,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,108,239,131,NULL,10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,1772697620,0.00,NULL,NULL,10,0.00,NULL,1772688498,NULL,10);

/*!40000 ALTER TABLE `authorized_wallet` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 channel_price
# ------------------------------------------------------------

DROP TABLE IF EXISTS `channel_price`;

CREATE TABLE `channel_price` (
  `id` int NOT NULL AUTO_INCREMENT,
  `agent_id` int DEFAULT NULL,
  `count` int NOT NULL,
  `start` decimal(4,2) NOT NULL,
  `end` decimal(4,2) NOT NULL,
  `show` decimal(4,2) NOT NULL,
  `status` tinyint NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `count` (`count`,`agent_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `channel_price` WRITE;
/*!40000 ALTER TABLE `channel_price` DISABLE KEYS */;

INSERT INTO `channel_price` (`id`, `agent_id`, `count`, `start`, `end`, `show`, `status`)
VALUES
	(1,180594339,1,1.20,1.50,1.23,10),
	(2,180594339,2,1.60,2.00,2.00,10),
	(6,180594165,1,1.30,2.40,2.10,10),
	(7,180594165,2,2.30,4.50,3.00,10),
	(8,180594165,3,4.40,7.00,6.00,10),
	(9,180594165,4,6.90,10.00,7.00,10),
	(10,180594165,5,1.00,4.00,1.00,0);

/*!40000 ALTER TABLE `channel_price` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 delegtion_wallet
# ------------------------------------------------------------

DROP TABLE IF EXISTS `delegtion_wallet`;

CREATE TABLE `delegtion_wallet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `addr` char(34) NOT NULL,
  `count` int NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `delegtion_wallet` WRITE;
/*!40000 ALTER TABLE `delegtion_wallet` DISABLE KEYS */;

INSERT INTO `delegtion_wallet` (`id`, `addr`, `count`, `status`)
VALUES
	(1,'TBVseMfrSRvvaFnMeVG1b28TzNV3h6uyFJ',0,10),
	(2,'TQNpet5TeAXbr8Y7txALFuchiDPpZ27s6Q',0,0),
	(3,'TRLuQN7TPVRNbb4xHTv9WWP8CWM2xfYpnu',0,10);

/*!40000 ALTER TABLE `delegtion_wallet` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 energy_records
# ------------------------------------------------------------

DROP TABLE IF EXISTS `energy_records`;

CREATE TABLE `energy_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tx_id` varchar(255) DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  `block_number` bigint DEFAULT NULL,
  `timestamp` int NOT NULL,
  `from_addr` char(34) DEFAULT NULL,
  `to_addr` char(34) DEFAULT NULL,
  `stake_amount` int DEFAULT NULL,
  `amount` decimal(11,0) NOT NULL,
  `type` varchar(50) NOT NULL,
  `resource` enum('E','B') NOT NULL DEFAULT 'E',
  `fee` decimal(20,6) NOT NULL DEFAULT '0.000000',
  `net_usage` decimal(20,6) DEFAULT NULL,
  `net_fee` decimal(20,6) DEFAULT NULL,
  `energy_usage` decimal(20,6) DEFAULT NULL,
  `energy_fee` decimal(20,6) DEFAULT NULL,
  `energy_usage_total` decimal(20,6) DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `finished_at` int DEFAULT NULL,
  `status` int NOT NULL DEFAULT '10',
  `remark` text,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `txID` (`tx_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `energy_records` WRITE;
/*!40000 ALTER TABLE `energy_records` DISABLE KEYS */;

INSERT INTO `energy_records` (`id`, `tx_id`, `order_id`, `block_number`, `timestamp`, `from_addr`, `to_addr`, `stake_amount`, `amount`, `type`, `resource`, `fee`, `net_usage`, `net_fee`, `energy_usage`, `energy_fee`, `energy_usage_total`, `created_at`, `finished_at`, `status`, `remark`)
VALUES
	(1,'e6482db5394d52c30282a836b6707e0412802c8ad586b45486c173a4ceaf6130',18808664,80614311,1772508411,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',-1392,-1392,'DELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772508412,1772508414,10,NULL),
	(3,'6db98fb8a61387ad0904b4203165386fddcb708742c4bc6cb24c1ace6ff407ab',18808664,80615481,1772512017,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',1393,1393,'UNDELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772512020,1772512022,10,NULL),
	(4,'8456ab33b89e8cc03f0634dce9e15383284c5b7db0a07443bcf8f58a1e3de25e',18808667,80617127,1772517144,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',-53,-503,'DELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772517147,1772517150,10,NULL),
	(5,'af9edb39767c210db507be6ff9e2cd7c5886da29043ab915e55805742d898fb2',18808667,80618321,1772520747,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',53,504,'UNDELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772520750,1772520751,10,NULL),
	(6,'f70714a54a463120578025ea8d6afbd8cc224dc457a27f52b21673e6c8334f00',18808671,80649072,1772613876,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',-13761,-131004,'DELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772613890,1772613892,10,NULL),
	(7,'9e40e6f27a9fbec26591371698cb783436edebda2b302a8035fa72a8046c0dac',18808671,80649706,1772615778,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',13761,131005,'UNDELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772615796,1772615798,10,NULL),
	(8,'7165407504fcd340d89efda8518626a4c4fb4e5a3ccc9de7d518e28406d311ff',18808677,80650088,1772616924,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',-13747,-131008,'DELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772616928,1772616930,10,NULL),
	(9,'367316c4ff448d1c44af5a937c9835c9eedf5d1cfbe7de841df2a2b499e2da0a',18808677,80650225,1772617335,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',13747,131009,'UNDELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772617355,1772617357,10,NULL),
	(10,'28f2ed93b7a0f9dbbb35c2de39eaa3aa33664ba109baab14f3ad7ad71371770b',18808681,80669348,1772674722,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',-13703,-131000,'DELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772674722,1772674724,10,NULL),
	(11,'0c745c08ccf83d0a72ea0998282062148cf7d961c71c09061079d308b42a8747',18808681,80670634,1772678580,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',13703,131001,'UNDELEGATE','E',0.000000,NULL,NULL,NULL,NULL,NULL,1772678580,1772678583,10,NULL);

/*!40000 ALTER TABLE `energy_records` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 exchange
# ------------------------------------------------------------

DROP TABLE IF EXISTS `exchange`;

CREATE TABLE `exchange` (
  `id` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `transfer_in_tx_id` char(64) DEFAULT NULL,
  `transfer_out_tx_id` char(64) DEFAULT NULL,
  `from` char(34) NOT NULL COMMENT '发送地址',
  `to` char(34) NOT NULL COMMENT '接收地址',
  `owner` char(34) DEFAULT NULL,
  `amount` decimal(20,6) NOT NULL COMMENT '接收数量',
  `currency` enum('USDT','TRX') NOT NULL COMMENT '币种',
  `base_rate` decimal(6,3) DEFAULT NULL,
  `rate` decimal(6,3) NOT NULL COMMENT '汇率',
  `exchange` decimal(10,2) NOT NULL COMMENT '发送数量',
  `created_at` int DEFAULT NULL,
  `transfered_at` int DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '状态',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `exchange` WRITE;
/*!40000 ALTER TABLE `exchange` DISABLE KEYS */;

INSERT INTO `exchange` (`id`, `agent_id`, `transfer_in_tx_id`, `transfer_out_tx_id`, `from`, `to`, `owner`, `amount`, `currency`, `base_rate`, `rate`, `exchange`, `created_at`, `transfered_at`, `status`)
VALUES
	(181138663,180594339,'c0314105ed73fcff573ddd9972da2c10293a311ffed0bdbafcb547beecbf0d7e',NULL,'TRtCsfvZc6t73XRfsCENWPSnEKHsABn5y4','TJm7FcvMc6EMr3Y17dg9bXSqWHSut2v5DZ',NULL,2.000000,'USDT',2.930,2.000,4.00,1757267637,NULL,0),
	(181138665,180594339,'c0314105ed73fcff573ddd9972da2c10293a311ffed0bdbafcb547beecbf0d7e',NULL,'TRtCsfvZc6t73XRfsCENWPSnEKHsABn5y4','TJm7FcvMc6EMr3Y17dg9bXSqWHSut2v5DZ',NULL,2.000000,'USDT',2.930,1.930,3.86,1757267861,NULL,0),
	(181138667,180594339,'c0314105ed73fcff573ddd9972da2c10293a311ffed0bdbafcb547beecbf0d7e',NULL,'TRtCsfvZc6t73XRfsCENWPSnEKHsABn5y4','TJm7FcvMc6EMr3Y17dg9bXSqWHSut2v5DZ',NULL,2.000000,'USDT',2.930,1.930,3.86,1757268074,NULL,0);

/*!40000 ALTER TABLE `exchange` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 funds
# ------------------------------------------------------------

DROP TABLE IF EXISTS `funds`;

CREATE TABLE `funds` (
  `id` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `cate` tinyint NOT NULL DEFAULT '10' COMMENT '10 买家 20 卖家 30 代理',
  `type` tinyint NOT NULL COMMENT '10 充值 20 消费 30 提现 40 调账',
  `uid` int NOT NULL,
  `tx_id` char(64) DEFAULT NULL,
  `currency` enum('USDT','TRX') NOT NULL,
  `exchange` decimal(10,3) NOT NULL,
  `order_id` int DEFAULT NULL,
  `plan_id` int DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `real_amount` decimal(10,2) DEFAULT NULL,
  `balance` decimal(10,2) NOT NULL,
  `remark` text,
  `created_at` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `funds` WRITE;
/*!40000 ALTER TABLE `funds` DISABLE KEYS */;

INSERT INTO `funds` (`id`, `agent_id`, `cate`, `type`, `uid`, `tx_id`, `currency`, `exchange`, `order_id`, `plan_id`, `amount`, `real_amount`, `balance`, `remark`, `created_at`)
VALUES
	(18808643,NULL,10,40,180697878,NULL,'TRX',1.000,NULL,NULL,1000.00,NULL,1000.00,'调整余额',1771826983),
	(18808644,NULL,10,40,180697878,NULL,'TRX',1.000,NULL,NULL,-500.00,NULL,500.00,'调整余额',1771827378),
	(18808655,NULL,10,24,180594165,NULL,'TRX',1.000,18808654,NULL,-2.28,-2.28,99997.72,NULL,1772243425),
	(18808660,NULL,10,24,180594165,NULL,'TRX',1.000,18808659,NULL,-2.28,-2.28,99995.44,NULL,1772246354),
	(18808662,NULL,10,10,180697856,'3542089edbff038d1def30e67c0b1b68f47dee171243f0dbc0b0126cff8fb41b','TRX',1.000,NULL,NULL,3.00,3.00,100003.00,NULL,1772266365),
	(18808665,NULL,10,24,180594165,NULL,'TRX',1.000,18808664,NULL,-0.02,-0.02,99995.42,NULL,1772507582),
	(18808668,NULL,10,24,180594165,NULL,'TRX',1.000,18808667,NULL,-0.02,-0.02,99995.40,NULL,1772517142),
	(18808670,NULL,10,27,180594165,NULL,'TRX',1.000,18808669,NULL,-4.59,-4.59,99990.81,NULL,1772607480),
	(18808672,NULL,10,27,180594165,NULL,'TRX',1.000,18808671,NULL,-4.59,-4.59,99986.22,NULL,1772608946),
	(18808675,NULL,10,10,180594165,'b7b0ee504ab04cd2b253863ddf23525a25fd094b3e944ed992f44684f2a086c5','USDT',3.470,NULL,NULL,0.35,0.35,99986.57,NULL,1772615778),
	(18808678,NULL,10,27,180594165,NULL,'TRX',1.000,18808677,NULL,-6.00,-6.00,99980.57,NULL,1772616920),
	(18808680,NULL,10,10,180594165,'d1801a599475fc78ea9153ff38e3f57b2907120e19f1ed89f38a7546fa1f2f8f','USDT',3.470,NULL,NULL,0.35,0.35,99980.92,NULL,1772617224),
	(18808682,NULL,10,27,180594165,NULL,'TRX',1.000,18808681,NULL,-6.00,-6.00,99974.92,NULL,1772618406),
	(18808683,NULL,10,40,180594184,NULL,'TRX',1.000,NULL,NULL,1.00,NULL,1.00,'后台调账',1772674064),
	(18808684,NULL,10,40,180594184,NULL,'TRX',1.000,NULL,NULL,-1.00,NULL,0.00,'后台调账',1772674081),
	(18808686,NULL,10,10,180594165,'943dcd0354df57c12df71cc90a4d3aaf457f7d8f4bb5aa3f42b869db775dd5f1','USDT',3.430,NULL,NULL,0.34,0.34,99975.26,NULL,1772677218),
	(18808687,NULL,10,40,180594165,NULL,'TRX',1.000,18808681,NULL,3.00,NULL,99978.26,'[{\"time\":1772678573,\"contents\":\"快捷指令退还1笔费用\"}]',1772678573);

/*!40000 ALTER TABLE `funds` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 lease_plan
# ------------------------------------------------------------

DROP TABLE IF EXISTS `lease_plan`;

CREATE TABLE `lease_plan` (
  `plan_id` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `cate` tinyint NOT NULL DEFAULT '10' COMMENT '10 托管1； 20 托管2',
  `with_bandwidth` tinyint DEFAULT NULL,
  `uid` int DEFAULT NULL COMMENT '用户ID,如果没有则为笔数套餐',
  `to_addr` varchar(255) DEFAULT NULL,
  `type` enum('E','B') NOT NULL COMMENT '类型 E能量 B带宽',
  `limit` int NOT NULL COMMENT '托管数量',
  `count` int NOT NULL COMMENT '总笔数',
  `left` int NOT NULL DEFAULT '0' COMMENT '剩余笔数',
  `recharge` decimal(10,2) DEFAULT NULL COMMENT '充值金额',
  `start_at` date DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `last_check_at` int DEFAULT NULL,
  `currency` varchar(7) NOT NULL DEFAULT 'TRX',
  `exchange` decimal(10,3) NOT NULL DEFAULT '1.000',
  `base_exchange` decimal(10,3) DEFAULT NULL,
  `remark` text,
  `status` tinyint NOT NULL DEFAULT '10',
  PRIMARY KEY (`plan_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `lease_plan` WRITE;
/*!40000 ALTER TABLE `lease_plan` DISABLE KEYS */;

INSERT INTO `lease_plan` (`plan_id`, `agent_id`, `cate`, `with_bandwidth`, `uid`, `to_addr`, `type`, `limit`, `count`, `left`, `recharge`, `start_at`, `created_at`, `updated_at`, `last_check_at`, `currency`, `exchange`, `base_exchange`, `remark`, `status`)
VALUES
	(181138785,180594339,20,10,180593568,'TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','E',131000,1,1,2.35,NULL,1757572796,1758274268,0,'TRX',1.000,1.000,NULL,0),
	(181138794,180594165,20,0,180697860,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','E',131000,1,1,2.07,NULL,1757660539,1763109605,0,'TRX',1.000,1.000,NULL,0),
	(181138797,180594165,10,0,180697860,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','E',131000,1,1,2.39,NULL,1757660809,1758700504,0,'TRX',1.000,1.000,NULL,0);

/*!40000 ALTER TABLE `lease_plan` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 lease_records
# ------------------------------------------------------------

DROP TABLE IF EXISTS `lease_records`;

CREATE TABLE `lease_records` (
  `order_id` int NOT NULL,
  `c_no` varchar(255) DEFAULT NULL,
  `parent_order_id` int DEFAULT NULL,
  `tx_id` char(64) DEFAULT NULL,
  `uid` int NOT NULL COMMENT '用户ID',
  `type` enum('B','E') NOT NULL COMMENT '资源类型,E能量 B带宽',
  `platform` tinyint DEFAULT '0' COMMENT '卖家类型 0 系统钱包  10 内部钱包 20 卖家钱包',
  `source` tinyint NOT NULL DEFAULT '10' COMMENT '20 前台订单 24 telegram订单 25 赠送带宽订单  22 api订单 23 自动托管 ',
  `plan_id` int DEFAULT NULL,
  `amount` bigint NOT NULL COMMENT '资源数量',
  `stake_amount` decimal(20,2) DEFAULT NULL,
  `stake_rate` decimal(10,3) DEFAULT NULL,
  `expire` int NOT NULL COMMENT '过期时间值',
  `expire_type` enum('D','H','M') DEFAULT NULL,
  `start_at` int DEFAULT NULL,
  `locked` tinyint DEFAULT '0' COMMENT '是否锁定',
  `expired_at` int DEFAULT NULL,
  `reclaimed_at` int DEFAULT NULL,
  `reclaim_type` tinyint DEFAULT NULL,
  `from_addr` char(34) DEFAULT NULL,
  `to_addr` char(34) DEFAULT NULL,
  `agent_id` int DEFAULT NULL,
  `seller_id` int DEFAULT NULL,
  `price` decimal(10,2) NOT NULL COMMENT '单位SUN',
  `cost` decimal(10,2) NOT NULL COMMENT '单位TRX',
  `agent_price` decimal(10,2) DEFAULT NULL,
  `agent_cost` decimal(10,2) DEFAULT NULL,
  `commission` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '分红数量',
  `agent_commission` decimal(10,2) DEFAULT NULL,
  `net_cost` decimal(10,2) DEFAULT NULL,
  `agent_net_cost` decimal(10,2) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  `agent_total_cost` decimal(10,2) DEFAULT NULL,
  `net_profit` decimal(10,2) DEFAULT NULL,
  `try_counts` int DEFAULT NULL,
  `progress` tinyint NOT NULL DEFAULT '0' COMMENT '订单进程 (已废弃)',
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` tinyint NOT NULL DEFAULT '10' COMMENT '订单状态',
  `last_order_left` int DEFAULT NULL,
  `last_order_id` int DEFAULT NULL,
  `reclaim_tx_id` char(64) DEFAULT NULL,
  `remark` text,
  `created_at` int DEFAULT NULL,
  PRIMARY KEY (`order_id`) USING BTREE,
  UNIQUE KEY `txID` (`tx_id`) USING BTREE,
  UNIQUE KEY `cNo` (`c_no`) USING BTREE,
  KEY `fromAddr` (`from_addr`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `lease_records` WRITE;
/*!40000 ALTER TABLE `lease_records` DISABLE KEYS */;

INSERT INTO `lease_records` (`order_id`, `c_no`, `parent_order_id`, `tx_id`, `uid`, `type`, `platform`, `source`, `plan_id`, `amount`, `stake_amount`, `stake_rate`, `expire`, `expire_type`, `start_at`, `locked`, `expired_at`, `reclaimed_at`, `reclaim_type`, `from_addr`, `to_addr`, `agent_id`, `seller_id`, `price`, `cost`, `agent_price`, `agent_cost`, `commission`, `agent_commission`, `net_cost`, `agent_net_cost`, `total_cost`, `agent_total_cost`, `net_profit`, `try_counts`, `progress`, `balance`, `status`, `last_order_left`, `last_order_id`, `reclaim_tx_id`, `remark`, `created_at`)
VALUES
	(18808659,NULL,NULL,NULL,180594165,'E',0,24,NULL,65000,NULL,NULL,1,'H',NULL,0,NULL,NULL,NULL,NULL,'TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',NULL,NULL,35.00,2.28,NULL,NULL,0.00,NULL,NULL,NULL,2.28,NULL,NULL,7,0,99995.44,-10,NULL,NULL,NULL,NULL,1772246354),
	(18808664,NULL,NULL,'e6482db5394d52c30282a836b6707e0412802c8ad586b45486c173a4ceaf6130',180594165,'E',30,24,NULL,500,53.00,9.500,1,'H',1772508411,10,1772512011,1772512014,0,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',NULL,39,35.00,0.02,NULL,NULL,0.00,NULL,NULL,NULL,0.02,NULL,NULL,19,0,99995.42,30,NULL,NULL,'6db98fb8a61387ad0904b4203165386fddcb708742c4bc6cb24c1ace6ff407ab',NULL,1772507582),
	(18808667,NULL,NULL,'8456ab33b89e8cc03f0634dce9e15383284c5b7db0a07443bcf8f58a1e3de25e',180594165,'E',30,24,NULL,500,53.00,9.500,1,'H',1772517144,10,1772520744,1772520746,0,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',NULL,39,35.00,0.02,NULL,NULL,0.00,NULL,NULL,NULL,0.02,NULL,NULL,1,0,99995.40,30,503,NULL,'af9edb39767c210db507be6ff9e2cd7c5886da29043ab915e55805742d898fb2','[{\"time\":1772519849,\"contents\":\"回收请求失败: 回收资源失败: \\\"436f6e74726163742076616c6964617465206572726f72203a20696e73756666696369656e742064656c656761746546726f7a656e42616c616e636528456e65726779292c20726571756573743d35333030303030302c20756e6c6f636b5f62616c616e63653d30\\\"\"},{\"time\":1772519834,\"contents\":\"回收请求失败: 回收资源失败: \\\"436f6e74726163742076616c6964617465206572726f72203a20696e73756666696369656e742064656c656761746546726f7a656e42616c616e636528456e65726779292c20726571756573743d35333030303030302c20756e6c6f636b5f62616c616e63653d30\\\"\"},{\"time\":1772519819,\"contents\":\"回收请求失败: 回收资源失败: \\\"436f6e74726163742076616c6964617465206572726f72203a20696e73756666696369656e742064656c656761746546726f7a656e42616c616e636528456e65726779292c20726571756573743d35333030303030302c20756e6c6f636b5f62616c616e63653d30\\\"\"},{\"time\":1772519804,\"contents\":\"回收请求失败: 回收资源失败: \\\"436f6e74726163742076616c6964617465206572726f72203a20696e73756666696369656e742064656c656761746546726f7a656e42616c616e636528456e65726779292c20726571756573743d35333030303030302c20756e6c6f636b5f62616c616e63653d30\\\"\"},{\"time\":1772519789,\"contents\":\"回收请求失败: 回收资源失败: \\\"436f6e74726163742076616c6964617465206572726f72203a20696e73756666696369656e742064656c656761746546726f7a656e42616c616e636528456e65726779292c20726571756573743d35333030303030302c20756e6c6f636b5f62616c616e63653d30\\\"\"},{\"time\":1772519774,\"contents\":\"回收请求失败: 回收资源失败: \\\"436f6e74726163742076616c6964617465206572726f72203a20696e73756666696369656e742064656c656761746546726f7a656e42616c616e636528456e65726779292c20726571756573743d35333030303030302c20756e6c6f636b5f62616c616e63653d30\\\"\"},{\"time\":1772519759,\"contents\":\"回收请求失败: 回收资源失败: \\\"436f6e74726163742076616c6964617465206572726f72203a20696e73756666696369656e742064656c656761746546726f7a656e42616c616e636528456e65726779292c20726571756573743d35333030303030302c20756e6c6f636b5f62616c616e63653d30\\\"\"},{\"time\":1772519744,\"contents\":\"回收请求失败: 回收资源失败: \\\"436f6e74726163742076616c6964617465206572726f72203a20696e73756666696369656e742064656c656761746546726f7a656e42616c616e636528456e65726779292c20726571756573743d35333030303030302c20756e6c6f636b5f62616c616e63653d30\\\"\"},{\"time\":1772519730,\"contents\":\"回收请求失败: 回收资源失败: \\\"436f6e74726163742076616c6964617465206572726f72203a20696e73756666696369656e742064656c656761746546726f7a656e42616c616e636528456e65726779292c20726571756573743d35333030303030302c20756e6c6f636b5f62616c616e63653d30\\\"\"}]',1772517141),
	(18808669,NULL,NULL,NULL,180594165,'E',0,27,NULL,131000,NULL,NULL,1,'H',NULL,0,NULL,NULL,NULL,NULL,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',NULL,NULL,35.00,4.59,NULL,NULL,0.00,NULL,NULL,NULL,4.59,NULL,NULL,NULL,0,99990.81,-10,NULL,NULL,NULL,NULL,1772607480),
	(18808671,NULL,NULL,'f70714a54a463120578025ea8d6afbd8cc224dc457a27f52b21673e6c8334f00',180594165,'E',30,27,NULL,131000,13761.00,9.520,1,'H',1772613876,0,1772617476,1772615776,0,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',NULL,16,35.00,4.59,NULL,NULL,0.00,NULL,NULL,NULL,4.59,NULL,NULL,1,0,99986.22,30,130000,18808671,'9e40e6f27a9fbec26591371698cb783436edebda2b302a8035fa72a8046c0dac',NULL,1772608946),
	(18808677,NULL,NULL,'7165407504fcd340d89efda8518626a4c4fb4e5a3ccc9de7d518e28406d311ff',180594165,'E',30,27,NULL,131000,13747.00,9.530,1,'H',1772616924,0,1772620524,1772617331,0,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',NULL,16,0.00,6.00,NULL,NULL,0.00,NULL,NULL,NULL,6.00,NULL,NULL,1,0,99980.57,30,130000,18808677,'367316c4ff448d1c44af5a937c9835c9eedf5d1cfbe7de841df2a2b499e2da0a',NULL,1772616920),
	(18808681,NULL,NULL,'28f2ed93b7a0f9dbbb35c2de39eaa3aa33664ba109baab14f3ad7ad71371770b',180594165,'E',30,27,NULL,131000,13703.00,9.560,1,'H',1772674722,0,1772678322,1772678577,0,'TNBzNucd4jrtJqdFKCLyUmhKjcQ1kbbbbb','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',NULL,16,0.00,6.00,NULL,NULL,0.00,NULL,NULL,NULL,6.00,NULL,NULL,11,0,99974.92,30,NULL,NULL,'0c745c08ccf83d0a72ea0998282062148cf7d961c71c09061079d308b42a8747','[{\"time\":1772678573,\"contents\":\"快捷指令退还1笔费用\"}]',1772618405);

/*!40000 ALTER TABLE `lease_records` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 listened_addr
# ------------------------------------------------------------

DROP TABLE IF EXISTS `listened_addr`;

CREATE TABLE `listened_addr` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `addr` char(34) NOT NULL,
  `amount_limit` int DEFAULT NULL,
  `trx` tinyint NOT NULL DEFAULT '0',
  `usdt` tinyint NOT NULL DEFAULT '0',
  `out` tinyint NOT NULL DEFAULT '0',
  `in` tinyint NOT NULL DEFAULT '0',
  `telegram_id` varchar(31) DEFAULT NULL,
  `remark` text,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



# 转储表 notify_deny
# ------------------------------------------------------------

DROP TABLE IF EXISTS `notify_deny`;

CREATE TABLE `notify_deny` (
  `uid` int NOT NULL,
  `type` int NOT NULL DEFAULT '0',
  UNIQUE KEY `uid` (`uid`,`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `notify_deny` WRITE;
/*!40000 ALTER TABLE `notify_deny` DISABLE KEYS */;

INSERT INTO `notify_deny` (`uid`, `type`)
VALUES
	(180593568,10),
	(180593568,20),
	(180697876,10),
	(180697876,20);

/*!40000 ALTER TABLE `notify_deny` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 out_reach
# ------------------------------------------------------------

DROP TABLE IF EXISTS `out_reach`;

CREATE TABLE `out_reach` (
  `uid` int NOT NULL,
  `nickname` varchar(255) DEFAULT NULL,
  `commission_rate` decimal(4,3) DEFAULT NULL,
  `commission` decimal(12,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `remark` text,
  `status` tinyint NOT NULL DEFAULT '10',
  `created_at` int DEFAULT NULL,
  PRIMARY KEY (`uid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `out_reach` WRITE;
/*!40000 ALTER TABLE `out_reach` DISABLE KEYS */;

INSERT INTO `out_reach` (`uid`, `nickname`, `commission_rate`, `commission`, `balance`, `remark`, `status`, `created_at`)
VALUES
	(180593568,NULL,0.050,0.00,0.00,NULL,10,1748332383),
	(180594165,NULL,0.050,0.03,0.00,NULL,10,1748332615);

/*!40000 ALTER TABLE `out_reach` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 plan_log
# ------------------------------------------------------------

DROP TABLE IF EXISTS `plan_log`;

CREATE TABLE `plan_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `plan_id` int DEFAULT NULL,
  `operate` int NOT NULL COMMENT '10 开启 0 关闭 -10 删除',
  `created_at` int DEFAULT NULL,
  `remark` varchar(255) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `plan_log` WRITE;
/*!40000 ALTER TABLE `plan_log` DISABLE KEYS */;

INSERT INTO `plan_log` (`id`, `uid`, `agent_id`, `plan_id`, `operate`, `created_at`, `remark`)
VALUES
	(1,180697860,180594165,181138797,0,1758700504,'手动关闭'),
	(2,180697860,180594165,181148014,0,1758700508,'手动关闭'),
	(3,180697860,180594165,181138794,10,1763108617,'手动开启'),
	(4,180697860,180594165,181138794,10,1763108863,'手动开启'),
	(5,180697860,180594165,181138794,0,1763109154,'手动关闭'),
	(6,180697860,180594165,181138794,10,1763109522,'手动开启'),
	(7,180697860,180594165,181138794,0,1763109605,'手动关闭');

/*!40000 ALTER TABLE `plan_log` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 plan_transaction
# ------------------------------------------------------------

DROP TABLE IF EXISTS `plan_transaction`;

CREATE TABLE `plan_transaction` (
  `id` int NOT NULL,
  `addr` varchar(34) DEFAULT NULL,
  `tx_id` varchar(255) DEFAULT NULL,
  `contract_addr` varchar(34) DEFAULT NULL,
  `energy_fee` decimal(12,6) DEFAULT NULL,
  `energy_usage` int DEFAULT NULL,
  `bandwidth_fee` decimal(12,6) DEFAULT NULL,
  `bandwidth_usage` int DEFAULT NULL,
  `transfer_at` int DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `txId` (`tx_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



# 转储表 receiver_address
# ------------------------------------------------------------

DROP TABLE IF EXISTS `receiver_address`;

CREATE TABLE `receiver_address` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `addr` char(34) NOT NULL,
  `is_main` tinyint DEFAULT NULL,
  `sort` int DEFAULT '0',
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uid` (`uid`,`addr`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `receiver_address` WRITE;
/*!40000 ALTER TABLE `receiver_address` DISABLE KEYS */;

INSERT INTO `receiver_address` (`id`, `uid`, `addr`, `is_main`, `sort`, `created_at`, `updated_at`, `status`)
VALUES
	(201,178426424,'TYBpgZKow2ENfJPTv8ZCpzAaTUoqHYBEt1',10,0,1726201574,0,10),
	(205,987905,'TARPBo3R1ZeXQY23uKx5CJQVx7EBUCGiii',0,0,1726827941,0,10),
	(208,987905,'TLfK6aJUKAEwgKnyv5KhUdkJyXDcx99jvm',0,7,1726828995,0,10),
	(210,987905,'TPVsYCfYLr9U3xnpYdFzq9NJ8etKY7cnuu',0,2,1730273064,0,10),
	(211,987905,'TLo8N2qD7WBRpCvCVuHEZtSbJCJG7xPP5R',0,7,1731913722,1731913722,10),
	(213,987903,'TBdrV7kKHTc6mB9NkeA6f2mTKwa7cCUC6M',0,2,1732352126,1732352126,10),
	(214,178870275,'TGgvu5b1yJhqTnDQEgJKkChkWFC8AyLe8J',0,0,1733912937,1733912937,10),
	(216,178870275,'TRtCsfvZc6t73XRfsCENWPSnEKHsABn5y4',0,1,1734590334,1734590334,10),
	(217,178870275,'TJJ3v8zGoPx4td75FHbrp489afDf8MEQfS',0,5,1734590460,1734590460,10),
	(218,178870275,'TG2fP7CS5BQPf2zkEBuMHGL5HbZfnfu6t6',10,5,1734932562,1734932562,10),
	(219,178426425,'TCSfU1SAhA1wfEu14ruTtEfUQCUYBjTQc5',10,0,1734932936,1734932936,10),
	(221,179527144,'TLBobwZxwB8rwx2B8bB6RYEF7vc7yhyDgv',0,0,1744957080,1744957080,10),
	(222,179303009,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',0,2,1745546287,1745546287,10),
	(225,179527144,'TG2fP7CS5BQPf2zkEBuMHGL5HbZfnfu6t6',10,6,1745688764,1745688764,10),
	(226,180095173,'TGZVXqxTDwkNKpbE6dDdirVJBmupZzmTyN',0,2,1745805644,1745805644,10),
	(227,180095173,'TN3gfLkRSDb8p5yCy77nyS7jiJckMQS18T',10,1,1745821105,1745821105,10),
	(228,180095173,'TVqpqskRuCx4VBbrLXxFoGtJWM35vG7oiz',0,1,1745825491,1745825491,10),
	(229,179527144,'TWRhoADdMfi7tivm6MA4rXF9wKECc1twCm',0,0,1745917226,1745917226,10);

/*!40000 ALTER TABLE `receiver_address` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 recharge_apply
# ------------------------------------------------------------

DROP TABLE IF EXISTS `recharge_apply`;

CREATE TABLE `recharge_apply` (
  `id` int NOT NULL,
  `cate` tinyint NOT NULL,
  `uid` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `amount` decimal(10,4) NOT NULL,
  `currency` varchar(7) NOT NULL,
  `to_addr` char(34) DEFAULT NULL,
  `count` int DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `expire_at` int DEFAULT NULL,
  `extra` text,
  `status` tinyint NOT NULL COMMENT '10 待处理 20 已完成',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `recharge_apply` WRITE;
/*!40000 ALTER TABLE `recharge_apply` DISABLE KEYS */;

INSERT INTO `recharge_apply` (`id`, `cate`, `uid`, `agent_id`, `amount`, `currency`, `to_addr`, `count`, `created_at`, `expire_at`, `extra`, `status`)
VALUES
	(18808646,20,180594165,NULL,1.9838,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',1,1772178922,1772180722,'{\"energyPerCount\":65000,\"totalEnergy\":65000,\"count\":1,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1\"}',10),
	(18808647,20,180594165,NULL,2.0215,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',1,1772180566,1772181166,'{\"energyPerCount\":65000,\"totalEnergy\":65000,\"count\":1,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt\"}',10),
	(18808648,20,180594165,NULL,1.9554,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',1,1772181172,1772181772,'{\"energyPerCount\":65000,\"totalEnergy\":65000,\"count\":1,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt\"}',10),
	(18808649,20,180594165,NULL,2.0427,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',1,1772181455,1772182055,'{\"energyPerCount\":65000,\"totalEnergy\":65000,\"count\":1,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt\"}',10),
	(18808650,20,180594165,NULL,2.3060,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',1,1772182090,1772182690,'{\"energyPerCount\":65000,\"totalEnergy\":65000,\"count\":1,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt\"}',10),
	(18808651,20,180594165,NULL,4.5882,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',2,1772184891,1772185491,'{\"energyPerCount\":65000,\"totalEnergy\":130000,\"count\":2,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1\"}',10),
	(18808652,20,180594165,NULL,4.5544,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',2,1772185597,1772186197,'{\"energyPerCount\":65000,\"totalEnergy\":130000,\"count\":2,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1\"}',10),
	(18808653,20,180594165,NULL,2.3719,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',1,1772243407,1772243425,'{\"energyPerCount\":65000,\"totalEnergy\":65000,\"count\":1,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1\"}',20),
	(18808656,10,180594165,NULL,100.0801,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',NULL,1772246034,1772246634,NULL,10),
	(18808657,10,180594165,NULL,5.0652,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',NULL,1772246130,1772246730,NULL,10),
	(18808658,20,180594165,NULL,2.3296,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',1,1772246348,1772246354,'{\"energyPerCount\":65000,\"totalEnergy\":65000,\"count\":1,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1\"}',20),
	(18808663,20,180594165,NULL,0.1046,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',1,1772507231,1772507582,'{\"energyPerCount\":500,\"totalEnergy\":500,\"count\":1,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1\"}',20),
	(18808666,20,180594165,NULL,0.0258,'TRX','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',1,1772517135,1772517142,'{\"energyPerCount\":500,\"totalEnergy\":500,\"count\":1,\"type\":\"E\",\"expire\":1,\"expireType\":\"H\",\"resourceType\":\"E\",\"targetAddr\":\"TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1\"}',20);

/*!40000 ALTER TABLE `recharge_apply` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 recharge_records
# ------------------------------------------------------------

DROP TABLE IF EXISTS `recharge_records`;

CREATE TABLE `recharge_records` (
  `id` int NOT NULL,
  `uid` int NOT NULL,
  `agent_id` int DEFAULT NULL,
  `tx_id` char(64) DEFAULT NULL,
  `type` enum('USDT','TRX') NOT NULL,
  `from_addr` char(34) DEFAULT NULL,
  `to_addr` char(34) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `real_amount` decimal(10,2) DEFAULT NULL,
  `exchange` decimal(6,3) NOT NULL,
  `recharge` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `recharge_records` WRITE;
/*!40000 ALTER TABLE `recharge_records` DISABLE KEYS */;

INSERT INTO `recharge_records` (`id`, `uid`, `agent_id`, `tx_id`, `type`, `from_addr`, `to_addr`, `amount`, `real_amount`, `exchange`, `recharge`, `created_at`)
VALUES
	(18808661,180697856,NULL,'3542089edbff038d1def30e67c0b1b68f47dee171243f0dbc0b0126cff8fb41b','TRX','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',3.00,3.00,1.000,0.00,1772266365),
	(18808674,180594165,NULL,'b7b0ee504ab04cd2b253863ddf23525a25fd094b3e944ed992f44684f2a086c5','USDT','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',0.10,0.35,3.470,0.00,1772615778),
	(18808679,180594165,NULL,'d1801a599475fc78ea9153ff38e3f57b2907120e19f1ed89f38a7546fa1f2f8f','USDT','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',0.10,0.35,3.470,0.00,1772617224),
	(18808685,180594165,NULL,'943dcd0354df57c12df71cc90a4d3aaf457f7d8f4bb5aa3f42b869db775dd5f1','USDT','TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',0.10,0.34,3.430,0.00,1772677218);

/*!40000 ALTER TABLE `recharge_records` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 resource_price
# ------------------------------------------------------------

DROP TABLE IF EXISTS `resource_price`;

CREATE TABLE `resource_price` (
  `id` int NOT NULL AUTO_INCREMENT,
  `agent_id` int DEFAULT NULL,
  `in_price` decimal(10,2) DEFAULT NULL,
  `key` varchar(32) NOT NULL,
  `type` enum('B','E') NOT NULL,
  `expire` int NOT NULL,
  `expire_type` enum('D','H','M') DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `status` tinyint NOT NULL DEFAULT '10',
  `updated_at` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `key` (`key`,`agent_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `resource_price` WRITE;
/*!40000 ALTER TABLE `resource_price` DISABLE KEYS */;

INSERT INTO `resource_price` (`id`, `agent_id`, `in_price`, `key`, `type`, `expire`, `expire_type`, `price`, `status`, `updated_at`)
VALUES
	(1,NULL,NULL,'E1H','E',1,'H',30.00,10,NULL),
	(2,NULL,NULL,'E1D','E',1,'D',60.00,10,NULL);

/*!40000 ALTER TABLE `resource_price` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 super_witness
# ------------------------------------------------------------

DROP TABLE IF EXISTS `super_witness`;

CREATE TABLE `super_witness` (
  `addr` char(34) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `vote_count` bigint DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `ranking` int DEFAULT NULL,
  `brokerage` decimal(4,2) DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `status` tinyint DEFAULT '0',
  PRIMARY KEY (`addr`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `super_witness` WRITE;
/*!40000 ALTER TABLE `super_witness` DISABLE KEYS */;

INSERT INTO `super_witness` (`addr`, `name`, `vote_count`, `url`, `ranking`, `brokerage`, `created_at`, `updated_at`, `status`)
VALUES
	('TA43K3sTFYstnRu5ku7DtyzjsR4MLdUgEu','TronMacau',7724107,'https://www.tronmacau.com',42,0.00,1732277287,1732277287,0),
	('TA5KfFoKDdoiSDgNzzH8HUSs4zJtFwqFit','Trust_Wallet',414766,'https://trustwallet.com',79,4.06,1732277287,1732277287,0),
	('TA5Ub5djuEe8naTMxyXyRoKjemqFiE3RmC','FireKrakenMedia',314,'https://firekraken.media',259,0.00,1732277287,1732277287,0),
	('TA8VRz8ofdpmqAvxTKDVGkQRHRWxmRTXGA','TRONPADCOM',163,'https://tronpad.com',278,0.00,1732277287,1732277287,0),
	('TAa14iLEKPAetX49mzaxZmH6saRxcX7dT5','http://TronGr21.com',1501,'http://TronGr21.com',212,0.00,1732277287,1732277287,0),
	('TAAdjpNYfeJ2edcETNpad1QpQWJfyBdB9V','Ant Investment Group',1217458285,'antinvestmentgroup',12,4.57,1732277286,1732277286,0),
	('TAAJiJ1NgkEkE3w1PQk4dA8XH9rpfk5eVE','DescentralizaciOn',5,'HTTPS://BEFREE',378,0.00,1732277287,1732277287,0),
	('TAaVYkzXEuMxscfTwiu9vuE5YSit61JvGT','FiberToken',104,'https://fibertoken.org',290,0.00,1732277287,1732277287,0),
	('TAD78uBWAveGNg3nDN8Ku18MSDeHmTRpbB','SmartRealEstateXRE',2934,'XREGlobal.com',186,0.00,1732277287,1732277287,0),
	('TAEw4zwwYMiDcWFC9xQrLP9moMi34YAZbz','http://imcash.io',114,'http://imcash.io',287,0.00,1732277287,1732277287,0),
	('TAHg5zi2ejWeWiE6bqtDT9vfbH3zNTWrfA','TRXUltra',210447677,'https://trxultra.org',28,0.00,1732277287,1732277287,0),
	('TAhXnVYaAKx6xa8E6JeASR5SrGXHSeyqaL','RinzlerSR',5,'https://rinzler.eu',376,0.00,1732277287,1732277287,0),
	('TAKFctfLwhcUwU7PPfijB35GzpPuiph2XE','oceanview',11913,'https://twitter.com/mr_oceanview',141,0.00,1732277287,1732277287,0),
	('TAmFfS4Tmm8yKeoqZN8x51ASwdQBdnVizt','http://TronGr5.com',13,'http://TronGr5.com',347,0.00,1732277287,1732277287,0),
	('TAQpCTFeJvwdWf6MQZtXXkzWrTS9aymshb','Abra Capital Management',1196774190,'https://valkyrieinvest.com',14,4.58,1732277286,1732277286,0),
	('TAS3kXwHFDbL8J7wQHwopVEfLT26XAWMiq','FruitToken',84468,'https://www.fruit.ws',100,4.06,1732277287,1732277287,0),
	('TAUJxXHnxh7Zhk2Yh23aEHRiwzqXaYTF3T','KalNiranjan',334,'https://sites.google.com/view/metatronsr/introduction',257,0.00,1732277287,1732277287,0),
	('TAXZHpzFwGdqMzF7w8KkFhWkikGY12yUpk','https://dexnode.net',107191,'https://dexnode.net',97,3.25,1732277287,1732277287,0),
	('TAyVDZqhtymJq32itDSxdkRKTRTEb8kkXE','http://test.com',112,'http://test.com',289,0.00,1732277287,1732277287,0),
	('TB6nqQpQDoiWm3VKFjxQrEDi7m84jXjfus','https://bixin.com',5329,'https://bixin.com',161,0.00,1732277287,1732277287,0),
	('TBArD4iwUueGrTu7b7QoqBfyqBocb81TNb','https://wdtronsr.com',2,'https://wdtronsr.com',385,0.00,1732277287,1732277287,0),
	('TBkF5gRmwxq4Zm4K7oBMHvfvUKxD8KYkJ5','TRONJAPAN',4187,'http://tronjapan.io',171,0.00,1732277287,1732277287,0),
	('TBR3MfBcgZV5Yo71tMj6CS55wUGYNiDLms','Operationrange',5628,'https://operationrange.com/',156,0.00,1732277287,1732277287,0),
	('TBsyKdNsCKNXLgvneeUJ3rbXgWSgk6paTM','StakedTron',974150173,'https://staked.us',22,4.23,1732277286,1732277286,0),
	('TBWMoK75hMmjRUtDrEEweA7g8nkSPUzDjG','http://www.ocoins.cc/',40,'http://www.ocoins.cc/',312,0.00,1732277287,1732277287,0),
	('TBXB5tobBPCFkC8ihFDBWjaiwW2iSpzSfr','TRONVIETNAM',4810409,'https://www.tronvietnam.com/',45,3.29,1732277287,1732277287,0),
	('TBYsHxDmFaRmfCF3jZNmgeJE8sDnTNKHbz','http://TronGr22.com',529,'http://TronGr22.com',238,0.00,1732277287,1732277287,0),
	('TBzaVm3e3QmoaG5xjR98DNqZE9bYwqgZcg','BitcoinGOD',302,'https://trx.bitcoingod.org',262,0.00,1732277287,1732277287,0),
	('TBzwNEE7D3DdTB4wALiSBaMmpSK7jdoxYF','TRONSiliconValley',539288,'https://WINTokenGames.com',74,0.00,1732277287,1732277287,0),
	('TC1yZaa75GPPzM26pxfSP3AxsPT8yartQR','CBD-OIL-NETWORK-TOKEN',345,'NULL.DAT',256,0.00,1732277287,1732277287,0),
	('TC1ZCj9Ne3j5v3TLx5ZCDLD55MU9g3XqQW','http://TronGr8.com',711,'http://TronGr8.com',227,0.00,1732277287,1732277287,0),
	('TC34KZDLwARaBrZ2B8eet9GqgLGDpvifiz','Peterkim7238',20,'http://blog.naver.com/coolkim01',334,0.00,1732277287,1732277287,0),
	('TC5R96uvuKb8sS7RABzmi3QyopxgwgXQdZ','Bebrahimi891',13,'https://t.me/Deutschland_1989',345,0.00,1732277287,1732277287,0),
	('TC6qGw3d6h25gjcM64KLuZn1cznNi5NR6t','Crypto Innovation Fund',1315259740,'cryptoinnovationfund',10,4.53,1732277286,1732277286,0),
	('TCCSajWS8qGSF3htnYZvYpnuSaRy6aoGE4','http://www.tronslisa.top',32,'http://www.tronslisa.top',319,0.00,1732277287,1732277287,0),
	('TCEo1hMAdaJrQmvnGTCcGT2LqrGU4N7Jqf','TRONScan',838481037,'https://tronscan.org',26,3.84,1732277287,1732277287,0),
	('TCf5cqLffPccEY7hcsabiFnMfdipfyryvr','http://TronGr20.com',2440,'http://TronGr20.com',191,0.00,1732277287,1732277287,0),
	('TCjwPyWLgry8dD8QCgpYv7cvKe6oK5PM1j','theseusx',250,'https://theseusx.net',266,0.00,1732277287,1732277287,0),
	('TCKLRjJmhFABs4Hbjy5S3DBFoytMQ95hS4','GeoTreasureSR',11269,'digitalgeotreasure.com/',143,0.00,1732277287,1732277287,0),
	('TCmubWCoL7cLA2VDkVn4WGWCT7nqcFavXX','KaanKOZAN',455,'https://twitter.com/KaanKOZANn',247,0.00,1732277287,1732277287,0),
	('TCot7EFnbvCqAyboVyRBSEL15nfBQiwrVq','https://web.firefox.fun',0,'https://web.firefox.fun',420,0.00,1732277287,1732277287,0),
	('TCpUBHKNq8AXZuccdNt7cuVtLtcaGFmDV9','https://www.coinpayu.com/',35796,'https://www.coinpayu.com/',118,4.06,1732277287,1732277287,0),
	('TCqca3v9CDSydN4bWr3u79yEyYdmbxa54Y','StakeBowlNode',3031050,'https://stakebowl.io',55,4.06,1732277287,1732277287,0),
	('TCuX3bzHqkFKqsYKWZDWr8ooH9fFeFJTWR','VX Crypto',46310,'vx_crypto',109,4.02,1732277287,1732277287,0),
	('TCvwc3FV3ssq2rD82rMmjhT4PVXYTsFcKV','http://TronGr10.com',1,'http://TronGr10.com',389,0.00,1732277287,1732277287,0),
	('TCZvvbn4SCVyNhCAt1L8Kp1qk5rtMiKdBB','Crypto Labs',3015247743,'CryptoLabs',2,4.26,1732277286,1732277286,0),
	('TD4anu8auWfCDYqQpAEcLXVK6UgME9Jsid','TronSecure-Super-Representative',17188,'https://tronsecure.io',129,0.00,1732277287,1732277287,0),
	('TDarXEG2rAD57oa7JTK785Yb2Et32UzY32','http://TronGr4.com',2434,'http://TronGr4.com',193,0.00,1732277287,1732277287,0),
	('TDbNE1VajxjpgM5p7FyGNDASt3UVoFbiD3','http://TronGr26.com',510,'http://TronGr26.com',240,0.00,1732277287,1732277287,0),
	('TDD97yguPESTpcrJMqU6h2ozZbibv4Vaqm','Cryptomus',14465834,'https://cryptomus.com/',36,4.06,1732277287,1732277287,0),
	('TDdYEXqbqYGXaufkh2kiZhFQA3oi6A8yoi','TronBoston',10251,'https://www.tronboston.com',147,0.00,1732277287,1732277287,0),
	('TDEhi48MepJYzdb2XfEKe294prSiMssmTx','trongalaxy',199,'http://www.trongalaxy.io',276,0.00,1732277287,1732277287,0),
	('TDGAnbNhYA1dsbPSF2RBNEu1fz4c2vRWbU','Muse_Incorporated',115,'https://www.museprotocol.com',286,0.00,1732277287,1732277287,0),
	('TDGmmTC7xDgQGwH4FYRGuE7SFH2MePHYeH','TeamTronics',1394250,'https://www.tronics.io/',65,0.00,1732277287,1732277287,0),
	('TDGy2M9qWBepSHDEutWWxWd1JZfmAed3BP','CommunityNode',210506,'http://www.communitynode.org/',87,3.85,1732277287,1732277287,0),
	('TDhyFzPiCehQVv4wmYHPr41gJi5SKBHdRJ','TakeAndGive',33048,'https://tag.trustzone.id',121,3.25,1732277287,1732277287,0),
	('TDirsgwgL8i95nzQqyPZ6XuHv9jvJQfTmF','vongabau',30,'http://hqn.vn',324,0.00,1732277287,1732277287,0),
	('TDJ8A5jRuAmb2ctYvZcwtPQaGDv33sVbDD','TronLottery',37908,'https://tronlottery.io',115,0.00,1732277287,1732277287,0),
	('TDo2qwRLEkTZCXzcotiEQLt2wLeTttKTnZ','TronSchool',317,'http://www.tron.school/',258,0.00,1732277287,1732277287,0),
	('TDocCH9FoGVmUPEujwUi5eEKkNQHcZ8y3Y','RintNetwork',31,'https://rint.network',321,0.00,1732277287,1732277287,0),
	('TDpt9adA6QidL1B1sy3D8NC717C6L5JxFo','Chain Cloud',1196479150,'chaincloud',16,4.58,1732277286,1732277286,0),
	('TDpzrQUkUuMBsx67HXByZZNT6u9PUvbifE','http://www.linkvc.com/',9,'http://www.linkvc.com/',361,0.00,1732277287,1732277287,0),
	('TDUjtGPXM6UJkxREWyNV53c9r1L5ZVJLPb','justanthonyhero',100,'https://reyna2.com',292,0.00,1732277287,1732277287,0),
	('TDzsWrq5Fog6nedZqbe1soB62WR2nCCMiE','BlueLion2020',11,'http://cryptochain.network',350,0.00,1732277287,1732277287,0),
	('TE3gESMZ6aBetwALDhqaUBK3QHi7k8VaTK','https://tronforge.xyz',0,'https://tronforge.xyz',400,0.00,1732277287,1732277287,0),
	('TE7BWvxSPbsxZ5MVFFLfmkDnBw3MRFQGtw','ProudBTC1nvest',40,'https://sites.google.com/view/proudbtc1nvest/startsida',311,0.00,1732277287,1732277287,0),
	('TE7hnUtWRRBz3SkFrX8JESWUmEvxxAhoPt','TronWalletMe',8590777,'https://www.tronwallet.me/',40,0.00,1732277287,1732277287,0),
	('TEb5CafPNCX7hfyppWsK87Sbt9UvHhhkHf','OZYS-staking',5418,'https://medium.com/orbit-chain',159,0.00,1732277287,1732277287,0),
	('TEbYtf3gRudzLGEGhfqxkVuUWsNAqmjCLi','RoboCoin',76,'https://www.robocoinexchange.com',299,0.00,1732277287,1732277287,0),
	('TEcqaqvew5eR3gBPeEhj4noHZ2e4aUT7SQ','KuCoin_Staking',156337,'https://www.kucoin.com/news/en-trx-soft-staking-official-rules-cash-back-investment-program-for-tron-trx-holding',90,4.06,1732277287,1732277287,0),
	('TEDJddHqRN6jsh7Dm92rHdvoh3Geqb81jX','https://www.8host.com/',0,'https://www.8host.com/',421,0.00,1732277287,1732277287,0),
	('TEdtp37c9bLDZtJ7DoPcsRW7mxGVoyHVfN','https://quantag.academy',87997,'https://quantag.academy',99,4.02,1732277287,1732277287,0),
	('TEe7HDXdHJemT142R643cajh8BbKdWgR3H','CashierestStaking',157,'	https://www.cashierest.com',280,0.00,1732277287,1732277287,0),
	('TEEzguTtCihbRPfjf1CvW8Euxz1kKuvtR9','http://TronGr14.com',1530,'http://TronGr14.com',205,0.00,1732277287,1732277287,0),
	('TEHLcTgkpR38uuzqpepUB5BtLpBYr45Tbs','Cyber_Tron',0,'Cyber_Tron',411,0.00,1732277287,1732277287,0),
	('TEimkVEaQ7XH8LLwkvhZ8o3w5S7nF9B9te','InfiniTron',7450,'Http://Omni-digital.app',151,0.00,1732277287,1732277287,0),
	('TEKUPpjTMKWw9LJZ9YJ4enhCjAmVXSL7M6','lianjinshu',1017659,'http://www.lianjinshu.com',71,3.25,1732277287,1732277287,0),
	('TELjcuZeP3vCXjq2zvgLsi7dNQry6pDKn5','SteveJobs',10,'http://the-crazy-once.de',355,0.00,1732277287,1732277287,0),
	('TEnUTKNocuYWnYe4eMxUgutiqNijPTKunG','https://smartway.finance',101,'https://smartway.finance',291,0.00,1732277287,1732277287,0),
	('TEPP42EeJWy3bQ6a845ruSoDf64S8FJkLE','Paxful_Wallet',25253,'https://paxful.com/',126,0.00,1732277287,1732277287,0),
	('TEqAjvCS4G71VYminY8tGnunTjEzKrrQDJ','TRONWORLD',4321,'https://tron-world.io',169,0.00,1732277287,1732277287,0),
	('TESbJxpJjKZYuzamimRozWhHCyoz1MHQEa','BixosInc',263,'https://bixos.com',265,0.00,1732277287,1732277287,0),
	('TEsRRMAs4n1yBwzdMuTFEdaKsYANzprtUb','NORA-IGI',23,'https://noraigi.com/en/home',331,0.00,1732277287,1732277287,0),
	('TEsuA4ULsZwfvSRSbu8yx7K3UB6aLi5Djn','TheL1Crew',42,'http://t.me/TheL1Crew',310,0.00,1732277287,1732277287,0),
	('TEsVMAbhaBk56yKgimyqH14gJEYoncNEgz','INRTOKEN-MAIN',6,'https://inrtoken.io/',366,0.00,1732277287,1732277287,0),
	('TEuVwDCt4qGehQTg7DJEC1EsJHpTkWHhqJ','MEG4TRON',2471,'http://www.meg4tron.com/',189,0.00,1732277287,1732277287,0),
	('TEVAq8dmSQyTYK7uP1ZnZpa6MBVR83GsV6','http://TronGr23.com',1525,'http://TronGr23.com',207,0.00,1732277287,1732277287,0),
	('TEVwq7bwFf6ToBu8M3ydD96tnVPyGXf394','daranonetwork',3,'https://darano.network/',383,0.00,1732277287,1732277287,0),
	('TEx5tV96VqUUUn7uAkTUWbduoh62YquHMk','Spiry-Capital',20,'https://spiry.ro/',335,0.00,1732277287,1732277287,0),
	('TEYLwxfyreXXeLSheBWLKQkne8RZxq9y9E','CoinbaseSR',445,'https://www.coinbase.com/',249,0.00,1732277287,1732277287,0),
	('TF1Qpk7Md1NXpHoRTKb3a9MDDQvkT73nci','https://tronscan.org/#/wallet',6,'https://tronscan.org/#/wallet',369,0.00,1732277287,1732277287,0),
	('TFA1qpUkQ1yBDw4pgZKx25wEZAqkjGoZo1','JustinSunTron',1318659,'https://twitter.com/justinsuntron',66,3.25,1732277287,1732277287,0),
	('TFcBLX6W4u7xAFYvcyUDEHT6Cy7GroVLfD','TRONbet',11061,'https://tronbet.com',144,0.00,1732277287,1732277287,0),
	('TFDEzwPqeyKyYGQrXtUTJqiLNKCqBHhVi6','TronCommunityGroup',396397,'.',80,3.25,1732277287,1732277287,0),
	('TFkHXapDnFCq8Cw4LFUzM3cSe6EGnMb4pk','https://atticlab.net',53,'https://atticlab.net',304,0.00,1732277287,1732277287,0),
	('TFqda2yei59QzhFwpA3KypxdJexUV4PuUF','Nodeasy-Pool',6,'https://www.nodeasy.com',371,0.00,1732277287,1732277287,0),
	('TFqEaQBVpJmc6y6sbvXgzu9zsXL1pTKw47','Trust_Nodes',128154818,'https://trustwallet.com',31,3.65,1732277287,1732277287,0),
	('TFQVyHpWSRtH7YbH6xYDamNmKpqBGHmWwc','https://www.coinnest.co.kr',439,'https://www.coinnest.co.kr',251,0.00,1732277287,1732277287,0),
	('TFsgyrtVwUFdc5uZSprhyBJNQzpuoMXjwC','TRONCAMBODIA',216,'https://tronkh.org',270,0.00,1732277287,1732277287,0),
	('TFuC2Qge4GxA2U9abKxk1pw3YZvGM5XRir','http://TronGr11.com',501,'http://TronGr11.com',242,0.00,1732277287,1732277287,0),
	('TFuWG1FeQ3CXTsXnuydHahy3JsZZy11w5M','Lucky2019YearOfThePig',558,'https://globalricetoken.wixsite.com/grttoken',235,0.00,1732277287,1732277287,0),
	('TFxanMr7ffV9YsbXcaSzA9Eja7AA318rha','TRONMANkr',5,'http://tronman.io/',375,0.00,1732277287,1732277287,0),
	('TFYhSxKGD7Ysqi96wozmpGw5P3vC324Kem','HelloWorld',5061,'https://helloworldteam.org',162,0.00,1732277287,1732277287,0),
	('TFyKFQzWvMqGCTJeF8iHh1GNAjwvDa4VwW','TRONEXPERT',0,'https://www.tronexpert.com',417,0.00,1732277287,1732277287,0),
	('TG519wQRpmBNSzVUiHVx6wkVZkLKmxTXxS','ALLE_Exchange',70243,'https://member.alleexchange.com',102,3.25,1732277287,1732277287,0),
	('TG6Nn9pnTv6XLKqoda1CHpaEYYFfyLS9T6','JDI-Venture',0,'http://jdi.group',404,0.00,1732277287,1732277287,0),
	('TGBnYeW24FC9zcVmV3T2Vrz21hJQrHWfJW','Swisstron',3444,'https://www.tron.buzz',179,0.00,1732277287,1732277287,0),
	('TGBSbjAmv4NU8w11q4drFj2Pz9PcEXf62Z','ELONGREEN',514,'https://elongreen.io',239,0.00,1732277287,1732277287,0),
	('TGEa5tx8HitPoVv5Ug9SvGSfreDwUaZQjU','https://www.kraken.com/',0,'https://www.kraken.com/',409,0.00,1732277287,1732277287,0),
	('TGfUjDNr5Huk8DumHfmzY2ksE6RRYpuGLG','BeatzCoin',2275515,'https://www.beatzcoin.io/',59,0.00,1732277287,1732277287,0),
	('TGgF85TNinitZZ1zTf1bKbUyTByAxHLd7G','HOLDTRON',899,'https://t.me/joinchat/F5QrYU9C8y-nAN2w0M327Q',222,0.00,1732277287,1732277287,0),
	('TGiDnq7cxAFwProHPo8MFwhs7C5PU7EyJR','1000WONG',672,'https://twitter.com/1000WONG',229,0.00,1732277287,1732277287,0),
	('TGj1Ej1qRzL9feLTLhjwgxXF4Ct6GTWg2U','Skypeople',3013827,'http://www.skypeople.co.kr',56,3.25,1732277287,1732277287,0),
	('TGJBjL8wmRVyRStkghnhcVNYYgn6Yjno6X','BlockAnalysis',2045296285,'blockanalysis',6,4.36,1732277286,1732277286,0),
	('TGJN4cjvxW62MLjAKizAambVxPTYQCCUKU','TRON-LATAM',51,'https://tron.lat',305,0.00,1732277287,1732277287,0),
	('TGK6iAKgBmHeQyp5hn3imB71EDnFPkXiPR','http://TronGr16.com',3939,'http://TronGr16.com',172,0.00,1732277287,1732277287,0),
	('TGK8YYb9bJVnkw2hRFG1FyNVvXuqkWB4VD','TronGameGlobal',1351,'https://trongameglobal.network',215,0.00,1732277287,1732277287,0),
	('TGMrz1LZbABRA3jG8pFM2V4LaXYBqEi6gh','NipponValid',10000,'https://www.instagram.com/rei_ando33/',144,0.00,1752566403,1752566403,0),
	('TGMZpmGpx8KTGJc8NzBkEBnfzpWGp9Rar8','NextGenius',10,'http://www.nextgenius.com.au',356,0.00,1732277287,1732277287,0),
	('TGnTYAB6XjLWoAGYXmDoLeLeX9X59JFBVK','https://cobo.com',109433,'https://cobo.com',96,3.25,1732277287,1732277287,0),
	('TGqFJPFiEqdZx52ZR4QcKHz4Zr3QXA24VL','http://TronGr7.com',2,'http://TronGr7.com',388,0.00,1732277287,1732277287,0),
	('TGqfuXr6yRBHFF8bbRduc5LRiGH1o4GmL4','CryptoPath',37830,'https://cryptopath.me',116,3.25,1732277287,1732277287,0),
	('TGrTrJrbvnDLUf13yi2JV5i1ovR629WqnR','https://www.synclub.io/',2276,'https://www.synclub.io/',198,0.00,1732277287,1732277287,0),
	('TGuS4RVh8wpQCtAdxij6pYSk9ur6J8fsmb','Happy_East_Capital',78,'http://he.capital/',298,0.00,1732277287,1732277287,0),
	('TGXRA72hwr47NDezgfSqhBJczxsYFQcK2H','http://VeganIS.ME/',827,'http://VeganIS.ME/',223,0.00,1732277287,1732277287,0),
	('TGy7dAFiULcxWAwPT1TSEUgsanMBiyWYCu','CommunitySR',271,'https://kingofdefi.org',264,0.00,1732277287,1732277287,0),
	('TGyChLHDcuHziQgomRgARLwe2LU4aLhtnu','KuailianSandbox',488,'https://kuailiandp.com/',245,0.00,1732277287,1732277287,0),
	('TGYjzvtpM4WiBrWVEBkdVYo8oFVaD3og19','http://helloservice.pro',2,'http://helloservice.pro',387,0.00,1732277287,1732277287,0),
	('TGyrSc9ZmTdbYziuk1SKEmdtCdETafewJ9','Luganodes',1527274222,'https://luganodes.com',8,4.02,1732277286,1732277286,0),
	('TGZdwPPqsR3B9JghJryozpBtZz3kbDEjGM','MyTronScan-FullNode',919,'https://DoNotVote-Not-Active-SR',221,0.00,1732277287,1732277287,0),
	('TGZYYi1KVLJTmNmzJ4B8xxFh4vQCiUuR7U','https://cryptoprocessing.io',1,'https://cryptoprocessing.io',393,0.00,1732277287,1732277287,0),
	('TGzz8gjYiYRqpfmDwnLxfgPuLVNmpCswVp','Sesameseed',15095450,'https://www.sesameseed.org',35,0.00,1732277287,1732277287,0),
	('TH4nPzmbioavDew4GPxD4hHzsLXAetDFSA','https://tron.34rth.com/',8005,'https://tron.34rth.com/',150,0.00,1732277287,1732277287,0),
	('TH7Fe1W8CcLeqN4LGfqX1R9EpsnrJBQJij','P2P.ORG',0,'https://www.p2p.org',418,0.00,1741680003,1741680003,0),
	('TH87qYGLdYTymYpyhxAvZoixBvojhLkhXA','BigBossHogg',15,'https://gotno.life',343,0.00,1732277287,1732277287,0),
	('THHHeoztjbVkpUk9ZXb194mt3jF4Q1DJh4','Billion_Money',568,'https://billionmoney.live/',234,0.00,1732277287,1732277287,0),
	('THHYCCr12cJWejkWw1SFwK7PGx1xGHR3ia','https://wlt.klgtime.com',0,'https://wlt.klgtime.com',414,0.00,1732277287,1732277287,0),
	('THKJYuUmMKKARNf7s2VT51g5uPY6KEqnat','http://TronGr1.com',3550,'http://TronGr1.com',175,0.00,1732277287,1732277287,0),
	('THM4SAoJrNebe8zdQJ8d6eu41XFHHNbb8N','CharityCompassionCoin-CCC',599,'https://CharityCompassionCoin.com',233,0.00,1732277287,1732277287,0),
	('THoSTLFaMH3qnF8yrKSqrXadPRmUAq19mM','jindongwei',2250,'https://weibo.com/6195677429',199,0.00,1732277287,1732277287,0),
	('THpWeDXW422Suo5fNZtz1XU8kpPJ3jo4q1','https://www.rightbtc.com',10,'https://www.rightbtc.com',357,0.00,1732277287,1732277287,0),
	('THWCmwMwtc97qDd1fqkeK8LBwSPgwTeq79','NEOPLY-TRON',13015,'https://www.neoply.com',139,0.00,1732277287,1732277287,0),
	('THWeUoi3HYEnLDXigeyejjFSFAMaAJGnDU','TronicStorm',44,'VoteTronicStorm',309,0.00,1732277287,1732277287,0),
	('THX1ZF1CNdcDMNai2QUSYgdBmsECah6vtJ','https://www.thz.net',4,'https://www.thz.net',381,0.00,1732277287,1732277287,0),
	('THyFzhbcfWw2CJa4eAaHRCst3d5hnyqXLL','LivenodesNetwork',450,'https://www.livenodes.network/',248,0.00,1732277287,1732277287,0),
	('THYPk7Z72REsPrHtZkcwp9pWJadsPxp1UP','bitwirespool',46401,'https://www.beekuaibao.com',108,0.00,1732277287,1732277287,0),
	('TJ2aDMgeipmoZRuUEru2ri8t7TGkxnm6qY','Huobi_pool',102404,'https://www.huobipool.com',98,0.00,1732277287,1732277287,0),
	('TJBtdYunmQkeK5KninwgcjuK1RPDhyUWBZ','JD Investment',1414363518,'JDinvestment',9,4.50,1732277286,1732277286,0),
	('TJDP6oG6KqKzfvhFFhYYmLNt3266666666','BuzzWallet',0,'https://wallet.buzz',406,0.00,1732277287,1732277287,0),
	('TJDziZkvjTbHKpniRf6ySveef77zv7rjBW','https://api.zft.plus/',226174,'https://api.zft.plus/',83,4.06,1732277287,1732277287,0),
	('TJE3hXDseyEgwv31QzysrNBJyDjEhVDBVQ','PRESIDENT',5,'Https://www.numeriuno.eu',380,0.00,1732277287,1732277287,0),
	('TJgmwx9TYaqujmdthJkjaLyWXrwTCmmTan','ZADEA-MadeInItaly',5442,'www',158,0.00,1732277287,1732277287,0),
	('TJhjG9g5NdtNUmAaBRVyj2gBVjtsJM8yq3','https://cc9.io',6,'https://cc9.io',367,0.00,1732277287,1732277287,0),
	('TJKuAQAhZbcg6hw54B5fo4aE2fq5j78LTA','troncoin-nl',82493,'http://troncoin.nl',101,0.00,1732277287,1732277287,0),
	('TJmwW3xm9HNv9dsfDiNQ2P5yw9ojzzCYRc','jd investment',1523,'jdinvestment',208,0.00,1732277287,1732277287,0),
	('TJPgacRkihkAxtsEgH3VY5R6fr8bqykf4j','TronHope',18831,'https://tronhope.org/',128,0.00,1732277287,1732277287,0),
	('TJQHeWxaxaSskBmi7EN19psRe5s9Xn8AcY','mrlavman',248,'https://www.cityuptake.com',267,0.00,1732277287,1732277287,0),
	('TJSG3UZZKKANXNeUxzxR8CzY5G72EkChj7','CryptAPI',2087550,'https://cryptapi.io',60,4.06,1732277287,1732277287,0),
	('TJuRfL3tRdSQvVPKDXi6FRivcbZpsbz7AD','ApexInformatics',531,'http://www.apexinformatics.com',237,0.00,1732277287,1732277287,0),
	('TJvaAeFb8Lykt9RQcVyyTFN2iDvGMuyD4M','Poloniex',2830719765,'https://poloniex.com/',3,4.28,1732277286,1732277286,0),
	('TJX4T7AgfkvWbNAyWTxhgXrJv6Yed6BgDx','TRON-MINING',132005,'https://www.tron-mining.com',93,4.06,1732277287,1732277287,0),
	('TJX72VYuxFRpQ1TWNCUxknQ6gnpAv9tUTe','ConstitutionDAO',443353,'https://www.constitutiondao.com',77,4.06,1732277287,1732277287,0),
	('TJz3YaEaeceU3qhsanaomQp9oomR2Rbecf','Tronix_Global',4794,'www.tronixglobal.com',166,0.00,1732277287,1732277287,0),
	('TK1Q72E87K9T8evFW2ucBGByf96WEbX777','MolotovLab',827,'https://molotovlab.com',224,0.00,1732277287,1732277287,0),
	('TK3XvT4gRx3Hk4z4sngQ4LT7Une7RqzSeS','https://spacebot.ltd/',6,'https://spacebot.ltd/',370,0.00,1732277287,1732277287,0),
	('TK4qxwmq8nDeymtjxzXMkPzq4Gsb39fkLu','Activ8Coin',1535775,'https://activ8coin.com',63,4.06,1732277287,1732277287,0),
	('TK6V5Pw2UWQWpySnZyCDZaAvu1y48oRgXN','http://TronGr6.com',2433,'http://TronGr6.com',194,0.00,1732277287,1732277287,0),
	('TK9qME8revUZ2KfuZApTHwGqqXS9AoTuBX','Tronhuborg',2429,'https://tran.systems/tronhub/',195,0.00,1732277287,1732277287,0),
	('TKEppdcqcY73hgeL9ogta6ZoXR1jfzA2gV','http://d2fapp.com',17,'http://d2fapp.com',339,0.00,1732277287,1732277287,0),
	('TKHDVDgkb6XGS4cHX7nNFy74zswy5Vxr2a','BITXSTAKING',57744,'http://bitxstaking.com',104,4.06,1732277287,1732277287,0),
	('TKhx4UGvVmYLvsyHputZXF4YYgEWkNaXMR','StakingPool',16,'https://stakingpool.com',340,0.00,1732277287,1732277287,0),
	('TKKyKpkxSG6FTXXZn7p5pMcoCE6p9D2X1F','Moonstake',452731,'https://moonstake.io/',76,3.65,1732277287,1732277287,0),
	('TKneSBwUvtA3tYnFTFi228ZpYnr3QYjsxN','Black_Twitter_Token',205,'https://www.blacktwittertoken.com',272,0.00,1732277287,1732277287,0),
	('TKPepDpU2FfagEFRy4eaN2MTevWjpzDNmT','BinanceStaking',21464742,'https://www.binance.com/en/staking',33,3.25,1732277287,1732277287,0),
	('TKryHSq8k6BKoTvxkdHXsYf5KhASwNsVfa','STEEM-UPVU',1,'https://www.uncommonlab.org',391,0.00,1732277287,1732277287,0),
	('TKSXDA8HfE9E1y39RczVQ1ZascUEtaSToF','CryptoChain',975403341,'http://cryptochain.network',21,4.23,1732277286,1732277286,0),
	('TKV52nvtpLe5uapeTabyAYANMQYBXPGVds','TronKorea',1133561,'http://tronkorea.io',69,3.25,1732277287,1732277287,0),
	('TKV775LjfpGbCWqhjy3xt4tk9sceLXxyvP','CryptoprocessingByCoinsPaid',10825409,'https://cryptoprocessing.com/',39,4.22,1733900402,1733900402,0),
	('TKXnhSWxKAfYhsYLkh5wS8qUT1ESBbMSpn','PROMO-NETWORK',1596,'https://promo.network/',203,0.00,1732277287,1732277287,0),
	('TKYW4wDGg3FcaAR8cP8sbmiU8RdZwcK7Bz','WINTokenCommunity',6926,'https://WinTokenGames.com',153,0.00,1732277287,1732277287,0),
	('TL48TNFjeeLkFxNWD65KaePyzmTuVeJA7b','https://klever.io',17591405,'https://klever.io',34,4.06,1732277287,1732277287,0),
	('TL5dCBUQJRa4gQcRe4Ezitp9FYLDNJvdXQ','https://www.paydex.io',5,'https://www.paydex.io',379,0.00,1732277287,1732277287,0),
	('TL6V4kJbNA7EzDK2z88YqKA6m4SnRsgnsK','NEOWIZ-SR',0,'https://www.neowiz.com',399,0.00,1732277287,1732277287,0),
	('TL8rrg2ZNPHtpPFp3j2nwH9BLhN7qg32dh','https://cobo.com',205,'https://cobo.com',273,0.00,1732277287,1732277287,0),
	('TL9C9NYyBAQccj8WWr9bFda26rqhBWHPco','Cryptospace',216708,'https://cryptospace.com/',86,3.65,1732277287,1732277287,0),
	('TLaqfGrxZ3dykAFps7M2B4gETTX1yixPgN','http://TronGr17.com',1517,'http://TronGr17.com',210,0.00,1732277287,1732277287,0),
	('TLBfpfH8aQsvzXpFsD5SonUxtrf8CPFzQc','https://www.ltcgogo.ml',15926,'https://www.ltcgogo.ml',130,0.00,1732277287,1732277287,0),
	('TLCjmH6SqGK8twZ9XrBDWpBbfyvEXihhNS','http://TronGr13.com',18,'http://TronGr13.com',337,0.00,1732277287,1732277287,0),
	('TLCuBEirVzB6V4menLZKw1jfBTFMZbuKq7','https://game.com',5406,'https://game.com',160,0.00,1732277287,1732277287,0),
	('TLF5cNeWQKGUyDDHebQnLTfCNCKGCb4wiu','TeamTronVIP',12591,'https://tronvip.io',140,0.00,1732277287,1732277287,0),
	('TLfeF626BHufnnX3V7NF8d2CPfxWoroH9P','Brick-Foundation',3621,'https://brick.foundation',173,0.00,1732277287,1732277287,0),
	('TLG2B6w4K18HSnje7udYvqMMdJYQ9uYxjJ','https://nansen.ai',35,'https://nansen.ai',317,0.00,1732277287,1732277287,0),
	('TLGLByGtUjKDF6LyNEVzUsvfEVmX2u3btg','STEX_TRX',8188,'https://www.stex.com',149,0.00,1732277287,1732277287,0),
	('TLipnfPL5ajqYB9eqEJuaUBqr2jEG75X2B','https://gconnect.io/',150,'https://gconnect.io/',282,0.00,1732277287,1732277287,0),
	('TLpWEwR5bXM1GBJ2P3BgXLa8DzWTGsaRPb','TronShares',5001,'http://tronshares.com',165,0.00,1732277287,1732277287,0),
	('TLTDZBcPoJ8tZ6TTEeEqEvwYFk2wgotSfD','http://TronGr27.com',210,'http://TronGr27.com',271,0.00,1732277287,1732277287,0),
	('TLTeJxavvgAC5opkDXfXfhRXp4thLfHL5p','BitDogSR',4381,'https://weibo.com/bitdog666',167,0.00,1732277287,1732277287,0),
	('TLUDH2XF9VeN21gxDZopQ5z7L9dUyRWAYn','MCDEX001',4353186,'https://app.mcdex.io/trade/00001/?chainId=42161',46,0.00,1732277287,1732277287,0),
	('TLxcpCwAPTnBVYYrL7JeQCohnLVAfnyQQf','becometa',5843,'https://kryptowaluty.org.pl',155,0.00,1732277287,1732277287,0),
	('TLyKxzA5QUkV6R4PCZKZiLaKeoyT5qnEAA','C773Tron',0,'https://c773.com/',407,0.00,1732277287,1732277287,0),
	('TLyqzVGLV1srkB7dToTAEqgDSfPtXRJZYH','Binance Staking',3356697843,'https://www.binance.com/en/staking',1,3.39,1732277286,1732277286,0),
	('TM2WoRPjYAWjJuR6QSZgaGWkr2qDP2d6sA','Tron-Man',29815,'http://tron-man.com/',122,3.25,1732277287,1732277287,0),
	('TMAbjAuefZqzJAyGhkn4AbWa3jinzcZtGc','MLG-Global',221424,'https://mlgblockchain.com',84,3.25,1732277287,1732277287,0),
	('TMafrJCuNoYq3mg9dDThfg7c9VP6enZN6j','metaverse home',1239878013,'metaversehome',11,4.56,1732277286,1732277286,0),
	('TMAqheVWMaNm15UJTNgasEVpJ7YHYiZVZ8','Allnodes.com ⚡️ 0% fees',3085571,'https://www.allnodes.com/trx/staking',54,4.06,1732277287,1732277287,0),
	('TMAw9NSh6tVs7vLrm9Yo6tNx9hS8uVpnVm','Flower-DAO',38838,'https://twitter.com/FlowerDAO_V',113,4.06,1732277287,1732277287,0),
	('TMDhcpkjJngzSRCWrYjhLjvMSeZGywf9Nb','etixcoin',88,'https://etixcoin.com/',296,0.00,1732277287,1732277287,0),
	('TMEQ4hu7DtLTHPn6qPsYktk1QGdTbAyTEK','Tron-Europe',258533,'www.Tron-Europe.com',81,0.00,1732277287,1732277287,0),
	('TMG95kirH4cKW5GnKoCcCye1dBqbt77yGu','MinerGate',182928243,'https://minergate.com',29,0.00,1732277287,1732277287,0),
	('TMNUDeyr6ZEW8vHAUnaKi2Bbgi14TPq63q','https://cobo.com',15,'https://cobo.com',342,0.00,1732277287,1732277287,0),
	('TMofnVBZeuFTrkYAnQ54TDWNyMbrHzXkwy','BrianJun_Web',6,'https://twitter.com/@brianjun09',372,0.00,1732277287,1732277287,0),
	('TMs377k86n2NXwoZoN6gNCf929u6BKdbvn','odintron',100,'https://twitter.com/black0din',293,0.00,1732277287,1732277287,0),
	('TMU2ZzHzFvKfPTqfVzVH7PSLMTpfyP2SYp','https://alt-e.io/',3474,'https://alt-e.io/',178,0.00,1732277287,1732277287,0),
	('TMwGtBQioBk2pjCsLWUaQ4rcQNf5DS6FLQ','siqveland',712,'http://tronsiqveland.co.uk/',226,0.00,1732277287,1732277287,0),
	('TMXamLGmArfCEFoVXbrvbyXpzMT2Tq1FBy','DEXExchange-DEXCOIN-XDEX',6,'Change Your Vote From This SR Position, To Our New SR Position: \"DEXExchange-DEXCOIN\"',374,0.00,1732277287,1732277287,0),
	('TMXiQ2W35fDochXM6dDUrF3ZDnWR2uwcRW','PHI-ECAFE',30,'https://phituasesor.com/sr-tron-trx-phi-ecafe/',323,0.00,1732277287,1732277287,0),
	('TMXUSGrhhWctWwpVykCFPMAo9mQiGjaXGU','TRON-BENELUX',51299,'https://www.facebook.com/Tron-BENELUX-102409935185040',105,3.65,1732277287,1732277287,0),
	('TMYf7Ux87MKB1j9x4Y7Qrn5AWAZt7M3g6a','cyberminter',10,'http://cyberminter.com/',359,0.00,1732277287,1732277287,0),
	('TMykaWQe9YinNb36yE5k4MH9VUEGyKgQQA','testmain',12,'https://www.wunderchain.com',348,0.00,1732277287,1732277287,0),
	('TN1XmTJ44u7xjtSUNMzjHgjh4ivfS1yP6F','GravelTRON',1842,'https://gravelproject.io/',201,0.00,1732277287,1732277287,0),
	('TN2MEB71iox2mDwwngdTrUyUZXeENcb79F','SR-TRON-Europe',4028017,'https://www.tron-europe.org',47,0.00,1732277287,1732277287,0),
	('TN2W4cc7a4dsYyTLiLMWa9m7jVpdLjGvYs','Huobi_Wallet',1196602713,'https://www.huobiwallet.com/',15,4.58,1732277286,1732277286,0),
	('TN7N9QCauvngEsQgBNSwnh24CWwbLHmFbN','https://www.youtube.com/channel/UCS5oVB09MKVHvHFhQjIRCMw',0,'https://www.youtube.com/channel/UCS5oVB09MKVHvHFhQjIRCMw',397,0.00,1732277287,1732277287,0),
	('TN8jmSQv79QHa37cckKMguDyf3vAKtpvDs','BlockChainRealEstate',4194,'tronsr',170,0.00,1732277287,1732277287,0),
	('TN8Y2ZztFHW3CrgPYQMK3BPp7VYiHKfvF9','SexTronsAndRocknRoll',50896,'https://twitter.com/TronsRocknRoll',106,0.00,1732277287,1732277287,0),
	('TN9rYynDSPinTuvRg8G1TdrEjAc2f3X2dX','Tron-France',15438,'http://www.tron-france.com',132,0.00,1732277287,1732277287,0),
	('TNaJADoq1u2atryP1ZzwvmEE4ZBELXfMqw','callmeSR',2427425032,'http://zempty.peiwo.cn/',5,4.31,1732277286,1732277286,0),
	('TNaMNHgtqS763tXwbzGDRhn5qUL9RwfcTn','TronixInternational',200,'https://tronix.international/',275,0.00,1732277287,1732277287,0),
	('TNd2MPxccwBZoqpJuCrDEeNJizx5tmyNLs','TRAC_REG',25,'www.upvote.world TBD',328,0.00,1732277287,1732277287,0),
	('TNddBi3qJv26Ghqqd3qb97ERx47AwMWhR6','Segrith1',45159,'https://www.baggi.co/',111,4.06,1732277287,1732277287,0),
	('TNeEwWHXLLUgEtfzTnYN8wtVenGxuMzZCE','OKCoinJapan',822351036,'https://okcoin.jp/',27,4.57,1732277287,1732277287,0),
	('TNEqakRxoJ1YsLK2t5c57vZyWWbDpetq7y','GameOfTron',2860,'https://www.gameoftron.net/',187,0.00,1732277287,1732277287,0),
	('TNfqpGrR3v4bQo8jemVyEpiUGFipQxj8sH','TheProphet',954,'www.dtroynx.com',220,0.00,1732277287,1732277287,0),
	('TNGoca1VHC6Y5Jd2B1VFpFEhizVk92Rz85','http://TronGr12.com',3102,'http://TronGr12.com',183,0.00,1732277287,1732277287,0),
	('TNHpUuakVeceLagF9k6j8HU9KruSQ23cXW','TronWatch',659,'https://www.google.com/',230,0.00,1732277287,1732277287,0),
	('TNi5gk1xVLR3QddJ5t6ReraYed63WjWGPj','smoksolutios',2999,'ffgtrgh',185,0.00,1732277287,1732277287,0),
	('TNkRSKWP7VvdrisTwC8iNzUV6MRoEJh6xx','Health-Port-EHR-Issuing-Account',28459,'https://healthport.io/',123,0.00,1732277287,1732277287,0),
	('TNmas2SUNGJ2R1jq4Sivya5nHDLYN9ggpG','TheLastMe',14052,'http://www.thelast.me',134,0.00,1732277287,1732277287,0),
	('TNMcBfKauBykfamL2YkE8WFNDUBmahQzYx','Newpool-TRON',3115979,'https://tron.newdex.one',53,0.00,1732277287,1732277287,0),
	('TNq7jKkTfFEvGXeqqZR5nk6wFse31wXv8B','miPool',0,'https://mipool.one',397,0.00,1732777202,1732777202,0),
	('TNQeGSCCK28cXVNCL8KHQ7mMx8pzBgz7sT','KuailianPayments',138928,'https://kuailiandp.com/',92,0.41,1732277287,1732277287,0),
	('TNRKgJ6Le7xLsewFayFonaVhftxV5KNVnC','TRONIUM-SR',11,'http://www.tronium.net',351,0.00,1732277287,1732277287,0),
	('TPCszPpdmHrx7NDZsr162AiG3MA4sUNE1d','https://trezor.io/',400,'https://trezor.io/',254,0.00,1732277287,1732277287,0),
	('TPD7dthTz6sjRhkopeBVqHQBB5LgyARHoA','https://lesp888.info',24,'https://lesp888.info',330,0.00,1732277287,1732277287,0),
	('TPDa1KRmFpLA42WffiXBwEykef9exHNPKV','https://t.me/hwdbtrx',0,'https://t.me/hwdbtrx',408,0.00,1732277287,1732277287,0),
	('TPEPbmN3DqrJ3n35jcccrxGzoDA5hSi1bn','BitTron_BTN',11,'https://www.bittron.org',352,0.00,1732277287,1732277287,0),
	('TPfok58xnZwzxsJTGekekwGvpzf5VRzQXw','MelihKURT',505,'http://www.healtcarecash.com',241,0.00,1732277287,1732277287,0),
	('TPhyLGPVVz6KCkpMZejUkHStfmbiiky9mk','Rabexio1',0,'https://rabex.io',416,0.00,1732277287,1732277287,0),
	('TPjc5LNkpa5iwjUv8u4XXV92JA2JaAxHgL','http://bz.com/',18,'http://bz.com/',336,0.00,1732277287,1732277287,0),
	('TPMGfspxLQGom8sKutrbHcDKtHjRHFbGKw','Infinity-Stones',127123,'https://infstones.io/',94,0.00,1732277287,1732277287,0),
	('TPoD5zksnpTDDW33RmAZ6BWEjdYPxW1WBC','Tron-Capital',1230180,'https://www.instagram.com/originalstylee',68,4.06,1732277287,1732277287,0),
	('TPpKBv6cv3oT54NcgBvr4iyG6mRWyq6CMA','InferoCrypto',82,'https://InferoCrypto.com',297,0.00,1732277287,1732277287,0),
	('TPr4Po9LHUuxqfuRyjpiWctkP39EbpujXH','ONGISTRON™ ',11,'https://t.me/ONGISTRON_NewsChannel',353,0.00,1732277287,1732277287,0),
	('TPrimoGth5oWUS9YRAC8S1h1jNu1Yf3TuG','PrimoGardensInc',10304,'https://www.primogardensinc.com',146,0.00,1732277287,1732277287,0),
	('TPRxUBEakukBMwTScCHgvCPSBYk5UhfboJ','CryptoDivaSR',37064,'http://www.cryptodiva.io/',117,0.00,1732277287,1732277287,0),
	('TPsQ4XsQEFwSWGr2Zae62kuo69MABA1cVU','FedayKeen',22,'http://www.contactnetwork.fr/',332,0.00,1732277287,1732277287,0),
	('TPtryrrXSVT9cefs4wvL3ks2J5sr8PJLcg','TronBlock',551,'https://tronblock.co',236,0.00,1732277287,1732277287,0),
	('TPVMxXoci8SAoJMF1Xyqzethg4Qzoh51Z7','SevoNikolovTRX',1122,'https://www.facebook.com/sevo.nikolov',218,0.00,1732277287,1732277287,0),
	('TPWan2jFh4JNaFaNozRSC2c3X7bELpCHzu','https://tronsyolo.com',6680463,'https://tronsyolo.com',43,0.00,1732277287,1732277287,0),
	('TQ1TFctjSWzwCouZxM2Q5VNh6azxqpKSAr','WEARETRON',770,'https://TRON.MOVIE',225,0.00,1732277287,1732277287,0),
	('TQ4bh4nQknQp33vuf1mUAKu5M5TWW8cTAD','Intelligence Quant',1562861250,'IntelligenceQuant',7,4.46,1732277286,1732277286,0),
	('TQ4EtNraCeAh4xkw7xLGiWZMbtMtbBv7Bj','TronTexas',202,'https://trontx.com',274,0.00,1732277287,1732277287,0),
	('TQ8qAxMCcrrCeXMmmy5MkgjXtzNogmQtGb','https://www.baidu.com',40,'https://www.baidu.com',313,0.00,1732277287,1732277287,0),
	('TQANnQ4DwspKuuF3BCvaukwXGHD4G36XGH','BlakeStorie',10,'https://mobile.twitter.com/busyblaze',358,0.00,1732277287,1732277287,0),
	('TQFemZuyBZKaaARRDuDfvDvQsdpDb9Qt7v','Coinone',11933173,'https://node.coinone.co.kr',37,3.25,1732277287,1732277287,0),
	('TQhdzwEyYbQsrzxqb2RCQtw1fnadhuc94P','https://blockchaintec.network/',349,'https://blockchaintec.network/',255,0.00,1732277287,1732277287,0),
	('TQhuVjZtmp6k4fPmGZLr4wyXdziCVSPkEX','Google Cloud',962376375,'https://cloud.google.com/',24,0.00,1732277286,1732277286,0),
	('TQLCBejffwVGYNK9mJj4wzUsHdtkJJ8KUw','Jorgekobo',417698,'http://www.spaintrx.com',78,3.65,1732277287,1732277287,0),
	('TQNCne1UuKFmihsHjzebNSob7nS9xk9JNL','https://TRXGUARDIAN.ORG',25,'https://TRXGUARDIAN.ORG',329,0.00,1732277287,1732277287,0),
	('TQopP5GM68QoqLzpz8YReDfSoCMkvwcZYd','cryptoAI',1174489437,'https://cryptoai.com',18,4.59,1732277286,1732277286,0),
	('TQq5ynrFUoDt338dXSWM4abFfF8YQ1PysX','TRXKings',20,'https://www.trxkings.com',333,0.00,1732277287,1732277287,0),
	('TQQ6akqQfkUoB26PfnkLkEqKoh1BNvQoFs','BitcoinWorld',6,'https://www.bitcoinworld.com/',373,0.00,1732277287,1732277287,0),
	('TQrGUuZi4MojsW3mTx5CzWr2pbmPQu6wTd','StakingPaython',3287,'http://165.22.252.90/',182,0.00,1732277287,1732277287,0),
	('TQtSeHqP8ZtkZxmywfPEGz6pwbKFtKoTEQ','https://www.facebook.com/sopianjohn85',0,'https://www.facebook.com/sopianjohn85',401,0.00,1732277287,1732277287,0),
	('TQUKraByJXWBGPM3i9DqxeMTYsonMVdhNM','https://bihu.com/people/1791797618',3,'https://bihu.com/people/1791797618',382,0.00,1732277287,1732277287,0),
	('TQuykY6ETCErhUdumqcoQB1poVRuWNkng5','SabetFinance',0,'https://www.sabet.finance',419,0.00,1732277287,1732277287,0),
	('TQwqK8LhHGria5gkkfCVqQfE5mSwpvdp3B','Tron-Society',208402,'https://tron-society.com',88,0.00,1732277287,1732277287,0),
	('TQxyQu5d76MaxsEF4nBf9tFa8s93nSHe8M','tronproio',3568,'http://tronpro.io',174,0.00,1732277287,1732277287,0),
	('TQzd66b9EFVHJfZK5AmiVhBjtJvXGeSPPZ','Kiln_Staking',10058562,'https://kiln.fi',39,3.65,1732277287,1732277287,0),
	('TR2GceZyViN7UKdAGhXaZBe6KzGVaTzwag','https://www.instagram.com/jameslu65',0,'https://www.instagram.com/jameslu65',403,0.00,1732277287,1732277287,0),
	('TRAzTRvjfd7TCqfUkB1zJ6vMv7Y7F7puZr','Vena_Family',63,'https://www.vena.network',300,0.00,1732277287,1732277287,0),
	('TRE6JANcQBfmXTDooRyStoALZNWvEgNpsE','Tronbite',58,' ',302,0.00,1732277287,1732277287,0),
	('TRjk9RiwdhnwvijRqWvmnt1w2hLXyPkKtY','GBUnitedFund',491,'https://tronscan.io/GBUnitedFund',244,0.00,1732277287,1732277287,0),
	('TRKJzrZxN34YyB8aBqqPDt7g4fv6sieemz','http://TronGr24.com',501,'http://TronGr24.com',243,0.00,1732277287,1732277287,0),
	('TRLnLri5w7q9VigSeTJEjog4RuVtwoqvCr','https://mdt.co',2002,'https://mdt.co',200,0.00,1732277287,1732277287,0),
	('TRMP6SKeFUt5NtMLzJv8kdpYuHRnEGjGfe','http://TronGr25.com',1526,'http://TronGr25.com',206,0.00,1732277287,1732277287,0),
	('TRmPzvoYssWC5NKvCy3g32VoiNUjSaK7xr','CanadaTron',135,'https://tron.financial',284,0.00,1732277287,1732277287,0),
	('TRMTnvb1SXsqv37mrj7cf2gjVX96AdXMcQ','oatzaazaaoat',2,'https://tronscan.io/#/address/TRMTnvb1SXsqv37mrj7cf2gjVX96AdXMcQ',386,0.00,1732277287,1732277287,0),
	('TRni6NxF8CQVcywcDm67sEpCYCo7BUGXCD','FreeSpace',39,'https://youtu.be/pWhw_NjVV68',316,0.00,1732277287,1732277287,0),
	('TRSMQteQDRt4kHoaQ8uU24WHPrTsDTZEVR','Prospective_LLc',2297975,'https://prospective.world',58,0.69,1732277287,1732277287,0),
	('TRSZydUjAZaA5aMYA21J9iWriNF1q1bwzW','TRONCanada',307,'https://www.troncanada.com/',260,0.00,1732277287,1732277287,0),
	('TRTC1DxDg2eWPHmyc3DTGR672rVHoZQa8h','https://hitbtc.com',1784,'https://hitbtc.com',202,0.00,1732277287,1732277287,0),
	('TRXDEXMoaAprSGJSwKanEUBqfQjvQEDuaw','TrxDexCom',1638419,'https://github.com/trondex/',62,0.00,1732277287,1732277287,0),
	('TRXhcpTyvFnpf9SdUdzsTXJg1JfYmkZZQB','hedgedCap',13090,'https://sites.google.com/view/tsuperrep',138,0.00,1732277287,1732277287,0),
	('TRyF5ijvfGaetQ3oZWuujMP3LFFjxaGcU6','http://www.uscoin.live',240,'http://www.uscoin.live',268,0.00,1732277287,1732277287,0),
	('TS4vTdFRNJCHZex8j7bozAiRXGXvtRjhAF','TEAMHELIOS',13148,'https://teamhelios.org/',137,0.00,1732277287,1732277287,0),
	('TSbhZijH2t7Qn1UAHAu7PBHQdVAvRwSyYr','Intergalactic-Gaming',665465,'https://www.iggalaxy.com',72,0.00,1732277287,1732277287,0),
	('TSBogkZPpr9C5btGEAub1uJqHJkFU34Uj1','SteveTrx',17,'https://www.dsptoken.io?ref=TSBogkZPpr9C5btGEAub1uJqHJkFU34Uj1',338,0.00,1732277287,1732277287,0),
	('TSBT5RFwcnanSYSgRYGLpxY8HLURDHXheg','Topcredit',303,'https://www.tope.com/',261,0.00,1732277287,1732277287,0),
	('TSEHJbvpnevJP4zR3uTgXJ1toZ16bPz3uW','https://zhizhu.top/',135,'https://zhizhu.top/',283,0.00,1732277287,1732277287,0),
	('TSeJtWDCowLuYnibVsZVr3N2U3ypVap5hG','TronSwap',1113,'https://tronswap.io',219,0.00,1732277287,1732277287,0),
	('TSeU7Sa22kRVo2gUSt47S6PiW8NRktPt8o','a4ooooooo',6,'https://a4oo.ml',368,0.00,1732277287,1732277287,0),
	('TSFb39rFQj58X1ct3cnypBK6aT5amCqHiZ','SmartContractMainWallet',25572,'http://hellocrypto.ltd',124,2.43,1732277287,1732277287,0),
	('TSFdrkxNmGMmSGVHg1QynxkjzzDxY1572M','https://www.facebook.com/krigsons',1423,'https://www.facebook.com/krigsons',213,0.00,1732277287,1732277287,0),
	('TSkXBuJBsnjdVFADqU2CsmD6YaCuxN7AHe','https://antpool.com',1567,'https://antpool.com',204,0.00,1732277287,1732277287,0),
	('TSLByu8S1fAXohgvsLjDJRpnWDmnKFoeiQ','https://decalholics.com/',1,'https://decalholics.com/',394,0.00,1732277287,1732277287,0),
	('TSMC4YzUSfySfqKuFnJbYyU3W6PBebBk2E','Smart Consensus',1204328248,'SmartConsensus',13,4.57,1732277286,1732277286,0),
	('TSNbzxac4WhxN91XvaUfPTKP2jNT18mP6T','BitTorrent',2821938,'https://www.bittorrent.com/',57,3.25,1732277287,1732277287,0),
	('TSNGrvpwrVBNqX3NxFcXNBDtXqW2ajbUfJ','Mcgriddles',8,'https://www.bitmart.com/',364,0.00,1732277287,1732277287,0),
	('TSnYuvSdUMiHopGDopNZzDbHbZWKxx4Eqb','http://trx.megastake.space',6063,'http://trx.megastake.space',154,0.00,1732277287,1732277287,0),
	('TSoEtsYTqWjKZBobpzpZsB26rWa3Ck9KdH','https://twitter.com/yunwu5267?t=uVM-TiT4SQAzgFa-2Z6gUA&s=09',0,'https://twitter.com/yunwu5267?t=uVM-TiT4SQAzgFa-2Z6gUA&s=09',395,0.00,1732277287,1732277287,0),
	('TSQ8c97uCRG5ZugLDZ8jdbhtktNLgh6f26','AurumCryptoCompany',5,' ',377,0.00,1732277287,1732277287,0),
	('TSqaF9Cdh7MxP84NRFMEoRo3gFYN3bnaBP','FasstGlobal',0,'https://fasstx.com',413,0.00,1732277287,1732277287,0),
	('TSrE9QG9jKLr21dic27SuecQDjXZzzPYYY','TRON-Shark',654,'https://www.shark.vin',231,0.00,1732277287,1732277287,0),
	('TSRmKPv8kvokcHKfLeySQ3gNHyYrAAXrnc','DAPPHOUSE',46129,'http://dapps.house',110,3.25,1732277287,1732277287,0),
	('TSRondb2bBbFjKpcvS5N2HkoGPkgiNnN84','https://validatorhub.co.za/',34243,'https://validatorhub.co.za/',120,3.45,1732277287,1732277287,0),
	('TSspYecmTae3SH4agg5kziiBFbXxn6Fy7Y','Global-Lottery',89,'https://blockchainlott.com',295,0.00,1732277287,1732277287,0),
	('TSyG9BdjsGE2GoHG9eeYKMns6zMQFDmbvS','TarquinRealEstate',25461,'xreglobal.com',125,0.00,1732277287,1732277287,0),
	('TSyZCD3j7c9LtFZ2roZX1QoSD7b5HE12tG','https://github.com',8,'https://github.com',363,0.00,1732277287,1732277287,0),
	('TSzoLaVCdSNDpNxgChcFt9rSRF5wWAZiR4','TRXMarket',233537,'http://trx.market',82,3.25,1732277287,1732277287,0),
	('TT3ygYaojy9ZryyB9YxxnJX4XBPFvHqYnv','http://www.tronsbank.vip',15128,'http://www.tronsbank.vip',133,0.00,1732277287,1732277287,0),
	('TT64g3f68SmjfyRX1JDZhWskdsueYLiUMZ','BlockChainGPT',2,'https://www.blockchaingpt.com',384,0.00,1732277287,1732277287,0),
	('TTCrBKXyTCS2B5ktjivNtHiSyCPTCLWv3v','TronVietNam',13674,'https://www.tronvietnam.org',135,0.00,1732277287,1732277287,0),
	('TTcYhypP8m4phDhN6oRexz2174zAerjEWP','CryptoGuyInZA',933499411,'https://www.cryptoguyinza.co.za/',25,4.25,1732277286,1732277286,0),
	('TTDY8aQQizYCHA7qdmgtLgPNEe2YWEfPZa','TEAMX-SR',16,'https://www.teamx.com',341,0.00,1732277287,1732277287,0),
	('TTECz1XMg6RrV6YFaXgZrcwS77Qpr4WYVq','GlobalStaking',40,'https://6789trx.com/',314,0.00,1732277287,1732277287,0),
	('TTENv9A7zf543xdVmnaon42SqsGGd7L7p8','Bankroll_Network',23234,'https://bankroll.network',127,3.25,1732277287,1732277287,0),
	('TTfrzRa2eB6YX9abuf9NxN8AuooKeUxKQS','CEX-IO-Validator_0_Fees',5530,'https://cex.io/',157,0.00,1732277287,1732277287,0),
	('TTfTKZTtMksif9dwmoGiwx92CEdwTzScX3','https://twitter.com/MasterBlox_io/status/1631782840818868231',0,'https://twitter.com/MasterBlox_io/status/1631782840818868231',396,0.00,1732277287,1732277287,0),
	('TTiAHqKadiLPVZjiKaAjHDXkq7sfEozQZr','Cancancan',6,'Can',365,0.00,1732277287,1732277287,0),
	('TTjacDH5PL8hpWirqU7HQQNZDyF723PuCg','NEOPLY-Staking',3523348,'https://www.neoply.com',52,3.85,1732277287,1732277287,0),
	('TTMNxTmRpBZnjtUnohX84j25NLkTqDga7j','TronSpark',1075365884,'https://tronspark.com',19,4.17,1732277286,1732277286,0),
	('TTpt2bmR3WR5Zwa7z32P2ncRP9eaV9irZK','http://teleblog.io/',0,'http://teleblog.io/',405,0.00,1732277287,1732277287,0),
	('TTqAUsBx4hcSNmLxiUzEscUFADsV7Q7CqC','XQ-BoChang',32,'https://www.dxchain.com/',320,0.00,1732277287,1732277287,0),
	('TTSt647opgK4KRbrDF89ibKYBo2RsGLw2n','https://www.pioneer.com',40,'https://www.pioneer.com',315,0.00,1732277287,1732277287,0),
	('TTTZFEVSxpZ8gVHwJVs6yhzBuN4xbHuoES','--BANK--',9,'www.tbd.com',360,0.00,1732277287,1732277287,0),
	('TTuT2AG5q37f74zra7PjAApUmyVaXmFvC4','RayboTron',10857,'http://raybo.com',145,0.00,1732277287,1732277287,0),
	('TTVLVuMfmM5SGdS5qNhVnyKTAedbZg5kqA','TRON_CASH',50,'https://www.tron.cash',306,0.00,1732277287,1732277287,0),
	('TTW663tQYJTTCtHh6DWKAfexRhPMf2DxQ1','TRONALLIANCE',2790829396,'http://tronalliance.org',4,4.28,1732277286,1732277286,0),
	('TTxrh32VJveqiYRwbLEX2wLTMFCfbpAUQj','OKX Earn',971089989,'https://www.okx.com/earn/home',23,4.46,1732277286,1732277286,0),
	('TTxt1K49riY6FvAkk84xJzBEBPtMbFa85M','BittrexStaking',48833,'https://global.bittrex.com/',107,3.25,1732277287,1732277287,0),
	('TTXuNxcNEy5twXTphq2erbEETvMVfBoERP','TB_Investment',12,'https://www.tbinvestment.com',349,0.00,1732277287,1732277287,0),
	('TTyNZXwUjF9g8us4HUgEXMvNuzRkcvopbL','TRONBITCOIN',441,'http://tronbitcoin.io',250,0.00,1732277287,1732277287,0),
	('TU1ucME2H17XX2BrTZzaAvn8t9st669JTc','beerisgood',3504,'https://portal.justlend.org/?lang=en-US',177,0.00,1732277287,1732277287,0),
	('TU5gKG2QrysL4wmjM6ydonVDcEtupuVHCN','DEXExchange-DEXCOIN',3002,'https://dexexchange.us',184,0.00,1732277287,1732277287,0),
	('TU5Td1DnsL84aeoMXTm7HGW7Nt5kuxHoCs','GSC-GlobalSocialChain',0,'https://gsc.social',412,0.00,1732277287,1732277287,0),
	('TUbPJqc7pw9iSkWC2a3dWJAThSnnesAwFq','https://www.hashfin.com',400,'https://www.hashfin.com',253,0.00,1732277287,1732277287,0),
	('TUD4YXYdj2t1gP5th3A7t97mx1AUmrrQRt','TRONGrid',1074871632,'https://www.trongrid.io',20,3.71,1732277286,1732277286,0),
	('TUHkTGbNAYWVbJ8WCcUJj66ui1nrFd9k2m','Huxliumworkforce',15,'https://huxlium.org',344,0.00,1732277287,1732277287,0),
	('TUJPDwQ4eTuuJtcGDKsizKV95TuCmowSZr','StakeWithMe',11327,'http://StakeWithMe.io',142,0.00,1732277287,1732277287,0),
	('TUMgzqpJKPRUMNhTpwCpP9PLXwYRjrnvSo','CryptoHellas',605,'https://t.me/Crypt0Hellas',232,0.00,1732277287,1732277287,0),
	('TUpoK1NUFcXpVjn7AvTsSCAYwD559CEaxr','TrIP4web',96,'https://trip4web.com',294,0.00,1732277287,1732277287,0),
	('TUwgUNvVr3QPBVHgoEZvVw8K4a4QHkpvED','IDAONetworks',15755,'http://www.i-dao.io',131,0.00,1732277287,1732277287,0),
	('TUzEApori8CkTpCvTUT922NTq6K8jEkVH6','FlowerDAO',9548,'https://www.flower.dog',148,0.00,1732277287,1732277287,0),
	('TV3TMyDbbBu5iwB1GPMZzAfTETDhtav3KE','Credz_io',2355,'https://www.credz.io',196,0.00,1732277287,1732277287,0),
	('TV4jnSrjq869eZ4j8Vbu4ioPMasqYrW5ko','Tronhubme',50,'http://tronhub.me',307,0.00,1732277287,1732277287,0),
	('TV6qcwSp38uESiDczxxb7zbJX1h2LfDs78','TronsTronics',2047047,'Tronstronics',61,0.00,1732277287,1732277287,0),
	('TV9QitxEJ3pdiAUAfJ2QuPxLKp9qTTR3og','BitGuild',52524242,'https://www.bitguild.com',32,4.06,1732277287,1732277287,0),
	('TVa6MF7SgZa8PToLoQ9PNq6KQHyTXLBz1p','KryptoKnight',8006154,'http://krypto-knight.us/',41,3.45,1732277287,1732277287,0),
	('TVbttVPEYh6K99Zofi8VuYX6MrJDJ6FY44','Valkyrie Investments',1408779,'https://valkyrieinvest.com',64,3.98,1732277287,1732277287,0),
	('TVDmPWGYxgi5DNeW8hXrzrhY8Y6zgxPNg4','http://TronGr2.com',2435,'http://TronGr2.com',192,0.00,1732277287,1732277287,0),
	('TVds7ZDSWGTKF5avZGtWHwhiHz91BogLae','https://www.facebook.com/gtoups/603060284648405',0,'https://www.facebook.com/gtoups/603060284648405',398,0.00,1732277287,1732277287,0),
	('TVFKwzE8qeETLaZEHMx2tjEsdnujAgAWaA','BlockchainOrg',1195937876,'http://blockchain.org',17,4.58,1732277286,1732277286,0),
	('TVGAM39FrwMFcyCZ4aZEE46CvEd9Adgbeo','GuardaWallet',6233833,'https://guarda.com/',44,3.85,1732277287,1732277287,0),
	('TVGYho2v6mUhFMuhYy4sWx8BA79b4FzwSg','AOCOINIO',678,'HTTPS://AOCOIN.IO',228,0.00,1732277287,1732277287,0),
	('TVkstdVtthhegUvWjeMgi3KfWr29S28baG','TRON-INDIA',38296,'https://tron.blocksindia.com/',114,3.25,1732277287,1732277287,0),
	('TVLpHaZ4kafexmv9S4RK9ARhjU7LJJA5Qa','https://HWInvestment',0,'https://HWInvestment',410,0.00,1732277287,1732277287,0),
	('TVMC8C7Y4f4ABr48PJencVdunVVB4XUW96','https://dootron.com/en/home',9,'https://dootron.com/en/home',362,0.00,1732277287,1732277287,0),
	('TVMP5r12ymtNerq5KB4E8zAgLDmg2FqsEG','CryptoGirls',560187,'https://www.cryptogirls.ro/',73,0.00,1732277287,1732277287,0),
	('TVQ6wERJ4YBd1TqH9bdYT1VV93CP393eiT','TRON-Bet',13,'https://www.tronbet.io',346,0.00,1732277287,1732277287,0),
	('TVrdyw1qCMzW59QycTytDXVbbXFDBgBj42','StakeBowl',61471,'https://stakebowl.io',103,0.00,1732277287,1732277287,0),
	('TVSdAnnZUdSH8gdeUgMPTht1mXmhtEXAN3','TRON-BOOM',35227,'www.tronspirit.com',119,3.45,1732277287,1732277287,0),
	('TVsofxarmK6TYPzF7QkYsKxUhYtKFzrsRW','COINHEIO',1377,'https://coinhe.io',214,0.00,1732277287,1732277287,0),
	('TVSRos7nkBPaQXxZfXxXusM8iLPZbZCHry','http://t77t.com',489999,'http://t77t.com',75,0.00,1732277287,1732277287,0),
	('TW5oEHAE2LqMdozna7HBDiW6U56f6m8Vfa','TRON-Ace',4368,'https://www.tronace.com',168,0.00,1732277287,1732277287,0),
	('TW9C1ZU66H3G1s6CNpGX8kC8iZABV7vEr3','Direct2Sun',115,'https://omagod.tistory.com/',285,0.00,1732277287,1732277287,0),
	('TWb93mTXSGqThvHyJ8gEf7zSQyYkMTAjgV','TuruGlobal_SR',3535880,'https://turuglobal.com/',51,3.25,1732277287,1732277287,0),
	('TWcebMiHwZbnt6viAtyVEG57bj7DWcZUPx','whaleexbp',224,'https://www.whaleex.com',269,0.00,1732277287,1732277287,0),
	('TWEcP8CPhcdmmo1R2RANXGBRYAHvxNoLst','OneMillionCom_Community',3336,'https://www.millioncoinx.com/pl',181,0.00,1732277287,1732277287,0),
	('TWeZZDaDu63CebHsnDGUhsKAZ2cHz7uFJt','NodeCapital',5002,'http://www.nodecap.com/',164,0.00,1732277287,1732277287,0),
	('TWGGB35HUudizmcLheQN7kANDnD8KfgKkK','TRON-Family',3716703,'https://www.tron-family.de',49,3.25,1732277287,1732277287,0),
	('TWjGyMHSxx4pJ3V4ES5E4ANE2NWW9xcWcp','TronVote',27,'https://tronvote.club',326,0.00,1732277287,1732277287,0),
	('TWKFjPakHP54EAXTMifbKA77RT3g8cyZoQ','https://www.digitalcurrencydaily.com',1207,'https://www.digitalcurrencydaily.com',217,0.00,1732277287,1732277287,0),
	('TWkpg1ZQ4fTv7sj41zBUTMo1kuJEUWTere','TRONLink',136959105,'https://tronlink.org',30,3.25,1732277287,1732277287,0),
	('TWKZN1JJPFydd5rMgMCV5aZTSiwmoksSZv','http://TronGr3.com',406,'http://TronGr3.com',252,0.00,1732277287,1732277287,0),
	('TWm3id3mrQ42guf7c4oVpYExyTYnEGy3JL','http://TronGr9.com',2452,'http://TronGr9.com',190,0.00,1732277287,1732277287,0),
	('TWmYacoioZVVDn3jwVCd28sEJpJARyybSF','BitTorrentNow',3536,'http://bt.co',176,0.00,1732277287,1732277287,0),
	('TWQFDB9By1JJexx5VqiJEWbBA9dtiMmphG','ByteDance',151860,'Byte Dance Labs',91,4.06,1732277287,1732277287,0),
	('TWsyGWXyU9JYC74QV543EjRnJ87n9qUiqM','https://t.me/Tc_0x00',0,'https://t.me/Tc_0x00',415,0.00,1732277287,1732277287,0),
	('TWT3B6F9U68PrHddyoMpE1XhTvYEAHHdLA','JSBFoundation',2319,'https://jsb.foundation/',197,0.00,1732277287,1732277287,0),
	('TWT4BantYCwgQCN9ubxd8Lz765Sw8yv8iL','ROCA-TRON',0,'    ',402,0.00,1732277287,1732277287,0),
	('TWvncFqyDfMcKfjsx4hvoWwhJfF5yKMZcU','http://foo.bar',3710852,'http://foo.bar',50,0.00,1732277287,1732277287,0),
	('TWVshJt3KxRZmgxKaAhkmRKghyGoyyA1zL','Hillwell ',35,'https://www.dee7.com',318,0.00,1732277287,1732277287,0),
	('TWVVi4x2QNhRJyhqa7qrwM4aSXnXoUDDwY','Brutus_Tron_Staking',10468453,'https://www.brutustoken.com',38,4.06,1732277287,1732277287,0),
	('TWwaKmzCGF4Hka99GHuR8Waz1mrEtkByeN','TronInvestGroup',10,'https://www.troninvestgroup.org',354,0.00,1732277287,1732277287,0),
	('TWWYdS9hHi6qmBxkDPoKWmev5rv2D9bQWU','SpiryCapital',59,'https://spiry.ro',301,0.00,1732277287,1732277287,0),
	('TX3ZceVew6yLC5hWTXnjrUFtiFfUDGKGty','http://TronGr18.com',1209,'http://TronGr18.com',216,0.00,1732277287,1732277287,0),
	('TX663KZ2dKmLvxhCnyY3rytowLNR4TmdVf','MusicCasper',219111,'https://www.musiccasper.com/',85,0.00,1732277287,1732277287,0),
	('TX9nw7PXpGHLqRNMWmj8izyNvzy7JU5qXi','TronCenter',159,'http://www.troncenter.com',279,0.00,1732277287,1732277287,0),
	('TXbcmuJ6BMiZeXrWBSFwNvxd2Ggs1Jjrmu','NOBI_Staking',178317,'https://usenobi.com',89,3.25,1732277287,1732277287,0),
	('TXd5uuk9wk6TCwbz3yUFhFXjdyaxffVs4Q','https://www.biconomy.com/',13495,'https://www.biconomy.com/',136,0.00,1732277287,1732277287,0),
	('TXio2SKopbzwyZ5XPxfFwceBFFHDKjEvUZ','www',1,'www',390,0.00,1732277287,1732277287,0),
	('TXnqPcy9zWHYyCiQ7Kmvt3aCx5jm9Qnq3e','TRON-Want',43652,'https://TRON-Want',112,4.06,1732277287,1732277287,0),
	('TXSh73A7dwbQU3Navx5217hf9Yjp3QEGD1','LUCKYGAMES',50,'https://t.me/TronParty',308,0.00,1732277287,1732277287,0),
	('TXUqMBAisbzUg3myoZys7q9wQqafyUUJib','PYRO-Network',26,'https://pyro.network',327,0.00,1732277287,1732277287,0),
	('TXWoCHzDqhRahAr6Bts4vDdS7HR2Xb9vLw','https://github.com/tronnode-007/tron-node',1,'https://github.com/tronnode-007/tron-node',392,0.00,1732277287,1732277287,0),
	('TY4MrSdT1wkEXy9PseuaU3v4xt84fFqBAx','http://www.tronslink.vip',3437,'http://www.tronslink.vip',180,0.00,1732277287,1732277287,0),
	('TY65QiDt4hLTMpf3WRzcX357BnmdxT2sw9','uTorrent',1022507,'https://www.utorrent.com/',70,3.25,1732277287,1732277287,0),
	('TY83yqtx1ksa5kHrHYgWGhLWshFqcsVmfV','TRON-Investment',113041,'TRON-Investment',95,0.00,1732277287,1732277287,0),
	('TYednHaV9zXpnPchSywVpnseQxY9Pxw4do','http://TronGr19.com',0,'http://TronGr19.com',418,0.00,1732277287,1732277287,0),
	('TYEYCoYyKdH2zekWo7fy77sALpQJmSTixr','Tron-DAG',29,'http://www.dagbvi.com',325,0.00,1732277287,1732277287,0),
	('TYftfpnCitoxju9rMYx6XNegUHmFoPMary','ReynaExchange',7183,'https://reyna.exchange/',152,0.00,1732277287,1732277287,0),
	('TYNh7Td8z7jga1tZYvkZvn4AKxq8aPmGZm','genesiscap',5020,'http://newgenesiscap.com/',163,0.00,1732277287,1732277287,0),
	('TYqxoFgQLtq7f146uJS533GMU88nEpwKgz','GM-Informatics-SR-001',112,'https://www.gm-informatics.com',288,0.00,1732277287,1732277287,0),
	('TYShuadcBNBKgk8UgxsnB43yeBdyioswHh','tronfans',155,'http://www.tronfans.info',281,0.00,1732277287,1732277287,0),
	('TYtySRuCWqNkgEynVbkAfrfijTsYbJKqb3','CryptoUnicornMoney',195,'https://discord.gg/Uw6TbEe',277,0.00,1732277287,1732277287,0),
	('TYTYuSyiEpxNsjakQSRmjiZAymvxoBbziH','TronLabsRomania',1521,'https://www.tronlabs.ro',209,0.00,1732277287,1732277287,0),
	('TYVJ8JuQ6ctzCa2u79MFmvvNQ1U2tYQEUM','TRON-ONE',3737007,'http://tronone.com',48,0.00,1732277287,1732277287,0),
	('TYWSifqtAfa9MCEUsTbpcEtcmJMnxZK4rU','test-account do not vote',1505,'test-account do not vote',211,0.00,1732277287,1732277287,0),
	('TYy6xnc35LkyEuU9fJv4x89vkhLZim1yJv','EtherPoker',2757,'http://www.etherpoker.cc',188,0.00,1732277287,1732277287,0),
	('TZ1ZBqgZ8PUdEk6dxEYwyZCqxYwHj9PmS2','Metronix',1268916,'https://metronix.imba-exchange.co',67,3.85,1732277287,1732277287,0),
	('TZ2iD3EW2fGSkez7zZXEo7VwXhQPPXRkVR','rewards-for-all-not-just-for-SR',283,'http://bit.ly/libertytron',263,0.00,1732277287,1732277287,0),
	('TZ8NZA6PPKSK2wHuFAo8vzf4VZnMtmDugF','Surface-Foundation',468,'https://t.me/tron_my',246,0.00,1732277287,1732277287,0),
	('TZBABURn1nNxw63QiezbTvhRPmFjomSz2Q','RB-Main-L',55,'https://cryptotalkers.com',303,0.00,1732277287,1732277287,0),
	('TZHvwiw9cehbMxrtTbmAexm9oPo4eFFvLS','http://TronGr15.com',30,'http://TronGr15.com',322,0.00,1732277287,1732277287,0);

/*!40000 ALTER TABLE `super_witness` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 sys_cfg
# ------------------------------------------------------------

DROP TABLE IF EXISTS `sys_cfg`;

CREATE TABLE `sys_cfg` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `group` varchar(255) DEFAULT NULL,
  `key` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `rule` varchar(255) DEFAULT NULL,
  `desc` varchar(255) DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `key` (`key`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `sys_cfg` WRITE;
/*!40000 ALTER TABLE `sys_cfg` DISABLE KEYS */;

INSERT INTO `sys_cfg` (`id`, `name`, `group`, `key`, `value`, `rule`, `desc`, `created_at`, `updated_at`, `status`)
VALUES
	(11,'TronGrid密钥','系统配置','trongridKey','813ee822-0f6e-4edf-b279-d9a1fe85c4b5','string',NULL,1734776251,NULL,0),
	(12,'卖家最低质押数','卖家配置','sellerMinAsset','5000','integer/min:0',NULL,1734776251,1749182620,10),
	(13,'提现手续费','提现配置','withdrawFee','1','integer/min:0',NULL,1734776251,1747646704,10),
	(14,'最小提现金额','提现配置','minWithdraw','10','integer/min:0',NULL,1734776251,NULL,10),
	(15,'自动免审金额','提现配置','autoWithdrawAmount','20','integer/min:0',NULL,1734776251,NULL,0),
	(16,'单笔能量数量','公链配置','singleAmount','65000','integer/min:1',NULL,1734776251,1761643997,10),
	(17,'最小能量租赁数量','订单配置','minEnergyLease','20000','integer/min:0',NULL,1734776251,1749220406,10),
	(18,'最大足量租赁数量','订单配置','maxEnergyLease','10000000','integer/min:0',NULL,1734776251,NULL,10),
	(19,'最小带宽租赁数量','订单配置','minBandwidthLease','100','integer/min:0',NULL,1734776251,NULL,10),
	(20,'最大带宽租赁数量','订单配置','maxBandwidthLease','10000','integer/min:0',NULL,1734776251,NULL,10),
	(21,'卖家分红比例','卖家配置','proportion','0.55,0.75','each/number/min:0/max:1',NULL,1734776251,1736844423,10),
	(22,'最大API数量','系统配置','apiCount','3','integer/min:0',NULL,1734776251,NULL,10),
	(23,'自动解绑钱包地址时间','系统配置','autoUnbindAddrExpire','3600','integer/min:0',NULL,1734776251,NULL,10),
	(25,'U充值汇率微调','充值配置','rechargeFee','-0.05','number/max:1/min:-1',NULL,1734776251,NULL,0),
	(26,'单笔带宽数量','公链配置','singleBandwidthAmount','350','integer/min:1',NULL,1734776251,1736832995,10),
	(27,'机器人用户名','机器人配置','botUrl','trxenio_bot','string',NULL,1734776251,NULL,10),
	(28,'频道地址','机器人配置','channelUrl','trx2me','string',NULL,1734776251,NULL,10),
	(29,'是否开启自动提现','提现配置','autoWithdraw','0','in/0,10',NULL,1734776251,NULL,0),
	(30,'频道订单单价','机器人配置','quickRechargePrice','1','integer/min:0',NULL,1734776251,1736844412,10),
	(31,'T充值最低数量','充值配置','trxMinRechargeAmount','1','integer/min:0',NULL,1734776251,NULL,10),
	(32,'U充值最低数量','充值配置','usdtMinRechargeAmount','1','integer/min:0',NULL,1734776251,1736841767,10),
	(33,'U充值汇率','充值配置','uRechargeExchange','3.47','number/min:0',NULL,1734776251,1758873962,10),
	(34,'频道订单过期时间','订单配置','quickEnergyExpire','10M','in/10M,1H',NULL,1734776251,NULL,10),
	(35,'通知群ID','系统配置','notifyGroup','-1002841574760','number',NULL,1734776251,1753121829,0),
	(36,'U转T最低数量','机器人配置','minU2TAmount','2','integer/min:0',NULL,1734776251,NULL,10),
	(37,'客服飞机用户名','机器人配置','csUsername','trxenio','string',NULL,1734776251,NULL,10),
	(38,'联系我们','系统配置','contactUsEmail','suport@trxen.io','string','联系我们的系统邮箱',1734776251,1745773345,10),
	(39,'投票地址','系统配置','voteAddr','TCZvvbn4SCVyNhCAt1L8Kp1qk5rtMiKdBB','string',NULL,1734776251,NULL,0),
	(40,'代理分拥比例','系统配置','agentProportion','0.05','number/max:1/min:0',NULL,1734776251,NULL,10),
	(41,'投票提现最低金额','系统配置','minAutoVoteWithdrawAmount','100','integer/min:0',NULL,1734776251,NULL,10),
	(42,'自动回收检查时间','订单配置','earlyRecoveryTime','60','integer/min:0',NULL,1734776251,NULL,0),
	(43,'自动回收能量剩余数量','订单配置','earlyRecoveryAmount','1000','integer/min:0',NULL,1734776251,1749220423,0),
	(44,'是否开启签到送能量','活动配置','dailyFreeEnergy','10','in/0,10',NULL,1734776251,1736842485,10),
	(45,'签到送能量过期时间','活动配置','dailyFreeEnergyExpire','1H','in/10M,1H',NULL,1734776251,NULL,10),
	(46,'签到送能量是否送带宽','活动配置','dailyFreeBandwidth','0','in/0,10',NULL,1734776251,NULL,0),
	(47,'能量质押比例','公链配置','energyStakeExchange','9.55','readonly',NULL,1734776251,1758880546,10),
	(48,'带宽质押比例','公链配置','bandwidthStakeExchange','1.62','readonly',NULL,1734776251,1758880546,10),
	(49,'是否赠送带宽','订单配置','freeBandwidth','0','in/0,10',NULL,1734776251,1752565393,10),
	(51,'UT基本汇率','公链配置','baseExchange','3.52','readonly',NULL,NULL,1758873962,0),
	(52,'能量单价','公链配置','energyPrice','100','readonly',NULL,NULL,1756713104,10),
	(53,'带宽单价','公链配置','bandwidthPrice','1000','readonly',NULL,NULL,1737014934,10),
	(54,'播报群号','机器人配置','broadcastGroup','-4609488796','string',NULL,NULL,1745513503,10),
	(59,'卖家数量','卖家配置','sellerNum','10','in/0,10','',1747646770,1749182091,10),
	(61,'能量警报值','系统配置','lowEnergy','1000000','integer',NULL,1,1749146769,10),
	(64,'托管单价','订单配置','autoLeasePrice','30','number',NULL,1,NULL,10),
	(65,'托管占位费单价','订单配置','autoLeaseDayPrice','60','number',NULL,1,NULL,10),
	(66,'能量用掉多少算一笔','回收配置','planUsedReclaim','5000','integer/min:0',NULL,1,1,10),
	(67,'带宽低于多少提前回收','回收配置','earlyNetRecoveryAmount','300','integer/min:0',NULL,1,NULL,10),
	(68,'无U能量','订单配置','noUEnergyAmount','131000','integer/min:0',NULL,1,1,10),
	(69,'充值地址','系统配置','rechargeAddr','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','string',NULL,NULL,NULL,10),
	(70,'u换t收u地址','系统配置','u2tRechargeAddr','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','string',NULL,NULL,NULL,10),
	(71,'指令价格（2笔）','订单配置','shortcutsPrice','6','number',NULL,NULL,NULL,10);

/*!40000 ALTER TABLE `sys_cfg` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 transaction_records
# ------------------------------------------------------------

DROP TABLE IF EXISTS `transaction_records`;

CREATE TABLE `transaction_records` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tx_id` char(64) DEFAULT NULL,
  `block_number` bigint DEFAULT NULL,
  `timestamp` int DEFAULT NULL,
  `from_addr` char(34) DEFAULT NULL,
  `to_addr` char(34) DEFAULT NULL,
  `amount` decimal(20,6) NOT NULL,
  `currency` enum('TRX','USDT') NOT NULL,
  `fee` decimal(20,6) DEFAULT '0.000000',
  `net_usage` decimal(20,6) DEFAULT NULL,
  `net_fee` decimal(20,6) DEFAULT NULL,
  `energy_usage` decimal(20,6) DEFAULT NULL,
  `energy_fee` decimal(20,6) DEFAULT NULL,
  `energy_usage_total` decimal(20,6) DEFAULT NULL,
  `energy_penalty_total` decimal(20,6) DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `type` tinyint NOT NULL DEFAULT '0',
  `finished_at` int DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `remark` text,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `txID` (`tx_id`,`amount`) USING BTREE,
  KEY `idx_transaction_hash` (`tx_id`) USING BTREE,
  KEY `idx_sender_address` (`from_addr`) USING BTREE,
  KEY `idx_recipient_address` (`to_addr`) USING BTREE,
  KEY `idx_block_number` (`block_number`) USING BTREE,
  KEY `idx_timestamp` (`timestamp`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `transaction_records` WRITE;
/*!40000 ALTER TABLE `transaction_records` DISABLE KEYS */;

INSERT INTO `transaction_records` (`id`, `tx_id`, `block_number`, `timestamp`, `from_addr`, `to_addr`, `amount`, `currency`, `fee`, `net_usage`, `net_fee`, `energy_usage`, `energy_fee`, `energy_usage_total`, `energy_penalty_total`, `created_at`, `type`, `finished_at`, `status`, `remark`)
VALUES
	(1,'3542089edbff038d1def30e67c0b1b68f47dee171243f0dbc0b0126cff8fb41b',80533657,1772266362,'TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',3.000000,'TRX',0.000000,NULL,NULL,NULL,NULL,NULL,NULL,1772266364,10,NULL,20,NULL),
	(2,'677e7a13234f98d5d5dba7a25f8f1cced48650041e18002b9c08aef336c4c158',80533679,1772266428,'TXvTupfsLmLqTfC52WvT1E3XHDiXzrVdR1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',0.000002,'TRX',0.000000,NULL,NULL,NULL,NULL,NULL,NULL,1772266446,0,NULL,5,'[{\"time\":1772692591,\"contents\":\"111\"}]'),
	(3,'b7b0ee504ab04cd2b253863ddf23525a25fd094b3e944ed992f44684f2a086c5',80649705,1772615775,'TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',0.100000,'USDT',0.000000,NULL,NULL,NULL,NULL,NULL,NULL,1772615775,10,NULL,20,NULL),
	(5,'d1801a599475fc78ea9153ff38e3f57b2907120e19f1ed89f38a7546fa1f2f8f',80650183,1772617209,'TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',0.100000,'USDT',0.000000,NULL,NULL,NULL,NULL,NULL,NULL,1772617222,10,NULL,20,NULL),
	(6,'943dcd0354df57c12df71cc90a4d3aaf457f7d8f4bb5aa3f42b869db775dd5f1',80670179,1772677215,'TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',0.100000,'USDT',0.000000,NULL,NULL,NULL,NULL,NULL,NULL,1772677215,10,NULL,20,NULL);

/*!40000 ALTER TABLE `transaction_records` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 unique_id
# ------------------------------------------------------------

DROP TABLE IF EXISTS `unique_id`;

CREATE TABLE `unique_id` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `unique_id` WRITE;
/*!40000 ALTER TABLE `unique_id` DISABLE KEYS */;

INSERT INTO `unique_id` (`id`, `created_at`)
VALUES
	(18808642,1758872006),
	(18808643,1771826983),
	(18808644,1771827378),
	(18808645,1772178409),
	(18808646,1772178922),
	(18808647,1772180566),
	(18808648,1772181172),
	(18808649,1772181455),
	(18808650,1772182090),
	(18808651,1772184891),
	(18808652,1772185597),
	(18808653,1772243407),
	(18808654,1772243425),
	(18808655,1772243425),
	(18808656,1772246034),
	(18808657,1772246130),
	(18808658,1772246348),
	(18808659,1772246354),
	(18808660,1772246354),
	(18808661,1772266365),
	(18808662,1772266365),
	(18808663,1772507231),
	(18808664,1772507582),
	(18808665,1772507582),
	(18808666,1772517135),
	(18808667,1772517141),
	(18808668,1772517142),
	(18808669,1772607480),
	(18808670,1772607480),
	(18808671,1772608946),
	(18808672,1772608946),
	(18808673,1772615775),
	(18808674,1772615778),
	(18808675,1772615778),
	(18808676,1772615778),
	(18808677,1772616920),
	(18808678,1772616920),
	(18808679,1772617224),
	(18808680,1772617224),
	(18808681,1772618406),
	(18808682,1772618406),
	(18808683,1772674064),
	(18808684,1772674081),
	(18808685,1772677218),
	(18808686,1772677218),
	(18808687,1772678573);

/*!40000 ALTER TABLE `unique_id` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 user_device
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_device`;

CREATE TABLE `user_device` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `lang` varchar(255) DEFAULT NULL,
  `fingerprint` varchar(255) NOT NULL,
  `token` varchar(32) NOT NULL,
  `os` varchar(32) DEFAULT NULL,
  `browser` varchar(255) DEFAULT NULL,
  `login_at` int DEFAULT NULL,
  `login_ip` varchar(255) DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `last_active_ip` varchar(255) DEFAULT NULL,
  `expired_at` int DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `fingerprint` (`fingerprint`,`uid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `user_device` WRITE;
/*!40000 ALTER TABLE `user_device` DISABLE KEYS */;

INSERT INTO `user_device` (`id`, `uid`, `lang`, `fingerprint`, `token`, `os`, `browser`, `login_at`, `login_ip`, `created_at`, `updated_at`, `last_active_ip`, `expired_at`, `status`)
VALUES
	(36,180593568,'zh-CN','qRTE7qXuhkmfafFfW1Lr0QENBhog2Zhw','aTlnJHr-nLe2Hu1pyThLJswF1pa5ppM3','OS X@137.0.0.0','Chrome@10_15_7',1751739892,'127.0.0.1',1751739892,1751739892,NULL,NULL,10),
	(37,180697856,'zh-CN','GGpXGQUTGPzp9WO9e_A9jrtdYLyj6eR-','PVnl2NpokjrGwJNIvIvnablEFW79Adn7','OS X@137.0.0.0','Chrome@10_15_7',1752050216,'192.168.31.117',1752050216,1752050216,NULL,NULL,10),
	(38,180594165,'zh-CN','GGpXGQUTGPzp9WO9e_A9jrtdYLyj6eR-','F3txTO86JJRsZ1nP7e3JxMYDvX8P8ycD','OS X@137.0.0.0','Chrome@10_15_7',1752050266,'192.168.31.117',1752050266,1753091242,NULL,NULL,10),
	(39,180594339,'zh-CN','qRTE7qXuhkmfafFfW1Lr0QENBhog2Zhw','pAFRkoAjC4GruLyMzTJ6kXpNQ8nHwVw_','OS X@137.0.0.0','Chrome@10_15_7',1753118050,'127.0.0.1',1753118050,1753118050,NULL,NULL,10),
	(40,180697856,'zh-CN','null','aRJW6fgSHUv-3ZDShDVfSRnBtchA01mQ','OS X@139.0.0.0','Chrome@10_15_7',1755586746,'192.168.31.117',1755586746,1755586746,NULL,NULL,10),
	(41,180697856,'zh-CN','aRJW6fgSHUv-3ZDShDVfSRnBtchA01mQ','4PyYHxGDSjCtrt4fRqnI8RRtYf2UONQe','OS X@139.0.0.0','Chrome@10_15_7',1755588447,'192.168.31.117',1755588447,1755588447,NULL,NULL,10),
	(42,180594165,'zh-CN','aRJW6fgSHUv-3ZDShDVfSRnBtchA01mQ','jDPz0z22Y2Gs2s5bWg4qTGXqBR2cZEn3','OS X@139.0.0.0','Chrome@10_15_7',1755588540,'192.168.31.117',1755588540,1756794097,NULL,NULL,10),
	(43,180697860,'zh-CN','aRJW6fgSHUv-3ZDShDVfSRnBtchA01mQ','OvnKjJCzxI3nUqm8mdhAvysgOCB8jpXt','OS X@139.0.0.0','Chrome@10_15_7',1756792444,'192.168.31.117',1756792444,1756794043,NULL,NULL,10);

/*!40000 ALTER TABLE `user_device` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 user_extend
# ------------------------------------------------------------

DROP TABLE IF EXISTS `user_extend`;

CREATE TABLE `user_extend` (
  `uid` int NOT NULL,
  `wallet_verify_deadline` int DEFAULT NULL,
  `email_verify_deadline` int DEFAULT NULL,
  `telegram_notify_opt` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`uid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `user_extend` WRITE;
/*!40000 ALTER TABLE `user_extend` DISABLE KEYS */;

INSERT INTO `user_extend` (`uid`, `wallet_verify_deadline`, `email_verify_deadline`, `telegram_notify_opt`)
VALUES
	(180593568,1748335349,NULL,'10,20'),
	(180594165,1756283975,NULL,'10,20'),
	(180594339,1748336377,NULL,'10,20'),
	(180697855,1750058971,NULL,'10,20'),
	(180697856,NULL,NULL,'10,20'),
	(180697857,1757875257,NULL,'10,20'),
	(180697860,1756451341,NULL,'10,20');

/*!40000 ALTER TABLE `user_extend` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `nickname` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(16) DEFAULT NULL,
  `wallet_addr` char(34) DEFAULT NULL,
  `telegram_id` varchar(32) DEFAULT NULL,
  `telegram_username` varchar(255) DEFAULT NULL,
  `telegram_nickname` varchar(255) DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `type` tinyint NOT NULL DEFAULT '0' COMMENT '是否是卖家',
  `auth_key` varchar(32) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `verification_token` varchar(255) DEFAULT NULL,
  `google_secret` varchar(32) DEFAULT NULL,
  `two_step_validate` tinyint DEFAULT NULL,
  `last_login_at` int DEFAULT NULL,
  `last_login_ip` varchar(16) DEFAULT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `source` varchar(255) DEFAULT NULL,
  `remark` text,
  `mail_verified` int DEFAULT NULL,
  `wallet_verified` int DEFAULT NULL,
  `status` smallint NOT NULL DEFAULT '10',
  `energy_price_float` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '时长能量价格浮动',
  `net_price_float` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '时长带宽价格浮动',
  `plan_energy_price_float` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '托管能量价格浮动',
  `plan_net_price_float` decimal(12,2) NOT NULL DEFAULT '0.00',
  `fast_energy_price_float` decimal(12,2) NOT NULL DEFAULT '0.00',
  `fast_net_price_float` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `password_reset_token` (`password_reset_token`) USING BTREE,
  UNIQUE KEY `verificationToken` (`verification_token`) USING BTREE,
  UNIQUE KEY `telegramId` (`telegram_id`,`parent_id`) USING BTREE,
  UNIQUE KEY `walletAddr` (`wallet_addr`,`parent_id`) USING BTREE,
  UNIQUE KEY `username` (`username`,`parent_id`) USING BTREE,
  UNIQUE KEY `email` (`email`,`parent_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;

INSERT INTO `users` (`id`, `username`, `nickname`, `email`, `mobile`, `wallet_addr`, `telegram_id`, `telegram_username`, `telegram_nickname`, `parent_id`, `type`, `auth_key`, `password_hash`, `password_reset_token`, `created_at`, `updated_at`, `verification_token`, `google_secret`, `two_step_validate`, `last_login_at`, `last_login_ip`, `balance`, `source`, `remark`, `mail_verified`, `wallet_verified`, `status`, `energy_price_float`, `net_price_float`, `plan_energy_price_float`, `plan_net_price_float`, `fast_energy_price_float`, `fast_net_price_float`)
VALUES
	(180593568,NULL,NULL,NULL,NULL,NULL,'7019402576',NULL,'Feia Gooa',180594339,0,NULL,NULL,NULL,1748331615,1755495836,NULL,NULL,0,1751739892,'127.0.0.1',100041.47,NULL,NULL,0,0,10,0.00,0.00,0.00,0.00,0.00,0.00),
	(180594165,NULL,NULL,NULL,NULL,'TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1','5282841759','kylin68','kylin',180593568,0,NULL,NULL,NULL,1748332383,1772673952,NULL,NULL,0,1756794097,'192.168.31.117',99978.26,'180593568',NULL,0,0,10,5.00,0.00,0.00,0.00,0.00,0.00),
	(180594339,NULL,NULL,NULL,NULL,'TPVsYCfYLr9U3xnpYdFzq9NJ8etKY7cnuu','6326493773',NULL,'Peter ',180594339,0,NULL,NULL,NULL,1748332615,1753118050,NULL,NULL,0,1753118050,'127.0.0.1',99953.98,'180594165',NULL,0,0,10,0.00,0.00,0.00,0.00,0.00,0.00),
	(180636742,NULL,NULL,NULL,NULL,NULL,'6296316740',NULL,'垂耳兔 ',180594339,0,NULL,NULL,NULL,1748709821,1748913617,NULL,NULL,0,NULL,NULL,100000.00,NULL,NULL,0,0,10,0.00,0.00,0.00,0.00,0.00,0.00),
	(180637454,NULL,NULL,NULL,NULL,NULL,'6388648220','TianGe888888','天哥 ',180594339,0,NULL,NULL,NULL,1748740834,1748740834,NULL,NULL,0,NULL,NULL,100000.00,NULL,NULL,0,0,10,0.00,0.00,0.00,0.00,0.00,0.00),
	(180697855,NULL,NULL,NULL,NULL,'TCSfU1SAhA1wfEu14ruTtEfUQCUYBjTQc5','5817725384',NULL,'王者 DJ',180594339,0,NULL,NULL,NULL,1749446050,1750055371,NULL,NULL,0,NULL,NULL,100000.00,NULL,NULL,0,0,10,0.00,0.00,0.00,0.00,0.00,0.00),
	(180697856,NULL,'',NULL,NULL,'TSUEitrCqEn9VU7aoYe9cnQnugYTeBDdR1',NULL,NULL,NULL,180594339,0,NULL,NULL,NULL,1752050216,1755588447,NULL,NULL,0,1755588447,'192.168.31.117',100003.00,NULL,NULL,0,10,10,0.00,0.00,0.00,0.00,0.00,0.00),
	(180697857,NULL,'',NULL,NULL,'THEQNEdcwSebDUPY79ht1PutaVSZ1x31ro','123333423423','fasdfasdf','zs ls',180594339,0,NULL,NULL,NULL,1756189703,1756281600,NULL,NULL,0,NULL,NULL,99976.61,NULL,NULL,0,0,10,0.00,0.00,0.00,0.00,0.00,0.00),
	(180697860,NULL,'',NULL,NULL,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt','5282841759','kylin68','kylin',180594165,0,NULL,NULL,NULL,1756197174,1762854164,NULL,NULL,0,1756794043,'192.168.31.117',99942.50,NULL,NULL,0,0,10,0.00,0.00,0.00,0.00,0.00,0.00),
	(180697880,NULL,NULL,NULL,NULL,NULL,'6937550741',NULL,'Bea Leonard',NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,NULL,NULL,NULL,NULL,10,0.00,0.00,0.00,0.00,0.00,0.00);

/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 vote_record
# ------------------------------------------------------------

DROP TABLE IF EXISTS `vote_record`;

CREATE TABLE `vote_record` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tx_id` char(64) DEFAULT NULL,
  `uid` int NOT NULL,
  `from` char(34) NOT NULL,
  `to` char(34) NOT NULL,
  `amount` int NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `created_at` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `txID` (`tx_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



# 转储表 votewithdraw
# ------------------------------------------------------------

DROP TABLE IF EXISTS `votewithdraw`;

CREATE TABLE `votewithdraw` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` int NOT NULL,
  `tx_id` char(64) DEFAULT NULL,
  `addr` char(34) NOT NULL,
  `amount` decimal(12,6) NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  `created_at` int DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `txid` (`tx_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



# 转储表 withdraw_apply
# ------------------------------------------------------------

DROP TABLE IF EXISTS `withdraw_apply`;

CREATE TABLE `withdraw_apply` (
  `id` int NOT NULL,
  `tx_id` char(64) DEFAULT NULL,
  `cate` tinyint NOT NULL DEFAULT '10' COMMENT '10 卖家提现 20 代理提现',
  `uid` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `real_amount` decimal(10,2) DEFAULT NULL,
  `from_addr` char(34) DEFAULT NULL,
  `to_addr` char(34) DEFAULT NULL,
  `type` tinyint NOT NULL COMMENT '10 手动提现 20 自动提现',
  `created_at` int DEFAULT NULL,
  `finished_at` int DEFAULT NULL,
  `remark` varchar(255) DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '0' COMMENT '0 已提交 10 处理中 20 已完成 -10 已取消 ',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `withdraw_apply` WRITE;
/*!40000 ALTER TABLE `withdraw_apply` DISABLE KEYS */;

INSERT INTO `withdraw_apply` (`id`, `tx_id`, `cate`, `uid`, `amount`, `fee`, `real_amount`, `from_addr`, `to_addr`, `type`, `created_at`, `finished_at`, `remark`, `status`)
VALUES
	(180691214,'5f14f0ae9c46fd02827f362b59018e8237a3322682cbe38d8931d89706002d50',30,180594165,0.03,0.00,0.03,'TMMx3iwQC3WtJ9rzw4RYb2Fwo2wf141TYm','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',20,1749148540,1749148546,NULL,20),
	(180691216,NULL,40,180593568,-0.70,1.00,-1.70,NULL,'TG2fP7CS5BQPf2zkEBuMHGL5HbZfnfu6t6',20,1749149105,NULL,'[{\"time\":1749149105,\"contents\":\"class org.tron.core.exception.ContractValidateException : Amount must be greater than 0.\"}]',15),
	(180691218,NULL,40,180594165,-0.10,1.00,-1.10,NULL,'TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',20,1749149105,NULL,'[{\"time\":1749149106,\"contents\":\"class org.tron.core.exception.ContractValidateException : Amount must be greater than 0.\"}]',15),
	(180691220,NULL,40,180594339,-0.70,1.00,-1.70,NULL,'TPVsYCfYLr9U3xnpYdFzq9NJ8etKY7cnuu',20,1749149105,NULL,'[{\"time\":1749149106,\"contents\":\"class org.tron.core.exception.ContractValidateException : Amount must be greater than 0.\"}]',15),
	(180691293,'97d7b83c9f12b43a50be022a270935233c5029fca202a3773ea99f5870e7853b',40,180593568,1.00,0.00,1.00,'TMMx3iwQC3WtJ9rzw4RYb2Fwo2wf141TYm','TG2fP7CS5BQPf2zkEBuMHGL5HbZfnfu6t6',20,1749149273,1749149282,NULL,20),
	(180691295,'8cfa576d3f2979690df84354a6e00029cbbf39a0fce251742d075061b80b1896',40,180594165,1.00,0.00,1.00,'TMMx3iwQC3WtJ9rzw4RYb2Fwo2wf141TYm','TRjkXSHGXVFkQJf2Nhnjx4GTzS8QVnskTt',20,1749149273,1749149282,NULL,20),
	(180691297,'91cbc87a29328b600958fca4b1772a958beede16b04982ba5bae43d673fa6094',40,180594339,1.00,0.00,1.00,'TMMx3iwQC3WtJ9rzw4RYb2Fwo2wf141TYm','TPVsYCfYLr9U3xnpYdFzq9NJ8etKY7cnuu',20,1749149273,1749149282,NULL,20);

/*!40000 ALTER TABLE `withdraw_apply` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
