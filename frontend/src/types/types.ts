export type User = {
    ID: number;
    FirstName: string;
    LastName: string;
    Email: string;
    Username: string;
    Avatar: string | null;
    AuthProvider: string | null;
    GamesPlayed: number
}

export type Friend = {
    id: number;
    username: string;
    avatar: number;
}

// for avatars, use the avatar of the selected friend
export type PrivateMessage = {
    senderId: number;
    receiverId: number;
    content: string;
}

export type GlobalMessage = {
    id: number;
    username: string;
    avatar: number;
    content: string;
}

export type Game = {
  GameID: number;
  GameName: string;
  Icon: number;
}

export type GameDetails = {
    GameID: number;
    GameName: string,
    GameDesc: string;
    MinPlayers: number;
    MaxPlayers: number;
    Icon: number;
}

export type LeadboardEntry = {
    ID: number;
    Avatar: number;
    Username: string;
    Score: number;
}