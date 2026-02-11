# ************************************************************
# Sequel Ace SQL dump
# 版本号： 20095
#
# https://sequel-ace.com/
# https://github.com/Sequel-Ace/Sequel-Ace
#
# 主机: 127.0.0.1 (MySQL 8.4.4)
# 数据库: test_api
# 生成时间: 2026-02-06 13:53:58 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
SET NAMES utf8mb4;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE='NO_AUTO_VALUE_ON_ZERO', SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# 转储表 adminUser
# ------------------------------------------------------------

DROP TABLE IF EXISTS `adminUser`;

CREATE TABLE `adminUser` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `type` tinyint NOT NULL DEFAULT '30',
  `authKey` varchar(32) DEFAULT NULL,
  `passwordHash` varchar(255) DEFAULT NULL,
  `passwordResetToken` varchar(255) DEFAULT NULL,
  `createdAt` int NOT NULL,
  `updatedAt` int NOT NULL,
  `googleSecret` varchar(32) DEFAULT NULL,
  `accessToken` varchar(32) DEFAULT NULL,
  `twoStepValidate` tinyint NOT NULL DEFAULT '0',
  `lastLoginAt` int DEFAULT NULL,
  `lastLoginIp` varchar(16) DEFAULT NULL,
  `remark` text,
  `accessTokenExpired` int NOT NULL DEFAULT '0',
  `status` smallint NOT NULL DEFAULT '10',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `email` (`username`) USING BTREE,
  UNIQUE KEY `password_reset_token` (`passwordResetToken`) USING BTREE,
  UNIQUE KEY `access_token` (`accessToken`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `adminUser` WRITE;
/*!40000 ALTER TABLE `adminUser` DISABLE KEYS */;

INSERT INTO `adminUser` (`id`, `username`, `type`, `authKey`, `passwordHash`, `passwordResetToken`, `createdAt`, `updatedAt`, `googleSecret`, `accessToken`, `twoStepValidate`, `lastLoginAt`, `lastLoginIp`, `remark`, `accessTokenExpired`, `status`)
VALUES
	(1,'aa@cc.com',10,'HBsnICaG4Xx1CFdNZH7JOBmtS0ZK6O5A','$2y$13$mqIJzuzsY9GSSLth/UvO3.o/OsbBgVVV29KGt8SjD1cKIlAlLCKP2',NULL,1710395057,1710395057,NULL,'0adeb646fe132b59aa193ce26c57dd51',0,1770818650,NULL,NULL,1770818650,10);

/*!40000 ALTER TABLE `adminUser` ENABLE KEYS */;
UNLOCK TABLES;


# 转储表 users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `accessToken` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;

INSERT INTO `users` (`id`, `email`, `isActive`, `createdAt`, `updatedAt`, `name`, `avatar`, `password`, `accessToken`)
VALUES
	(1,'zhangsan@qq.com\n',1,'2025-10-17 18:41:08.189284','2025-10-17 18:41:08.189284','',NULL,'',''),
	(2,'lisi@qq.com',1,'2025-10-17 18:55:15.401794','2025-10-17 18:55:52.000000','李四更新','https://example.com/new-avatar.jpg','',''),
	(3,'test@example.com',1,'2025-10-20 14:37:27.783818','2025-10-29 16:32:17.000000','测试用户',NULL,'$2b$10$.8kYZG40wnl6UjkVIP7CFusbqtD0YceXvhMjgPe5cdWyDUxRMsdyi','7a323b43b91af340130a6b76d80a35a9');

/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;



/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
