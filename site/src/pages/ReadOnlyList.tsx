import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "./ItemList.scss";

type Item = {
  value: string;
  checked: boolean;
  id: string;
};

function ReadOnlyItemList() {
  let { id } = useParams();

  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/export/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setItems(data.data);
          setName(data.name);
        }
      });
  }, [id]);

  function onCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { id, checked } = e.target;

    setItems(
      items.map((item) => {
        if (item.id === id.slice(2, id.length)) {
          return { ...item, checked };
        }
        return item;
      })
    );
  }

  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <nav className="px-1 sm:px-2 py-2 bg-gray-800 w-screen">
        <div className="flex gap-1 items-center">
          <button
            className="order-first text-white rounded-md pr-1 py-2.5"
            aria-label="Go back home"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
          </button>
          {error ? (
            <div className="text-white text-3xl">{error}</div>
          ) : (
            <p className="text-3xl text-white order-first ml-0 mr-auto">
              {name}
            </p>
          )}
        </div>
      </nav>

      {error ? (
        <div className="text-2xl items-center text-center">
          List could not be loaded, please go back{" "}
          <a className="underline" href="/">
            home
          </a>
          .
        </div>
      ) : (
        <div
          id="items"
          className="bg-slate-50 pt-2 lg:text-xl text-3xl w-screen overflow-y-scroll overflow-x-hidden mb-10"
          style={{ maxHeight: "88vh" }}
        >
          {items.map((item) => (
            <div className="flex flex-row items-center" key={item.id}>
              <input
                type="checkbox"
                className="scale-125 mx-2"
                id={"cb" + item.id}
                checked={item.checked}
                onChange={onCheckboxChange}
              />
              <label htmlFor={"cb" + item.id} className="visuallyhidden">
                {item.value}
              </label>
              <p
                style={{
                  overflowWrap: "anywhere",
                }}
                className={`${item.checked ? "strike" : ""}`}
                id="inputelement"
              >
                {item.value}
              </p>
              <hr className="h-1" />
            </div>
          ))}

          <div className="h-10"></div>
        </div>
      )}
    </div>
  );
}

export default ReadOnlyItemList;
