import { useState } from "react";

function Home() {
  const [name, setName] = useState<string>("");
  const recents: { id: string; name: string }[] = JSON.parse(
    localStorage.getItem("recent") || "[]"
  );

  return (
    <div className="bg-gray-400 w-screen h-screen">
      <div>
        <h1 className="text-4xl flex justify-center items-center -inset-y-48 h-screen w-screen absolute">
          Todo and shopping list app
        </h1>
        <div className="flex justify-center items-center h-screen w-screen absolute -inset-y-32">
          <input
            className="border m-2 p-1 text-2xl w-4/12"
            type="text"
            placeholder="Name"
            maxLength={25}
            onChange={(c) => setName(c.target.value)}
          />
          <button
            className="text-white rounded-md bg-blue-600 hover:bg-blue-700 px-5 py-2.5 mr-3 md:mr-0 transition duration-200 ease-in-out"
            aria-label="Create new list"
            onClick={() => {
              fetch(`${process.env.REACT_APP_API_URL}/new`, {
                method: "POST",
                body: JSON.stringify({
                  name: name || "List",
                }),
              })
                .then((res) => res.json())
                .then((res) => {
                  window.location.href = `/${res.id}`;
                });
            }}
          >
            New
          </button>
        </div>
      </div>
      <div className="flex justify-center items-center h-screen w-screen absolute">
        <p className="text-2xl">Recent items</p>
        <ul>
          {recents.map((r) => (
            <li
              aria-label="Recent lists"
              onClick={() => {
                window.location.href = `/${r.id}`;
              }}
            >
              - {r.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Home;
