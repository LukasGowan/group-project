CREATE DATABASE  IF NOT EXISTS `payroll_project_dev` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `payroll_project_dev`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: payroll_project_dev
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `department_id` int NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `department_name` (`department_name`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'IT','Information Technology'),(2,'Sales','Sales Department'),(3,'Human Resources','Employee Management'),(4,'Accounting','Financial Operations');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `job_title` varchar(100) NOT NULL,
  `hire_date` date NOT NULL,
  `department_id` int NOT NULL,
  `employment_status` varchar(20) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_employee_department` (`department_id`),
  CONSTRAINT `fk_employee_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
INSERT INTO `employees` VALUES (1,'Jordan','Smith','jordan@example.com','555-0101','IT Technician','2025-01-15',1,'Active'),(2,'Sarah','Johnson','sarah@example.com','555-0102','Senior Sales Associate','2025-03-10',2,'Active'),(3,'Michael','Brown','michael@example.com','555-0103','HR Manager','2024-06-20',3,'Active');
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pay_periods`
--

DROP TABLE IF EXISTS `pay_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_periods` (
  `pay_period_id` int NOT NULL AUTO_INCREMENT,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `pay_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Open',
  PRIMARY KEY (`pay_period_id`),
  UNIQUE KEY `uq_pay_period_dates` (`period_start`,`period_end`),
  CONSTRAINT `chk_pay_date` CHECK ((`pay_date` >= `period_end`)),
  CONSTRAINT `chk_pay_period_dates` CHECK ((`period_end` >= `period_start`)),
  CONSTRAINT `chk_pay_period_status` CHECK ((`status` in (_utf8mb4'Open',_utf8mb4'Processing',_utf8mb4'Paid')))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pay_periods`
--

LOCK TABLES `pay_periods` WRITE;
/*!40000 ALTER TABLE `pay_periods` DISABLE KEYS */;
INSERT INTO `pay_periods` VALUES (1,'2026-10-19','2026-11-01','2026-11-06','Open');
/*!40000 ALTER TABLE `pay_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pay_rates`
--

DROP TABLE IF EXISTS `pay_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pay_rates` (
  `pay_rate_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `hourly_rate` decimal(10,2) NOT NULL,
  `effective_date` date NOT NULL,
  PRIMARY KEY (`pay_rate_id`),
  UNIQUE KEY `uq_employee_rate_date` (`employee_id`,`effective_date`),
  CONSTRAINT `fk_pay_rate_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`),
  CONSTRAINT `chk_hourly_rate` CHECK ((`hourly_rate` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pay_rates`
--

LOCK TABLES `pay_rates` WRITE;
/*!40000 ALTER TABLE `pay_rates` DISABLE KEYS */;
INSERT INTO `pay_rates` VALUES (1,1,25.00,'2025-01-15'),(2,2,18.50,'2025-03-10'),(3,3,30.00,'2024-06-20');
/*!40000 ALTER TABLE `pay_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paycheck_deductions`
--

DROP TABLE IF EXISTS `paycheck_deductions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paycheck_deductions` (
  `deduction_id` int NOT NULL AUTO_INCREMENT,
  `paycheck_id` int NOT NULL,
  `deduction_type` varchar(100) NOT NULL,
  `deduction_amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`deduction_id`),
  KEY `fk_deduction_paycheck` (`paycheck_id`),
  CONSTRAINT `fk_deduction_paycheck` FOREIGN KEY (`paycheck_id`) REFERENCES `paychecks` (`paycheck_id`),
  CONSTRAINT `chk_deduction_amount` CHECK ((`deduction_amount` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paycheck_deductions`
--

LOCK TABLES `paycheck_deductions` WRITE;
/*!40000 ALTER TABLE `paycheck_deductions` DISABLE KEYS */;
INSERT INTO `paycheck_deductions` VALUES (1,1,'Federal Tax',20.00),(2,1,'Health Insurance',15.00),(3,2,'Federal Tax',12.00),(4,3,'Federal Tax',25.00),(5,3,'Retirement',20.00);
/*!40000 ALTER TABLE `paycheck_deductions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paychecks`
--

DROP TABLE IF EXISTS `paychecks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paychecks` (
  `paycheck_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `pay_period_id` int NOT NULL,
  `regular_hours` decimal(7,2) NOT NULL DEFAULT '0.00',
  `overtime_hours` decimal(7,2) NOT NULL DEFAULT '0.00',
  `gross_pay` decimal(10,2) NOT NULL DEFAULT '0.00',
  `paycheck_status` varchar(20) NOT NULL DEFAULT 'Draft',
  PRIMARY KEY (`paycheck_id`),
  UNIQUE KEY `uq_employee_pay_period` (`employee_id`,`pay_period_id`),
  KEY `fk_paycheck_period` (`pay_period_id`),
  CONSTRAINT `fk_paycheck_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`),
  CONSTRAINT `fk_paycheck_period` FOREIGN KEY (`pay_period_id`) REFERENCES `pay_periods` (`pay_period_id`),
  CONSTRAINT `chk_gross_pay` CHECK ((`gross_pay` >= 0)),
  CONSTRAINT `chk_overtime_hours` CHECK ((`overtime_hours` >= 0)),
  CONSTRAINT `chk_paycheck_status` CHECK ((`paycheck_status` in (_utf8mb4'Draft',_utf8mb4'Approved',_utf8mb4'Paid'))),
  CONSTRAINT `chk_regular_hours` CHECK ((`regular_hours` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paychecks`
--

LOCK TABLES `paychecks` WRITE;
/*!40000 ALTER TABLE `paychecks` DISABLE KEYS */;
INSERT INTO `paychecks` VALUES (1,1,1,7.50,0.00,187.50,'Draft'),(2,2,1,7.50,0.00,138.75,'Draft'),(3,3,1,7.00,0.00,210.00,'Draft');
/*!40000 ALTER TABLE `paychecks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `shift_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `shift_start` datetime NOT NULL,
  `shift_end` datetime NOT NULL,
  `break_minutes` int NOT NULL DEFAULT '0',
  `shift_status` varchar(20) NOT NULL DEFAULT 'Scheduled',
  `calendar_event_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`shift_id`),
  KEY `fk_shift_employee` (`employee_id`),
  CONSTRAINT `fk_shift_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`),
  CONSTRAINT `chk_break_minutes` CHECK ((`break_minutes` >= 0)),
  CONSTRAINT `chk_shift_status` CHECK ((`shift_status` in (_utf8mb4'Scheduled',_utf8mb4'Completed',_utf8mb4'Canceled'))),
  CONSTRAINT `chk_shift_times` CHECK ((`shift_end` > `shift_start`))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` VALUES (1,1,'2026-10-26 09:00:00','2026-10-26 17:00:00',30,'Scheduled',NULL),(2,2,'2026-10-26 10:00:00','2026-10-26 18:00:00',30,'Scheduled',NULL),(3,3,'2026-10-26 08:00:00','2026-10-26 16:00:00',60,'Scheduled',NULL);
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `time_entries`
--

DROP TABLE IF EXISTS `time_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `time_entries` (
  `time_entry_id` int NOT NULL AUTO_INCREMENT,
  `shift_id` int NOT NULL,
  `clock_in` datetime NOT NULL,
  `clock_out` datetime NOT NULL,
  `break_minutes` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`time_entry_id`),
  UNIQUE KEY `shift_id` (`shift_id`),
  CONSTRAINT `fk_time_entry_shift` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`shift_id`),
  CONSTRAINT `chk_clock_times` CHECK ((`clock_out` > `clock_in`)),
  CONSTRAINT `chk_time_break` CHECK ((`break_minutes` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `time_entries`
--

LOCK TABLES `time_entries` WRITE;
/*!40000 ALTER TABLE `time_entries` DISABLE KEYS */;
INSERT INTO `time_entries` VALUES (1,1,'2026-10-26 09:00:00','2026-10-26 17:00:00',30),(2,2,'2026-10-26 10:00:00','2026-10-26 18:00:00',30),(3,3,'2026-10-26 08:00:00','2026-10-26 16:00:00',60);
/*!40000 ALTER TABLE `time_entries` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-24 16:22:35
