import { useRef } from "react";

export default function MembersList( { members } : { members: {ID: number, userName: string}[]} ) {

    const ContainerRef = useRef<HTMLDivElement>(null);

    return (
        <div className="bg-white rounded-lg shadow-md w-64 border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-900 text-white p-3 font-medium flex items-center">
        <span className="text-lg">Room Members</span>
        <span className="ml-2 text-xl">🎮</span>
      </div>
      
      {/* Messages container */}
      <div className="p-3 max-h-39 overflow-y-auto bg-gray-50" ref={ContainerRef}>
        {members.map((member, index) => (
          <div key={index} className="mb-2 last:mb-0">
            <span className="font-semibold text-blue-700">{member.userName}:</span>
          </div>
        ))}
      </div>
    </div>
    )
}