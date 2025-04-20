import { useState, useContext, useEffect } from "react";
import { GlobalContext } from "../../context/index.jsx";
import { api } from "../../service/api";

const StatusDot = ({ status }) => (
  <span
    className={`h-2 w-2 rounded-full inline-block mr-2 ${
      status === "online" ? "bg-green-500" : "bg-gray-400"
    }`}
  ></span>
);

const MemberCard = ({ member, role }) => (
  <div className="w-64">
    <div className="flex items-center space-x-3 p-2">
      <img
        src={"https://cdn.discordapp.com/embed/avatars/2.png"}
        alt={member.full_name}
        className="w-8 h-8 rounded-full"
      />
      <div className="items-start flex flex-col">
        <h2 className="text-sm font-medium">
          {member.full_name}
          {role === "host" && (
            <span className="text-xs text-blue-400 ml-1">(Host)</span>
          )}
        </h2>
        <p className="text-xs text-gray-500">
          <StatusDot status={member.status} />{" "}
          {member.status === "invisible" ? "offline" : member.status}
        </p>
      </div>
    </div>
  </div>
);

export default function MemberList() {
  const [search, setSearch] = useState("");
  const { currentChannel } = useContext(GlobalContext);
  const [members, setMembers] = useState([]);

  // Lọc theo từ khóa tìm kiếm
  const filtered = members.filter(
    (member) =>
      member &&
      member.user &&
      member.user.full_name &&
      member.user.full_name.toLowerCase().includes(search.toLowerCase())
  );

  // Lọc theo trạng thái online/offline
  const onlineMembers = filtered.filter(
    (member) => member.user.status === "online"
  );
  const offlineMembers = filtered.filter(
    (member) =>
      member.user.status === "offline" || member.user.status === "invisible"
  );

  const fetchMembers = async () => {
    try {
      if (!currentChannel) return;

      const res = await api.get(`/channels/${currentChannel}/members`);
      console.log("Members data:", res.data);
      setMembers(res.data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      setMembers([]);
    }
  };

  useEffect(() => {
    if (currentChannel) {
      fetchMembers();
    }
  }, [currentChannel]);

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
            <MemberCard
              key={member.id}
              member={member.user}
              role={member.role}
            />
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
            <MemberCard
              key={member.id}
              member={member.user}
              role={member.role}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
