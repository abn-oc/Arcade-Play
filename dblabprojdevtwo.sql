
use projectDB;
go
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

	CONSTRAINT UQ_ProviderUserID UNIQUE (AuthProvider, ProviderUserID)
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
    SentTime DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_PrivateDM_Sender 
       FOREIGN KEY (SenderID) REFERENCES Users(ID),
    CONSTRAINT FK_PrivateDM_Receiver 
       FOREIGN KEY (ReceiverID) REFERENCES Users(ID)
);
sELECT ID, Username, isDeleted FROM Users;
insert into PrivateMessages (SenderID, Content)
values (17, 'ho');
select * from PrivateMessages;
delete PrivateMessages;
select * from Users;
delete from Users;
select * from Games;

UPDATE Users
        SET GamesPlayed = ISNULL(GamesPlayed, 0) + 1
        WHERE ID = 28 AND IsDeleted = 0

delete Users;

select * from LeaderBoard;
insert into LeaderBoard
values (17, 1, 25), (18, 1, 40);
select * from Games;
select * from Users;
update Users
set Username = 'changed'
where FirstName = 'abd';

select * from Friends;
delete Friends;

SELECT u.Username, l.Score
        FROM LeaderBoard l
        JOIN Users u ON l.UserID = u.ID
        WHERE l.GameID = 1
        ORDER BY l.Score DESC;