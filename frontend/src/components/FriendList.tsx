import { useContext, useEffect, useState } from "react"
import { userContext } from "../contexts/userContext"
import { addFriend, getFriends, removeFriend as RemoveFriend } from "../services/friendService";

export default function FriendList() {

    const user = useContext(userContext)?.user;
    const socket = useContext(userContext)?.socket;

    const [sendRequestText, setSendRequestText] = useState<string>('');

    const [friendList, setFriendList] = useState<{ID: number, userName: string}[]>([]);   

    const [requests, setRequests] = useState<{ID: number, userName: string}[]>([]);

    function sendRequest(e: any) {
        e.preventDefault();
        socket?.emit('send-friend-request', {
            toUsername: sendRequestText,
            fromUsername: user?.Username,
            fromID: user?.ID
        });
        setSendRequestText('');
    }

    function deleteRequest(id: number) {
        const newReqs = requests.filter(request => request.ID !== id);
        setRequests(newReqs);
    }

    function acceptRequest(request: {ID: number, userName: string}) {
        setFriendList(prev => [...prev, {ID: request.ID, userName: request.userName}]);
        deleteRequest(request.ID);
        socket?.emit('accept-friend-request', {
            toID: request.ID,
            fromID: user?.ID
        });  
        if (user) addFriend(user.ID, request.ID);
    }

    function removeFriend(id: number) {
        if (user) RemoveFriend(id, user?.ID);
        const newFriendsList = friendList.filter(friend => friend.ID !== id);
        setFriendList(newFriendsList);
        socket?.emit('remove-friend', user?.ID, id);
    }

    // load friends on startup
    useEffect(() => {
        (async () => {
            if (user) {
                const friends = await getFriends(user.ID);
                setFriendList(friends.map(friend => ({ID: friend.id, userName: friend.username})));
            }
        })()
    }, [user])

    // socket
    useEffect(() => {
      
        const getRequest = (request: { fromUsername: string, fromID: number }) => {
            setRequests(prev => {
              if (prev.find(req => req.ID === request.fromID)) {
                return prev;
              }
              return [...prev, { ID: request.fromID, userName: request.fromUsername }];
            });
        };  

        const getAccept = (newFriend: {fromID: number, fromUsername: string}) => {
            setFriendList(prev => [...prev, {ID: newFriend.fromID, userName: newFriend.fromUsername}]);
        }

        const RemovedFriend = (id: number) => {
            const newFriendsList = friendList.filter(friend => friend.ID !== id);
            setFriendList(newFriendsList);
        }
      
        socket?.on('receive-friend-request', getRequest);
        socket?.on('accepted-friend-request', getAccept);
        socket?.on('removed-friend', RemovedFriend);
      
        return () => {
          socket?.off('receive-friend-request', getRequest);
          socket?.off('accepted-friend-request', getAccept);
          socket?.off('removed-friend', RemovedFriend);
        };
      }, [socket]);
      

      return (

        <div className="bg-white rounded-lg shadow-md w-64 border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-900 text-white p-3 font-medium flex items-center">
            <span className="text-lg">Friends List</span>
            <span className="ml-2 text-xl">🫂</span>
          </div>
      
          {/* Add friend input */}
          <form onSubmit={sendRequest} className="border-b border-gray-200 p-2">
            <input 
              type="text" 
              value={sendRequestText} 
              onChange={e => setSendRequestText(e.target.value)} 
              placeholder="Add friend by username..." 
              className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </form>
      
          {/* Requests list */}
          <div className="p-3 max-h-36 overflow-y-auto bg-gray-50">
            {requests.map((request, index) => (
              <div key={index} className="mb-2 last:mb-0 text-sm flex justify-between items-center">
                <span className="text-blue-700 font-medium">{request.userName}</span>
                <div className="space-x-1">
                  <button 
                    onClick={() => acceptRequest(request)} 
                    className="text-green-600 hover:underline"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => deleteRequest(request.ID)} 
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
      
          {/* Friends list */}
          <div className="p-3 border-t border-gray-200 bg-white max-h-36 overflow-y-auto">
            {friendList.map((friend, index) => (
              <div 
                key={index} 
                className="text-sm text-gray-800 py-1 px-2 rounded hover:bg-gray-100 cursor-pointer flex flex-row justify-between"
              >
                {friend.userName}
                <button className="text-red-500 hover:text-red-700 text-md hover:font-bold cursor-pointer" onClick={() => removeFriend(friend.ID)}> unfriend </button>
              </div>
            ))}
          </div>
        </div>
      );              
}