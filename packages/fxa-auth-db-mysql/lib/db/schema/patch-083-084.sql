SET NAMES utf8mb4 COLLATE utf8mb4_bin;

CALL assertPatchLevel('83');

-- Since we are altering the size of the `recoveryKeyId` column
-- we need to make sure that the column is empty before it can be applied.
-- This table is ok to clear at this point because no user facing api
-- has landed to create recovery keys.
DELETE from recoveryKeys;

ALTER TABLE recoveryKeys MODIFY COLUMN recoveryKeyId BINARY(16);

CREATE PROCEDURE `createRecoveryKey_2` (
  IN `uidArg` BINARY(16),
  IN `recoveryKeyIdArg` BINARY(16),
  IN `recoveryDataArg` TEXT
)
BEGIN

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SET @accountCount = 0;

  -- Signal error if no user found
  SELECT COUNT(*) INTO @accountCount FROM `accounts` WHERE `uid` = `uidArg`;
  IF @accountCount = 0 THEN
    SIGNAL SQLSTATE '45000' SET MYSQL_ERRNO = 1643, MESSAGE_TEXT = 'Can not create recovery key for unknown user.';
  END IF;

  INSERT INTO recoveryKeys (uid, recoveryKeyId, recoveryData) VALUES (uidArg, recoveryKeyIdArg, recoveryDataArg);

  COMMIT;
END;

CREATE PROCEDURE `getRecoveryKey_2` (
  IN `uidArg` BINARY(16)
)
BEGIN

  SELECT recoveryKeyId, recoveryData FROM recoveryKeys WHERE uid = uidArg;

END;

CREATE PROCEDURE `deleteRecoveryKey_2` (
  IN `uidArg` BINARY(16)
)
BEGIN

  DELETE FROM recoveryKeys WHERE uid = uidArg;

END;

UPDATE dbMetadata SET value = '84' WHERE name = 'schema-patch-level';