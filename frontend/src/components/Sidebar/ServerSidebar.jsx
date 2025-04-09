import React, { useContext, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { GlobalContext } from "../../context/index.jsx";
import { api } from "../../service/api";

const ServerSidebar = () => {
  const { servers, setServers, currentServer, setCurrentServer } =
    useContext(GlobalContext);

  const [tooltip, setTooltip] = useState({
    visible: false,
    name: "",
    x: 0,
    y: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serverName, setServerName] = useState("");
  const [serverColor, setServerColor] = useState("#4f46e5");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleMouseEnter = (event, serverName) => {
    const { clientX, clientY } = event;
    setTooltip({ visible: true, name: serverName, x: clientX, y: clientY });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, name: "", x: 0, y: 0 });
  };

  const addServer = async (serverName, serverColor, isPrivate) => {
    const payload = {
      name: serverName,
      color: serverColor,
      is_private: isPrivate,
    };
    const res = await api.post("/servers/create", payload);
    console.log(res.data);
    setServers((prev) => [...prev, res.data]);
    setCurrentServer(res.data.id);
  };

  const handleAddServer = async () => {
    if (serverName.trim()) {
      await addServer(serverName, serverColor, isPrivate);
      setServerName("");
      setServerColor("#4f46e5");
      setIsPrivate(false);
      setIsModalOpen(false);
    }
  };
  return (
    <div className="w-16 bg-gray-900 flex flex-col items-center py-3 space-y-2 overflow-y-auto">
      <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold cursor-pointer hover:rounded-2xl transition-all duration-200">
        <FontAwesomeIcon icon={faDiscord} className="text-2xl" />
      </div>
      <button
        className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white cursor-pointer hover:rounded-2xl transition-all duration-200"
        onClick={() => setIsModalOpen(true)}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
      <div className="border-t border-gray-700 w-8 mx-auto my-2"></div>
      {servers.map((server) => (
        <div
          key={server.id}
          onClick={() => setCurrentServer(server.id)}
          onMouseEnter={(e) => handleMouseEnter(e, server.name)}
          onMouseLeave={handleMouseLeave}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white cursor-pointer hover:rounded-2xl transition-all duration-200`}
          style={{
            backgroundColor:
              currentServer === server.id ? server.color : "#4b5563", // Màu xám mặc định nếu không được chọn
          }}
        >
          <span className="font-bold">{server.name[0]}</span>
        </div>
      ))}

      {tooltip.visible && (
        <div
          className="absolute bg-gray-800 text-white text-sm px-2 py-1 rounded shadow-lg z-50"
          style={{
            top: tooltip.y + 10,
            left: tooltip.x + 10,
          }}
        >
          {tooltip.name}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed m-0 top-0 inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          style={{ margin: 0 }}
        >
          <div className="bg-gray-800 rounded-lg w-96 p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Create New Server
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Server Name
              </label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                placeholder="Enter server name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Server Color
              </label>
              <input
                type="color"
                value={serverColor}
                onChange={(e) => setServerColor(e.target.value)}
                className="w-full h-10 cursor-pointer"
              />
            </div>
            <div className="mb-4 flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
              />
              <label htmlFor="isPrivate" className="text-sm text-gray-400">
                Private Server
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-transparent text-gray-300 hover:text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddServer}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerSidebar;
