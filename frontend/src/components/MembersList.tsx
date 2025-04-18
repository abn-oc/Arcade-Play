import { useEffect, useState } from "react";
import { getUserScore } from "../services/leaderboardService";
import { getAvatarID } from "../services/friendService";

export default function MembersList({
  members,
}: {
  members: { ID: number; userName: string }[];
}) {
  const [scoreList, setScoreList] = useState<{Score: number}[]>([]);

  const [avatars, setAvatars] = useState<number[]>([]);

  useEffect(() => {
    async function fetchScores() {
        console.log("gonna fetch scores of members")
        const scores = await Promise.all(
        members.map((member) => getUserScore(member.ID, 1))
      );
      //for every member, put value returned by getAvatarID in avatars
      members.forEach(async (member) => {
        const newAvatar = await getAvatarID(member.ID);
        setAvatars(prev => [...prev, newAvatar]);
      })
      console.log(scores)
      setScoreList(scores);
    }

    if (members.length > 0) fetchScores();
  }, [members]);

  return (
    <div className="bg-white rounded-lg shadow-md w-64 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-900 text-white p-3 font-medium flex items-center">
        <span className="text-lg">Room Members</span>
        <span className="ml-2 text-xl">🎮</span>
      </div>

      {/* Members container */}
      <div className="p-3 max-h-39 overflow-y-auto bg-gray-50">
        {members.map((member, index) => (
          <div key={member.ID} className="mb-2 last:mb-0">
            <span className="font-semibold text-blue-700 flex flex-row gap-2 items-center">
              <img src={`/assets/avatars/${avatars[index]}.jpg`} className="w-12 rounded-full" />
              {member.userName} —{" "}
              <span className="text-gray-800">
                {scoreList[index] !== undefined ? scoreList[index].Score : "Loading..."}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
