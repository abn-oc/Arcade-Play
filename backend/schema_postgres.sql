DROP TABLE IF EXISTS GlobalChat CASCADE;
DROP TABLE IF EXISTS FriendRequests CASCADE;
DROP TABLE IF EXISTS PrivateMessages CASCADE;
DROP TABLE IF EXISTS Friends CASCADE;
DROP TABLE IF EXISTS LeaderBoard CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS Games CASCADE;

CREATE TABLE Users (
    ID SERIAL PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Passwords VARCHAR(255),
    Username VARCHAR(50) UNIQUE NOT NULL,
    Avatar TEXT,
    GamesPlayed INT DEFAULT 0 CHECK (GamesPlayed >= 0),
    IsDeleted BOOLEAN NOT NULL DEFAULT false,
    AuthProvider VARCHAR(50),
    ProviderUserID VARCHAR(255),
    Bio VARCHAR(255) DEFAULT 'Hey there, I am using ArcadePlay'
);

CREATE TABLE Friends (
    UserID INT NOT NULL REFERENCES Users(ID) ON DELETE CASCADE,
    FriendID INT NOT NULL REFERENCES Users(ID) ON DELETE CASCADE,
    PRIMARY KEY (UserID, FriendID),
    CHECK (UserID <> FriendID)
);

CREATE TABLE Games (
    GameID SERIAL PRIMARY KEY,
    GameName VARCHAR(50),
    GameDesc VARCHAR(50),
    MinPlayers INT,
    MaxPlayers INT,
    Icon INT,
    CHECK (MinPlayers >= 1 AND MinPlayers <= MaxPlayers),
    CHECK (MaxPlayers >= MinPlayers)
);

INSERT INTO Games (GameName, GameDesc, MinPlayers, MaxPlayers, Icon)
VALUES
('Tic Tac Toe', 'Classic X and O game', 2, 2, 1),
('Maze Runner', 'Escape the maze', 1, 4, 2),
('Type Racer', 'Typing speed test', 1, 6, 3);

CREATE TABLE LeaderBoard (
    UserID INT NOT NULL REFERENCES Users(ID) ON DELETE CASCADE,
    GameID INT NOT NULL REFERENCES Games(GameID) ON DELETE CASCADE,
    Score INT NOT NULL CHECK (Score >= 0),
    PRIMARY KEY (UserID, GameID)
);

CREATE TABLE PrivateMessages (
    MessageID SERIAL PRIMARY KEY,
    SenderID INT REFERENCES Users(ID) ON DELETE CASCADE,
    ReceiverID INT REFERENCES Users(ID) ON DELETE CASCADE,
    Content TEXT NOT NULL,
    SentTime TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE FriendRequests (
    SenderID INT NOT NULL REFERENCES Users(ID) ON DELETE CASCADE,
    ReceiverID INT NOT NULL REFERENCES Users(ID) ON DELETE CASCADE,
    PRIMARY KEY (SenderID, ReceiverID)
);

CREATE TABLE GlobalChat (
    SenderID INT NOT NULL REFERENCES Users(ID) ON DELETE CASCADE,
    Content VARCHAR(255),
    MessageTime TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION limit_global_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM GlobalChat
    WHERE ctid IN (
        SELECT ctid
        FROM GlobalChat
        ORDER BY MessageTime ASC
        OFFSET 15
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_limit_global_chat_messages ON GlobalChat;
CREATE TRIGGER trg_limit_global_chat_messages
AFTER INSERT ON GlobalChat
FOR EACH STATEMENT
EXECUTE FUNCTION limit_global_chat_messages();
