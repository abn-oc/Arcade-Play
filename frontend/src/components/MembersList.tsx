import { useEffect, useState } from "react";
import { getUserScore } from "../services/leaderboardService";
import { Friend } from "../types/types";

// the members array passed to this component already have id and username
export default function MembersList({ members }: { members: Friend[] }) {
  const [scoreList, setScoreList] = useState<{ Score: number }[]>([]);


  // on members changing, fetch scores avatars and set them (we already have id and username)
  useEffect(() => {
    async function fetchScores() {
      // for every member, fetch and set scores
      const scores = await Promise.all(
        members.map((member) => getUserScore(member.id, 1))
      );
      setScoreList(scores);
    }

    // ofc only call that if members are more than 0 (i want to try removing this check, see what it does later)
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
          <div key={member.id} className="mb-2 last:mb-0">
            <span className="font-semibold text-blue-700 flex flex-row gap-2 items-center">
              <img
                src={`/assets/avatars/${member.avatar}.jpg`}
                className="w-12 rounded-full"
              />
              {member.username} —{" "}
              <span className="text-gray-800">
                {scoreList[index] !== undefined
                  ? scoreList[index].Score
                  : "Loading..."}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
