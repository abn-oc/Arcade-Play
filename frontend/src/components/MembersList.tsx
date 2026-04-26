import { useEffect, useState } from "react";
import { getUserScore } from "../services/leaderboardService";
import { getAvatarID } from "../services/friendService";
import { AvatarValue, resolveAvatarSrc } from "../utils/avatar";

// the members array passed to this component already have id and username
export default function MembersList({
  members,
}: {
  members: {
    avatar: AvatarValue;
    id: number;
    username: string;
  }[];
}) {
  const [scoreList, setScoreList] = useState<{ Score: number }[]>([]);
  const [avatars, setAvatars] = useState<AvatarValue[]>([]);

  // on members changing, fetch scores avatars and set them (we already have id and username)
  useEffect(() => {
    async function fetchScores() {
      // for every member, fetch and set scores
      const scores = await Promise.all(
        members.map((member) => getUserScore(member.id, 1))
      );
      setScoreList(scores);

      const fetchedAvatars = await Promise.all(
        members.map((member) => getAvatarID(member.id))
      );
      setAvatars(fetchedAvatars);
    }

    // ofc only call that if members are more than 0 (i want to try removing this check, see what it does later)
    if (members.length > 0) fetchScores();
  }, [members]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:w-72">
      {/* Header */}
      <div className="bg-blue-900 text-white p-3 font-medium flex items-center">
        <span className="text-lg">Room Members</span>
        <span className="ml-2 text-xl">🎮</span>
      </div>

      {/* Members container */}
      <div className="max-h-56 overflow-y-auto bg-gray-50 p-3">
        {members.map((member, index) => (
          <div key={member.id} className="mb-2 last:mb-0">
            <span className="font-semibold text-blue-700 flex flex-row gap-2 items-center">
              <img
                src={resolveAvatarSrc(avatars[index])}
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
