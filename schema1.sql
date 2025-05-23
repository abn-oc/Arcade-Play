
-- use this if dropping normally doesnt work
ALTER DATABASE projectDB
SET SINGLE_USER
WITH ROLLBACK IMMEDIATE;

DROP DATABASE projectDB;
--end

use master;
go
drop database projectDB
go

create database projectDB
go
use projectDB;
go
drop table if exists GlobalChat
drop table if exists FriendRequests
DROP TABLE IF EXISTS PrivateMessages;
DROP TABLE IF EXISTS Friends;
DROP TABLE IF EXISTS LeaderBoard;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Games;
go

CREATE TABLE Users (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Passwords NVARCHAR(100) NULL,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Avatar INT NOT NULL DEFAULT (0),
    GamesPlayed INT DEFAULT 0 CHECK (GamesPlayed >= 0),
	IsDeleted BIT NOT NULL DEFAULT 0,
	AuthProvider NVARCHAR(50) NULL,
    ProviderUserID NVARCHAR(255) NULL,
	Bio NVARCHAR(255) NULL DEFAULT ('Hey there, I am using ArcadePlay'),
);

CREATE TABLE Friends (
    UserID INT NOT NULL,
    FriendID INT NOT NULL,
    CONSTRAINT PK_Friend PRIMARY KEY (UserID, FriendID),
    CONSTRAINT FK_Friend_User FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE,
    CONSTRAINT FK_Friend_Friend FOREIGN KEY (FriendID) REFERENCES Users(ID) ON DELETE NO ACTION,
    CONSTRAINT CHK_NotSelfFriend CHECK (UserID <> FriendID)
);

------------------------------
-- NEW TABLE IN DELIVERABLE 2 --
------------------------------
CREATE TABLE Games (
	GameID INT IDENTITY(1, 1) PRIMARY KEY,
	GameName NVARCHAR(50),
	GameDesc NVARCHAR(50),
	MinPlayers INT,
	MaxPlayers INT,
	Icon INT,
	CONSTRAINT CHK_MinPlayers CHECK (MinPlayers >= 1 and MinPlayers <= MaxPlayers),
	CONSTRAINT CHK_MaxPlayers CHECK (MaxPLayers >= MinPlayers)
)
INSERT INTO Games (GameName, GameDesc, MinPlayers, MaxPlayers, Icon)
VALUES 
('Tic Tac Toe', 'Classic X and O game', 2, 2, 1),
('Maze Runner', 'Escape the maze', 1, 4, 2),
('Type Racer', 'Typing speed test', 1, 6, 3);


CREATE TABLE LeaderBoard (
    UserID INT NOT NULL DEFAULT(-1),
    GameID INT NOT NULL DEFAULT(-1),
    Score INT NOT NULL CHECK (Score >= 0),
    CONSTRAINT PK_LeaderBoard PRIMARY KEY (UserID, GameID),
    CONSTRAINT FK_LeaderBoard_User FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE,
	CONSTRAINT FK_GameID FOREIGN KEY (GameID) REFERENCES Games(GameID) ON DELETE CASCADE
);

CREATE TABLE PrivateMessages (
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    SenderID INT NULL,      -- Allow NULL
    ReceiverID INT NULL,    -- Allow NULL
    Content NVARCHAR(MAX) NOT NULL,
    SentTime DATETIME NOT NULL DEFAULT GETDATE(),-
    CONSTRAINT FK_PrivateDM_Sender 
       FOREIGN KEY (SenderID) REFERENCES Users(ID),
    CONSTRAINT FK_PrivateDM_Receiver 
       FOREIGN KEY (ReceiverID) REFERENCES Users(ID)
)
--// New tables

create table FriendRequests
(
SenderID int not null,
ReceiverID int not null,
CONSTRAINT FK_FriendRequests1 FOREIGN KEY (ReceiverID) REFERENCES Users(ID),
CONSTRAINT PK_FriendRequests PRIMARY KEY (SenderID, ReceiverID),
CONSTRAINT FK_FriendRequests2 FOREIGN KEY (SenderID) REFERENCES Users(ID)
)
create table GlobalChat
(
SenderID int not null,
Content nvarchar(255),
MessageTime DATETIME DEFAULT GETDATE(),
CONSTRAINT FK_GlobelChat FOREIGN KEY (SenderID) REFERENCES Users(ID)
)

--//New quries return msg with avatar and username
select U.ID,U.FirstName,U.Avatar, Content
from GlobalChat G left join Users U on G.SenderID=U.ID


--//New trigger delete all previous msg if count(*) of GlobleChat>15
GO
CREATE TRIGGER TRG_LimitGlobalChatMessages
ON GlobalChat
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Delete the oldest message(s) if there are more than 15
    WHILE (SELECT COUNT(*) FROM GlobalChat) > 15
    BEGIN
        ;WITH CTE AS (
            SELECT TOP (1) *
            FROM GlobalChat
            ORDER BY MessageTime ASC
        )
        DELETE FROM CTE;
    END
END;

-- Insert User 1 into Users table
INSERT INTO Users 
(FirstName, LastName, Email, Passwords, Username, Avatar, GamesPlayed, IsDeleted, AuthProvider, ProviderUserID, Bio)
VALUES 
('John', 'Doe', 'johndoe@example.com', 'Password123', 'JohnDoe', 1, 5, 0, NULL, NULL, 'Excited to play!');


-- Insert 16 sample messages into GlobalChat
INSERT INTO GlobalChat (SenderID, Content) VALUES (1, 'Hello World 1');
select * from GlobalChat


select * from users;
select * from GlobalChat;
delete GlobalChat;

delete from FriendRequests;
select * from FriendRequests;
insert into FriendRequests (SenderID, ReceiverID)
values (1, 2);

select * from Friends;

select * from Users;