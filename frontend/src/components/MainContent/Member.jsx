import { useState } from "react";
// import { Input } from "@/components/ui/input";

const members = [
  {
    id: "1",
    name: "Naruto Uzumaki",
    avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
    status: "online",
  },
  {
    id: "2",
    name: "Sasuke Uchiha",
    avatar: "https://cdn.discordapp.com/embed/avatars/1.png",
    status: "offline",
  },
  {
    id: "3",
    name: "Sakura Haruno",
    avatar: "https://cdn.discordapp.com/embed/avatars/2.png",
    status: "online",
  },
];

const StatusDot = ({ status }) => (
  <span
    className={`h-2 w-2 rounded-full inline-block mr-2 ${
      status === "online" ? "bg-green-500" : "bg-gray-400"
    }`}
  ></span>
);

const MemberCard = ({ member }) => (
  <div className="w-64">
    <div className="flex items-center space-x-3 p-2">
      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
      <div className="items-start flex flex-col">
        <h2 className="text-sm font-medium">{member.name}</h2>
        <p className="text-xs text-gray-500">
          <StatusDot status={member.status} /> {member.status}
        </p>
      </div>
    </div>
  </div>
);

export default function MemberList() {
  const [search, setSearch] = useState("");

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const onlineMembers = filtered.filter(m => m.status === "online");
  const offlineMembers = filtered.filter(m => m.status === "offline");

  return (
    <div className="w-48 space-y-2 p-2 bg-gray-800">
      <input
        placeholder="Search members..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 mb-[20px] py-2 text-xs bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      
      {/* Online Members Section */}
      <div className="mb-4">
        <h3 className="text-green-500 text-xs font-semibold mb-2 flex items-center">
          <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
          Online - {onlineMembers.length}
        </h3>
        <div className="space-y-1">
          {onlineMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Offline Members Section */}
      <div className="mb-4">
        <h3 className="text-gray-400 text-xs font-semibold mb-2 flex items-center">
          <span className="h-2 w-2 bg-gray-400 rounded-full mr-1"></span>
          Offline - {offlineMembers.length}
        </h3>
        <div className="space-y-1">
          {offlineMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}
